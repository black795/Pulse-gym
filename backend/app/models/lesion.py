from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class Lesion(Base):
    """Estado actual de una lesión o limitación; las versiones viven en el historial."""

    __tablename__ = "lesiones"
    __table_args__ = (
        CheckConstraint("tipo IN ('lesion', 'limitacion')", name="ck_lesion_tipo"),
        CheckConstraint("estado IN ('activa', 'resuelta')", name="ck_lesion_estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    tipo: Mapped[str] = mapped_column(String(10))
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(String(10))
    registrado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    actualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
