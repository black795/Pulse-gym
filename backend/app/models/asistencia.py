from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ahora


class Asistencia(Base):
    """Una entrada (check-in) de un cliente al gimnasio. Cada sesión es un registro."""

    __tablename__ = "asistencias"
    __table_args__ = (
        CheckConstraint("metodo IN ('manual', 'qr')", name="ck_asistencia_metodo"),
        Index("ix_asistencias_cliente_fecha_hora", "cliente_id", "fecha_hora"),  # última entrada e historial
        # Sin esto SQLite reutiliza el id de una entrada anulada, y una pantalla desactualizada
        # podría anular por error la entrada nueva de otro cliente.
        {"sqlite_autoincrement": True},
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"))
    fecha_hora: Mapped[datetime] = mapped_column(DateTime, default=ahora)  # instante en UTC
    fecha: Mapped[date] = mapped_column(Date, index=True)  # día según la zona del gimnasio
    metodo: Mapped[str] = mapped_column(String(10), default="manual", server_default="manual")
    registrado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
