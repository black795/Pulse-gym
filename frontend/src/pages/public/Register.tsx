import { useState } from 'react';
import { useNavigate } from 'react-router';
import { IconAlertTriangle, IconPulse } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { rutaInicial } from '../../features/auth/permisos';

type Campos = { nombre: string; apellido: string; email: string; telefono: string; password: string; confirmar: string };
const VACIO: Campos = { nombre: '', apellido: '', email: '', telefono: '', password: '', confirmar: '' };

/** Revisa el formulario antes de enviarlo (el backend vuelve a revisar todo). */
function validar(c: Campos, consentimiento: boolean): Partial<Record<keyof Campos | 'consentimiento', string>> {
  const e: Partial<Record<keyof Campos | 'consentimiento', string>> = {};
  if (c.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre.';
  if (c.apellido.trim().length < 2) e.apellido = 'Ingresa tu apellido.';
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = 'Ingresa un correo válido.';
  if (c.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  else if (!/[a-zA-Z]/.test(c.password) || !/\d/.test(c.password)) e.password = 'Incluye al menos una letra y un número.';
  if (c.confirmar !== c.password) e.confirmar = 'Las contraseñas no coinciden.';
  if (!consentimiento) e.consentimiento = 'Necesitamos tu autorización para registrarte.';
  return e;
}

export default function Register() {
  const navigate = useNavigate();
  const { registro } = useAuth();
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [consentimiento, setConsentimiento] = useState(false);
  const [errores, setErrores] = useState<ReturnType<typeof validar>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampos(c => ({ ...c, [k]: e.target.value }));
    setErrores(er => ({ ...er, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorServidor(null);
    const encontrados = validar(campos, consentimiento);
    setErrores(encontrados);
    if (Object.values(encontrados).some(Boolean)) return;

    setGuardando(true);
    try {
      const usuario = await registro({
        nombre: `${campos.nombre.trim()} ${campos.apellido.trim()}`,
        email: campos.email.trim(),
        telefono: campos.telefono.trim() || null,
        password: campos.password,
        acepta_consentimiento: consentimiento,
      });
      navigate(rutaInicial(usuario), { replace: true });
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Rail izquierdo con foto (se muestra en pantallas anchas) */}
      <div className="register-rail" style={{
        width: 340, flexShrink: 0, position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=680&h=900&fit=crop&auto=format)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,18,13,0.85), rgba(10,18,13,0.7))' }} />
        <div style={{ position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'var(--neon)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPulse style={{ color: 'var(--sidebar)', width: 20, height: 20, strokeWidth: 2.5 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
              Pulse<span style={{ color: 'var(--neon)' }}> Gym</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {['Rutinas personalizadas con IA', 'Seguimiento de progreso y mediciones', 'Atención de entrenadores certificados'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ color: '#b3c8bb', fontSize: 14, fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, margin: '0 0 6px', color: 'var(--ink)' }}>Crea tu cuenta</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Paso 1 de 2 · Tus datos de acceso a Pulse Gym</p>
          </div>

          {errorServidor && (
            <div role="alert" style={{ display: 'flex', gap: 8, padding: '10px 12px', marginBottom: 16, background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 9, color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>
              <IconAlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
              {errorServidor}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Block title="1. Datos personales">
              <div className="grid-2">
                <Field id="nombre" label="Nombre" value={campos.nombre} onChange={cambiar('nombre')} error={errores.nombre} autoComplete="given-name" />
                <Field id="apellido" label="Apellido" value={campos.apellido} onChange={cambiar('apellido')} error={errores.apellido} autoComplete="family-name" />
                <Field id="email" label="Correo" type="email" placeholder="correo@email.com" value={campos.email} onChange={cambiar('email')} error={errores.email} autoComplete="email" />
                <Field id="telefono" label="Teléfono (opcional)" type="tel" placeholder="+591 7..." value={campos.telefono} onChange={cambiar('telefono')} autoComplete="tel" />
              </div>
            </Block>

            <Block title="2. Contraseña">
              <div className="grid-2">
                <Field id="password" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={campos.password} onChange={cambiar('password')} error={errores.password} autoComplete="new-password" />
                <Field id="confirmar" label="Repite la contraseña" type="password" value={campos.confirmar} onChange={cambiar('confirmar')} error={errores.confirmar} autoComplete="new-password" />
              </div>
            </Block>

            <Block title="3. Tus datos de salud">
              <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>
                Después de crear tu cuenta registrarás peso, altura, lesiones y tu objetivo. Con eso tu entrenador
                (y luego la IA) arma una rutina segura para ti.
              </p>
              <label style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', cursor: 'pointer', borderRadius: 9,
                background: errores.consentimiento ? 'var(--danger-tint)' : 'var(--warning-tint)',
                border: `1px solid ${errores.consentimiento ? '#fecaca' : '#fde68a'}`,
              }}>
                <input type="checkbox" checked={consentimiento} onChange={e => { setConsentimiento(e.target.checked); setErrores(er => ({ ...er, consentimiento: undefined })); }}
                  style={{ accentColor: 'var(--primary)', marginTop: 3 }} />
                <span style={{ fontSize: 12.5, color: errores.consentimiento ? 'var(--danger)' : 'var(--warning)', lineHeight: 1.5 }}>
                  Autorizo a Pulse Gym a guardar mis datos físicos y de salud (peso, medidas, lesiones y fotos) solo para
                  armar y ajustar mi entrenamiento. No se mostrarán a otros clientes.
                  {errores.consentimiento && <b style={{ display: 'block', marginTop: 4 }}>{errores.consentimiento}</b>}
                </span>
              </label>
            </Block>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={guardando} style={{
                flex: 1, height: 50, background: guardando ? 'var(--muted-2)' : 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15, cursor: guardando ? 'wait' : 'pointer',
              }}>
                {guardando ? 'Creando cuenta...' : 'Crear mi cuenta'}
              </button>
              <button type="button" onClick={() => navigate('/login')} style={{
                padding: '0 24px', height: 50, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)',
                borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>
                Ya tengo cuenta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, error, ...input }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>{label}</label>
      <input id={id} type="text" {...input} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} style={{
        width: '100%', height: 42, padding: '0 12px', border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8,
        fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
      }} />
      {error && <div id={`${id}-error`} style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, marginBottom: 16, color: 'var(--ink)' }}>{title}</div>
      {children}
    </div>
  );
}
