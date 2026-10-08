import { api } from '../../lib/http';

export interface DatosLesion {
  tipo: 'lesion' | 'limitacion';
  nombre: string;
  descripcion: string | null;
  estado: 'activa' | 'resuelta';
}
export interface Lesion extends DatosLesion {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  registrado_por: number | null;
  actualizado_por: number | null;
  responsable_nombre: string | null;
  created_at: string;
  updated_at: string;
}
export interface EventoLesion extends DatosLesion {
  id: number;
  lesion_id: number;
  usuario_id: number | null;
  usuario_nombre: string | null;
  created_at: string;
}
export const lesionesApi = {
  listar: (clienteId: number) => api<Lesion[]>(`/clientes/${clienteId}/lesiones`),
  vigentes: () => api<Lesion[]>('/lesiones?solo_vigentes=true'),
  crear: (clienteId: number, datos: DatosLesion) => api<Lesion>(`/clientes/${clienteId}/lesiones`, { method: 'POST', body: datos }),
  editar: (id: number, datos: Partial<DatosLesion>) => api<Lesion>(`/lesiones/${id}`, { method: 'PATCH', body: datos }),
  historial: (id: number) => api<EventoLesion[]>(`/lesiones/${id}/historial`),
};

/** El backend guarda timestamps UTC sin sufijo. */
export const fechaEvento = (iso: string) => new Date(`${iso}Z`).toLocaleString('es-BO');
