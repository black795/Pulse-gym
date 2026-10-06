import { useState } from 'react';
import { attendance, clients } from '../../data/mock';
import Avatar from '../../components/Avatar';
import { IconSearch, IconCheck, IconQR } from '../../components/Icons';

export default function Attendance() {
  const [search, setSearch] = useState('');
  const [registered, setRegistered] = useState(false);
  const [log, setLog] = useState(attendance);

  const handleRegister = () => {
    if (!search.trim()) return;
    const client = clients.find(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (client) {
      const now = new Date();
      const time = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
      setLog(prev => [{ id: prev.length + 1, client: client.name, time, method: 'Manual', date: '17 sep 2026' }, ...prev]);
      setSearch('');
      setRegistered(true);
      setTimeout(() => setRegistered(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Asistencia</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Control de ingresos del día</p>
      </div>

      {/* Check-in bar */}
      <div style={{
        background: 'var(--sidebar)', borderRadius: 14, padding: '20px 24px',
        display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24,
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <IconSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4d7a5e', width: 16, height: 16 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            placeholder="Buscar cliente para registrar entrada..."
            style={{
              width: '100%', height: 44, paddingLeft: 38, paddingRight: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, color: '#d0e8d4', fontSize: 14, fontFamily: 'var(--font-manrope)', outline: 'none',
            }}
          />
        </div>
        <button onClick={handleRegister} style={{
          padding: '0 22px', height: 44, background: 'var(--neon)', border: 'none', borderRadius: 9,
          fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--sidebar)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <IconCheck style={{ width: 16, height: 16 }} />
          Registrar entrada
        </button>
      </div>

      {registered && (
        <div style={{
          background: 'var(--primary-tint)', border: '1px solid #bbf7d0', borderRadius: 10,
          padding: '12px 18px', marginBottom: 18, color: 'var(--primary-dark)', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <IconCheck style={{ width: 16, height: 16 }} />
          Entrada registrada correctamente
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Asistencias hoy', value: log.length },
          { label: 'Pico del día', value: '7–9am' },
          { label: 'Promedio semanal', value: '4.2/día' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>Entradas del día — 17 sep 2026</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CLIENTE', 'HORA', 'MÉTODO', 'FECHA'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map((row, i) => {
              const client = clients.find(c => c.name === row.client);
              return (
                <tr key={row.id} style={{ borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {client && <Avatar name={client.name} photo={client.photo} size={32} />}
                      <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{row.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{row.time}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: row.method === 'QR' ? 'var(--sidebar)' : '#f0fdf4',
                      color: row.method === 'QR' ? 'var(--neon)' : 'var(--primary-dark)',
                      border: row.method === 'QR' ? '1px solid rgba(182,255,69,0.3)' : '1px solid #bbf7d0',
                    }}>
                      {row.method === 'QR' ? <IconQR style={{ width: 12, height: 12 }} /> : <IconCheck style={{ width: 12, height: 12 }} />}
                      {row.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
