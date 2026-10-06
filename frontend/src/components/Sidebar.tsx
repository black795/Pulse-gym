import { NavLink } from 'react-router';
import { IconPulse } from './Icons';
import { GRUPOS_MENU, RUTAS_ADMIN, rutaCompleta, type RutaAdmin } from '../config/rutasAdmin';
import { useAuth } from '../features/auth/AuthContext';
import { ROLES_UI } from '../features/auth/permisos';

const estiloLink = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
  background: isActive ? 'rgba(22,163,74,0.22)' : 'transparent',
  color: isActive ? '#7BE3A0' : '#8fad99',
  fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5,
  transition: 'all 0.15s', marginBottom: 1,
  borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
});

function ItemMenu({ ruta }: { ruta: RutaAdmin }) {
  const Icono = ruta.menu!.icono;
  return (
    <NavLink to={rutaCompleta(ruta.path)} end={ruta.path === ''} style={estiloLink}>
      <Icono style={{ width: 17, height: 17, flexShrink: 0 }} />
      {ruta.menu!.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { usuario, tiene } = useAuth();
  // Solo se muestran las opciones para las que el rol tiene la llave.
  const visibles = RUTAS_ADMIN.filter(r => r.menu && tiene(r.permiso));
  const sinGrupo = visibles.filter(r => r.menu!.grupo === null);

  return (
    <aside style={{
      width: 264, minHeight: '100vh', background: 'var(--sidebar)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPulse style={{ color: 'var(--sidebar)', width: 20, height: 20, strokeWidth: 2.5 }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
              <span style={{ color: '#fff' }}>Pulse</span>
              <span style={{ color: 'var(--neon)' }}> Gym</span>
            </div>
            <div style={{ color: '#4d7a5e', fontSize: 11, fontWeight: 500, marginTop: 2 }}>
              Panel · {usuario ? ROLES_UI[usuario.rol].etiqueta : ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 12px 0' }}>
        {sinGrupo.map(r => <ItemMenu key={r.path} ruta={r} />)}
      </div>

      <nav style={{ flex: 1, padding: '4px 12px 20px' }}>
        {GRUPOS_MENU.map(grupo => {
          const items = visibles.filter(r => r.menu!.grupo === grupo);
          if (items.length === 0) return null; // un grupo vacío no se muestra
          return (
            <div key={grupo} style={{ marginTop: 20 }}>
              <div style={{ color: '#3d5a47', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', padding: '0 12px', marginBottom: 4 }}>
                {grupo}
              </div>
              {items.map(r => <ItemMenu key={r.path} ruta={r} />)}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
