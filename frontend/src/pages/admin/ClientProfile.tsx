import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { clients } from '../../data/mock';
import { statusBadge } from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { IconAlertTriangle, IconChevronRight } from '../../components/Icons';
import { planBOptions } from '../../data/mock';

const TABS = ['Datos personales', 'Mediciones', 'Rutina asignada', 'Historial físico'];

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = clients.find(c => c.id === Number(id)) || clients[0];
  const [tab, setTab] = useState(0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--muted)' }}>
        <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/admin')}>Clientes</span>
        <IconChevronRight style={{ width: 14, height: 14 }} />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{client.name}</span>
      </div>

      {/* Header card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar name={client.name} photo={client.photo} size={80} />
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{client.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {statusBadge(client.status)}
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{client.plan}</span>
              {client.injury && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}>
                  <IconAlertTriangle style={{ width: 13, height: 13 }} /> Lesión activa
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Editar ficha
          </button>
          <button style={{ padding: '9px 18px', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Registrar pago
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 6, width: 'fit-content',
      }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13,
            background: tab === i ? 'var(--primary)' : 'transparent',
            color: tab === i ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <TabPersonal client={client} />}
      {tab === 1 && <TabMeasurements client={client} />}
      {tab === 2 && <TabRoutine client={client} />}
      {tab === 3 && <TabHistory client={client} />}
    </div>
  );
}

function TabPersonal({ client }: { client: typeof clients[0] }) {
  const fields = [
    { label: 'Nombre completo', value: client.name },
    { label: 'Teléfono', value: client.phone },
    { label: 'Edad', value: `${client.age} años` },
    { label: 'Peso', value: `${client.weight} kg` },
    { label: 'Altura', value: `${client.height} cm` },
    { label: 'Objetivo', value: client.goal },
    { label: 'Plan', value: client.plan },
    { label: 'Última visita', value: client.lastVisit },
  ];
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {fields.map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabMeasurements({ client }: { client: typeof clients[0] }) {
  const m = client.measurements[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {client.injury && (
        <div style={{
          background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <IconAlertTriangle style={{ color: 'var(--danger)', width: 20, height: 20, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: 'var(--danger)', marginBottom: 4 }}>
              Lesión activa — {client.injury.zone}
            </div>
            <div style={{ fontSize: 13, color: '#991b1b' }}>
              Registrada el {client.injury.date} · Severidad: {client.injury.severity} · Entrenadora: {client.injury.trainer}
            </div>
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
              Esta lesión está activa y afecta la rutina asignada. Rutina ajustada automáticamente.
            </div>
          </div>
        </div>
      )}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, marginBottom: 18 }}>Última medición — {m.date}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Peso', value: `${m.weight} kg` },
            { label: 'IMC', value: m.bmi.toFixed(1) },
            { label: 'Brazos', value: `${m.arms} cm` },
            { label: 'Cintura', value: `${m.waist} cm` },
            { label: 'Cadera', value: `${m.hips} cm` },
            { label: 'Cambio peso', value: client.measurements.length > 1 ? `${(m.weight - client.measurements[1].weight).toFixed(1)} kg` : '—' },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabRoutine({ client }: { client: typeof clients[0] }) {
  const [day, setDay] = useState(0);
  if (!client.routine) return <div style={{ color: 'var(--muted)', padding: 24 }}>Sin rutina asignada.</div>;
  const days = client.routine.days;
  const currentDay = days[day];
  const exercises = (client.routine.schedule as Record<string, typeof client.routine.schedule.Lunes>)[currentDay] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map((d, i) => (
          <button key={d} onClick={() => setDay(i)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13,
            background: day === i ? 'var(--sidebar)' : 'var(--surface)',
            color: day === i ? 'var(--neon)' : 'var(--muted)',
            border: day === i ? '1px solid var(--sidebar)' : '1px solid var(--border)',
          }}>
            {d}
          </button>
        ))}
      </div>
      {exercises.map((ex, idx) => (
        <div key={ex.id} style={{
          background: 'var(--surface)', border: `1px solid ${ex.available === false ? '#fecaca' : 'var(--border)'}`,
          borderRadius: 14, padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ex.planB ? 14 : 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{ex.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                {ex.sets} series · {ex.reps} reps · {ex.weight}
                {ex.prev !== '--' && <span style={{ color: 'var(--muted-2)' }}> (anterior: {ex.prev})</span>}
              </div>
              {ex.progress && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-tint)', padding: '3px 10px', borderRadius: 999, display: 'inline-block' }}>
                  📈 {ex.progress}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {ex.available === false ? (
                <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>● Ocupada</span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>● Disponible</span>
              )}
            </div>
          </div>
          {ex.planB && (
            <div style={{ borderTop: '1px solid #fecaca', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13, color: 'var(--sidebar)', background: 'var(--neon)', padding: '4px 12px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>
                IA Plan B — Entrenador IA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {planBOptions.map(opt => (
                  <div key={opt.id} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: opt.selected ? 'var(--primary-tint)' : 'var(--bg)',
                    border: `1px solid ${opt.selected ? '#bbf7d0' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      background: opt.selected ? 'var(--primary)' : 'var(--border)',
                      border: `2px solid ${opt.selected ? 'var(--primary)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {opt.selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{opt.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 10, fontStyle: 'italic' }}>
                Daniela verá las mismas opciones desde su celular.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabHistory({ client }: { client: typeof clients[0] }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Historial de mediciones</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['FECHA', 'PESO', 'IMC', 'BRAZOS', 'CINTURA', 'CADERA'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {client.measurements.map((m, i) => (
            <tr key={i} style={{ borderBottom: i < client.measurements.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <td style={{ padding: '12px', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500 }}>{m.date}</td>
              <td style={{ padding: '12px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{m.weight} kg</td>
              <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13.5 }}>{m.bmi.toFixed(1)}</td>
              <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13.5 }}>{m.arms} cm</td>
              <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13.5 }}>{m.waist} cm</td>
              <td style={{ padding: '12px', color: 'var(--muted)', fontSize: 13.5 }}>{m.hips} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
