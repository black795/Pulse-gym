import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { IconAlertTriangle, IconPulse } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { ROLES_UI, rutaInicial } from '../../features/auth/permisos';
import type { Rol, Usuario } from '../../features/auth/types';

// Cuentas de prueba (solo se muestran en desarrollo, nunca en producción).
const CUENTAS_DEMO: { email: string; rol: Rol; nombre: string }[] = [
  { email: 'carlos@pulsegym.com', rol: 'administrador', nombre: 'Carlos' },
  { email: 'pati@pulsegym.com', rol: 'recepcionista', nombre: 'Pati' },
  { email: 'javier@pulsegym.com', rol: 'entrenador', nombre: 'Javier' },
  { email: 'daniela@pulsegym.com', rol: 'cliente', nombre: 'Daniela' },
];
const PASSWORD_DEMO = 'Pulse2026!';

/** Solo regresa a la ruta anterior si ese rol puede verla; si no, va a su inicio. */
function destinoTrasLogin(usuario: Usuario, desde?: string): string {
  const inicio = rutaInicial(usuario);
  if (!desde) return inicio;
  const esCliente = usuario.rol === 'cliente';
  if (esCliente && desde.startsWith('/mobile')) return desde;
  if (!esCliente && desde.startsWith('/admin')) return desde;
  return inicio;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const desde = (location.state as { desde?: string } | null)?.desde;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setCargando(true);
    try {
      const usuario = await login(email, password, recordar);
      navigate(destinoTrasLogin(usuario, desde), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setCargando(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px', border: `1.5px solid ${error ? '#fecaca' : 'var(--border)'}`,
    borderRadius: 9, fontSize: 14, fontFamily: 'var(--font-manrope)', color: 'var(--ink)', outline: 'none', background: 'var(--bg)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Panel izquierdo (foto) */}
      <div className="auth-hero" style={{
        width: '55%', position: 'relative', overflow: 'hidden',
        backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop&auto=format)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(10,18,13,0.92) 0%, rgba(10,18,13,0.55) 60%, rgba(10,18,13,0.3) 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '60px 56px',
        }}>
          <div style={{ position: 'absolute', top: 40, left: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: 'var(--neon)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPulse style={{ color: 'var(--sidebar)', width: 22, height: 22, strokeWidth: 2.5 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 20, color: '#fff' }}>
              Pulse<span style={{ color: 'var(--neon)' }}> Gym</span>
            </span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 40, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
              Tu mejor versión<br />empieza aquí
            </div>
            <div style={{ color: '#8fad99', fontSize: 16, lineHeight: 1.6, maxWidth: 360 }}>
              Sistema integral de gestión para tu gimnasio. Clientes, rutinas, pagos y más — todo en un solo lugar.
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
              {['Acceso por roles', 'IA entrenador', 'Rutinas adaptadas'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--neon)', fontWeight: 800 }}>✓</span>
                  <span style={{ color: '#b3c8bb', fontSize: 13.5, fontWeight: 600 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho (formulario) */}
      <div className="auth-form" style={{ width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div className="auth-logo-movil" style={{ alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, background: 'var(--neon)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPulse style={{ color: 'var(--sidebar)', width: 20, height: 20, strokeWidth: 2.5 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 19, color: 'var(--ink)' }}>
              Pulse<span style={{ color: 'var(--primary)' }}> Gym</span>
            </span>
          </div>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: '0 0 8px' }}>Iniciar sesión</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div role="alert" style={{
              display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 16,
              background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 9, color: 'var(--danger)', fontSize: 13.5, fontWeight: 600,
            }}>
              <IconAlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Correo electrónico</label>
              <input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="carlos@pulsegym.com" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13.5, color: 'var(--muted)' }}>
                <input type="checkbox" checked={recordar} onChange={e => setRecordar(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                Recordarme
              </label>
              <button type="button" onClick={() => setAviso('Acércate a recepción o pídele al dueño del gimnasio que te ayude a restablecerla.')}
                style={{ fontSize: 13.5, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}>
                Olvidé mi contraseña
              </button>
            </div>
            {aviso && <div style={{ fontSize: 12.5, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>{aviso}</div>}

            <button type="submit" disabled={cargando} style={{
              height: 48, background: cargando ? 'var(--muted-2)' : 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15, cursor: cargando ? 'wait' : 'pointer',
              transition: 'background 0.15s', marginTop: 4,
            }}>
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
              🔒 Tu contraseña se guarda cifrada; nadie del gimnasio puede verla
            </div>
            ¿No tienes cuenta?{' '}
            <button type="button" onClick={() => navigate('/register')} style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13 }}>
              Registrarse
            </button>
          </div>

          {import.meta.env.DEV && (
            <div style={{ marginTop: 22, borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-2)', marginBottom: 8 }}>
                CUENTAS DE PRUEBA · contraseña {PASSWORD_DEMO}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CUENTAS_DEMO.map(c => (
                  <button key={c.email} type="button" onClick={() => { setEmail(c.email); setPassword(PASSWORD_DEMO); setError(null); }}
                    style={{
                      padding: '8px 10px', borderRadius: 9, cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)',
                      background: 'var(--bg)', fontFamily: 'var(--font-manrope)',
                    }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11.5, color: c.rol === 'administrador' ? 'var(--primary-dark)' : ROLES_UI[c.rol].color, fontWeight: 600 }}>{ROLES_UI[c.rol].etiqueta}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
