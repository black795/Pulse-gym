"""Inicio de sesión."""
from sqlalchemy.orm import Session

from app.core.security import HASH_RELLENO, crear_token, verificar_password
from app.models import Usuario
from app.services import usuario_service
from app.services.errores import ErrorNegocio

MENSAJE_CREDENCIALES = "Correo o contraseña incorrectos."


def autenticar(db: Session, email: str, password: str) -> Usuario:
    usuario = usuario_service.buscar_por_email(db, email)

    # Siempre se compara una contraseña (aunque el correo no exista): misma demora, misma respuesta.
    hash_a_comparar = usuario.password_hash if usuario else HASH_RELLENO
    password_ok = verificar_password(password, hash_a_comparar)
    if usuario is None or not password_ok:
        raise ErrorNegocio(MENSAJE_CREDENCIALES, 401)

    # Solo si la contraseña es correcta explicamos por qué no puede entrar.
    if not usuario.estado.permite_acceso:
        raise ErrorNegocio(
            f"Tu cuenta está {usuario.estado.nombre}. Habla con el administrador del gimnasio.", 403
        )
    return usuario


def emitir_token(usuario: Usuario) -> str:
    return crear_token(usuario.id, usuario.rol.nombre)
