from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import requiere_permiso
from app.core.permisos import USUARIOS_GESTIONAR
from app.db.session import get_db
from app.models import Usuario
from app.schemas.usuario import CambiarEstadoIn, CambiarRolIn, UsuarioOut, UsuarioPersonalIn
from app.services import usuario_service as svc

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])
solo_admin = Depends(requiere_permiso(USUARIOS_GESTIONAR))


@router.get("", response_model=list[UsuarioOut])
def listar(solo_personal: bool = False, db: Session = Depends(get_db), _: Usuario = solo_admin):
    return [svc.a_usuario_out(u) for u in svc.listar(db, solo_personal=solo_personal)]


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_personal(datos: UsuarioPersonalIn, db: Session = Depends(get_db), actor: Usuario = solo_admin):
    u = svc.crear_usuario(
        db, nombre=datos.nombre, email=datos.email, password=datos.password,
        telefono=datos.telefono, rol=datos.rol, creado_por=actor.id,
        motivo="Alta de personal por el administrador",
    )
    return svc.a_usuario_out(u)


@router.patch("/{usuario_id}/rol", response_model=UsuarioOut)
def cambiar_rol(usuario_id: int, datos: CambiarRolIn, db: Session = Depends(get_db), actor: Usuario = solo_admin):
    return svc.a_usuario_out(svc.cambiar_rol(db, svc.obtener(db, usuario_id), datos.rol, actor))


@router.patch("/{usuario_id}/estado", response_model=UsuarioOut)
def cambiar_estado(usuario_id: int, datos: CambiarEstadoIn, db: Session = Depends(get_db), actor: Usuario = solo_admin):
    u = svc.cambiar_estado(db, svc.obtener(db, usuario_id), datos.estado, datos.motivo, actor)
    return svc.a_usuario_out(u)
