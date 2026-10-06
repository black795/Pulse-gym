"""Datos iniciales. Es seguro ejecutarlo muchas veces: solo crea lo que falta."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permisos import ADMINISTRADOR, CLIENTE, DESCRIPCION_ROL, ENTRENADOR, RECEPCIONISTA, TODOS_LOS_ROLES
from app.models import EstadoUsuario, Rol, Sede, Usuario
from app.services import usuario_service

ESTADOS = [("activo", True), ("inactivo", False), ("suspendido", False)]

# Personal y cliente de ejemplo (los mismos nombres de tu diseño)
DEMO = [
    ("Carlos Mendoza", "carlos@pulsegym.com", ADMINISTRADOR, False),
    ("Pati Ríos", "pati@pulsegym.com", RECEPCIONISTA, True),
    ("Javier Torres", "javier@pulsegym.com", ENTRENADOR, True),
    ("Rosa Lima", "rosa@pulsegym.com", ENTRENADOR, True),
    ("Iván Castillo", "ivan@pulsegym.com", ENTRENADOR, True),
    ("Daniela Vargas", "daniela@pulsegym.com", CLIENTE, True),
]


def sembrar_catalogos(db: Session) -> None:
    for nombre in TODOS_LOS_ROLES:
        if db.scalar(select(Rol).where(Rol.nombre == nombre)) is None:
            db.add(Rol(nombre=nombre, descripcion=DESCRIPCION_ROL[nombre]))
    for nombre, permite in ESTADOS:
        if db.scalar(select(EstadoUsuario).where(EstadoUsuario.nombre == nombre)) is None:
            db.add(EstadoUsuario(nombre=nombre, permite_acceso=permite))
    db.commit()


def sembrar_demo(db: Session) -> None:
    sede = db.scalar(select(Sede).where(Sede.nombre == "Sede Central"))
    if sede is None:
        sede = Sede(nombre="Sede Central")
        db.add(sede)
        db.commit()

    password = get_settings().demo_password
    for nombre, email, rol, con_sede in DEMO:
        if usuario_service.buscar_por_email(db, email) is None:
            usuario_service.crear_usuario(
                db, nombre=nombre, email=email, password=password, rol=rol,
                sede_id=sede.id if con_sede else None, motivo="Usuario de demostración",
            )
