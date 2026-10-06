import { useState } from 'react';
import { clients, planBOptions } from '../../data/mock';
import Avatar from '../../components/Avatar';

const daniela = clients[0];

export default function Routines() {
  const [selectedClient, setSelectedClient] = useState(0);
  const client = clients[selectedClient];
  const [day, setDay] = useState(0);

  if (!client.routine) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: '0 0 24px' }}>Rutinas</h1>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Este cliente no tiene rutina asignada.</p>
        </div>
      </div>
    );
  }

  const days = client.routine.days;
  const currentDay = days[day];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const routineRef = daniela.routine!;
  type ExList = typeof routineRef.schedule.Lunes;
  const exercises = (client.routine.schedule as Record<string, ExList>)[currentDay] || [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Rutinas</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Visualización y gestión de rutinas semanales</p>
      </div>

      {/* Client selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        {clients.map((c, i) => (
          <button key={c.id} onClick={() => { setSelectedClient(i); setDay(0); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
            border: selectedClient === i ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: selectedClient === i ? 'var(--primary-tint)' : 'var(--surface)',
            fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13,
            color: selectedClient === i ? 'var(--primary-dark)' : 'var(--muted)',
          }}>
            <Avatar name={c.name} photo={c.photo} size={24} />
            {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {!client.routine ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
          Sin rutina asignada para este cliente.
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={client.name} photo={client.photo} size={40} />
              <div>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16 }}>{client.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Asignada por: {client.routine.assignedBy} · {client.routine.days.join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {days.map((d, i) => (
              <button key={d} onClick={() => setDay(i)} style={{
                padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
                fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5,
                background: day === i ? 'var(--sidebar)' : 'var(--surface)',
                color: day === i ? 'var(--neon)' : 'var(--muted)',
                border: day === i ? '1px solid var(--sidebar)' : '1px solid var(--border)',
              }}>
                {d}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {exercises.map((ex) => (
              <div key={ex.id} style={{
                background: 'var(--surface)', border: `1px solid ${ex.available === false ? '#fecaca' : 'var(--border)'}`,
                borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{ex.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                      {ex.sets} series · {ex.reps} reps · {ex.weight}
                      {ex.prev !== '--' && <span style={{ color: 'var(--muted-2)' }}> (ant: {ex.prev})</span>}
                    </div>
                    {ex.progress && (
                      <div style={{ marginTop: 8, display: 'inline-block', background: 'var(--primary-tint)', color: 'var(--primary-dark)', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                        📈 {ex.progress}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ex.available === false ? 'var(--danger)' : 'var(--primary)' }}>
                    {ex.available === false ? '● Ocupada' : '● Disponible'}
                  </div>
                </div>

                {ex.planB && (
                  <div style={{ marginTop: 14, borderTop: '1px dashed var(--border)', paddingTop: 14 }}>
                    <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 12, background: 'var(--neon)', color: 'var(--sidebar)', padding: '3px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>
                      IA — Plan B automático del Entrenador IA
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {planBOptions.map(opt => (
                        <div key={opt.id} style={{
                          padding: '10px 14px', borderRadius: 10,
                          background: opt.selected ? 'var(--primary-tint)' : 'var(--bg)',
                          border: `1px solid ${opt.selected ? 'var(--primary)' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 12.5, color: opt.selected ? 'var(--primary-dark)' : 'var(--ink)' }}>{opt.label}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{opt.description}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--muted-2)', fontStyle: 'italic' }}>
                      {client.name.split(' ')[0]} verá las mismas opciones desde su celular.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
