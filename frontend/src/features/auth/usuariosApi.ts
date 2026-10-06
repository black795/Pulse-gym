import { api } from '../../lib/http';
import type { Rol, Usuario } from './types';

export interface RolInfo { nombre: Rol; descripcion: string | null; permisos: string[] }
export interface NuevoPersonal { nombre: string; email: string; password: string; telefono?: string | null; rol: Exclude<Rol, 'cliente'> }

export const usuariosApi = {
  roles: () => api<RolInfo[]>('/roles'),
  personal: () => api<Usuario[]>('/usuarios?solo_personal=true'),
  crearPersonal: (datos: NuevoPersonal) => api<Usuario>('/usuarios', { method: 'POST', body: datos }),
  cambiarRol: (id: number, rol: Rol) => api<Usuario>(`/usuarios/${id}/rol`, { method: 'PATCH', body: { rol } }),
  cambiarEstado: (id: number, estado: Usuario['estado'], motivo?: string) =>
    api<Usuario>(`/usuarios/${id}/estado`, { method: 'PATCH', body: { estado, motivo } }),
};
