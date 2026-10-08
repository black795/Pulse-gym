from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import LESIONES_GESTIONAR
from app.db.session import get_db
from app.models import Usuario
from app.schemas.lesion import HistorialLesionOut, LesionEditarIn, LesionIn, LesionOut
from app.services import lesion_service as svc

router = APIRouter(tags=["Lesiones"])
puede_gestionar = Depends(requiere_permiso(LESIONES_GESTIONAR))


@router.post("/clientes/{cliente_id}/lesiones", response_model=LesionOut, status_code=status.HTTP_201_CREATED)
def crear(cliente_id: int, datos: LesionIn, db: Session = Depends(get_db), actor: Usuario = puede_gestionar):
    return svc.a_lesion_out(db, svc.crear(db, cliente_id, datos, actor))


@router.get("/clientes/{cliente_id}/lesiones", response_model=list[LesionOut])
def listar_cliente(cliente_id: int, solo_vigentes: bool = False, db: Session = Depends(get_db),
                   _: Usuario = puede_gestionar):
    return [svc.a_lesion_out(db, lesion) for lesion in svc.listar(db, cliente_id, solo_vigentes)]


@router.get("/lesiones", response_model=list[LesionOut])
def listar(solo_vigentes: bool = False, db: Session = Depends(get_db), _: Usuario = puede_gestionar):
    return [svc.a_lesion_out(db, lesion) for lesion in svc.listar(db, solo_vigentes=solo_vigentes)]


@router.patch("/lesiones/{lesion_id}", response_model=LesionOut)
def editar(lesion_id: int, datos: LesionEditarIn, db: Session = Depends(get_db), actor: Usuario = puede_gestionar):
    return svc.a_lesion_out(db, svc.editar(db, svc.obtener(db, lesion_id), datos, actor))


@router.get("/lesiones/{lesion_id}/historial", response_model=list[HistorialLesionOut])
def historial(lesion_id: int, db: Session = Depends(get_db), _: Usuario = puede_gestionar):
    return svc.historial(db, lesion_id)
