from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.tiempo import hoy

DIAS_ATRAS_MAXIMO = 366  # un error de tipeo (ej. 2002) no debe crear una membresía vencida hace años

EstadoMembresia = Literal["vigente", "por_vencer", "vencida"]


class PlanOut(BaseModel):
    id: int
    nombre: str
    duracion_meses: int
    precio: float


class MembresiaIn(BaseModel):
    """Se envía solo el cliente, el plan y (opcional) la fecha de pago; el vencimiento lo calcula el sistema."""

    model_config = ConfigDict(extra="forbid")

    cliente_id: int
    plan_id: int
    fecha_pago: date | None = Field(default=None, description="Si se omite, se usa la fecha de hoy.")

    @field_validator("fecha_pago")
    @classmethod
    def _no_futura(cls, v: date | None) -> date | None:
        if v is not None and v > hoy():
            raise ValueError("La fecha de pago no puede ser futura.")
        if v is not None and (hoy() - v).days > DIAS_ATRAS_MAXIMO:
            raise ValueError("La fecha de pago es demasiado antigua: revisa el año.")
        return v


class MembresiaOut(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: str
    cliente_carnet: str
    plan_id: int
    plan: str
    duracion_meses: int
    fecha_pago: date
    fecha_inicio: date
    fecha_vencimiento: date
    estado: EstadoMembresia
    dias_restantes: int  # negativo = días desde que venció
