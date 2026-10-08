import { useCallback, useEffect, useState } from 'react';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { IconPlus, IconX } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { ETIQUETA_PERMISO, ROLES_UI, ordenarPermisos } from '../../features/auth/permisos';
import type { Rol, Usuario } from '../../features/auth/types';
import { usuariosApi, type NuevoPersonal, type RolInfo } from '../../features/auth/usuariosApi';

const ROLES_PERSONAL: Exclude<Rol, 'cliente'>[] = ['administrador', 'recepcionista', 'entrenador'];
const colorAvatar = (rol: Rol) => (rol === 'administrador' ? '#16A34A' : ROLES_UI[rol].color);

export default function Roles() {
  const { usuario: yo } = useAuth();
  const [roles, setRoles] = useState<RolInfo[]>([]);
  const [equipo, setEquipo] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null); // id de la fila que se está guardando

  const cargar = useCallback(async () => {
    try {
      const [r, e] = await Promise.all([usuariosApi.roles(), usuariosApi.personal()]);
      setRoles(r);
      setEquipo(e);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const reemplazar = (u: Usuario) => setEquipo(lista => lista.map(x => (x.id === u.id ? u : x)));

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    setOcupado(u.id);
    try {
      reemplazar(await usuariosApi.cambiarRol(u.id, rol));
      setMensaje({ tipo: 'ok', texto: `${u.nombre} ahora es ${ROLES_UI[rol].etiqueta}.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setOcupado(null);
    }
  };

  const alternarEstado = async (u: Usuario) => {
    const nuevo = u.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión hasta que lo reactives.`)) return;
    setOcupado(u.id);
    try {
      reemplazar(await usuariosApi.cambiarEstado(u.id, nuevo, nuevo === 'inactivo' ? 'Desactivado desde Roles y permisos' : 'Reactivado'));
      setMensaje({ tipo: 'ok', texto: `La cuenta de ${u.nombre} quedó ${nuevo === 'activo' ? 'activa' : 'inactiva'}.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setOcupado(null);
    }
  };

  const activos = equipo.filter(u => u.estado === 'activo').length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Roles y permisos</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Gestión de accesos del equipo</p>
        </div>
        <button onClick={() => setFormAbierto(v => !v)} style={botonPrimario}>
          {formAbierto ? <IconX style={{ width: 16, height: 16 }} /> : <IconPlus style={{ width: 16, height: 16 }} />}
          {formAbierto ? 'Cerrar' : 'Agregar miembro'}
        </button>
      </div>

      {/* Banner */}
      <div style={{
        height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 28, position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=360&fit=crop&auto=format)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,18,13,0.92) 0%, rgba(10,18,13,0.4) 100%)', display: 'flex', alignItems: 'center', padding: '0 40px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
              Comunidad <span style={{ color: 'var(--neon)' }}>Pulse Gym</span>
            </div>
            <div style={{ color: '#8fad99', fontSize: 14, marginTop: 6 }}>
              {cargando ? 'Cargando equipo…' : `${equipo.length} miembros del equipo · ${activos} activos · ${roles.length} roles`}
            </div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div role="status" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 18, borderRadius: 10,
          fontSize: 13.5, fontWeight: 600,
          background: mensaje.tipo === 'ok' ? 'var(--primary-tint)' : 'var(--danger-tint)',
          color: mensaje.tipo === 'ok' ? 'var(--primary-dark)' : 'var(--danger)',
          border: `1px solid ${mensaje.tipo === 'ok' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {mensaje.texto}
          <button onClick={() => setMensaje(null)} aria-label="Cerrar aviso" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <IconX style={{ width: 15, height: 15 }} />
          </button>
        </div>
      )}

      {formAbierto && (
        <FormNuevoMiembro
          onCreado={u => {
            setEquipo(lista => [...lista, u]);
            setFormAbierto(false);
            setMensaje({ tipo: 'ok', texto: `Se agregó a ${u.nombre} con el rol ${ROLES_UI[u.rol].etiqueta}. Ya puede iniciar sesión.` });
          }}
        />
      )}

      {/* Tarjetas de rol (permisos reales que vienen del backend) */}
      <div className="grid-roles" style={{ marginBottom: 32 }}>
        {roles.map(role => {
          const ui = ROLES_UI[role.nombre];
          const oscuro = role.nombre === 'administrador';
          return (
            <div key={role.nombre} style={{ background: ui.fondo, border: `2px solid ${oscuro ? 'rgba(182,255,69,0.15)' : ui.color + '22'}`, borderRadius: 14, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, color: oscuro ? '#fff' : 'var(--ink)' }}>{ui.etiqueta}</div>
              <div style={{ fontSize: 11.5, color: oscuro ? '#4d7a5e' : 'var(--muted-2)', margin: '3px 0 12px' }}>{role.permisos.length} permisos</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ordenarPermisos(role.permisos).map(p => (
                  <li key={p} style={{ fontSize: 12.5, color: oscuro ? '#8fad99' : 'var(--muted)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: ui.color, fontWeight: 800, marginTop: 1 }}>✓</span>
                    {ETIQUETA_PERMISO[p] ?? p}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Tabla del equipo */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>Equipo</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['NOMBRE', 'ROL', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>Cargando…</td></tr>
              )}
              {equipo.map((s, i) => {
                const soyYo = s.id === yo?.id;
                return (
                  <tr key={s.id} style={{ borderBottom: i < equipo.length - 1 ? '1px solid var(--border)' : 'none', opacity: ocupado === s.id ? 0.55 : 1 }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.nombre} size={36} color={colorAvatar(s.rol)} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>
                            {s.nombre} {soyYo && <span style={{ color: 'var(--muted-2)', fontWeight: 600, fontSize: 12 }}>(tú)</span>}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <select
                        value={s.rol}
                        disabled={soyYo || ocupado === s.id}
                        title={soyYo ? 'No puedes cambiar tu propio rol' : undefined}
                        onChange={e => cambiarRol(s, e.target.value as Rol)}
                        aria-label={`Rol de ${s.nombre}`}
                        style={selectStyle}
                      >
                        {ROLES_PERSONAL.map(r => <option key={r} value={r}>{ROLES_UI[r].etiqueta}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <Badge variant={s.estado === 'activo' ? 'success' : s.estado === 'suspendido' ? 'danger' : 'muted'}>
                        {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {!soyYo && (
                        <button onClick={() => alternarEstado(s)} disabled={ocupado === s.id} style={{
                          height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 12.5,
                          background: s.estado === 'activo' ? 'var(--surface)' : 'var(--primary)',
                          color: s.estado === 'activo' ? 'var(--danger)' : '#fff',
                          border: s.estado === 'activo' ? '1px solid #fecaca' : 'none',
                        }}>
                          {s.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FormNuevoMiembro({ onCreado }: { onCreado: (u: Usuario) => void }) {
  const [datos, setDatos] = useState<NuevoPersonal>({ nombre: '', email: '', password: '', telefono: '', rol: 'entrenador' });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof NuevoPersonal) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDatos(d => ({ ...d, [k]: e.target.value }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      onCreado(await usuariosApi.crearPersonal({ ...datos, telefono: datos.telefono?.trim() || null }));
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Nuevo miembro del equipo</div>
      <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '0 0 16px' }}>Dale una contraseña temporal; podrá entrar de inmediato.</p>
      {error && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{error}</div>}
      <div className="grid-3">
        <Campo label="Nombre completo"><input required value={datos.nombre} onChange={set('nombre')} style={inputStyle} /></Campo>
        <Campo label="Correo"><input required type="email" value={datos.email} onChange={set('email')} style={inputStyle} /></Campo>
        <Campo label="Teléfono (opcional)"><input value={datos.telefono ?? ''} onChange={set('telefono')} style={inputStyle} /></Campo>
        <Campo label="Contraseña temporal"><input required type="password" autoComplete="new-password" placeholder="Letras y números, 8+" value={datos.password} onChange={set('password')} style={inputStyle} /></Campo>
        <Campo label="Rol">
          <select value={datos.rol} onChange={set('rol')} style={{ ...inputStyle, cursor: 'pointer' }}>
            {ROLES_PERSONAL.map(r => <option key={r} value={r}>{ROLES_UI[r].etiqueta}</option>)}
          </select>
        </Campo>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" disabled={guardando} style={{ ...botonPrimario, width: '100%', justifyContent: 'center', height: 42, background: guardando ? 'var(--muted-2)' : 'var(--primary)' }}>
            {guardando ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

const botonPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: 'var(--primary)', color: '#fff',
  border: 'none', borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px', border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink)', background: 'var(--surface)', outline: 'none',
};
const selectStyle: React.CSSProperties = {
  height: 34, padding: '0 10px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)',
  fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', cursor: 'pointer',
};
