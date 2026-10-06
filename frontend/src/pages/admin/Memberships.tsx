import { useState } from 'react';
import { clients } from '../../data/mock';
import { statusBadge } from '../../components/Badge';
import Avatar from '../../components/Avatar';

const plans = [
  { name: 'Mensual', price: 'Bs 150', color: '#f0fdf4', border: '#bbf7d0', featured: false, benefits: ['Acceso ilimitado', 'Rutina básica', 'Asistencia manual', 'App cliente'] },
  { name: 'Trimestral', price: 'Bs 400', color: 'var(--sidebar)', border: 'var(--neon)', featured: true, benefits: ['Acceso ilimitado', 'Rutina personalizada IA', 'Entrenador asignado', 'Mediciones mensuales', 'App premium', 'Acceso a clases grupales'] },
  { name: 'Semestral', price: 'Bs 700', color: '#f8fafc', border: '#e2e8f0', featured: false, benefits: ['Todo del Trimestral', 'Análisis de progreso', 'Consulta nutricional', '2 sesiones PT gratis'] },
];

const membershipRows = [
  { client: clients[0], plan: 'Trimestral', start: '01 jul 2026', end: '30 sep 2026', status: 'active' },
  { client: clients[1], plan: 'Mensual', start: '01 sep 2026', end: '30 sep 2026', status: 'warning' },
  { client: clients[2], plan: 'Semestral', start: '01 abr 2026', end: '30 sep 2026', status: 'warning' },
  { client: clients[3], plan: 'Mensual', start: '01 ago 2026', end: '31 ago 2026', status: 'overdue' },
  { client: clients[4], plan: 'Trimestral', start: '01 jul 2026', end: '30 sep 2026', status: 'active' },
  { client: clients[5], plan: 'Mensual', start: '01 sep 2026', end: '30 sep 2026', status: 'active' },
];

export default function Memberships() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Membresías</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Planes disponibles y asignaciones activas</p>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 32 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background: plan.color,
            border: `2px solid ${plan.border}`,
            borderRadius: 16, padding: '24px 22px',
            boxShadow: plan.featured ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', gap: 16,
            position: 'relative',
          }}>
            {plan.featured && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--neon)', color: 'var(--sidebar)', padding: '3px 14px',
                borderRadius: 999, fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 11,
                whiteSpace: 'nowrap',
              }}>
                ★ MÁS POPULAR
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 17, color: plan.featured ? '#fff' : 'var(--ink)' }}>{plan.name}</div>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 30, color: plan.featured ? 'var(--neon)' : 'var(--primary)', marginTop: 6 }}>{plan.price}</div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {plan.benefits.map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: plan.featured ? '#b3c8bb' : 'var(--muted)', fontWeight: 500 }}>
                  <span style={{ color: plan.featured ? 'var(--neon)' : 'var(--primary)', fontWeight: 800 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan(plan.name)}
              style={{
                padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14,
                background: plan.featured ? 'var(--neon)' : 'var(--primary)',
                color: plan.featured ? 'var(--sidebar)' : '#fff',
                transition: 'opacity 0.15s',
              }}
            >
              {selectedPlan === plan.name ? '✓ Seleccionado' : 'Elegir plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Active memberships table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16 }}>Asignaciones activas</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CLIENTE', 'PLAN', 'INICIO', 'VENCIMIENTO', 'ESTADO'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {membershipRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < membershipRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={row.client.name} photo={row.client.photo} size={32} />
                    <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{row.client.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5 }}>{row.plan}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.start}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.end}</td>
                <td style={{ padding: '12px 16px' }}>{statusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
