from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class Cliente(Base):
    """Ficha de un cliente del gimnasio. No necesita tener cuenta para entrar a la app."""

    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"))
    nombre: Mapped[str] = mapped_column(String(100))
    carnet: Mapped[str] = mapped_column(String(20), unique=True)  # identificador que evita duplicados
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(120))
    fecha_nacimiento: Mapped[date] = mapped_column(Date)  # la edad se calcula, así nunca queda vieja
    peso_kg: Mapped[float] = mapped_column(Float)
    altura_cm: Mapped[float] = mapped_column(Float)
    objetivo: Mapped[str | None] = mapped_column(String(60))
    registrado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=ahora, onupdate=ahora, server_default=func.now()
    )
