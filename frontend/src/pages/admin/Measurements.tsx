import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { clients } from '../../data/mock';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS } from '../../features/auth/permisos';
import { lesionesApi, fechaEvento, type Lesion } from '../../features/lesiones/lesionesApi';
import Avatar from '../../components/Avatar';
import { IconAlertTriangle } from '../../components/Icons';

export default function Measurements() {
  const withMeasurements = clients.filter(c => c.measurements.length > 0);
  const { tiene } = useAuth();
  const puedeLesiones = tiene(PERMISOS.LESIONES_GESTIONAR);
  const [injuries, setInjuries] = useState<Lesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    let activo = true;
    if (!puedeLesiones) return;
    setCargando(true); setError('');
    lesionesApi.vigentes().then(lista => activo && setInjuries(lista))
      .catch(err => activo && setError((err as Error).message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [puedeLesiones, recarga]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Mediciones y lesiones</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Vista consolidada para entrenadores</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 28 }}>
        {puedeLesiones && <div style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 28, color: 'var(--danger)' }}>{cargando || error ? '—' : injuries.length}</div>
          <div style={{ fontSize: 13, color: '#991b1b', marginTop: 4, fontWeight: 600 }}>Lesiones activas</div>
        </div>}
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
      {puedeLesiones && <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 22, overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle style={{ color: 'var(--danger)', width: 18, height: 18 }} />
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--danger)' }}>Lesiones activas</div>
        </div>
        {cargando ? <p role="status" style={{ padding: 20 }}>Cargando lesiones…</p> : error ? <div role="alert" style={{ padding: 20, color: 'var(--danger)' }}>{error} <button onClick={() => setRecarga(r => r + 1)}>Reintentar</button></div> : injuries.length === 0 ? <p style={{ padding: 20 }}>No hay lesiones ni limitaciones activas.</p> : <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CLIENTE', 'LESIÓN / LIMITACIÓN', 'REGISTRO', 'ÚLTIMO CAMBIO', 'RESPONSABLE DEL CAMBIO'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {injuries.map((inj, i) => {
              return (
                <tr key={inj.id} style={{ borderBottom: i < injuries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={inj.cliente_nombre} size={32} />
                      <Link to={`/admin/clients/${inj.cliente_id}`} style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{inj.cliente_nombre}</Link>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--danger)', fontWeight: 600, fontSize: 13.5 }}>{inj.nombre}<div style={{ color: 'var(--muted)', fontSize: 12 }}>{inj.tipo === 'lesion' ? 'Lesión' : 'Limitación'}</div></td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{fechaEvento(inj.created_at)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{fechaEvento(inj.updated_at)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{inj.responsable_nombre ?? 'No disponible'}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>}
      </div>}

      {/* Measurements */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>Últimas mediciones de peso</div>
        </div>
        <div className="tabla-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
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
        </table></div>
      </div>
    </div>
  );
}
