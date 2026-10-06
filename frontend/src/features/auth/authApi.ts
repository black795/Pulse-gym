import { api } from '../../lib/http';
import type { DatosRegistro, Sesion, Usuario } from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api<Sesion>('/auth/login', { method: 'POST', body: { email, password }, conToken: false }),

  registro: (datos: DatosRegistro) =>
    api<Sesion>('/auth/registro', { method: 'POST', body: datos, conToken: false }),

  yo: () => api<Usuario>('/auth/me'),
};
