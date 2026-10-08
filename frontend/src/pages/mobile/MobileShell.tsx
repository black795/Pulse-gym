import { useCallback, useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import { IconHome, IconList, IconZap, IconActivity, IconUser } from '../../components/Icons';
import { miCuentaApi, type ContextoMovil, type MiCuenta } from '../../features/miCuenta/miCuentaApi';

const navItems = [
  { to: '/mobile', icon: IconHome, label: 'Inicio' },
  { to: '/mobile/workout', icon: IconList, label: 'Rutina' },
  { to: '/mobile/ai', icon: IconZap, label: 'IA' },
  { to: '/mobile/progress', icon: IconActivity, label: 'Progreso' },
  { to: '/mobile/profile', icon: IconUser, label: 'Perfil' },
];

// Pantallas del diseño cuyos módulos (rutinas, entrenador IA, máquinas) aún no están conectados al sistema.
const RUTAS_DE_EJEMPLO = ['/mobile/workout', '/mobile/ai', '/mobile/camera', '/mobile/confirm'];

export default function MobileShell() {
  const { pathname } = useLocation();
  const [cuenta, setCuenta] = useState<MiCuenta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(() => {
    miCuentaApi.obtener()
      .then(datos => { setCuenta(datos); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setCargando(false));
  }, []);

  // Se vuelve a pedir al cambiar de pestaña: si recepción registró una entrada o un pago, aparece al instante.
  useEffect(() => { recargar(); }, [recargar, pathname]);

  const contexto: ContextoMovil = { cuenta, cargando, error, recargar };
  const esEjemplo = RUTAS_DE_EJEMPLO.includes(pathname);

  return (
    <div style={{
      height: '100dvh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Mobile frame: alto fijo; el contenido se desplaza por dentro y la barra inferior nunca lo tapa */}
      <div style={{
        width: '100%', maxWidth: 430,
        height: '100%', background: '#fff', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        position: 'relative', boxShadow: '0 0 40px rgba(0,0,0,0.12)',
      }}>
        {esEjemplo && (
          <div role="note" style={{
            flexShrink: 0, background: 'var(--warning-tint)', color: 'var(--warning)',
            borderBottom: '1px solid #fde68a', padding: '8px 14px', fontSize: 12, fontWeight: 700, textAlign: 'center',
          }}>
            Vista de ejemplo · este módulo todavía no usa tus datos
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Outlet context={contexto} />
        </div>

        {/* Bottom nav */}
        <nav aria-label="Secciones de la app" style={{
          flexShrink: 0, background: '#fff', borderTop: '1px solid var(--border)',
          display: 'flex', padding: '8px 0 calc(12px + env(safe-area-inset-bottom))',
        }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/mobile'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                textDecoration: 'none', padding: '4px 0',
                color: isActive ? 'var(--primary)' : 'var(--muted-2)',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon style={{ width: 22, height: 22 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-sora)' }}>{item.label}</span>
                  {isActive && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
