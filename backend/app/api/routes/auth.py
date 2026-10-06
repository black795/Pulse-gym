from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import usuario_actual
from app.core.config import get_settings
from app.core.permisos import CLIENTE
from app.db.session import get_db
from app.models import Usuario
from app.schemas.auth import LoginIn, RegistroIn, SesionOut
from app.schemas.usuario import UsuarioOut
from app.services import auth_service, usuario_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _sesion(usuario: Usuario) -> SesionOut:
    return SesionOut(
        access_token=auth_service.emitir_token(usuario),
        expira_en_minutos=get_settings().access_token_minutos,
        usuario=usuario_service.a_usuario_out(usuario),
    )


@router.post("/login", response_model=SesionOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    return _sesion(auth_service.autenticar(db, datos.email, datos.password))


@router.post("/registro", response_model=SesionOut, status_code=status.HTTP_201_CREATED)
def registro(datos: RegistroIn, db: Session = Depends(get_db)):
    """Auto-registro: solo crea clientes. El personal lo da de alta el administrador."""
    usuario = usuario_service.crear_usuario(
        db, nombre=datos.nombre, email=datos.email, password=datos.password,
        telefono=datos.telefono, rol=CLIENTE, motivo="Auto-registro del cliente",
    )
    return _sesion(usuario)


@router.get("/me", response_model=UsuarioOut)
def yo(usuario: Usuario = Depends(usuario_actual)):
    return usuario_service.a_usuario_out(usuario)
