from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.membresia import EstadoMembresia

MetodoAsistencia = Literal["manual", "qr"]
EstadoActividad = Literal["activo", "en_riesgo", "abandono", "sin_asistencias"]


class CheckinIn(BaseModel):
    """Solo se envía el cliente: la fecha y la hora las pone el sistema."""

    model_config = ConfigDict(extra="forbid")

    cliente_id: int = Field(gt=0, le=2**31 - 1)


class AsistenciaOut(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: str
    cliente_carnet: str
    fecha_hora: datetime  # UTC
    fecha: date  # día en la zona del gimnasio
    hora: str  # "HH:MM" en la zona del gimnasio
    metodo: MetodoAsistencia
    registrado_por: int | None
    registrado_por_nombre: str | None


class CheckinOut(AsistenciaOut):
    """Respuesta del check-in: la entrada más lo que recepción necesita saber en ese momento."""

    membresia_estado: EstadoMembresia | None  # None = el cliente nunca pagó un plan
    membresia_dias_restantes: int | None
    aviso: str | None  # texto listo para mostrar (membresía vencida, por vencer o inexistente)


class ResumenAsistenciaOut(BaseModel):
    fecha: date
    asistencias_hoy: int
    clientes_hoy: int
    hora_pico: str | None  # "07:00–08:00"; None si hoy no entró nadie
    promedio_diario_7_dias: float


class ActividadClienteOut(BaseModel):
    cliente_id: int
    cliente_nombre: str
    cliente_carnet: str
    ultima_asistencia: datetime | None  # UTC
    ultima_fecha: date | None
    dias_sin_asistir: int | None  # None = nunca asistió
    asistencias_30_dias: int
    estado: EstadoActividad
    membresia_estado: EstadoMembresia | None  # None también si quien consulta no puede ver membresías
