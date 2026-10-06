import { useState } from 'react';
import { revenueData } from '../../data/mock';

const periods = ['Semana', 'Mes', 'Año'];

const maxRevenue = Math.max(...revenueData.map(d => d.amount));

const byPlan = [
  { plan: 'Trimestral', pct: 55, color: 'var(--primary)' },
  { plan: 'Mensual', pct: 30, color: '#0891b2' },
  { plan: 'Semestral', pct: 15, color: '#7c3aed' },
];

const hourlyData = [
  { hour: '6–8am', pct: 45 },
  { hour: '8–10am', pct: 60 },
  { hour: '10am–12pm', pct: 30 },
  { hour: '12–2pm', pct: 20 },
  { hour: '2–4pm', pct: 35 },
  { hour: '4–6pm', pct: 50 },
  { hour: '6–8pm', pct: 100, peak: true },
  { hour: '8–10pm', pct: 40 },
];

export default function Reports() {
  const [period, setPeriod] = useState(1);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Reportes</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Análisis de desempeño del gimnasio</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {periods.map((p, i) => (
            <button key={p} onClick={() => setPeriod(i)} style={{
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13,
              background: period === i ? 'var(--primary)' : 'var(--surface)',
              color: period === i ? '#fff' : 'var(--muted)',
              border: period === i ? 'none' : '1px solid var(--border)',
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Ingresos', value: 'Bs 5,800' },
          { label: 'Clientes activos', value: '5' },
          { label: 'Retención', value: '83%' },
          { label: 'Ticket promedio', value: 'Bs 383' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Ingresos — últimos 6 meses</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
            {revenueData.map(d => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 600 }}>Bs {(d.amount / 1000).toFixed(1)}k</div>
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  height: `${(d.amount / maxRevenue) * 120}px`,
                  background: d.month === 'Ago' ? 'var(--primary)' : 'var(--primary-tint)',
                  border: '1px solid #bbf7d0',
                  transition: 'height 0.3s',
                }} />
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700 }}>{d.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan performance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Desempeño por plan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byPlan.map(p => (
              <div key={p.plan}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13.5, fontWeight: 600 }}>
                  <span style={{ fontFamily: 'var(--font-sora)' }}>{p.plan}</span>
                  <span style={{ color: p.color, fontWeight: 800 }}>{p.pct}%</span>
                </div>
                <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: 5, transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly occupation */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>
          Ocupación por horario
          <span style={{ marginLeft: 10, background: 'var(--sidebar)', color: 'var(--neon)', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 999 }}>PICO: 6–8pm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {hourlyData.map(d => (
            <div key={d.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', borderRadius: '5px 5px 0 0',
                height: `${d.pct}%`,
                background: d.peak ? 'var(--sidebar)' : 'var(--primary-tint)',
                border: `1px solid ${d.peak ? 'rgba(182,255,69,0.4)' : '#bbf7d0'}`,
              }} />
              <div style={{ fontSize: 10.5, color: d.peak ? 'var(--primary-dark)' : 'var(--muted)', fontWeight: d.peak ? 800 : 600, whiteSpace: 'nowrap' }}>{d.hour}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
