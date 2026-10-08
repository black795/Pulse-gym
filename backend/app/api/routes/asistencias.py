from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import ASISTENCIA_GESTIONAR, ASISTENCIA_VER, MEMBRESIAS_VER, permisos_de
from app.db.session import get_db
from app.models import Usuario
from app.schemas.asistencia import (
    ActividadClienteOut, AsistenciaOut, CheckinIn, CheckinOut, EstadoActividad, ResumenAsistenciaOut,
)
from app.services import asistencia_service as svc

router = APIRouter(prefix="/asistencias", tags=["Asistencia"])
puede_ver = Depends(requiere_permiso(ASISTENCIA_VER))
puede_gestionar = Depends(requiere_permiso(ASISTENCIA_GESTIONAR))


@router.post("", response_model=CheckinOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: CheckinIn, db: Session = Depends(get_db), actor: Usuario = puede_gestionar):
    """Check-in: registra la entrada del cliente con la fecha y hora del sistema."""
    return svc.registrar(db, datos.cliente_id, actor)


@router.get("", response_model=list[AsistenciaOut])
def listar(
    fecha: date | None = None, cliente_id: int | None = None,
    limite: int = Query(default=200, ge=1, le=svc.LIMITE_MAXIMO),
    db: Session = Depends(get_db), _: Usuario = puede_ver,
):
    """Sin filtros: las entradas de hoy. `cliente_id` solo: el historial de ese cliente."""
    return svc.listar(db, fecha=fecha, cliente_id=cliente_id, limite=limite)


@router.get("/resumen", response_model=ResumenAsistenciaOut)
def resumen(db: Session = Depends(get_db), _: Usuario = puede_ver):
    return svc.resumen(db)


@router.get("/actividad", response_model=list[ActividadClienteOut])
def actividad(estado: EstadoActividad | None = None, db: Session = Depends(get_db), usuario: Usuario = puede_ver):
    """Cliente activo o en abandono según su última asistencia.
    El estado de la membresía solo se incluye para quien puede ver membresías."""
    ve_membresias = MEMBRESIAS_VER in permisos_de(usuario.rol.nombre)
    return svc.actividad(db, estado=estado, con_membresia=ve_membresias)


@router.delete("/{asistencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def anular(asistencia_id: int, db: Session = Depends(get_db), actor: Usuario = puede_gestionar):
    svc.anular(db, asistencia_id, actor)
