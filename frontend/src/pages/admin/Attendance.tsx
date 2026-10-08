import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { IconSearch, IconCheck, IconQR, IconAlertTriangle } from '../../components/Icons';
import { useAuth } from '../../features/auth/AuthContext';
import { PERMISOS, tienePermiso } from '../../features/auth/permisos';
import { clientesApi, fechaLegible, type Cliente } from '../../features/clientes/clientesApi';
import {
  asistenciasApi, ETIQUETA_ACTIVIDAD, textoDiasSinAsistir, VARIANTE_ACTIVIDAD,
  type ActividadCliente, type Asistencia, type Checkin, type EstadoActividad, type ResumenAsistencia,
} from '../../features/asistencias/asistenciasApi';
import { ETIQUETA_ESTADO } from '../../features/membresias/membresiasApi';
import { ApiError } from '../../lib/http';

const MAX_SUGERENCIAS = 6;

const FILTROS: { valor: EstadoActividad | undefined; texto: string }[] = [
  { valor: undefined, texto: 'Todos' },
  { valor: 'abandono', texto: 'Abandono' },
  { valor: 'en_riesgo', texto: 'En riesgo' },
  { valor: 'activo', texto: 'Activos' },
  { valor: 'sin_asistencias', texto: 'Sin asistencias' },
];

const tarjeta = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;
const celdaTitulo = { padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' } as const;
const alerta = { color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 18 } as const;
const enlace = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' } as const;

/** Primero el carnet exacto, luego los que empiezan con el texto y al final los que solo lo contienen. */
function buscarClientes(clientes: Cliente[], busqueda: string): Cliente[] {
  const texto = busqueda.trim().toLowerCase();
  if (!texto) return [];
  const puntaje = (c: Cliente) => {
    const nombre = c.nombre.toLowerCase();
    const carnet = c.carnet.toLowerCase();
    if (carnet === texto || nombre === texto) return 0;
    if (carnet.startsWith(texto) || nombre.startsWith(texto)) return 1;
    return carnet.includes(texto) || nombre.includes(texto) ? 2 : -1;
  };
  return clientes
    .map(c => ({ c, p: puntaje(c) }))
    .filter(x => x.p >= 0)
    .sort((a, b) => a.p - b.p || a.c.nombre.localeCompare(b.c.nombre))
    .slice(0, MAX_SUGERENCIAS)
    .map(x => x.c);
}

export default function Attendance() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeRegistrar = tienePermiso(usuario, PERMISOS.ASISTENCIA_GESTIONAR);
  const veMembresias = tienePermiso(usuario, PERMISOS.MEMBRESIAS_VER);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entradas, setEntradas] = useState<Asistencia[]>([]);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [actividad, setActividad] = useState<ActividadCliente[]>([]);
  const [filtro, setFiltro] = useState<EstadoActividad | undefined>(undefined);
  const [cargandoDia, setCargandoDia] = useState(true);
  const [cargandoActividad, setCargandoActividad] = useState(true);
  // Un error por bloque: que cargue uno no debe ocultar que falló otro.
  const [errorDia, setErrorDia] = useState<string | null>(null);
  const [errorActividad, setErrorActividad] = useState<string | null>(null);
  const [errorClientes, setErrorClientes] = useState<string | null>(null);

  // Check-in
  const [busqueda, setBusqueda] = useState('');
  const [resaltado, setResaltado] = useState(0);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimo, setUltimo] = useState<Checkin | null>(null);
  const [errorCheckin, setErrorCheckin] = useState<string | null>(null);
  const [porAnular, setPorAnular] = useState<number | null>(null); // fila que espera confirmación
  const campo = useRef<HTMLInputElement>(null);

  // Si dos recargas se cruzan, solo cuenta la última de cada bloque (las viejas se descartan).
  const peticionDia = useRef(0);
  const peticionActividad = useRef(0);

  const cargarDia = async () => {
    const numero = ++peticionDia.current;
    try {
      const [lista, datos] = await Promise.all([asistenciasApi.deHoy(), asistenciasApi.resumen()]);
      if (numero !== peticionDia.current) return;
      setEntradas(lista);
      setResumen(datos);
      setErrorDia(null);
    } catch (err) {
      if (numero === peticionDia.current) setErrorDia((err as Error).message);
    } finally {
      if (numero === peticionDia.current) setCargandoDia(false);
    }
  };

  // La actividad se pide completa una vez y los filtros se aplican aquí: cambiar de filtro no va al servidor.
  const cargarActividad = async () => {
    const numero = ++peticionActividad.current;
    try {
      const filas = await asistenciasApi.actividad();
      if (numero !== peticionActividad.current) return;
      setActividad(filas);
      setErrorActividad(null);
    } catch (err) {
      if (numero === peticionActividad.current) setErrorActividad((err as Error).message);
    } finally {
      if (numero === peticionActividad.current) setCargandoActividad(false);
    }
  };

  const recargar = () => { void cargarDia(); void cargarActividad(); };

  useEffect(() => {
    recargar();
    if (puedeRegistrar) {
      clientesApi.listar().then(setClientes).catch(err => setErrorClientes((err as Error).message));
    }
  }, [puedeRegistrar]);

  const sugerencias = useMemo(() => buscarClientes(clientes, busqueda), [busqueda, clientes]);
  const listaVisible = listaAbierta && sugerencias.length > 0;
  const actividadVisible = useMemo(() => actividad.filter(f => !filtro || f.estado === filtro), [actividad, filtro]);

  const registrar = async (cliente: Cliente) => {
    if (guardando) return;
    setUltimo(null);
    setErrorCheckin(null);
    setListaAbierta(false);
    setGuardando(true);
    try {
      setUltimo(await asistenciasApi.registrar(cliente.id));
      setBusqueda('');
    } catch (err) {
      setErrorCheckin((err as Error).message);
      // "Ya registró su entrada": el mensaje ya nombra al cliente, así que el campo queda libre para el siguiente.
      if (err instanceof ApiError && err.status === 409) setBusqueda('');
    } finally {
      setGuardando(false); // el siguiente check-in no espera a que terminen las recargas
      campo.current?.focus();
    }
    recargar();
  };

  /** Enter o el botón: solo registra a alguien que se está viendo resaltado en la lista. */
  const confirmar = () => {
    if (guardando) return;
    if (!busqueda.trim()) { setErrorCheckin('Escribe el nombre o el carnet del cliente.'); return; }
    if (sugerencias.length === 0) {
      setErrorCheckin(errorClientes ? 'No se pudo cargar la lista de clientes. Recarga la página.' : 'Ningún cliente coincide con la búsqueda.');
      return;
    }
    if (!listaVisible) { setListaAbierta(true); setResaltado(0); setErrorCheckin(null); return; }
    void registrar(sugerencias[resaltado] ?? sugerencias[0]);
  };

  const anular = async (entrada: Asistencia) => {
    setErrorCheckin(null);
    setPorAnular(null);
    try {
      await asistenciasApi.anular(entrada.id);
    } catch (err) {
      setErrorCheckin((err as Error).message);
    }
    if (ultimo?.id === entrada.id) setUltimo(null);
    recargar(); // también si falló: otra recepción pudo haberla anulado antes
    campo.current?.focus();
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setListaAbierta(true); setResaltado(i => Math.max(0, Math.min(i + 1, sugerencias.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setResaltado(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Escape') { setBusqueda(''); setListaAbierta(false); }
  };

  const kpis = [
    { label: 'Asistencias hoy', value: resumen ? resumen.asistencias_hoy : '—' },
    { label: 'Hora pico de hoy', value: resumen?.hora_pico ?? '—' },
    { label: 'Promedio diario (7 días)', value: resumen ? resumen.promedio_diario_7_dias.toFixed(1) : '—' },
  ];
  const columnasDia = ['CLIENTE', 'HORA', 'MÉTODO', 'REGISTRÓ', ...(puedeRegistrar ? ['ACCIÓN'] : [])];
  const columnasActividad = ['CLIENTE', 'ÚLTIMA ASISTENCIA', 'VISITAS (30 DÍAS)', ...(veMembresias ? ['MEMBRESÍA'] : []), 'ACTIVIDAD'];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Asistencia</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Control de ingresos del día y actividad de los clientes</p>
      </div>

      {errorClientes && <div role="alert" style={alerta}>No se pudo cargar la lista de clientes: {errorClientes}</div>}

      {/* Check-in bar */}
      {puedeRegistrar && (
        <div style={{
          background: 'var(--sidebar)', borderRadius: 14, padding: '20px 24px',
          display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <IconSearch style={{ position: 'absolute', left: 12, top: 14, color: '#4d7a5e', width: 16, height: 16 }} />
            <input
              ref={campo}
              autoFocus
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setResaltado(0); setErrorCheckin(null); setListaAbierta(true); }}
              onKeyDown={alTeclear}
              placeholder="Nombre o carnet del cliente… (Enter para registrar)"
              aria-label="Buscar cliente para registrar entrada"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listaVisible}
              aria-controls={listaVisible ? 'sugerencias-checkin' : undefined}
              aria-activedescendant={listaVisible ? `sugerencia-${sugerencias[resaltado]?.id}` : undefined}
              autoComplete="off"
              style={{
                width: '100%', height: 44, paddingLeft: 38, paddingRight: 12, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, color: '#d0e8d4', fontSize: 14, fontFamily: 'var(--font-manrope)', outline: 'none',
              }}
            />
            {listaVisible && (
              <ul id="sugerencias-checkin" role="listbox" aria-label="Clientes que coinciden" style={{
                listStyle: 'none', margin: '6px 0 0', padding: 4, position: 'absolute', left: 0, right: 0, zIndex: 10,
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              }}>
                {sugerencias.map((c, i) => (
                  <li
                    key={c.id}
                    id={`sugerencia-${c.id}`}
                    role="option"
                    aria-selected={i === resaltado}
                    onMouseEnter={() => setResaltado(i)}
                    onMouseDown={e => { if (e.button !== 0) return; e.preventDefault(); void registrar(c); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                      background: i === resaltado ? 'var(--primary-tint)' : 'transparent',
                    }}
                  >
                    <Avatar name={c.nombre} size={28} />
                    <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{c.nombre}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>CI {c.carnet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={confirmar} disabled={guardando} style={{
            padding: '0 22px', height: 44, background: 'var(--neon)', border: 'none', borderRadius: 9,
            fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--sidebar)',
            cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IconCheck style={{ width: 16, height: 16 }} />
            {guardando ? 'Registrando…' : 'Registrar entrada'}
          </button>
        </div>
      )}

      {errorCheckin && <div role="alert" style={{ ...alerta, padding: '12px 18px', fontSize: 14 }}>{errorCheckin}</div>}

      {ultimo && (
        <div role="status" style={{
          background: 'var(--primary-tint)', border: '1px solid #bbf7d0', borderRadius: 10,
          padding: '12px 18px', marginBottom: 18, color: 'var(--primary-dark)', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <IconCheck style={{ width: 16, height: 16 }} />
          <span>Entrada registrada: {ultimo.cliente_nombre} · {ultimo.hora}</span>
          {ultimo.aviso && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 999, fontSize: 12.5,
              background: ultimo.membresia_estado === 'por_vencer' ? 'var(--warning-tint)' : 'var(--danger-tint)',
              color: ultimo.membresia_estado === 'por_vencer' ? 'var(--warning)' : 'var(--danger)',
            }}>
              <IconAlertTriangle style={{ width: 13, height: 13 }} />
              {ultimo.aviso}
            </span>
          )}
          <button onClick={() => void anular(ultimo)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary-dark)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            Deshacer
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...tarjeta, padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Entradas de hoy */}
      <div style={{ ...tarjeta, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>
            Entradas de hoy{resumen ? ` — ${fechaLegible(resumen.fecha)}` : ''}
          </div>
        </div>
        {errorDia && <div role="alert" style={{ ...alerta, margin: 16 }}>No se pudieron cargar las entradas de hoy: {errorDia}</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {columnasDia.map(h => <th key={h} scope="col" style={{ ...celdaTitulo, textAlign: h === 'ACCIÓN' ? 'right' : 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {entradas.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < entradas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={row.cliente_nombre} size={32} />
                      <div>
                        <button onClick={() => navigate(`/admin/clients/${row.cliente_id}`)} style={enlace}>{row.cliente_nombre}</button>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>CI {row.cliente_carnet}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{row.hora}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: row.metodo === 'qr' ? 'var(--sidebar)' : '#f0fdf4',
                      color: row.metodo === 'qr' ? 'var(--neon)' : 'var(--primary-dark)',
                      border: row.metodo === 'qr' ? '1px solid rgba(182,255,69,0.3)' : '1px solid #bbf7d0',
                    }}>
                      {row.metodo === 'qr' ? <IconQR style={{ width: 12, height: 12 }} /> : <IconCheck style={{ width: 12, height: 12 }} />}
                      {row.metodo === 'qr' ? 'QR' : 'Manual'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.registrado_por_nombre ?? '—'}</td>
                  {puedeRegistrar && (
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {porAnular === row.id ? (
                        <>
                          <button onClick={() => void anular(row)} style={{ padding: '5px 10px', background: 'var(--danger)', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700, marginRight: 6 }}>
                            Sí, anular
                          </button>
                          <button onClick={() => setPorAnular(null)} style={{ padding: '5px 10px', background: '#f0f4f1', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>
                            No
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setPorAnular(row.id)} aria-label={`Anular la entrada de ${row.cliente_nombre}`} style={{ padding: '5px 10px', background: '#f0f4f1', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>
                          Anular
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {(cargandoDia || (!errorDia && entradas.length === 0)) && (
                <tr><td colSpan={columnasDia.length} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
                  {cargandoDia ? 'Cargando…' : 'Todavía no hay entradas registradas hoy.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actividad: activos y abandono */}
      <div style={{ ...tarjeta, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>Actividad de clientes</div>
            <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 2 }}>Activo: vino en los últimos 14 días · En riesgo: 15 a 30 días · Abandono: más de 30 días</div>
          </div>
          <div role="group" aria-label="Filtrar por actividad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
        {errorActividad && <div role="alert" style={{ ...alerta, margin: 16 }}>No se pudo cargar la actividad: {errorActividad}</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {columnasActividad.map(h => <th key={h} scope="col" style={celdaTitulo}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {actividadVisible.map((row, i) => (
                <tr key={row.cliente_id} style={{ borderBottom: i < actividadVisible.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => navigate(`/admin/clients/${row.cliente_id}`)} style={enlace}>{row.cliente_nombre}</button>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>CI {row.cliente_carnet}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13.5 }}>
                    <div style={{ color: 'var(--ink)' }}>{textoDiasSinAsistir(row.dias_sin_asistir)}</div>
                    {row.ultima_fecha && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{fechaLegible(row.ultima_fecha)}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14 }}>{row.asistencias_30_dias}</td>
                  {veMembresias && (
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{row.membresia_estado ? ETIQUETA_ESTADO[row.membresia_estado] : 'Sin membresía'}</td>
                  )}
                  <td style={{ padding: '12px 16px' }}><Badge variant={VARIANTE_ACTIVIDAD[row.estado]}>{ETIQUETA_ACTIVIDAD[row.estado]}</Badge></td>
                </tr>
              ))}
              {!cargandoActividad && !errorActividad && actividadVisible.length === 0 && (
                <tr><td colSpan={columnasActividad.length} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>No hay clientes en este estado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {cargandoActividad && <div role="status" style={{ padding: 20, color: 'var(--muted)' }}>Cargando…</div>}
      </div>
    </div>
  );
}
