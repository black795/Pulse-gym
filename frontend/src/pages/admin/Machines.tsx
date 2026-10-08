import { machines } from '../../data/mock';
import { statusBadge } from '../../components/Badge';
import { IconDumbbell, IconPlus } from '../../components/Icons';

export default function Machines() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Máquinas</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Catálogo de equipamiento del gimnasio</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: '#fff',
          border: 'none', borderRadius: 9, padding: '10px 18px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>
          <IconPlus style={{ width: 16, height: 16 }} /> Agregar máquina
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 18 }}>
        {machines.map(machine => (
          <div key={machine.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
          >
            {machine.image ? (
              <img src={machine.image} alt={machine.name} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{
                height: 160, background: 'linear-gradient(135deg, var(--sidebar), var(--black-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10,
              }}>
                <IconDumbbell style={{ color: '#3d5a47', width: 36, height: 36 }} />
                <span style={{ color: '#3d5a47', fontSize: 12, fontWeight: 600 }}>Sin fotografía</span>
              </div>
            )}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{machine.name}</div>
                {statusBadge(machine.status)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Grupo: {machine.group}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
