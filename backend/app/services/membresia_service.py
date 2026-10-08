"""REQ-64 — Vencimiento de membresía: se calcula según la fecha de pago y la duración del plan."""
import calendar
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.tiempo import hoy as hoy_local
from app.models import Cliente, Membresia, Plan, Usuario
from app.schemas.membresia import EstadoMembresia, MembresiaIn, MembresiaOut
from app.services.errores import ErrorNegocio

DIAS_AVISO = 7  # "próximo a vencer" = vence dentro de los próximos 7 días (incluye hoy)


def sumar_meses(inicio: date, meses: int) -> date:
    """Suma meses de calendario; si el día no existe en el mes destino queda el último (31 ene + 1 mes = 28 feb)."""
    anio, mes = divmod(inicio.year * 12 + (inicio.month - 1) + meses, 12)
    mes += 1
    return date(anio, mes, min(inicio.day, calendar.monthrange(anio, mes)[1]))


def calcular_vencimiento(fecha_inicio: date, duracion_meses: int) -> date:
    """Último día con acceso: pagar el 01 sep un plan mensual vence el 30 sep."""
    return sumar_meses(fecha_inicio, duracion_meses) - timedelta(days=1)


def calcular_inicio(fecha_pago: date, vencimiento_actual: date | None) -> date:
    """Renovar antes de vencer no hace perder días: el plan nuevo empieza al terminar el que tiene.
    Si ya venció (o nunca pagó), empieza el día del pago."""
    if vencimiento_actual is None:
        return fecha_pago
    return max(fecha_pago, vencimiento_actual + timedelta(days=1))


def ultimo_vencimiento(db: Session, cliente_id: int) -> date | None:
    return db.scalar(select(func.max(Membresia.fecha_vencimiento)).where(Membresia.cliente_id == cliente_id))


def calcular_estado(vencimiento: date, hoy: date | None = None) -> EstadoMembresia:
    dias = (vencimiento - (hoy or hoy_local())).days
    if dias < 0:
        return "vencida"
    return "por_vencer" if dias <= DIAS_AVISO else "vigente"


def a_membresia_out(m: Membresia, cliente: Cliente, plan: Plan, hoy: date | None = None) -> MembresiaOut:
    hoy = hoy or hoy_local()
    return MembresiaOut(
        id=m.id, cliente_id=cliente.id, cliente_nombre=cliente.nombre, cliente_carnet=cliente.carnet,
        plan_id=plan.id, plan=plan.nombre, duracion_meses=plan.duracion_meses,
        fecha_pago=m.fecha_pago, fecha_inicio=m.fecha_inicio, fecha_vencimiento=m.fecha_vencimiento,
        estado=calcular_estado(m.fecha_vencimiento, hoy), dias_restantes=(m.fecha_vencimiento - hoy).days,
    )


def listar_planes(db: Session) -> list[Plan]:
    return list(db.scalars(select(Plan).order_by(Plan.duracion_meses, Plan.id)))


def registrar(db: Session, datos: MembresiaIn, actor: Usuario | None = None) -> MembresiaOut:
    cliente = db.get(Cliente, datos.cliente_id)
    if cliente is None:
        raise ErrorNegocio("Cliente no encontrado.", 404)
    plan = db.get(Plan, datos.plan_id)
    if plan is None:
        raise ErrorNegocio("Plan no encontrado.", 404)

    pago = datos.fecha_pago or hoy_local()
    inicio = calcular_inicio(pago, ultimo_vencimiento(db, cliente.id))
    membresia = Membresia(
        cliente_id=cliente.id, plan_id=plan.id, fecha_pago=pago, fecha_inicio=inicio,
        fecha_vencimiento=calcular_vencimiento(inicio, plan.duracion_meses),
        registrado_por=actor.id if actor else None,
    )
    db.add(membresia)
    db.commit()
    db.refresh(membresia)
    return a_membresia_out(membresia, cliente, plan)


def listar(
    db: Session, *, estado: EstadoMembresia | None = None, cliente_id: int | None = None,
    hoy: date | None = None,
) -> list[MembresiaOut]:
    """Sin `cliente_id`: la membresía más reciente de cada cliente (la que cuenta hoy).
    Con `cliente_id`: todo su historial de pagos."""
    hoy = hoy or hoy_local()
    consulta = (
        select(Membresia, Cliente, Plan)
        .join(Cliente, Cliente.id == Membresia.cliente_id)
        .join(Plan, Plan.id == Membresia.plan_id)
        .order_by(Membresia.fecha_vencimiento, Membresia.id)
    )
    if cliente_id is not None:
        consulta = consulta.where(Membresia.cliente_id == cliente_id)

    filas = db.execute(consulta).all()
    if cliente_id is None:
        actual_por_cliente = {}
        for fila in filas:  # ordenadas por vencimiento: la última de cada cliente es la que cuenta
            actual_por_cliente[fila[0].cliente_id] = fila
        filas = sorted(actual_por_cliente.values(), key=lambda f: (f[0].fecha_vencimiento, f[0].id))

    salida = [a_membresia_out(m, c, p, hoy) for m, c, p in filas]
    return [m for m in salida if estado is None or m.estado == estado]


def de_usuario(db: Session, usuario: Usuario) -> MembresiaOut | None:
    """La membresía actual del cliente que inició sesión (su ficha se une por el correo)."""
    cliente = db.scalar(select(Cliente).where(func.lower(Cliente.email) == usuario.email.lower()))
    return actual_de_cliente(db, cliente.id) if cliente else None


def estado_por_cliente(db: Session, hoy: date | None = None) -> dict[int, EstadoMembresia]:
    """Estado de la membresía actual de cada cliente con al menos un pago (una sola consulta agregada)."""
    hoy = hoy or hoy_local()
    filas = db.execute(select(Membresia.cliente_id, func.max(Membresia.fecha_vencimiento)).group_by(Membresia.cliente_id))
    return {cliente_id: calcular_estado(vencimiento, hoy) for cliente_id, vencimiento in filas}


def actual_de_cliente(db: Session, cliente_id: int) -> MembresiaOut | None:
    historial = listar(db, cliente_id=cliente_id)  # ordenado por vencimiento: la última es la que cuenta
    return historial[-1] if historial else None
