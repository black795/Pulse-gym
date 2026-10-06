import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { configurarHttp } from '../../lib/http';
import { authApi } from './authApi';
import { tienePermiso } from './permisos';
import { tokenStorage } from './tokenStorage';
import type { DatosRegistro, Usuario } from './types';

interface AuthValor {
  usuario: Usuario | null;
  cargando: boolean; // true mientras se revisa si ya había una sesión guardada
  login: (email: string, password: string, recordar: boolean) => Promise<Usuario>;
  registro: (datos: DatosRegistro) => Promise<Usuario>;
  logout: () => void;
  tiene: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.borrar();
    setUsuario(null);
  }, []);

  // Conecta el cliente HTTP con la sesión: le da el token y le dice qué hacer si caduca.
  useEffect(() => {
    configurarHttp({ obtenerToken: tokenStorage.leer, alPerderSesion: logout });
  }, [logout]);

  // Al abrir la app: si hay un token guardado, se pregunta al backend quién es.
  useEffect(() => {
    let activo = true;
    if (!tokenStorage.leer()) {
      setCargando(false);
      return;
    }
    authApi
      .yo()
      .then(u => activo && setUsuario(u))
      .catch(() => activo && logout())
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string, recordar: boolean) => {
    const sesion = await authApi.login(email, password);
    tokenStorage.guardar(sesion.access_token, recordar);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const registro = useCallback(async (datos: DatosRegistro) => {
    const sesion = await authApi.registro(datos);
    tokenStorage.guardar(sesion.access_token, false);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const valor = useMemo<AuthValor>(
    () => ({ usuario, cargando, login, registro, logout, tiene: p => tienePermiso(usuario, p) }),
    [usuario, cargando, login, registro, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
