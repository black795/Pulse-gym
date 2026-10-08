from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class HistorialLesion(Base):
    """Fotografía inmutable después de cada alta o modificación real."""

    __tablename__ = "historial_lesion"
    __table_args__ = (
        CheckConstraint("tipo IN ('lesion', 'limitacion')", name="ck_hist_lesion_tipo"),
        CheckConstraint("estado IN ('activa', 'resuelta')", name="ck_hist_lesion_estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lesion_id: Mapped[int] = mapped_column(ForeignKey("lesiones.id", ondelete="RESTRICT"), index=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    tipo: Mapped[str] = mapped_column(String(10))
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
