export type Rol = 'administrador' | 'recepcionista' | 'entrenador' | 'cliente';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  estado: 'activo' | 'inactivo' | 'suspendido';
  permisos: string[];
  created_at: string;
}

export interface Sesion {
  access_token: string;
  token_type: 'bearer';
  expira_en_minutos: number;
  usuario: Usuario;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  telefono?: string | null;
  acepta_consentimiento: boolean;
}
