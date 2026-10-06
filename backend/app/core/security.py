"""Contraseñas (bcrypt) y tokens de sesión (JWT)."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITMO = "HS256"
# bcrypt solo lee los primeros 72 bytes: más largo que eso se rechaza al validar.
MAX_BYTES_PASSWORD = 72


def hashear_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=get_settings().bcrypt_rounds)).decode("utf-8")


def verificar_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# Hash de relleno: cuando el correo no existe también "gastamos" el mismo tiempo,
# para que nadie pueda descubrir qué correos están registrados midiendo la demora.
HASH_RELLENO = hashear_password("relleno-no-es-una-contraseña-real")


def crear_token(usuario_id: int, rol: str) -> str:
    cfg = get_settings()
    ahora = datetime.now(timezone.utc)
    payload = {
        "sub": str(usuario_id),
        "rol": rol,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=cfg.access_token_minutos),
    }
    return jwt.encode(payload, cfg.secret_key, algorithm=ALGORITMO)


def leer_token(token: str) -> dict | None:
    """Devuelve el contenido del token, o None si es falso, manipulado o vencido."""
    try:
        return jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        return None
