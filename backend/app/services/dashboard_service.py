"""Panel de inicio del personal: indicadores, alertas y actividad reciente, según lo que cada rol puede ver."""
from collections import Counter
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permisos import (
    ASISTENCIA_VER, CLIENTES_VER, ENTRENADOR, LESIONES_GESTIONAR, MEMBRESIAS_VER, permisos_de,
)
from app.core.tiempo import hoy as hoy_local
from app.models import Asistencia, Cliente, EstadoUsuario, Lesion, Membresia, Plan, Rol, Usuario
from app.schemas.dashboard import ActividadRecienteOut, AlertaOut, DashboardOut, IndicadoresOut
from app.services import asistencia_service, membresia_service

MAX_ACTIVIDAD = 6


def _cuantos(n: int, singular: str, plural: str) -> str:
    return f"1 {singular}" if n == 1 else f"{n} {plural}"


def _actividad_reciente(db: Session, permisos: set[str]) -> list[ActividadRecienteOut]:
    """Los últimos movimientos de cada módulo que el rol puede ver, mezclados por fecha."""
    eventos: list[ActividadRecienteOut] = []
    if ASISTENCIA_VER in permisos:
        filas = db.execute(
            select(Asistencia.fecha_hora, Cliente.nombre).join(Cliente, Cliente.id == Asistencia.cliente_id)
            .where(asistencia_service.VIGENTE).order_by(Asistencia.fecha_hora.desc()).limit(MAX_ACTIVIDAD)
        )
        eventos += [ActividadRecienteOut(tipo="asistencia", texto=f"{nombre} registró ingreso", fecha_hora=momento)
                    for momento, nombre in filas]
    if MEMBRESIAS_VER in permisos:
        filas = db.execute(
            select(Membresia.created_at, Cliente.nombre, Plan.nombre)
            .join(Cliente, Cliente.id == Membresia.cliente_id).join(Plan, Plan.id == Membresia.plan_id)
            .order_by(Membresia.created_at.desc()).limit(MAX_ACTIVIDAD)
        )
        eventos += [ActividadRecienteOut(tipo="pago", texto=f"Pago de plan {plan}: {nombre}", fecha_hora=momento)
                    for momento, nombre, plan in filas]
    if LESIONES_GESTIONAR in permisos:
        filas = db.execute(
            select(Lesion.created_at, Cliente.nombre, Lesion.nombre).join(Cliente, Cliente.id == Lesion.cliente_id)
            .order_by(Lesion.created_at.desc()).limit(MAX_ACTIVIDAD)
        )
        eventos += [ActividadRecienteOut(tipo="lesion", texto=f"{nombre} — {lesion} registrada", fecha_hora=momento)
                    for momento, nombre, lesion in filas]
    if CLIENTES_VER in permisos:
        filas = db.execute(select(Cliente.created_at, Cliente.nombre).order_by(Cliente.created_at.desc()).limit(MAX_ACTIVIDAD))
        eventos += [ActividadRecienteOut(tipo="cliente", texto=f"Nuevo cliente: {nombre}", fecha_hora=momento)
                    for momento, nombre in filas]
    return sorted(eventos, key=lambda e: e.fecha_hora, reverse=True)[:MAX_ACTIVIDAD]


def resumen(db: Session, usuario: Usuario, hoy: date | None = None) -> DashboardOut:
    hoy = hoy or hoy_local()
    permisos = set(permisos_de(usuario.rol.nombre))
    ve_membresias = MEMBRESIAS_VER in permisos

    actividad = Counter(f.estado for f in asistencia_service.actividad(db, hoy=hoy, con_membresia=False))
    membresias = Counter(membresia_service.estado_por_cliente(db, hoy).values()) if ve_membresias else Counter()
    entrenadores = db.scalar(
        select(func.count(Usuario.id)).join(Rol, Rol.id == Usuario.rol_id).join(EstadoUsuario, EstadoUsuario.id == Usuario.estado_id)
        .where(Rol.nombre == ENTRENADOR, EstadoUsuario.permite_acceso.is_(True), Usuario.deleted_at.is_(None))
    ) or 0

    alertas: list[AlertaOut] = []
    if ve_membresias and membresias["vencida"]:
        alertas.append(AlertaOut(tipo="peligro", ruta="/admin/memberships", texto=_cuantos(
            membresias["vencida"], "cliente tiene la membresía vencida", "clientes tienen la membresía vencida")))
    if ve_membresias and membresias["por_vencer"]:
        alertas.append(AlertaOut(tipo="aviso", ruta="/admin/memberships", texto=_cuantos(
            membresias["por_vencer"], "membresía vence en los próximos 7 días", "membresías vencen en los próximos 7 días")))
    if actividad["abandono"]:
        alertas.append(AlertaOut(tipo="aviso", ruta="/admin/attendance", texto=_cuantos(
            actividad["abandono"], "cliente lleva más de 30 días sin venir", "clientes llevan más de 30 días sin venir")))
    if LESIONES_GESTIONAR in permisos:
        activas = db.scalar(select(func.count(Lesion.id)).where(Lesion.estado == "activa")) or 0
        if activas:
            alertas.append(AlertaOut(tipo="aviso", ruta="/admin/measurements", texto=_cuantos(
                activas, "lesión o limitación activa", "lesiones o limitaciones activas")))

    return DashboardOut(
        hoy=hoy,
        indicadores=IndicadoresOut(
            clientes_total=sum(actividad.values()), clientes_activos=actividad["activo"],
            membresias_vigentes=membresias["vigente"] + membresias["por_vencer"] if ve_membresias else None,
            asistencias_hoy=asistencia_service.resumen(db, hoy).asistencias_hoy,
            entrenadores_activos=entrenadores,
        ),
        alertas=alertas,
        actividad=_actividad_reciente(db, permisos),
    )
