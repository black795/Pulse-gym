from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import DASHBOARD_VER
from app.db.session import get_db
from app.models import Usuario
from app.schemas.dashboard import DashboardOut
from app.services import dashboard_service as svc

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), usuario: Usuario = Depends(requiere_permiso(DASHBOARD_VER))):
    """Indicadores, alertas y actividad reciente. Solo incluye lo que el rol de quien consulta puede ver."""
    return svc.resumen(db, usuario)
