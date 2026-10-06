"""
Fuente única de verdad de ROLES y PERMISOS.

Idea simple: un rol es un "llavero" y cada permiso es una "llave".
  - El backend usa estas llaves para decidir si deja pasar una petición.
  - El frontend recibe la lista de llaves del usuario (en /auth/me) y con eso
    decide qué menús y pantallas mostrar. Así nunca quedan desalineados.

Los nombres de rol coinciden con la tabla `roles` de tu base de datos.
"""

# ---- Nombres de rol (tabla roles) ----
ADMINISTRADOR = "administrador"  # en la interfaz se muestra como "Dueño"
RECEPCIONISTA = "recepcionista"
ENTRENADOR = "entrenador"
CLIENTE = "cliente"

# ---- Permisos del personal (formato "módulo:acción") ----
DASHBOARD_VER = "dashboard:ver"
CLIENTES_VER = "clientes:ver"
CLIENTES_CREAR = "clientes:crear"
CLIENTES_EDITAR = "clientes:editar"
MEMBRESIAS_VER = "membresias:ver"
MEMBRESIAS_GESTIONAR = "membresias:gestionar"
PAGOS_GESTIONAR = "pagos:gestionar"
ASISTENCIA_VER = "asistencia:ver"
ASISTENCIA_GESTIONAR = "asistencia:gestionar"
MAQUINAS_VER = "maquinas:ver"
MAQUINAS_GESTIONAR = "maquinas:gestionar"
RUTINAS_GESTIONAR = "rutinas:gestionar"
MEDICIONES_GESTIONAR = "mediciones:gestionar"
LESIONES_GESTIONAR = "lesiones:gestionar"
REPORTES_VER = "reportes:ver"
USUARIOS_GESTIONAR = "usuarios:gestionar"  # staff, roles y estados de cuenta

# ---- Permisos del cliente (solo sobre sus propios datos) ----
PROPIO_VER = "propio:ver"
RUTINA_PROPIA_VER = "rutina_propia:ver"
ENTRENADOR_IA_USAR = "entrenador_ia:usar"
HISTORIAL_PROPIO_VER = "historial_propio:ver"
CHECKIN_QR = "checkin:qr"

PERMISOS_POR_ROL: dict[str, frozenset[str]] = {
    ADMINISTRADOR: frozenset({
        DASHBOARD_VER, CLIENTES_VER, CLIENTES_CREAR, CLIENTES_EDITAR,
        MEMBRESIAS_VER, MEMBRESIAS_GESTIONAR, PAGOS_GESTIONAR,
        ASISTENCIA_VER, ASISTENCIA_GESTIONAR, MAQUINAS_VER, MAQUINAS_GESTIONAR,
        RUTINAS_GESTIONAR, MEDICIONES_GESTIONAR, LESIONES_GESTIONAR,
        REPORTES_VER, USUARIOS_GESTIONAR,
    }),
    RECEPCIONISTA: frozenset({
        DASHBOARD_VER, CLIENTES_VER, CLIENTES_CREAR, CLIENTES_EDITAR,
        MEMBRESIAS_VER, PAGOS_GESTIONAR, ASISTENCIA_VER, ASISTENCIA_GESTIONAR,
        MAQUINAS_VER,
    }),
    ENTRENADOR: frozenset({
        DASHBOARD_VER, CLIENTES_VER, ASISTENCIA_VER, MAQUINAS_VER,
        RUTINAS_GESTIONAR, MEDICIONES_GESTIONAR, LESIONES_GESTIONAR,
    }),
    CLIENTE: frozenset({
        PROPIO_VER, RUTINA_PROPIA_VER, ENTRENADOR_IA_USAR,
        HISTORIAL_PROPIO_VER, CHECKIN_QR,
    }),
}

ROLES_PERSONAL = (ADMINISTRADOR, RECEPCIONISTA, ENTRENADOR)
TODOS_LOS_ROLES = (ADMINISTRADOR, RECEPCIONISTA, ENTRENADOR, CLIENTE)

DESCRIPCION_ROL = {
    ADMINISTRADOR: "Gestiona sedes, usuarios, equipo y configuración",
    RECEPCIONISTA: "Registra clientes, asistencia y atención en recepción",
    ENTRENADOR: "Gestiona lesiones, valida y ajusta rutinas de sus clientes",
    CLIENTE: "Consulta su rutina y su progreso",
}


def permisos_de(rol: str) -> list[str]:
    """Lista ordenada de permisos de un rol (vacía si el rol no existe)."""
    return sorted(PERMISOS_POR_ROL.get(rol, frozenset()))
