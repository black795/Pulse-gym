"""Reglas de negocio de la ficha de cliente: crear, listar, consultar y editar."""
from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Cliente, Usuario
from app.schemas.cliente import ClienteEditarIn, ClienteIn, ClienteOut
from app.services.errores import ErrorNegocio

CARNET_REPETIDO = "Ya existe un cliente registrado con ese carnet."


def calcular_edad(nacimiento: date, hoy: date | None = None) -> int:
    hoy = hoy or date.today()
    aun_no_cumple = (hoy.month, hoy.day) < (nacimiento.month, nacimiento.day)
    return hoy.year - nacimiento.year - aun_no_cumple


def a_cliente_out(c: Cliente) -> ClienteOut:
    return ClienteOut(
        id=c.id, nombre=c.nombre, carnet=c.carnet, telefono=c.telefono, email=c.email,
        fecha_nacimiento=c.fecha_nacimiento, edad=calcular_edad(c.fecha_nacimiento),
        peso_kg=c.peso_kg, altura_cm=c.altura_cm, objetivo=c.objetivo,
        created_at=c.created_at, updated_at=c.updated_at,
    )


def obtener(db: Session, cliente_id: int) -> Cliente:
    c = db.get(Cliente, cliente_id)
    if c is None:
        raise ErrorNegocio("Cliente no encontrado.", 404)
    return c


def buscar_por_carnet(db: Session, carnet: str) -> Cliente | None:
    return db.scalar(select(Cliente).where(Cliente.carnet == carnet))


def listar(db: Session, *, buscar: str | None = None) -> list[Cliente]:
    consulta = select(Cliente).order_by(Cliente.nombre, Cliente.id)
    if buscar and buscar.strip():
        patron = f"%{buscar.strip().lower()}%"
        consulta = consulta.where(or_(
            func.lower(Cliente.nombre).like(patron), func.lower(Cliente.carnet).like(patron),
        ))
    return list(db.scalars(consulta))


def crear(db: Session, datos: ClienteIn, actor: Usuario | None = None) -> Cliente:
    if buscar_por_carnet(db, datos.carnet) is not None:
        raise ErrorNegocio(CARNET_REPETIDO, 409)

    cliente = Cliente(
        **datos.model_dump(),
        sede_id=actor.sede_id if actor else None,
        registrado_por=actor.id if actor else None,
    )
    db.add(cliente)
    try:
        db.commit()
    except IntegrityError:  # dos altas simultáneas con el mismo carnet
        db.rollback()
        raise ErrorNegocio(CARNET_REPETIDO, 409)
    db.refresh(cliente)
    return cliente


def editar(db: Session, cliente: Cliente, datos: ClienteEditarIn) -> Cliente:
    cambios = datos.model_dump(exclude_unset=True)
    carnet = cambios.get("carnet")
    if carnet and carnet != cliente.carnet and buscar_por_carnet(db, carnet) is not None:
        raise ErrorNegocio(CARNET_REPETIDO, 409)

    for campo, valor in cambios.items():
        setattr(cliente, campo, valor)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ErrorNegocio(CARNET_REPETIDO, 409)
    db.refresh(cliente)
    return cliente
