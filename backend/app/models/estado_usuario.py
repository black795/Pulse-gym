from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EstadoUsuario(Base):
    __tablename__ = "estados_usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True)
    # ¿Puede iniciar sesión estando en este estado? (activo = sí; inactivo/suspendido = no)
    permite_acceso: Mapped[bool] = mapped_column(Boolean)
