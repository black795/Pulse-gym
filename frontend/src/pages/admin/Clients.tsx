import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Avatar from '../../components/Avatar';
import { IconPlus, IconSearch, IconEye, IconEdit } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS, tienePermiso } from '../../features/auth/permisos';
import { clientesApi, type Cliente } from '../../features/clientes/clientesApi';

export default function Clients() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeCrear = tienePermiso(usuario, PERMISOS.CLIENTES_CREAR);
  const puedeEditar = tienePermiso(usuario, PERMISOS.CLIENTES_EDITAR);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    clientesApi.listar()
      .then(setClientes)
      .catch(err => setError((err as Error).message))
      .finally(() => setCargando(false));
  }, []);

  const texto = search.trim().toLowerCase();
  const filtered = clientes.filter(c => c.nombre.toLowerCase().includes(texto) || c.carnet.toLowerCase().includes(texto));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', margin: 0 }}>Clientes</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Gestiona todos los miembros del gimnasio</p>
        </div>
        {puedeCrear && (
          <button onClick={() => navigate('/admin/clients/new')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: 9, padding: '10px 18px', fontFamily: 'var(--font-sora)',
            fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
          }}>
            <IconPlus style={{ width: 16, height: 16 }} />
            Nuevo cliente
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <IconSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', width: 15, height: 15 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o carnet..."
            aria-label="Buscar cliente"
            style={{
              width: '100%', height: 38, paddingLeft: 34, paddingRight: 12,
              border: '1px solid var(--border)', borderRadius: 9,
              fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--ink)',
              background: 'var(--surface)', outline: 'none',
            }}
          />
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['NOMBRE', 'CARNET', 'TELÉFONO', 'EDAD', 'ACCIONES'].map(h => (
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
              {(cargando || filtered.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
                    {cargando ? 'Cargando…' : clientes.length === 0 ? 'Todavía no hay clientes registrados.' : 'Ningún cliente coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
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
                      <Avatar name={client.nombre} size={36} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{client.nombre}</div>
                        {client.email && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{client.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{client.carnet}</span>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{client.telefono ?? '—'}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{client.edad} años</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        style={{ padding: '5px 10px', background: 'var(--primary-tint)', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                      >
                        <IconEye style={{ width: 13, height: 13 }} /> Ver
                      </button>
                      {puedeEditar && (
                        <button
                          onClick={() => navigate(`/admin/clients/${client.id}/edit`)}
                          style={{ padding: '5px 10px', background: '#f0f4f1', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                        >
                          <IconEdit style={{ width: 13, height: 13 }} /> Editar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Mostrando {filtered.length} de {clientes.length} clientes</span>
        </div>
      </div>
    </div>
  );
}
