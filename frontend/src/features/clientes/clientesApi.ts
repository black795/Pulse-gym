import { api } from '../../lib/http';

export interface Cliente {
  id: number;
  nombre: string;
  carnet: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string; // AAAA-MM-DD
  edad: number;
  peso_kg: number;
  altura_cm: number;
  objetivo: string | null;
  created_at: string;
  updated_at: string;
}

export type DatosCliente = Pick<
  Cliente,
  'nombre' | 'carnet' | 'telefono' | 'email' | 'fecha_nacimiento' | 'peso_kg' | 'altura_cm' | 'objetivo'
>;

export const clientesApi = {
  listar: () => api<Cliente[]>('/clientes'),
  obtener: (id: number) => api<Cliente>(`/clientes/${id}`),
  crear: (datos: DatosCliente) => api<Cliente>('/clientes', { method: 'POST', body: datos }),
  editar: (id: number, datos: Partial<DatosCliente>) => api<Cliente>(`/clientes/${id}`, { method: 'PATCH', body: datos }),
};

/** "1998-05-20" → "20/05/1998" (sin pasar por Date, para que la zona horaria no mueva el día). */
export function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}
