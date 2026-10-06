from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

EDAD_MAXIMA = 110
PESO_KG = (20, 400)
ALTURA_CM = (80, 250)

# En una edición se pueden omitir, pero nunca dejar vacíos.
OBLIGATORIOS = ("nombre", "carnet", "fecha_nacimiento", "peso_kg", "altura_cm")


class ClienteOut(BaseModel):
    id: int
    nombre: str
    carnet: str
    telefono: str | None
    email: str | None
    fecha_nacimiento: date
    edad: int
    peso_kg: float
    altura_cm: float
    objetivo: str | None
    created_at: datetime
    updated_at: datetime


class _ReglasCliente(BaseModel):
    """Validaciones que comparten el alta y la edición."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("telefono", "email", "objetivo", mode="before", check_fields=False)
    @classmethod
    def _vacio_es_nulo(cls, v):
        return None if isinstance(v, str) and not v.strip() else v

    @field_validator("carnet", check_fields=False)
    @classmethod
    def _carnet(cls, v: str | None) -> str | None:
        # "1234567 lp" y "1234567  LP" son el mismo carnet.
        return v if v is None else " ".join(v.split()).upper()

    @field_validator("email", check_fields=False)
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        return v if v is None else v.lower()

    @field_validator("fecha_nacimiento", check_fields=False)
    @classmethod
    def _fecha_nacimiento(cls, v: date | None) -> date | None:
        if v is None:
            return v
        hoy = date.today()
        if v >= hoy:
            raise ValueError("La fecha de nacimiento debe ser anterior a hoy.")
        if hoy.year - v.year > EDAD_MAXIMA:
            raise ValueError("Revisa la fecha de nacimiento: la edad no es válida.")
        return v

    @field_validator("peso_kg", check_fields=False)
    @classmethod
    def _peso(cls, v: float | None) -> float | None:
        if v is not None and not PESO_KG[0] <= v <= PESO_KG[1]:
            raise ValueError(f"El peso debe estar entre {PESO_KG[0]} y {PESO_KG[1]} kg.")
        return v

    @field_validator("altura_cm", check_fields=False)
    @classmethod
    def _altura(cls, v: float | None) -> float | None:
        if v is not None and not ALTURA_CM[0] <= v <= ALTURA_CM[1]:
            raise ValueError(f"La altura debe estar entre {ALTURA_CM[0]} y {ALTURA_CM[1]} cm.")
        return v


class ClienteIn(_ReglasCliente):
    """Alta de la ficha: nombre, carnet, fecha de nacimiento, peso y altura son obligatorios."""

    nombre: str = Field(min_length=2, max_length=100)
    carnet: str = Field(min_length=4, max_length=20)
    fecha_nacimiento: date
    peso_kg: float
    altura_cm: float
    telefono: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    objetivo: str | None = Field(default=None, max_length=60)


class ClienteEditarIn(_ReglasCliente):
    """Edición: solo se envían los campos que cambian."""

    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    carnet: str | None = Field(default=None, min_length=4, max_length=20)
    fecha_nacimiento: date | None = None
    peso_kg: float | None = None
    altura_cm: float | None = None
    telefono: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    objetivo: str | None = Field(default=None, max_length=60)

    @model_validator(mode="after")
    def _obligatorios_no_se_vacian(self):
        for campo in OBLIGATORIOS:
            if campo in self.model_fields_set and getattr(self, campo) is None:
                raise ValueError(f"El campo '{campo}' es obligatorio y no puede quedar vacío.")
        return self
