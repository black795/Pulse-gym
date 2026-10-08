"""REQ-49 — Asistencia: check-in por sesión y, a partir de ahí, qué cliente está activo o abandonó."""
from collections import Counter
from datetime import date, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.tiempo import a_local, hoy as hoy_local
from app.db.base import ahora
from app.models import Asistencia, Cliente, Usuario
from app.schemas.asistencia import (
    ActividadClienteOut, AsistenciaOut, CheckinOut, EstadoActividad, MetodoAsistencia, ResumenAsistenciaOut,
)
from app.schemas.membresia import MembresiaOut
from app.services import cliente_service, membresia_service
from app.services.errores import ErrorNegocio

MINUTOS_ENTRE_CHECKINS = 60  # un segundo check-in antes de este tiempo se toma como duplicado
DIAS_ACTIVO = 14             # asistió en los últimos 14 días → activo
DIAS_ABANDONO = 30           # más de 30 días sin venir → abandono (entre ambos: en riesgo)
DIAS_FRECUENCIA = 30         # ventana para contar "asistencias recientes"
LIMITE_MAXIMO = 500


def calcular_actividad(dias_sin_asistir: int | None) -> EstadoActividad:
    if dias_sin_asistir is None:
        return "sin_asistencias"
    if dias_sin_asistir <= DIAS_ACTIVO:
        return "activo"
    return "en_riesgo" if dias_sin_asistir <= DIAS_ABANDONO else "abandono"


def aviso_de_membresia(membresia: MembresiaOut | None) -> str | None:
    """Lo que recepción debe saber al dejar pasar al cliente. El check-in no se bloquea."""
    if membresia is None:
        return "Sin membresía registrada."
    dias = membresia.dias_restantes
    if membresia.estado == "vencida":
        return "Membresía vencida ayer." if dias == -1 else f"Membresía vencida hace {-dias} días."
    if membresia.estado == "por_vencer":
        if dias == 0:
            return "Su membresía vence hoy."
        return "Su membresía vence mañana." if dias == 1 else f"Su membresía vence en {dias} días."
    return None


def _a_out(a: Asistencia, cliente: Cliente, autor: Usuario | None) -> AsistenciaOut:
    return AsistenciaOut(
        id=a.id, cliente_id=cliente.id, cliente_nombre=cliente.nombre, cliente_carnet=cliente.carnet,
        fecha_hora=a.fecha_hora, fecha=a.fecha, hora=a_local(a.fecha_hora).strftime("%H:%M"),
        metodo=a.metodo, registrado_por=a.registrado_por, registrado_por_nombre=autor.nombre if autor else None,
    )


def registrar(
    db: Session, cliente_id: int, actor: Usuario | None = None, *,
    metodo: MetodoAsistencia = "manual", momento: datetime | None = None,
) -> CheckinOut:
    """Registra la entrada con la fecha y hora del sistema (`momento` solo lo usan los datos de ejemplo)."""
    cliente = cliente_service.obtener(db, cliente_id)
    momento = momento or ahora()

    ultima = db.scalar(select(func.max(Asistencia.fecha_hora)).where(Asistencia.cliente_id == cliente.id))
    if ultima is not None and timedelta(0) <= momento - ultima < timedelta(minutes=MINUTOS_ENTRE_CHECKINS):
        minutos = int((momento - ultima).total_seconds() // 60)
        hace = "hace un momento" if minutos < 1 else f"hace {minutos} min"
        raise ErrorNegocio(
            f"{cliente.nombre} ya registró su entrada a las {a_local(ultima).strftime('%H:%M')} ({hace}).", 409,
        )

    asistencia = Asistencia(
        cliente_id=cliente.id, fecha_hora=momento, fecha=a_local(momento).date(), metodo=metodo,
        registrado_por=actor.id if actor else None,
    )
    db.add(asistencia)
    db.commit()
    db.refresh(asistencia)

    membresia = membresia_service.actual_de_cliente(db, cliente.id)
    return CheckinOut(
        **_a_out(asistencia, cliente, actor).model_dump(),
        membresia_estado=membresia.estado if membresia else None,
        membresia_dias_restantes=membresia.dias_restantes if membresia else None,
        aviso=aviso_de_membresia(membresia),
    )


def listar(
    db: Session, *, fecha: date | None = None, cliente_id: int | None = None, limite: int = 200,
) -> list[AsistenciaOut]:
    """Sin filtros: las entradas de hoy. Con `cliente_id` (y sin fecha): el historial de ese cliente.
    Siempre de la más reciente a la más antigua."""
    consulta = (
        select(Asistencia, Cliente, Usuario)
        .join(Cliente, Cliente.id == Asistencia.cliente_id)
        .outerjoin(Usuario, Usuario.id == Asistencia.registrado_por)
        .order_by(Asistencia.fecha_hora.desc(), Asistencia.id.desc())
        .limit(min(limite, LIMITE_MAXIMO))
    )
    if cliente_id is not None:
        cliente_service.obtener(db, cliente_id)
        consulta = consulta.where(Asistencia.cliente_id == cliente_id)
    if fecha is not None or cliente_id is None:
        consulta = consulta.where(Asistencia.fecha == (fecha or hoy_local()))
    return [_a_out(a, c, u) for a, c, u in db.execute(consulta).all()]


def resumen(db: Session, hoy: date | None = None) -> ResumenAsistenciaOut:
    hoy = hoy or hoy_local()
    de_hoy = db.execute(
        select(Asistencia.fecha_hora, Asistencia.cliente_id).where(Asistencia.fecha == hoy)
    ).all()
    por_hora = Counter(a_local(momento).hour for momento, _ in de_hoy)
    pico = None
    if por_hora:
        hora = max(sorted(por_hora), key=lambda h: por_hora[h])  # si empatan, la más temprana
        pico = f"{hora:02d}:00–{(hora + 1) % 24:02d}:00"

    semana = db.scalar(
        select(func.count(Asistencia.id)).where(Asistencia.fecha.between(hoy - timedelta(days=6), hoy))
    ) or 0
    return ResumenAsistenciaOut(
        fecha=hoy, asistencias_hoy=len(de_hoy), clientes_hoy=len({cliente for _, cliente in de_hoy}),
        hora_pico=pico, promedio_diario_7_dias=round(semana / 7, 1),
    )


def actividad(
    db: Session, *, estado: EstadoActividad | None = None, hoy: date | None = None,
) -> list[ActividadClienteOut]:
    """Una fila por cliente (asista o no): cuándo vino por última vez y si está activo o abandonó.
    Primero los que llevan más días sin venir; al final, los que nunca asistieron."""
    hoy = hoy or hoy_local()
    desde = hoy - timedelta(days=DIAS_FRECUENCIA - 1)
    filas = db.execute(
        select(
            Cliente,
            func.max(Asistencia.fecha_hora),
            func.max(Asistencia.fecha),
            func.count(case((Asistencia.fecha >= desde, Asistencia.id))),
        )
        .outerjoin(Asistencia, Asistencia.cliente_id == Cliente.id)
        .group_by(Cliente.id)
    ).all()
    membresias = {m.cliente_id: m.estado for m in membresia_service.listar(db, hoy=hoy)}

    salida = []
    for cliente, ultima, ultima_fecha, recientes in filas:
        dias = (hoy - ultima_fecha).days if ultima_fecha else None
        salida.append(ActividadClienteOut(
            cliente_id=cliente.id, cliente_nombre=cliente.nombre, cliente_carnet=cliente.carnet,
            ultima_asistencia=ultima, ultima_fecha=ultima_fecha, dias_sin_asistir=dias,
            asistencias_30_dias=recientes, estado=calcular_actividad(dias),
            membresia_estado=membresias.get(cliente.id),
        ))
    salida.sort(key=lambda f: (f.dias_sin_asistir is None, -(f.dias_sin_asistir or 0), f.cliente_nombre))
    return [f for f in salida if estado is None or f.estado == estado]


def anular(db: Session, asistencia_id: int) -> None:
    """Deshace un check-in hecho por error. Solo el mismo día: el historial no se reescribe."""
    asistencia = db.get(Asistencia, asistencia_id)
    if asistencia is None:
        raise ErrorNegocio("Entrada no encontrada.", 404)
    if asistencia.fecha != hoy_local():
        raise ErrorNegocio("Solo se puede anular una entrada registrada hoy.", 409)
    db.delete(asistencia)
    db.commit()
