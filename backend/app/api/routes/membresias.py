from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import MEMBRESIAS_VER, PAGOS_GESTIONAR
from app.db.session import get_db
from app.models import Usuario
from app.schemas.membresia import EstadoMembresia, MembresiaIn, MembresiaOut, PlanOut
from app.services import membresia_service as svc

router = APIRouter(tags=["Membresías"])
puede_ver = Depends(requiere_permiso(MEMBRESIAS_VER))
puede_registrar_pago = Depends(requiere_permiso(PAGOS_GESTIONAR))


@router.get("/planes", response_model=list[PlanOut])
def listar_planes(db: Session = Depends(get_db), _: Usuario = puede_ver):
    return svc.listar_planes(db)


@router.get("/membresias", response_model=list[MembresiaOut])
def listar(
    estado: EstadoMembresia | None = None, cliente_id: int | None = None,
    db: Session = Depends(get_db), _: Usuario = puede_ver,
):
    """Sin filtros: la membresía actual de cada cliente, de la que vence antes a la que vence después.
    `estado=por_vencer` o `estado=vencida` muestra a quién hay que avisar o cobrar."""
    return svc.listar(db, estado=estado, cliente_id=cliente_id)


@router.post("/membresias", response_model=MembresiaOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: MembresiaIn, db: Session = Depends(get_db), actor: Usuario = puede_registrar_pago):
    """Registra el pago de un plan; el vencimiento se calcula solo."""
    return svc.registrar(db, datos, actor)
