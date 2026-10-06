"""Dependencias reutilizables: quién es el usuario actual y qué permisos exige cada ruta."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.permisos import permisos_de
from app.core.security import leer_token
from app.db.session import get_db
from app.models import Usuario

_bearer = HTTPBearer(auto_error=False)


def _no_autenticado(detalle: str = "Sesión inválida o vencida. Inicia sesión nuevamente.") -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detalle, headers={"WWW-Authenticate": "Bearer"}
    )


def usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciales is None:
        raise _no_autenticado("Debes iniciar sesión.")
    datos = leer_token(credenciales.credentials)
    if datos is None:
        raise _no_autenticado()

    try:
        usuario = db.get(Usuario, int(datos["sub"]))
    except (KeyError, ValueError):
        raise _no_autenticado()

    # Se revisa en la base de datos en CADA petición: si desactivan o eliminan a alguien,
    # su token deja de servir al instante (no hay que esperar a que venza).
    if usuario is None or usuario.deleted_at is not None or not usuario.estado.permite_acceso:
        raise _no_autenticado()
    return usuario


def requiere_permiso(*requeridos: str):
    """Uso:  Depends(requiere_permiso("usuarios:gestionar"))  → 403 si le falta alguna llave."""

    def verificador(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
        tiene = set(permisos_de(usuario.rol.nombre))
        faltan = [p for p in requeridos if p not in tiene]
        if faltan:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para realizar esta acción.")
        return usuario

    return verificador
