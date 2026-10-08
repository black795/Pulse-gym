import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import Avatar from '../../components/Avatar';
import AsistenciasCliente from '../../features/asistencias/AsistenciasCliente';
import LesionesCliente from '../../features/lesiones/LesionesCliente';
import { IconChevronRight } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS, tienePermiso } from '../../features/auth/permisos';
import { clientesApi, fechaLegible, type Cliente } from '../../features/clientes/clientesApi';

const TABS = ['Datos personales', 'Mediciones', 'Rutina asignada', 'Historial físico'];

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeLesiones = tienePermiso(usuario, PERMISOS.LESIONES_GESTIONAR);
  const puedeAsistencia = tienePermiso(usuario, PERMISOS.ASISTENCIA_VER);
  const tabs = [...TABS, ...(puedeLesiones ? ['Lesiones'] : []), ...(puedeAsistencia ? ['Asistencia'] : [])];
  const [client, setClient] = useState<Cliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setClient(null);
    setError(null);
    clientesApi.obtener(Number(id)).then(setClient).catch(err => setError((err as Error).message));
  }, [id]);

  if (error) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
          {error}
        </div>
        <span style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }} onClick={() => navigate('/admin')}>← Volver a clientes</span>
      </div>
    );
  }
  if (!client) return <div style={{ color: 'var(--muted)', padding: 24 }}>Cargando…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--muted)' }}>
        <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/admin')}>Clientes</span>
        <IconChevronRight style={{ width: 14, height: 14 }} />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{client.nombre}</span>
      </div>

      {/* Header card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar name={client.nombre} size={80} />
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{client.nombre}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>CI {client.carnet}</span>
              {client.objetivo && <span style={{ color: 'var(--muted)', fontSize: 13 }}>· {client.objetivo}</span>}
            </div>
          </div>
        </div>
        {tienePermiso(usuario, PERMISOS.CLIENTES_EDITAR) && (
          <button onClick={() => navigate(`/admin/clients/${client.id}/edit`)} style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Editar ficha
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 6, width: 'fit-content', maxWidth: '100%',
      }}>
        {tabs.map((t, i) => (
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
      {tab === 0 ? <TabPersonal client={client} />
        : tabs[tab] === 'Lesiones' ? <LesionesCliente key={client.id} clienteId={client.id} />
        : tabs[tab] === 'Asistencia' ? <AsistenciasCliente key={client.id} clienteId={client.id} />
        : <TabPendiente nombre={tabs[tab] ?? 'Pestaña'} />}
    </div>
  );
}

function TabPersonal({ client }: { client: Cliente }) {
  const imc = client.peso_kg / (client.altura_cm / 100) ** 2;
  const fields = [
    { label: 'Nombre completo', value: client.nombre },
    { label: 'Carnet de identidad', value: client.carnet },
    { label: 'Teléfono', value: client.telefono ?? 'Sin registrar' },
    { label: 'Correo', value: client.email ?? 'Sin registrar' },
    { label: 'Edad', value: `${client.edad} años (${fechaLegible(client.fecha_nacimiento)})` },
    { label: 'Objetivo', value: client.objetivo ?? 'Sin definir' },
    { label: 'Peso', value: `${client.peso_kg} kg` },
    { label: 'Altura', value: `${client.altura_cm} cm` },
    { label: 'IMC', value: imc.toFixed(1) },
    { label: 'Registrado el', value: fechaLegible(client.created_at.slice(0, 10)) },
  ];
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 20 }}>
        {fields.map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', overflowWrap: 'anywhere' }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPendiente({ nombre }: { nombre: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', color: 'var(--muted)', fontSize: 14 }}>
      «{nombre}» todavía no está disponible para este cliente.
    </div>
  );
}
