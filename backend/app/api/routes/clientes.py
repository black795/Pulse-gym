from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import CLIENTES_CREAR, CLIENTES_EDITAR, CLIENTES_VER
from app.db.session import get_db
from app.models import Usuario
from app.schemas.cliente import ClienteEditarIn, ClienteIn, ClienteOut
from app.services import cliente_service as svc

router = APIRouter(prefix="/clientes", tags=["Clientes"])
puede_ver = Depends(requiere_permiso(CLIENTES_VER))
puede_crear = Depends(requiere_permiso(CLIENTES_CREAR))
puede_editar = Depends(requiere_permiso(CLIENTES_EDITAR))


@router.get("", response_model=list[ClienteOut])
def listar(buscar: str | None = None, db: Session = Depends(get_db), _: Usuario = puede_ver):
    return [svc.a_cliente_out(c) for c in svc.listar(db, buscar=buscar)]


@router.post("", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def crear(datos: ClienteIn, db: Session = Depends(get_db), actor: Usuario = puede_crear):
    return svc.a_cliente_out(svc.crear(db, datos, actor))


@router.get("/{cliente_id}", response_model=ClienteOut)
def consultar(cliente_id: int, db: Session = Depends(get_db), _: Usuario = puede_ver):
    return svc.a_cliente_out(svc.obtener(db, cliente_id))


@router.patch("/{cliente_id}", response_model=ClienteOut)
def editar(cliente_id: int, datos: ClienteEditarIn, db: Session = Depends(get_db), _: Usuario = puede_editar):
    return svc.a_cliente_out(svc.editar(db, svc.obtener(db, cliente_id), datos))
