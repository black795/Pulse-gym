from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TipoLesion = Literal["lesion", "limitacion"]
EstadoLesion = Literal["activa", "resuelta"]


class _ReglasLesion(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("descripcion", mode="before", check_fields=False)
    @classmethod
    def _vacio_es_nulo(cls, valor):
        return None if isinstance(valor, str) and not valor.strip() else valor


class LesionIn(_ReglasLesion):
    tipo: TipoLesion
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str | None = Field(default=None, max_length=5000)
    estado: EstadoLesion = "activa"


class LesionEditarIn(_ReglasLesion):
    tipo: TipoLesion | None = None
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    descripcion: str | None = Field(default=None, max_length=5000)
    estado: EstadoLesion | None = None

    @model_validator(mode="after")
    def _obligatorios_no_se_vacian(self):
        for campo in ("tipo", "nombre", "estado"):
            if campo in self.model_fields_set and getattr(self, campo) is None:
                raise ValueError(f"El campo '{campo}' no puede quedar vacío.")
        return self


class LesionOut(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: str
    tipo: TipoLesion
    nombre: str
    descripcion: str | None
    estado: EstadoLesion
    registrado_por: int | None
    actualizado_por: int | None
    responsable_nombre: str | None
    created_at: datetime
    updated_at: datetime


class HistorialLesionOut(BaseModel):
    id: int
    lesion_id: int
    usuario_id: int | None
    usuario_nombre: str | None
    tipo: TipoLesion
    nombre: str
    descripcion: str | None
    estado: EstadoLesion
    created_at: datetime
