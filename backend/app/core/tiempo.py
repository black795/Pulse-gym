"""La fecha de 'hoy' se decide con la zona horaria del gimnasio, no con la del servidor."""
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def zona() -> ZoneInfo:
    return ZoneInfo(get_settings().zona_horaria)


def hoy() -> date:
    return datetime.now(zona()).date()


def a_local(utc_sin_zona: datetime) -> datetime:
    """Convierte un instante guardado en la base (UTC, sin zona) a la hora del gimnasio."""
    return utc_sin_zona.replace(tzinfo=timezone.utc).astimezone(zona())
