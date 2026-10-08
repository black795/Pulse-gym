"""Lo que el cliente ve de sí mismo en la app móvil: ficha, membresía, lesiones activas y asistencia."""
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.tiempo import hoy as hoy_local
from app.models import Lesion, Usuario
from app.schemas.mi_cuenta import DiaSemanaOut, LesionActivaOut, MiCuentaOut
from app.services import asistencia_service, cliente_service, membresia_service

DIAS_PARA_RACHA = 120  # hasta dónde se mira hacia atrás para contar la racha


def calcular_racha(fechas: set[date], hoy: date) -> int:
    """Días seguidos con asistencia. Si hoy todavía no vino, la racha de ayer sigue en pie."""
    dia = hoy if hoy in fechas else hoy - timedelta(days=1)
    racha = 0
    while dia in fechas:
        racha += 1
        dia -= timedelta(days=1)
    return racha


def resumen(db: Session, usuario: Usuario, hoy: date | None = None) -> MiCuentaOut:
    hoy = hoy or hoy_local()
    lunes = hoy - timedelta(days=hoy.weekday())
    cliente = cliente_service.de_usuario(db, usuario)

    fechas: set[date] = set()
    lesiones: list[Lesion] = []
    asistencias_mes = 0
    if cliente is not None:
        fechas = set(asistencia_service.fechas_de_cliente(db, cliente.id, hoy - timedelta(days=DIAS_PARA_RACHA)))
        asistencias_mes = asistencia_service.contar_de_cliente(db, cliente.id, hoy.replace(day=1), hoy)
        lesiones = list(db.scalars(
            select(Lesion).where(Lesion.cliente_id == cliente.id, Lesion.estado == "activa").order_by(Lesion.id)
        ))

    return MiCuentaOut(
        hoy=hoy,
        ficha=cliente_service.a_cliente_out(cliente) if cliente else None,
        membresia=membresia_service.actual_de_cliente(db, cliente.id) if cliente else None,
        lesiones_activas=[LesionActivaOut(id=lesion.id, tipo=lesion.tipo, nombre=lesion.nombre) for lesion in lesiones],
        semana=[DiaSemanaOut(fecha=dia, asistio=dia in fechas) for dia in (lunes + timedelta(days=n) for n in range(7))],
        racha_dias=calcular_racha(fechas, hoy),
        asistencias_mes=asistencias_mes,
        ultima_asistencia=max(fechas) if fechas else None,
    )
