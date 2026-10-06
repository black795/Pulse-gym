import { useState } from 'react';
import { useNavigate } from 'react-router';
import { clients } from '../../data/mock';
import Badge, { statusBadge } from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { IconPlus, IconSearch, IconEye, IconEdit } from '../../components/Icons';

const filters = ['Todos', 'Activos', 'Inactivos', 'Por vencer'];

const filterMap: Record<string, string[]> = {
  Todos: ['active', 'warning', 'overdue'],
  Activos: ['active'],
  Inactivos: [],
  'Por vencer': ['warning', 'overdue'],
};

export default function Clients() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c => {
    const statusOk = filterMap[filter].length === 0 ? true : filterMap[filter].includes(c.status);
    const searchOk = c.name.toLowerCase().includes(search.toLowerCase()) || c.plan.toLowerCase().includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', margin: 0 }}>Clientes</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Gestiona todos los miembros del gimnasio</p>
        </div>
        <button onClick={() => navigate('/admin/clients/new')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--primary)', color: '#fff', border: 'none',
          borderRadius: 9, padding: '10px 18px', fontFamily: 'var(--font-sora)',
          fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>
          <IconPlus style={{ width: 16, height: 16 }} />
          Nuevo cliente
        </button>
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <IconSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', width: 15, height: 15 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o plan..."
            style={{
              width: '100%', height: 38, paddingLeft: 34, paddingRight: 12,
              border: '1px solid var(--border)', borderRadius: 9,
              fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--ink)',
              background: 'var(--surface)', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontFamily: 'var(--font-manrope)', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: filter === f ? 'var(--primary-tint)' : 'var(--surface)',
              color: filter === f ? 'var(--primary-dark)' : 'var(--muted)',
              border: filter === f ? '1px solid #bbf7d0' : '1px solid var(--border)',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['NOMBRE', 'TELÉFONO', 'PLAN', 'ÚLTIMA VISITA', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                  letterSpacing: '0.06em', fontFamily: 'var(--font-manrope)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => (
              <tr key={client.id} style={{
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faf8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={client.name} photo={client.photo} size={36} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{client.name}</div>
                      {client.injury && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>● Lesión activa</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{client.phone}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{client.plan}</span>
                </td>
                <td style={{ padding: '13px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{client.lastVisit}</td>
                <td style={{ padding: '13px 16px' }}>{statusBadge(client.status)}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                      style={{ padding: '5px 10px', background: 'var(--primary-tint)', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                    >
                      <IconEye style={{ width: 13, height: 13 }} /> Ver
                    </button>
                    <button style={{ padding: '5px 10px', background: '#f0f4f1', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                      <IconEdit style={{ width: 13, height: 13 }} /> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Mostrando {filtered.length} de {clients.length} clientes</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map(p => (
              <button key={p} style={{
                width: 32, height: 32, borderRadius: 7, border: p === 1 ? 'none' : '1px solid var(--border)',
                background: p === 1 ? 'var(--primary)' : 'var(--surface)',
                color: p === 1 ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
