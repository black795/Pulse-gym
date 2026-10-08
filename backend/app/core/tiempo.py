"""La fecha de 'hoy' se decide con la zona horaria del gimnasio, no con la del servidor."""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def hoy() -> date:
    return datetime.now(ZoneInfo(get_settings().zona_horaria)).date()
