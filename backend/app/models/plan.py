from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class Plan(Base):
    """Plan de membresía. La duración en meses es lo que define cuándo vence."""

    __tablename__ = "planes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
    duracion_meses: Mapped[int] = mapped_column(Integer)
    precio: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
