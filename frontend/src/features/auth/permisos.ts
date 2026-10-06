import type { Rol, Usuario } from './types';

/**
 * Las mismas "llaves" que define el backend (app/core/permisos.py).
 * El backend es quien decide; aquí solo se usan para mostrar u ocultar cosas.
 */
export const PERMISOS = {
  DASHBOARD_VER: 'dashboard:ver',
  CLIENTES_VER: 'clientes:ver',
  CLIENTES_CREAR: 'clientes:crear',
  CLIENTES_EDITAR: 'clientes:editar',
  MEMBRESIAS_VER: 'membresias:ver',
  MEMBRESIAS_GESTIONAR: 'membresias:gestionar',
  PAGOS_GESTIONAR: 'pagos:gestionar',
  ASISTENCIA_VER: 'asistencia:ver',
  ASISTENCIA_GESTIONAR: 'asistencia:gestionar',
  MAQUINAS_VER: 'maquinas:ver',
  MAQUINAS_GESTIONAR: 'maquinas:gestionar',
  RUTINAS_GESTIONAR: 'rutinas:gestionar',
  MEDICIONES_GESTIONAR: 'mediciones:gestionar',
  LESIONES_GESTIONAR: 'lesiones:gestionar',
  REPORTES_VER: 'reportes:ver',
  USUARIOS_GESTIONAR: 'usuarios:gestionar',
  PROPIO_VER: 'propio:ver',
  RUTINA_PROPIA_VER: 'rutina_propia:ver',
  ENTRENADOR_IA_USAR: 'entrenador_ia:usar',
  HISTORIAL_PROPIO_VER: 'historial_propio:ver',
  CHECKIN_QR: 'checkin:qr',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

/** Cómo se ve cada rol en la interfaz (colores de tu pantalla "Roles y permisos"). */
export const ROLES_UI: Record<Rol, { etiqueta: string; color: string; fondo: string }> = {
  administrador: { etiqueta: 'Dueño', color: 'var(--neon)', fondo: 'var(--sidebar)' },
  recepcionista: { etiqueta: 'Recepcionista', color: '#0891b2', fondo: '#ecfeff' },
  entrenador: { etiqueta: 'Entrenador', color: '#7c3aed', fondo: '#f5f3ff' },
  cliente: { etiqueta: 'Cliente', color: 'var(--primary)', fondo: 'var(--primary-tint)' },
};

/** Texto amigable para cada llave (se usa en la pantalla de roles). */
export const ETIQUETA_PERMISO: Record<string, string> = {
  'dashboard:ver': 'Ver dashboard',
  'clientes:ver': 'Ver fichas de clientes',
  'clientes:crear': 'Registrar clientes nuevos',
  'clientes:editar': 'Editar fichas de clientes',
  'membresias:ver': 'Ver membresías',
  'membresias:gestionar': 'Gestionar membresías',
  'pagos:gestionar': 'Registro de pagos',
  'asistencia:ver': 'Ver asistencia',
  'asistencia:gestionar': 'Check-in de clientes',
  'maquinas:ver': 'Ver máquinas',
  'maquinas:gestionar': 'Gestionar máquinas',
  'rutinas:gestionar': 'Crear y editar rutinas',
  'mediciones:gestionar': 'Registrar mediciones',
  'lesiones:gestionar': 'Registrar lesiones',
  'reportes:ver': 'Reportes financieros',
  'usuarios:gestionar': 'Gestión de staff y roles',
  'propio:ver': 'Ver su propia ficha',
  'rutina_propia:ver': 'Ver su rutina',
  'entrenador_ia:usar': 'Chat con Entrenador IA',
  'historial_propio:ver': 'Ver su historial',
  'checkin:qr': 'Registrar entrada (QR)',
};

const ORDEN = Object.keys(ETIQUETA_PERMISO);
/** Ordena permisos de forma lógica (dashboard primero, staff al final) en vez de alfabética. */
export function ordenarPermisos(permisos: string[]): string[] {
  return [...permisos].sort((a, b) => ORDEN.indexOf(a) - ORDEN.indexOf(b));
}

export function tienePermiso(usuario: Usuario | null, permiso: string): boolean {
  return !!usuario && usuario.permisos.includes(permiso);
}

/** A dónde va cada quien después de iniciar sesión. */
export function rutaInicial(usuario: Usuario): string {
  if (tienePermiso(usuario, PERMISOS.DASHBOARD_VER)) return '/admin/dashboard';
  if (tienePermiso(usuario, PERMISOS.RUTINA_PROPIA_VER)) return '/mobile';
  return '/sin-permiso';
}

export function primerNombre(usuario: Usuario | null): string {
  return usuario?.nombre.split(' ')[0] ?? '';
}
