"""REQ-64 — Vencimiento de membresía: se calcula según la fecha de pago y la duración del plan."""
import calendar
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

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


def calcular_estado(vencimiento: date, hoy: date | None = None) -> EstadoMembresia:
    dias = (vencimiento - (hoy or date.today())).days
    if dias < 0:
        return "vencida"
    return "por_vencer" if dias <= DIAS_AVISO else "vigente"


def a_membresia_out(m: Membresia, cliente: Cliente, plan: Plan, hoy: date | None = None) -> MembresiaOut:
    hoy = hoy or date.today()
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

    pago = datos.fecha_pago or date.today()
    membresia = Membresia(
        cliente_id=cliente.id, plan_id=plan.id, fecha_pago=pago, fecha_inicio=pago,
        fecha_vencimiento=calcular_vencimiento(pago, plan.duracion_meses),
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
    hoy = hoy or date.today()
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
