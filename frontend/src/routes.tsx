import { Outlet, createBrowserRouter, redirect } from 'react-router';

import { RUTAS_ADMIN } from './config/rutasAdmin';
import { AuthProvider } from './features/auth/AuthContext';
import { RequierePermiso, RequiereSesion, SoloInvitados } from './features/auth/guards';
import { PERMISOS } from './features/auth/permisos';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NoEncontrada from './pages/sistema/NoEncontrada';
import SinPermiso from './pages/sistema/SinPermiso';

import MobileAI from './pages/mobile/MobileAI';
import MobileCamera from './pages/mobile/MobileCamera';
import MobileConfirm from './pages/mobile/MobileConfirm';
import MobileHome from './pages/mobile/MobileHome';
import MobileProfile from './pages/mobile/MobileProfile';
import MobileProgress from './pages/mobile/MobileProgress';
import MobileShell from './pages/mobile/MobileShell';
import MobileWorkout from './pages/mobile/MobileWorkout';

/** La sesión envuelve a todas las rutas, así cualquier pantalla puede preguntar "¿quién soy?". */
function Raiz() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { path: '/', loader: () => redirect('/login') },

      // ---- Público (solo si NO has iniciado sesión) ----
      { path: '/login', element: <SoloInvitados><Login /></SoloInvitados> },
      { path: '/register', element: <SoloInvitados><Register /></SoloInvitados> },

      // ---- Panel del personal: dueño, recepcionista, entrenador ----
      {
        path: '/admin',
        element: (
          <RequiereSesion>
            <RequierePermiso permiso={PERMISOS.DASHBOARD_VER}>
              <AdminLayout />
            </RequierePermiso>
          </RequiereSesion>
        ),
        children: RUTAS_ADMIN.map(({ path, Component, permiso }) => ({
          ...(path ? { path } : { index: true }),
          element: <RequierePermiso permiso={permiso}><Component /></RequierePermiso>,
        })),
      },

      // ---- App del cliente (móvil) ----
      {
        path: '/mobile',
        element: (
          <RequiereSesion>
            <RequierePermiso permiso={PERMISOS.RUTINA_PROPIA_VER}>
              <MobileShell />
            </RequierePermiso>
          </RequiereSesion>
        ),
        children: [
          { index: true, Component: MobileHome },
          { path: 'workout', Component: MobileWorkout },
          { path: 'ai', element: <RequierePermiso permiso={PERMISOS.ENTRENADOR_IA_USAR}><MobileAI /></RequierePermiso> },
          { path: 'camera', Component: MobileCamera },
          { path: 'confirm', Component: MobileConfirm },
          { path: 'progress', Component: MobileProgress },
          { path: 'profile', Component: MobileProfile },
        ],
      },

      { path: '/sin-permiso', element: <RequiereSesion><SinPermiso /></RequiereSesion> },
      { path: '*', Component: NoEncontrada },
    ],
  },
]);
