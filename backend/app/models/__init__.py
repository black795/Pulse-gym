"""Importar todos los modelos aquí hace que SQLAlchemy los conozca al crear las tablas."""
from app.models.cliente import Cliente
from app.models.lesion import Lesion
from app.models.historial_lesion import HistorialLesion
from app.models.estado_usuario import EstadoUsuario
from app.models.historial_estado_usuario import HistorialEstadoUsuario
from app.models.rol import Rol
from app.models.sede import Sede
from app.models.usuario import Usuario

__all__ = ["Cliente", "Lesion", "HistorialLesion", "EstadoUsuario", "HistorialEstadoUsuario", "Rol", "Sede", "Usuario"]
