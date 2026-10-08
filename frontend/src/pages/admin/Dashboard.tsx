import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS, primerNombre } from '../../features/auth/permisos';
import { dashboardApi, haceCuanto, type Dashboard as DatosDashboard } from '../../features/dashboard/dashboardApi';
import { aFecha } from '../../features/miCuenta/miCuentaApi';
import { IconUsers, IconCard, IconCheck, IconDumbbell, IconAlertTriangle } from '../../components/Icons';

const KPICard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '20px 22px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ color, width: 20, height: 20 }} />
    </div>
    <div>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const ICONO_ACTIVIDAD: Record<string, string> = { asistencia: '🏃', pago: '💳', lesion: '⚠️', cliente: '👤' };

// Cada acceso rápido se muestra solo a quien tiene la llave de esa pantalla.
const ACCESOS = [
  { label: '+ Nuevo cliente', ruta: '/admin/clients/new', permiso: PERMISOS.CLIENTES_CREAR, principal: true },
  { label: 'Registrar entrada', ruta: '/admin/attendance', permiso: PERMISOS.ASISTENCIA_GESTIONAR },
  { label: 'Ver clientes', ruta: '/admin', permiso: PERMISOS.CLIENTES_VER },
  { label: 'Membresías', ruta: '/admin/memberships', permiso: PERMISOS.MEMBRESIAS_VER },
  { label: 'Rutinas', ruta: '/admin/routines', permiso: PERMISOS.RUTINAS_GESTIONAR },
  { label: 'Máquinas', ruta: '/admin/machines', permiso: PERMISOS.MAQUINAS_VER },
];

const panel = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, tiene } = useAuth();
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    dashboardApi.obtener()
      .then(d => { if (vigente) setDatos(d); })
      .catch(err => { if (vigente) setError((err as Error).message); });
    return () => { vigente = false; };
  }, []);

  const i = datos?.indicadores;
  const fechaLarga = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(datos ? aFecha(datos.hoy) : new Date());
  const fecha = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);
  const accesos = ACCESOS.filter(a => tiene(a.permiso));
  const saludo = !i ? ' '
    : i.asistencias_hoy === 0 ? 'Todavía no hay asistencias registradas hoy.'
    : `${i.asistencias_hoy} ${i.asistencias_hoy === 1 ? 'asistencia registrada' : 'asistencias registradas'} hoy.`;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero greeting */}
      <div style={{
        background: 'var(--sidebar)', borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden', minHeight: 140,
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop&auto=format)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: '#4d7a5e', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{fecha}</div>
          <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, lineHeight: 1.1, overflowWrap: 'anywhere' }}>
            Hola, {primerNombre(usuario)} 👋
          </div>
          <div style={{ color: '#8fad99', marginTop: 8, fontSize: 14 }}>{saludo}</div>
        </div>
        {/* Neon accent */}
        <div className="solo-escritorio" style={{
          position: 'absolute', bottom: 20, right: 32,
          background: 'var(--neon)', borderRadius: 8, padding: '6px 14px',
          fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, color: 'var(--sidebar)',
        }}>
          Pulse Gym
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>
          No se pudo cargar el panel: {error}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {accesos.map(btn => (
          <button key={btn.label} onClick={() => navigate(btn.ruta)} style={{
            padding: '9px 18px', borderRadius: 9, fontFamily: 'var(--font-sora)',
            fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            background: btn.principal ? 'var(--primary)' : 'var(--surface)',
            color: btn.principal ? '#fff' : 'var(--ink)',
            border: btn.principal ? 'none' : '1px solid var(--border)',
            transition: 'all 0.15s',
          }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard label={i ? `Clientes activos (de ${i.clientes_total})` : 'Clientes activos'} value={i?.clientes_activos ?? '—'} icon={IconUsers} color="#16A34A" />
        {i?.membresias_vigentes !== null && (
          <KPICard label="Membresías vigentes" value={i?.membresias_vigentes ?? '—'} icon={IconCard} color="#0891b2" />
        )}
        <KPICard label="Asistencia hoy" value={i?.asistencias_hoy ?? '—'} icon={IconCheck} color="#7c3aed" />
        <KPICard label="Entrenadores activos" value={i?.entrenadores_activos ?? '—'} icon={IconDumbbell} color="#d97706" />
      </div>

      {/* Bottom two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
        {/* Recent activity */}
        <div style={panel}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--ink)' }}>
            Actividad reciente
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {datos?.actividad.map((item, n) => (
              <div key={`${item.tipo}-${item.fecha_hora}-${n}`} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderBottom: n < datos.actividad.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>
                  {ICONO_ACTIVIDAD[item.tipo] ?? '•'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, overflowWrap: 'anywhere' }}>{item.texto}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{haceCuanto(item.fecha_hora)}</div>
                </div>
              </div>
            ))}
            {!datos && !error && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Cargando…</div>}
            {datos?.actividad.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Todavía no hay movimientos.</div>}
          </div>
        </div>

        {/* Alerts */}
        <div style={panel}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--ink)' }}>
            Alertas operativas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {datos?.alertas.map(alerta => {
              const peligro = alerta.tipo === 'peligro';
              return (
                <button key={alerta.texto} onClick={() => navigate(alerta.ruta)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', cursor: 'pointer', width: '100%',
                  padding: '10px 14px', borderRadius: 10,
                  background: peligro ? 'var(--danger-tint)' : 'var(--warning-tint)',
                  border: `1px solid ${peligro ? '#fecaca' : '#fde68a'}`,
                }}>
                  <IconAlertTriangle style={{ color: peligro ? 'var(--danger)' : 'var(--warning)', width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: peligro ? 'var(--danger)' : 'var(--warning)' }}>{alerta.texto}</span>
                </button>
              );
            })}
            {!datos && !error && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Cargando…</div>}
            {datos?.alertas.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Sin alertas: todo en orden.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
