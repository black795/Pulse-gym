from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ahora
from app.models.estado_usuario import EstadoUsuario
from app.models.rol import Rol


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"))
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="RESTRICT"))
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados_usuario.id", ondelete="RESTRICT"))
    nombre: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))  # nunca la contraseña real
    telefono: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ahora, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=ahora, onupdate=ahora, server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)  # borrado lógico

    rol: Mapped[Rol] = relationship(lazy="joined")
    estado: Mapped[EstadoUsuario] = relationship(lazy="joined")
