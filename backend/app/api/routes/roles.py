from fastapi import APIRouter, Depends

from app.api.deps import requiere_permiso
from app.core.permisos import DESCRIPCION_ROL, TODOS_LOS_ROLES, USUARIOS_GESTIONAR, permisos_de
from app.schemas.usuario import RolOut

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=list[RolOut], dependencies=[Depends(requiere_permiso(USUARIOS_GESTIONAR))])
def listar_roles():
    """Catálogo de roles con sus permisos (alimenta la pantalla 'Roles y permisos')."""
    return [
        RolOut(nombre=r, descripcion=DESCRIPCION_ROL[r], permisos=permisos_de(r))
        for r in TODOS_LOS_ROLES
    ]
