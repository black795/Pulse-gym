import { useNavigate } from 'react-router';
import { IconShield } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { ROLES_UI, rutaInicial } from '../../features/auth/permisos';

export default function SinPermiso() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const destino = usuario ? rutaInicial(usuario) : '/login';

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--warning-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <IconShield style={{ color: 'var(--warning)', width: 26, height: 26 }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>No tienes acceso a esta sección</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 22px', lineHeight: 1.5 }}>
          Tu rol{usuario ? <> (<b>{ROLES_UI[usuario.rol].etiqueta}</b>)</> : ''} no incluye este permiso.
          Si crees que es un error, pídeselo al dueño del gimnasio.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {destino !== '/sin-permiso' && (
            <button onClick={() => navigate(destino)} style={botonPrimario}>Ir a mi inicio</button>
          )}
          <button onClick={logout} style={botonSecundario}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

const botonPrimario: React.CSSProperties = {
  height: 42, padding: '0 18px', background: 'var(--primary)', color: '#fff', border: 'none',
  borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};
const botonSecundario: React.CSSProperties = {
  ...botonPrimario, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)',
};
