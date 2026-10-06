from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class HistorialEstadoUsuario(Base):
    """Cada fila = un periodo en que el usuario estuvo en un estado. hasta=NULL → es el vigente."""

    __tablename__ = "historial_estado_usuario"
    __table_args__ = (
        CheckConstraint("hasta IS NULL OR hasta >= desde", name="ck_hist_usuario_fechas"),
        # Un usuario solo puede tener UN estado vigente a la vez.
        Index(
            "un_estado_vigente_usuario",
            "usuario_id",
            unique=True,
            postgresql_where=text("hasta IS NULL"),
            sqlite_where=text("hasta IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"))
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados_usuario.id", ondelete="RESTRICT"))
    desde: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
    hasta: Mapped[datetime | None] = mapped_column(DateTime)
    motivo: Mapped[str | None] = mapped_column(String(200))
    cambiado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=ahora, onupdate=ahora, server_default=func.now()
    )
