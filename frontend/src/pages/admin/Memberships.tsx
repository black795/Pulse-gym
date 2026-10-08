import { useEffect, useRef, useState } from 'react';
import Badge from '../../components/Badge';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS, tienePermiso } from '../../features/auth/permisos';
import { clientesApi, fechaLegible, type Cliente } from '../../features/clientes/clientesApi';
import {
  ETIQUETA_ESTADO, membresiasApi, textoDias,
  type EstadoMembresia, type Membresia, type Plan,
} from '../../features/membresias/membresiasApi';

const VARIANTE = { vigente: 'success', por_vencer: 'warning', vencida: 'danger' } as const;

const estiloPlan = (nombre: string) => nombre === 'Trimestral'
  ? { color: 'var(--sidebar)', border: 'var(--neon)', featured: true }
  : { color: nombre === 'Semestral' ? '#f8fafc' : '#f0fdf4', border: nombre === 'Semestral' ? '#e2e8f0' : '#bbf7d0', featured: false };

const BENEFICIOS: Record<string, string[]> = {
  Mensual: ['Acceso ilimitado', 'Rutina básica', 'Asistencia manual', 'App cliente'],
  Trimestral: ['Acceso ilimitado', 'Rutina personalizada IA', 'Entrenador asignado', 'Mediciones mensuales', 'App premium', 'Acceso a clases grupales'],
  Semestral: ['Todo del Trimestral', 'Análisis de progreso', 'Consulta nutricional', '2 sesiones PT gratis'],
};

const FILTROS: { valor: EstadoMembresia | undefined; texto: string }[] = [
  { valor: undefined, texto: 'Todas' },
  { valor: 'por_vencer', texto: 'Por vencer' },
  { valor: 'vencida', texto: 'Vencidas' },
  { valor: 'vigente', texto: 'Vigentes' },
];

export default function Memberships() {
  const { usuario } = useAuth();
  const puedeRegistrar = tienePermiso(usuario, PERMISOS.PAGOS_GESTIONAR);

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [filas, setFilas] = useState<Membresia[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<EstadoMembresia | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario "Registrar pago"
  const [clienteId, setClienteId] = useState('');
  const [planId, setPlanId] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Si el usuario cambia de filtro rápido, solo cuenta la última petición (las viejas se descartan).
  const ultimaPeticion = useRef(0);

  const cargar = async (estado: EstadoMembresia | undefined) => {
    const numero = ++ultimaPeticion.current;
    setCargando(true);
    try {
      const resultado = await membresiasApi.listar(estado);
      if (numero !== ultimaPeticion.current) return;
      setFilas(resultado);
      setError(null);
    } catch (err) {
      if (numero !== ultimaPeticion.current) return;
      setFilas([]);
      setError((err as Error).message);
    } finally {
      if (numero === ultimaPeticion.current) setCargando(false);
    }
  };

  useEffect(() => {
    membresiasApi.planes().then(setPlanes).catch(err => setError((err as Error).message));
    if (puedeRegistrar) clientesApi.listar().then(setClientes).catch(err => setError((err as Error).message));
  }, [puedeRegistrar]);

  useEffect(() => { void cargar(filtro); }, [filtro]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAviso(null);
    if (!clienteId || !planId) { setError('Elige un cliente y un plan.'); return; }
    setGuardando(true);
    try {
      const m = await membresiasApi.registrarPago({
        cliente_id: Number(clienteId), plan_id: Number(planId), ...(fechaPago ? { fecha_pago: fechaPago } : {}),
      });
      setAviso(`Pago registrado: ${m.cliente_nombre} · ${m.plan} · vence el ${fechaLegible(m.fecha_vencimiento)}`);
      setClienteId(''); setPlanId(''); setFechaPago('');
      await cargar(filtro);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const entrada = { padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--surface)', minWidth: 160 } as const;
  const etiqueta = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--muted)' } as const;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Membresías</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Planes disponibles y vencimientos calculados según la fecha de pago</p>
      </div>

      {error && <div role="alert" style={{ background: 'var(--danger-tint)', color: 'var(--danger)', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 32 }}>
        {planes.map(plan => {
          const est = estiloPlan(plan.nombre);
          return (
            <div key={plan.id} style={{
              background: est.color, border: `2px solid ${est.border}`, borderRadius: 16, padding: '24px 22px',
              boxShadow: est.featured ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', gap: 16, position: 'relative',
            }}>
              {est.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--neon)', color: 'var(--sidebar)', padding: '3px 14px',
                  borderRadius: 999, fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap',
                }}>
                  ★ MÁS POPULAR
                </div>
              )}
              <div>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 17, color: est.featured ? '#fff' : 'var(--ink)' }}>{plan.nombre}</div>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 30, color: est.featured ? 'var(--neon)' : 'var(--primary)', marginTop: 6 }}>Bs {plan.precio}</div>
                <div style={{ fontSize: 12.5, marginTop: 2, color: est.featured ? '#b3c8bb' : 'var(--muted)' }}>
                  Dura {plan.duracion_meses} {plan.duracion_meses === 1 ? 'mes' : 'meses'}
                </div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(BENEFICIOS[plan.nombre] ?? []).map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: est.featured ? '#b3c8bb' : 'var(--muted)', fontWeight: 500 }}>
                    <span style={{ color: est.featured ? 'var(--neon)' : 'var(--primary)', fontWeight: 800 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              {puedeRegistrar && (
                <button
                  onClick={() => setPlanId(String(plan.id))}
                  style={{
                    padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14,
                    background: est.featured ? 'var(--neon)' : 'var(--primary)',
                    color: est.featured ? 'var(--sidebar)' : '#fff',
                  }}
                >
                  {planId === String(plan.id) ? '✓ Seleccionado' : 'Elegir plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Registrar pago */}
      {puedeRegistrar && (
        <form onSubmit={registrar} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={etiqueta}>
            CLIENTE
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={entrada}>
              <option value="">Elegir…</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.carnet}</option>)}
            </select>
          </label>
          <label style={etiqueta}>
            PLAN
            <select value={planId} onChange={e => setPlanId(e.target.value)} style={entrada}>
              <option value="">Elegir…</option>
              {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} · Bs {p.precio}</option>)}
            </select>
          </label>
          <label style={etiqueta}>
            FECHA DE PAGO (opcional, por defecto hoy)
            <input type="date" value={fechaPago} max={new Date().toLocaleDateString('en-CA')} onChange={e => setFechaPago(e.target.value)} style={entrada} />
          </label>
          <button type="submit" disabled={guardando} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--primary)', color: '#fff', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>
            {guardando ? 'Guardando…' : 'Registrar pago'}
          </button>
          {aviso && <div role="status" style={{ flexBasis: '100%', color: 'var(--primary-dark)', fontSize: 13.5, fontWeight: 600 }}>✓ {aviso}</div>}
        </form>
      )}

      {/* Vencimientos */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16 }}>Vencimientos</div>
          <div role="group" aria-label="Filtrar por estado" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTROS.map(f => (
              <button key={f.texto} onClick={() => setFiltro(f.valor)} aria-pressed={filtro === f.valor} style={{
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                border: '1px solid var(--border)',
                background: filtro === f.valor ? 'var(--primary)' : 'var(--surface)',
                color: filtro === f.valor ? '#fff' : 'var(--muted)',
              }}>{f.texto}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['CLIENTE', 'PLAN', 'PAGO', 'VENCIMIENTO', 'ESTADO'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < filas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5 }}>{row.cliente_nombre}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{row.cliente_carnet}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5 }}>{row.plan}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{fechaLegible(row.fecha_pago)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13.5 }}>
                    <div style={{ color: 'var(--ink)' }}>{fechaLegible(row.fecha_vencimiento)}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{textoDias(row.dias_restantes)}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge variant={VARIANTE[row.estado]}>{ETIQUETA_ESTADO[row.estado]}</Badge></td>
                </tr>
              ))}
              {!cargando && !error && filas.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No hay membresías en este estado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {cargando && <div role="status" style={{ padding: 20, color: 'var(--muted)' }}>Cargando…</div>}
      </div>
    </div>
  );
}
