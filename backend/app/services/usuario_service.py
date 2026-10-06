"""Reglas de negocio de usuarios: crear, cambiar rol, cambiar estado."""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permisos import permisos_de
from app.core.security import hashear_password
from app.db.base import ahora
from app.models import EstadoUsuario, HistorialEstadoUsuario, Rol, Usuario
from app.schemas.usuario import UsuarioOut
from app.services.errores import ErrorNegocio


def a_usuario_out(u: Usuario) -> UsuarioOut:
    return UsuarioOut(
        id=u.id, nombre=u.nombre, email=u.email, telefono=u.telefono,
        rol=u.rol.nombre, estado=u.estado.nombre, permisos=permisos_de(u.rol.nombre),
        created_at=u.created_at,
    )


def normalizar_email(email: str) -> str:
    return email.strip().lower()


def buscar_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(
        select(Usuario).where(Usuario.email == normalizar_email(email), Usuario.deleted_at.is_(None))
    )


def obtener(db: Session, usuario_id: int) -> Usuario:
    u = db.get(Usuario, usuario_id)
    if u is None or u.deleted_at is not None:
        raise ErrorNegocio("Usuario no encontrado.", 404)
    return u


def _rol(db: Session, nombre: str) -> Rol:
    r = db.scalar(select(Rol).where(Rol.nombre == nombre))
    if r is None:
        raise ErrorNegocio(f"El rol '{nombre}' no existe.", 400)
    return r


def _estado(db: Session, nombre: str) -> EstadoUsuario:
    e = db.scalar(select(EstadoUsuario).where(EstadoUsuario.nombre == nombre))
    if e is None:
        raise ErrorNegocio(f"El estado '{nombre}' no existe.", 400)
    return e


def crear_usuario(
    db: Session, *, nombre: str, email: str, password: str, rol: str,
    telefono: str | None = None, sede_id: int | None = None,
    creado_por: int | None = None, motivo: str = "Alta de cuenta",
) -> Usuario:
    email = normalizar_email(email)
    if buscar_por_email(db, email) is not None:
        raise ErrorNegocio("Ese correo ya está registrado.", 409)

    estado = _estado(db, "activo")
    usuario = Usuario(
        nombre=nombre, email=email, telefono=telefono, sede_id=sede_id,
        password_hash=hashear_password(password),
        rol_id=_rol(db, rol).id, estado_id=estado.id,
    )
    db.add(usuario)
    try:
        db.flush()  # obtiene el id del usuario
        # Todo usuario nace con su primera fila de historial de estado.
        db.add(HistorialEstadoUsuario(
            usuario_id=usuario.id, estado_id=estado.id, motivo=motivo, cambiado_por=creado_por,
        ))
        db.commit()
    except IntegrityError:  # dos registros simultáneos con el mismo correo
        db.rollback()
        raise ErrorNegocio("Ese correo ya está registrado.", 409)
    db.refresh(usuario)
    return usuario


def listar(db: Session, *, solo_personal: bool = False) -> list[Usuario]:
    consulta = select(Usuario).where(Usuario.deleted_at.is_(None)).order_by(Usuario.id)
    if solo_personal:
        consulta = consulta.join(Rol, Usuario.rol_id == Rol.id).where(Rol.nombre != "cliente")
    return list(db.scalars(consulta).unique())


def cambiar_rol(db: Session, usuario: Usuario, rol: str, actor: Usuario) -> Usuario:
    if usuario.id == actor.id:
        raise ErrorNegocio("No puedes cambiar tu propio rol.", 400)
    usuario.rol_id = _rol(db, rol).id
    db.commit()
    db.refresh(usuario)
    return usuario


def cambiar_estado(
    db: Session, usuario: Usuario, estado: str, motivo: str | None, actor: Usuario
) -> Usuario:
    """Equivale a cambiar_estado_usuario() de tu SQL: cierra el estado vigente, abre uno nuevo."""
    if usuario.id == actor.id:
        raise ErrorNegocio("No puedes cambiar el estado de tu propia cuenta.", 400)
    nuevo = _estado(db, estado)
    if usuario.estado_id == nuevo.id:
        raise ErrorNegocio(f"El usuario ya está '{nuevo.nombre}'.", 400)

    momento = ahora()
    vigente = db.scalar(select(HistorialEstadoUsuario).where(
        HistorialEstadoUsuario.usuario_id == usuario.id, HistorialEstadoUsuario.hasta.is_(None)
    ))
    if vigente is not None:
        vigente.hasta = momento
        db.flush()  # cierra el anterior ANTES de abrir el nuevo (índice de "un solo vigente")
    db.add(HistorialEstadoUsuario(
        usuario_id=usuario.id, estado_id=nuevo.id, desde=momento, motivo=motivo, cambiado_por=actor.id,
    ))
    usuario.estado_id = nuevo.id
    db.commit()  # todo o nada: si algo falla, no queda nada a medias
    db.refresh(usuario)
    return usuario
