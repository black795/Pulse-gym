import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { primerNombre } from '../../features/auth/permisos';
import { asistenciasApi } from '../../features/asistencias/asistenciasApi';
import { kpis, recentActivity, alerts } from '../../data/mock';
import { IconUsers, IconCard, IconCheck, IconDumbbell, IconAlertTriangle, IconPlus, IconTrendingUp } from '../../components/Icons';

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

const activityIcon = (type: string) => {
  const map: Record<string, string> = { attendance: '🏃', payment: '💳', routine: '📋', injury: '⚠️' };
  return map[type] || '•';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [asistenciasHoy, setAsistenciasHoy] = useState<number | null>(null);

  useEffect(() => {
    // Único indicador conectado por ahora; si falla, se muestra "—" y el resto del panel sigue igual.
    asistenciasApi.resumen().then(r => setAsistenciasHoy(r.asistencias_hoy)).catch(() => setAsistenciasHoy(null));
  }, []);
  const today = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date('2026-09-17'));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(120deg, var(--sidebar) 60%, var(--black-2) 100%)',
        borderRadius: 18, marginBottom: 28, minHeight: 200,
        padding: '36px 40px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop&auto=format)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: '#4d7a5e', fontSize: 13, fontWeight: 500, marginBottom: 6, textTransform: 'capitalize' }}>{today}</div>
          <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>
            Hola, {primerNombre(usuario)} 👋
          </div>
          <div style={{ color: '#8fad99', marginTop: 8, fontSize: 14 }}>{asistenciasHoy === null ? 'Todo en orden hoy.' : `Todo en orden hoy. ${asistenciasHoy} ${asistenciasHoy === 1 ? 'asistencia registrada' : 'asistencias registradas'}.`}</div>
        </div>
        {/* Neon accent */}
        <div style={{
          position: 'absolute', bottom: 20, right: 32,
          background: 'var(--neon)', borderRadius: 8, padding: '6px 14px',
          fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, color: 'var(--sidebar)',
        }}>
          Pulse Gym
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: '+ Nuevo cliente', action: () => navigate('/admin/clients/new'), primary: true },
          { label: 'Ver clientes', action: () => navigate('/admin') },
          { label: 'Rutinas', action: () => navigate('/admin/routines') },
          { label: 'Máquinas', action: () => navigate('/admin/machines') },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            padding: '9px 18px', borderRadius: 9, fontFamily: 'var(--font-sora)',
            fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            background: btn.primary ? 'var(--primary)' : 'var(--surface)',
            color: btn.primary ? '#fff' : 'var(--ink)',
            border: btn.primary ? 'none' : '1px solid var(--border)',
            transition: 'all 0.15s',
          }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KPICard label="Clientes activos" value={kpis.activeClients} icon={IconUsers} color="#16A34A" />
        <KPICard label="Membresías vigentes" value={kpis.activeMembers} icon={IconCard} color="#0891b2" />
        <KPICard label="Asistencia hoy" value={asistenciasHoy ?? '—'} icon={IconCheck} color="#7c3aed" />
        <KPICard label="Entrenadores activos" value={kpis.activeTrainers} icon={IconDumbbell} color="#d97706" />
      </div>

      {/* Bottom two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent activity */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--ink)' }}>
            Actividad reciente
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>
                  {activityIcon(item.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{item.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--ink)' }}>
            Alertas operativas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: alert.type === 'danger' ? 'var(--danger-tint)' : 'var(--warning-tint)',
                border: `1px solid ${alert.type === 'danger' ? '#fecaca' : '#fde68a'}`,
              }}>
                <IconAlertTriangle style={{
                  color: alert.type === 'danger' ? 'var(--danger)' : 'var(--warning)',
                  width: 16, height: 16, flexShrink: 0, marginTop: 1,
                }} />
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  color: alert.type === 'danger' ? 'var(--danger)' : 'var(--warning)',
                }}>
                  {alert.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
