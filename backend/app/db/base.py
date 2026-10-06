from datetime import datetime, timezone

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase madre de todos los modelos (tablas)."""


def ahora() -> datetime:
    """Fecha/hora actual en UTC, sin zona (igual que TIMESTAMP de tu esquema SQL)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
