"""Datos iniciales. Es seguro ejecutarlo muchas veces: solo crea lo que falta."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permisos import ADMINISTRADOR, CLIENTE, DESCRIPCION_ROL, ENTRENADOR, RECEPCIONISTA, TODOS_LOS_ROLES
from app.models import EstadoUsuario, Rol, Sede, Usuario
from app.schemas.cliente import ClienteIn
from app.services import cliente_service, usuario_service

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

# Fichas de ejemplo para que el listado de clientes no arranque vacío
CLIENTES_DEMO = [
    {"nombre": "Daniela Vargas", "carnet": "7012345 LP", "telefono": "+591 70012345", "email": "daniela@pulsegym.com",
     "fecha_nacimiento": "1999-03-14", "peso_kg": 58, "altura_cm": 165, "objetivo": "Fuerza"},
    {"nombre": "Emerson Choque", "carnet": "7112345 LP", "telefono": "+591 71123456",
     "fecha_nacimiento": "1995-07-02", "peso_kg": 75, "altura_cm": 178, "objetivo": "Masa muscular"},
    {"nombre": "Valeria Prado", "carnet": "7223456 CB", "telefono": "+591 72234567",
     "fecha_nacimiento": "2002-11-21", "peso_kg": 54, "altura_cm": 160, "objetivo": "Pérdida de grasa"},
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

    for ficha in CLIENTES_DEMO:
        if cliente_service.buscar_por_carnet(db, ficha["carnet"]) is None:
            cliente_service.crear(db, ClienteIn(**ficha))
