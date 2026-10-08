from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import PROPIO_VER
from app.db.session import get_db
from app.models import Usuario
from app.schemas.mi_cuenta import MiCuentaOut
from app.services import mi_cuenta_service as svc

router = APIRouter(prefix="/mi-cuenta", tags=["App del cliente"])


@router.get("", response_model=MiCuentaOut)
def mi_cuenta(db: Session = Depends(get_db), usuario: Usuario = Depends(requiere_permiso(PROPIO_VER))):
    """Ficha, membresía, lesiones activas y asistencia del cliente que inició sesión (solo sus datos)."""
    return svc.resumen(db, usuario)
