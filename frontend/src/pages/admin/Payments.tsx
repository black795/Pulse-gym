import { useState } from 'react';
import { payments, clients } from '../../data/mock';
import { statusBadge } from '../../components/Badge';
import Avatar from '../../components/Avatar';

const methods = ['Efectivo', 'QR', 'Tarjeta'];
const plans = ['Mensual', 'Trimestral', 'Semestral'];

export default function Payments() {
  const [client, setClient] = useState('');
  const [plan, setPlan] = useState(0);
  const [method, setMethod] = useState(0);
  const [log, setLog] = useState(payments);
  const [success, setSuccess] = useState(false);

  const handleRegister = () => {
    if (!client.trim()) return;
    const found = clients.find(c => c.name.toLowerCase().includes(client.toLowerCase()));
    const amounts = [150, 400, 700];
    setLog(prev => [{
      id: prev.length + 1,
      date: '17 sep 2026',
      client: found ? found.name : client,
      plan: plans[plan],
      amount: amounts[plan],
      method: methods[method],
      status: 'paid',
    }, ...prev]);
    setClient('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const totalMonth = log.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Pagos</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Registro y control de cobros</p>
      </div>

      {/* Quick charge */}
      <div style={{ background: 'var(--sidebar)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: '#b3c8bb', marginBottom: 16 }}>Cobro rápido</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4d7a5e', marginBottom: 6 }}>Cliente</label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              placeholder="Nombre del cliente..."
              style={{
                width: '100%', height: 40, padding: '0 12px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#d0e8d4', fontSize: 14, fontFamily: 'var(--font-manrope)', outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4d7a5e', marginBottom: 6 }}>Plan</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {plans.map((p, i) => (
                <button key={p} onClick={() => setPlan(i)} style={{
                  padding: '0 12px', height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 12,
                  background: plan === i ? 'var(--neon)' : 'rgba(255,255,255,0.1)',
                  color: plan === i ? 'var(--sidebar)' : '#8fad99',
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4d7a5e', marginBottom: 6 }}>Método</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {methods.map((m, i) => (
                <button key={m} onClick={() => setMethod(i)} style={{
                  padding: '0 12px', height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 12,
                  background: method === i ? 'var(--neon)' : 'rgba(255,255,255,0.1)',
                  color: method === i ? 'var(--sidebar)' : '#8fad99',
                }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleRegister} style={{
            height: 40, padding: '0 20px', background: 'var(--primary)', border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer',
          }}>
            Registrar
          </button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--primary-tint)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: 'var(--primary-dark)', fontSize: 13, fontWeight: 600 }}>
          ✓ Pago registrado correctamente
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 24 }}>
        <KPI label="Ingresos del mes" value={`Bs ${totalMonth.toLocaleString()}`} />
        <KPI label="Pagos hoy" value={log.filter(p => p.date === '17 sep 2026').length} />
        <KPI label="Pagos pendientes" value={log.filter(p => p.status === 'pending').length} danger />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['FECHA', 'CLIENTE', 'PLAN', 'MONTO', 'MÉTODO', 'ESTADO'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map((row, i) => {
              const c = clients.find(c => c.name === row.client);
              return (
                <tr key={row.id} style={{ borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {c && <Avatar name={c.name} photo={c.photo} size={28} />}
                      <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{row.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13.5, color: 'var(--ink)' }}>{row.plan}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>Bs {row.amount}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.method}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(row.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function KPI({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: danger && Number(value) > 0 ? 'var(--danger)' : 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
