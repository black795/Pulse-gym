"""Datos iniciales. Es seguro ejecutarlo muchas veces: solo crea lo que falta."""
from datetime import datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permisos import ADMINISTRADOR, CLIENTE, DESCRIPCION_ROL, ENTRENADOR, RECEPCIONISTA, TODOS_LOS_ROLES
from app.core.tiempo import hoy as hoy_local
from app.models import Asistencia, EstadoUsuario, Membresia, Plan, Rol, Sede, Usuario
from app.schemas.cliente import ClienteIn
from app.schemas.membresia import MembresiaIn
from app.services import asistencia_service, cliente_service, membresia_service, usuario_service

PLANES = [("Mensual", 1, 150), ("Trimestral", 3, 400), ("Semestral", 6, 700)]

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
    for nombre, meses, precio in PLANES:
        if db.scalar(select(Plan).where(Plan.nombre == nombre)) is None:
            db.add(Plan(nombre=nombre, duracion_meses=meses, precio=precio))
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

    # Un pago por cliente con fechas relativas a hoy, para ver los tres estados (vigente, por vencer, vencida)
    if db.query(Membresia).count() == 0:
        hoy = hoy_local()
        pagos = [("7012345 LP", "Trimestral", hoy - timedelta(days=10)),
                 ("7112345 LP", "Mensual", hoy - timedelta(days=26)),
                 ("7223456 CB", "Mensual", hoy - timedelta(days=45))]
        for carnet, plan, pago in pagos:
            membresia_service.registrar(db, MembresiaIn(
                cliente_id=cliente_service.buscar_por_carnet(db, carnet).id,
                plan_id=db.scalar(select(Plan).where(Plan.nombre == plan)).id, fecha_pago=pago,
            ))

    # Entradas de ejemplo con fechas relativas a hoy: un cliente activo, uno en riesgo y uno en abandono.
    # Ninguna es de hoy, para que el check-in de la demo no choque con la regla de duplicados.
    if db.query(Asistencia).count() == 0:
        hoy = hoy_local()
        visitas = [("7012345 LP", (12, 9, 6, 4, 2, 1)), ("7112345 LP", (25, 20)), ("7223456 CB", (45,))]
        for carnet, dias_atras in visitas:
            cliente = cliente_service.buscar_por_carnet(db, carnet)
            for dias in dias_atras:  # 11:30 UTC = 07:30 en La Paz
                asistencia_service.registrar(
                    db, cliente.id, momento=datetime.combine(hoy - timedelta(days=dias), time(11, 30)),
                )
