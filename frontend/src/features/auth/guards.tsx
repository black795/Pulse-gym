/**
 * "Porteros" de las rutas:
 *  - RequiereSesion:  si no iniciaste sesión, te manda al login (y luego te regresa).
 *  - RequierePermiso: si tu rol no tiene la llave, ves la pantalla de "sin permiso".
 *  - SoloInvitados:   si ya iniciaste sesión, no tiene sentido ver el login → a tu inicio.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import PantallaCarga from '../../pages/sistema/PantallaCarga';
import SinPermiso from '../../pages/sistema/SinPermiso';
import { useAuth } from './AuthContext';
import { rutaInicial } from './permisos';

export function RequiereSesion({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <PantallaCarga />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  return <>{children}</>;
}

export function RequierePermiso({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { tiene } = useAuth();
  return tiene(permiso) ? <>{children}</> : <SinPermiso />;
}

export function SoloInvitados({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <PantallaCarga />;
  if (usuario) return <Navigate to={rutaInicial(usuario)} replace />;
  return <>{children}</>;
}
