import { api } from '../../lib/http';

export interface Dashboard {
  hoy: string; // AAAA-MM-DD en la zona del gimnasio
  indicadores: {
    clientes_total: number;
    clientes_activos: number;
    membresias_vigentes: number | null; // null = este rol no puede ver membresías
    asistencias_hoy: number;
    entrenadores_activos: number;
  };
  alertas: { tipo: 'peligro' | 'aviso'; texto: string; ruta: string }[];
  actividad: { tipo: 'asistencia' | 'pago' | 'lesion' | 'cliente'; texto: string; fecha_hora: string }[];
}

export const dashboardApi = {
  obtener: () => api<Dashboard>('/dashboard'),
};

/** Instante UTC del backend (sin sufijo) → "hace 5 min", "hace 3 h", "hace 2 días". */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const minutos = Math.max(0, Math.round((ahora.getTime() - new Date(`${iso}Z`).getTime()) / 60000));
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}
