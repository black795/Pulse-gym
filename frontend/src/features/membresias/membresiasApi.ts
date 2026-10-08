import { api } from '../../lib/http';

export type EstadoMembresia = 'vigente' | 'por_vencer' | 'vencida';

export interface Plan {
  id: number;
  nombre: string;
  duracion_meses: number;
  precio: number;
}

export interface Membresia {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_carnet: string;
  plan_id: number;
  plan: string;
  duracion_meses: number;
  fecha_pago: string; // AAAA-MM-DD
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: EstadoMembresia;
  dias_restantes: number; // negativo = días desde que venció
}

export const membresiasApi = {
  planes: () => api<Plan[]>('/planes'),
  /** Para la app del cliente: su membresía actual (null si aún no paga). */
  mia: () => api<Membresia | null>('/membresias/mia'),
  listar: (estado?: EstadoMembresia) => api<Membresia[]>(`/membresias${estado ? `?estado=${estado}` : ''}`),
  registrarPago: (datos: { cliente_id: number; plan_id: number; fecha_pago?: string }) =>
    api<Membresia>('/membresias', { method: 'POST', body: datos }),
};

export const ETIQUETA_ESTADO: Record<EstadoMembresia, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
};

/** "A los 4 días", "Vence hoy", "Venció hace 12 días". */
export function textoDias(dias: number): string {
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  if (dias > 1) return `Vence en ${dias} días`;
  return dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`;
}
