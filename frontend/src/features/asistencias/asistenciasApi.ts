import { api } from '../../lib/http';
import type { EstadoMembresia } from '../membresias/membresiasApi';

export type EstadoActividad = 'activo' | 'en_riesgo' | 'abandono' | 'sin_asistencias';

export interface Asistencia {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_carnet: string;
  fecha_hora: string; // UTC, sin sufijo
  fecha: string; // AAAA-MM-DD en la zona del gimnasio
  hora: string; // "HH:MM" en la zona del gimnasio
  metodo: 'manual' | 'qr';
  registrado_por: number | null;
  registrado_por_nombre: string | null;
}

/** Respuesta del check-in: la entrada y, si hace falta, un aviso sobre la membresía. */
export interface Checkin extends Asistencia {
  membresia_estado: EstadoMembresia | null;
  membresia_dias_restantes: number | null;
  aviso: string | null;
}

export interface ResumenAsistencia {
  fecha: string;
  asistencias_hoy: number;
  clientes_hoy: number;
  hora_pico: string | null;
  promedio_diario_7_dias: number;
}

export interface ActividadCliente {
  cliente_id: number;
  cliente_nombre: string;
  cliente_carnet: string;
  ultima_asistencia: string | null;
  ultima_fecha: string | null;
  dias_sin_asistir: number | null; // null = nunca asistió
  asistencias_30_dias: number;
  estado: EstadoActividad;
  membresia_estado: EstadoMembresia | null;
}

export const asistenciasApi = {
  registrar: (clienteId: number) => api<Checkin>('/asistencias', { method: 'POST', body: { cliente_id: clienteId } }),
  deHoy: () => api<Asistencia[]>('/asistencias'),
  deCliente: (clienteId: number) => api<Asistencia[]>(`/asistencias?cliente_id=${clienteId}`),
  resumen: () => api<ResumenAsistencia>('/asistencias/resumen'),
  actividad: (estado?: EstadoActividad) => api<ActividadCliente[]>(`/asistencias/actividad${estado ? `?estado=${estado}` : ''}`),
  anular: (id: number) => api<null>(`/asistencias/${id}`, { method: 'DELETE' }),
};

export const ETIQUETA_ACTIVIDAD: Record<EstadoActividad, string> = {
  activo: 'Activo',
  en_riesgo: 'En riesgo',
  abandono: 'Abandono',
  sin_asistencias: 'Sin asistencias',
};

export const VARIANTE_ACTIVIDAD = {
  activo: 'success', en_riesgo: 'warning', abandono: 'danger', sin_asistencias: 'muted',
} as const;

/** 0 → "Hoy", 1 → "Ayer", 12 → "Hace 12 días", null → "Nunca". */
export function textoDiasSinAsistir(dias: number | null): string {
  if (dias === null) return 'Nunca';
  if (dias === 0) return 'Hoy';
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}
