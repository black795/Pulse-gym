from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import ahora
from app.models import Cliente, HistorialLesion, Lesion, Usuario
from app.schemas.lesion import HistorialLesionOut, LesionEditarIn, LesionIn, LesionOut
from app.services import cliente_service
from app.services.errores import ErrorNegocio


def obtener(db: Session, lesion_id: int) -> Lesion:
    lesion = db.scalar(select(Lesion).where(Lesion.id == lesion_id).with_for_update())
    if lesion is None:
        raise ErrorNegocio("Lesión o limitación no encontrada.", 404)
    return lesion


def listar(db: Session, cliente_id: int | None = None, solo_vigentes: bool = False) -> list[Lesion]:
    consulta = select(Lesion).order_by(Lesion.updated_at.desc(), Lesion.id.desc())
    if cliente_id is not None:
        cliente_service.obtener(db, cliente_id)
        consulta = consulta.where(Lesion.cliente_id == cliente_id)
    if solo_vigentes:
        consulta = consulta.where(Lesion.estado == "activa")
    return list(db.scalars(consulta))


def _guardar_historial(db: Session, lesion: Lesion, actor: Usuario):
    db.add(HistorialLesion(
        lesion_id=lesion.id, usuario_id=actor.id, tipo=lesion.tipo,
        nombre=lesion.nombre, descripcion=lesion.descripcion, estado=lesion.estado,
        created_at=lesion.updated_at,
    ))


def crear(db: Session, cliente_id: int, datos: LesionIn, actor: Usuario) -> Lesion:
    cliente_service.obtener(db, cliente_id)
    fecha = ahora()
    lesion = Lesion(**datos.model_dump(), cliente_id=cliente_id, registrado_por=actor.id,
                    actualizado_por=actor.id, created_at=fecha, updated_at=fecha)
    try:
        db.add(lesion)
        db.flush()
        _guardar_historial(db, lesion, actor)
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(lesion)
    return lesion


def editar(db: Session, lesion: Lesion, datos: LesionEditarIn, actor: Usuario) -> Lesion:
    cambios = {campo: valor for campo, valor in datos.model_dump(exclude_unset=True).items()
               if getattr(lesion, campo) != valor}
    if not cambios:
        return lesion
    try:
        for campo, valor in cambios.items():
            setattr(lesion, campo, valor)
        lesion.updated_at = ahora()
        lesion.actualizado_por = actor.id
        _guardar_historial(db, lesion, actor)
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(lesion)
    return lesion


def a_lesion_out(db: Session, lesion: Lesion) -> LesionOut:
    responsable = db.get(Usuario, lesion.actualizado_por) if lesion.actualizado_por else None
    return LesionOut(
        **{campo: getattr(lesion, campo) for campo in LesionOut.model_fields
           if campo not in ("cliente_nombre", "responsable_nombre")},
        cliente_nombre=db.get(Cliente, lesion.cliente_id).nombre,
        responsable_nombre=responsable.nombre if responsable else None,
    )


def historial(db: Session, lesion_id: int) -> list[HistorialLesionOut]:
    obtener(db, lesion_id)
    eventos = db.scalars(select(HistorialLesion).where(HistorialLesion.lesion_id == lesion_id)
                         .order_by(HistorialLesion.created_at, HistorialLesion.id))
    resultado = []
    for evento in eventos:
        usuario = db.get(Usuario, evento.usuario_id) if evento.usuario_id else None
        resultado.append(HistorialLesionOut(
            **{campo: getattr(evento, campo) for campo in HistorialLesionOut.model_fields
               if campo != "usuario_nombre"}, usuario_nombre=usuario.nombre if usuario else None,
        ))
    return resultado
