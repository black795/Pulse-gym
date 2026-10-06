from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import MAX_BYTES_PASSWORD
from app.schemas.usuario import UsuarioOut


def _validar_password(v: str) -> str:
    if len(v.encode("utf-8")) > MAX_BYTES_PASSWORD:
        raise ValueError("La contraseña es demasiado larga (máximo 72 caracteres).")
    if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
        raise ValueError("La contraseña debe incluir al menos una letra y un número.")
    return v


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class RegistroIn(BaseModel):
    """Auto-registro público. Siempre crea un CLIENTE: el rol NO se puede elegir."""

    model_config = ConfigDict(extra="forbid")  # si alguien envía "rol", se rechaza
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    telefono: str | None = Field(default=None, max_length=20)
    acepta_consentimiento: bool

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return _validar_password(v)

    @field_validator("nombre")
    @classmethod
    def _nombre_limpio(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("acepta_consentimiento")
    @classmethod
    def _debe_aceptar(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Debes aceptar el tratamiento de tus datos de salud para registrarte.")
        return v


class SesionOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expira_en_minutos: int
    usuario: UsuarioOut
