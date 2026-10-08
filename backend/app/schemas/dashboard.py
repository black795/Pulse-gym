from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class IndicadoresOut(BaseModel):
    clientes_total: int
    clientes_activos: int  # asistieron en los últimos 14 días
    membresias_vigentes: int | None  # None = quien consulta no puede ver membresías
    asistencias_hoy: int
    entrenadores_activos: int


class AlertaOut(BaseModel):
    tipo: Literal["peligro", "aviso"]
    texto: str
    ruta: str  # pantalla del panel donde se atiende


class ActividadRecienteOut(BaseModel):
    tipo: Literal["asistencia", "pago", "lesion", "cliente"]
    texto: str
    fecha_hora: datetime  # UTC


class DashboardOut(BaseModel):
    hoy: date  # día según la zona del gimnasio
    indicadores: IndicadoresOut
    alertas: list[AlertaOut]
    actividad: list[ActividadRecienteOut]
