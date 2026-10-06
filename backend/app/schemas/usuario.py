from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.permisos import ROLES_PERSONAL, TODOS_LOS_ROLES
from app.core.security import MAX_BYTES_PASSWORD


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: str | None
    rol: str
    estado: str
    permisos: list[str]
    created_at: datetime


class RolOut(BaseModel):
    nombre: str
    descripcion: str | None
    permisos: list[str]


class UsuarioPersonalIn(BaseModel):
    """Alta de personal (solo la hace el administrador)."""

    model_config = ConfigDict(extra="forbid")
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    telefono: str | None = Field(default=None, max_length=20)
    rol: str

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        if len(v.encode("utf-8")) > MAX_BYTES_PASSWORD:
            raise ValueError("La contraseña es demasiado larga (máximo 72 caracteres).")
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe incluir al menos una letra y un número.")
        return v

    @field_validator("rol")
    @classmethod
    def _rol_de_personal(cls, v: str) -> str:
        if v not in ROLES_PERSONAL:
            raise ValueError(f"El rol debe ser uno de: {', '.join(ROLES_PERSONAL)}.")
        return v


class CambiarRolIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rol: str

    @field_validator("rol")
    @classmethod
    def _rol_valido(cls, v: str) -> str:
        if v not in TODOS_LOS_ROLES:
            raise ValueError(f"El rol debe ser uno de: {', '.join(TODOS_LOS_ROLES)}.")
        return v


class CambiarEstadoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    estado: str  # activo | inactivo | suspendido
    motivo: str | None = Field(default=None, max_length=200)
