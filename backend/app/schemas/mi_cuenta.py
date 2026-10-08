from datetime import date

from pydantic import BaseModel

from app.schemas.cliente import ClienteOut
from app.schemas.lesion import TipoLesion
from app.schemas.membresia import MembresiaOut


class LesionActivaOut(BaseModel):
    id: int
    tipo: TipoLesion
    nombre: str


class DiaSemanaOut(BaseModel):
    fecha: date
    asistio: bool


class MiCuentaOut(BaseModel):
    """Todo lo que la app del cliente muestra sobre él mismo, en una sola respuesta."""

    hoy: date  # día según la zona del gimnasio
    ficha: ClienteOut | None  # None = recepción aún no registró su ficha
    membresia: MembresiaOut | None  # None = nunca pagó un plan
    lesiones_activas: list[LesionActivaOut]
    semana: list[DiaSemanaOut]  # de lunes a domingo de la semana en curso
    racha_dias: int  # días seguidos asistiendo, contando hasta hoy (o hasta ayer si hoy aún no vino)
    asistencias_mes: int
    ultima_asistencia: date | None
