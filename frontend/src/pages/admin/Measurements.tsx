import { clients, injuries } from '../../data/mock';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { IconAlertTriangle } from '../../components/Icons';

export default function Measurements() {
  const withMeasurements = clients.filter(c => c.measurements.length > 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Mediciones y lesiones</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Vista consolidada para entrenadores</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 28, color: 'var(--danger)' }}>{injuries.length}</div>
          <div style={{ fontSize: 13, color: '#991b1b', marginTop: 4, fontWeight: 600 }}>Lesiones activas</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 28, color: 'var(--ink)' }}>6</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Mediciones esta semana</div>
        </div>
        <div style={{ background: 'var(--warning-tint)', border: '1px solid #fde68a', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 28, color: 'var(--warning)' }}>1</div>
          <div style={{ fontSize: 13, color: 'var(--warning)', marginTop: 4, fontWeight: 600 }}>Sin medición reciente</div>
        </div>
      </div>

      {/* Active injuries */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 22, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle style={{ color: 'var(--danger)', width: 18, height: 18 }} />
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--danger)' }}>Lesiones activas</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CLIENTE', 'LESIÓN', 'FECHA', 'RUTINA AJUSTADA', 'ENTRENADOR'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {injuries.map((inj, i) => {
              const client = clients.find(c => c.name === inj.client);
              return (
                <tr key={inj.id} style={{ borderBottom: i < injuries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {client && <Avatar name={client.name} photo={client.photo} size={32} />}
                      <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{inj.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--danger)', fontWeight: 600, fontSize: 13.5 }}>{inj.injury}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{inj.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {inj.routineAdjusted ? <Badge variant="success">Sí</Badge> : <Badge variant="danger">Pendiente</Badge>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{inj.trainer}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Measurements */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>Últimas mediciones de peso</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CLIENTE', 'PESO ACTUAL', 'CAMBIO', 'FECHA'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withMeasurements.map((c, i) => {
              const m = c.measurements[0];
              const prev = c.measurements[1];
              const diff = prev ? (m.weight - prev.weight).toFixed(1) : null;
              return (
                <tr key={c.id} style={{ borderBottom: i < withMeasurements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={c.name} photo={c.photo} size={32} />
                      <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{m.weight} kg</td>
                  <td style={{ padding: '12px 16px' }}>
                    {diff ? (
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: Number(diff) < 0 ? 'var(--primary)' : 'var(--warning)' }}>
                        {Number(diff) > 0 ? '+' : ''}{diff} kg
                      </span>
                    ) : <span style={{ color: 'var(--muted-2)', fontSize: 13 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{m.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
