import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import Badge from '../../components/Badge';
import { lesionesApi, fechaEvento, type DatosLesion, type Lesion, type EventoLesion } from './lesionesApi';

const panel: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 16 };
const boton: CSSProperties = { background: 'var(--primary)', color: '#fff', border: 0, borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 700 };
const campo: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 10, margin: '6px 0 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)' };
const inicial: DatosLesion = { tipo: 'lesion', nombre: '', descripcion: null, estado: 'activa' };

export default function LesionesCliente({ clienteId }: { clienteId: number }) {
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [formulario, setFormulario] = useState(false);
  const [edicion, setEdicion] = useState<number | null>(null);
  const [datos, setDatos] = useState<DatosLesion>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState<EventoLesion[] | null>(null);
  const [historialId, setHistorialId] = useState<number | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    lesionesApi.listar(clienteId).then(lista => activo && setLesiones(lista))
      .catch(err => activo && setError((err as Error).message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [clienteId, recarga]);

  useEffect(() => {
    let activo = true;
    setHistorial(null);
    if (historialId === null) return;
    setCargandoHistorial(true);
    lesionesApi.historial(historialId).then(eventos => activo && setHistorial(eventos))
      .catch(err => activo && setError((err as Error).message))
      .finally(() => activo && setCargandoHistorial(false));
    return () => { activo = false; };
  }, [historialId]);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true); setError(''); setExito('');
    try {
      const payload = { ...datos, nombre: datos.nombre.trim(), descripcion: datos.descripcion?.trim() || null };
      const anterior = lesiones.find(l => l.id === edicion);
      const guardada = edicion === null ? await lesionesApi.crear(clienteId, payload) : await lesionesApi.editar(edicion, payload);
      setLesiones(lista => edicion === null ? [guardada, ...lista] : lista.map(l => l.id === edicion ? guardada : l));
      setFormulario(false); setHistorialId(null);
      setExito(anterior?.updated_at === guardada.updated_at ? 'Sin cambios: se conservó el historial.' : 'Lesión o limitación guardada correctamente.');
    } catch (err) { setError((err as Error).message); }
    finally { setGuardando(false); }
  }

  return <div>
    {error && <div role="alert" style={{ ...panel, color: 'var(--danger)' }}>{error} <button onClick={() => setRecarga(r => r + 1)}>Reintentar listado</button></div>}
    {exito && <div role="status" style={{ ...panel, color: 'var(--primary)' }}>{exito}</div>}
    <div style={panel}>
      <button style={boton} disabled={guardando} onClick={() => { setDatos(inicial); setEdicion(null); setFormulario(true); setExito(''); }}>Registrar lesión o limitación</button>
      {formulario && <form onSubmit={guardar} style={{ marginTop: 20 }}>
        <h3>{edicion === null ? 'Nuevo registro' : 'Actualizar registro'}</h3>
        <fieldset disabled={guardando} style={{ border: 0, padding: 0 }}>
          <label>Tipo<select style={campo} value={datos.tipo} onChange={e => setDatos({ ...datos, tipo: e.target.value as DatosLesion['tipo'] })}><option value="lesion">Lesión</option><option value="limitacion">Limitación</option></select></label>
          <label>Nombre<input style={campo} required maxLength={100} value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} /></label>
          <label>Descripción (opcional)<textarea style={campo} maxLength={5000} value={datos.descripcion ?? ''} onChange={e => setDatos({ ...datos, descripcion: e.target.value })} /></label>
          <label>Estado<select style={campo} value={datos.estado} onChange={e => setDatos({ ...datos, estado: e.target.value as DatosLesion['estado'] })}><option value="activa">Activa</option><option value="resuelta">Resuelta</option></select></label>
          <button style={boton} type="submit">{guardando ? 'Guardando…' : 'Guardar'}</button> <button type="button" onClick={() => setFormulario(false)}>Cancelar</button>
        </fieldset>
      </form>}
    </div>
    {cargando ? <p role="status">Cargando lesiones…</p> : !error && lesiones.length === 0 ? <div style={panel}>Este cliente no tiene lesiones ni limitaciones registradas.</div> : lesiones.map(lesion => <article key={lesion.id} style={panel}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{lesion.nombre}</h3><Badge variant={lesion.estado === 'activa' ? 'danger' : 'success'}>{lesion.estado === 'activa' ? 'Activa' : 'Resuelta'}</Badge><span>{lesion.tipo === 'lesion' ? 'Lesión' : 'Limitación'}</span></div>
      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{lesion.descripcion ?? 'Sin descripción'}</p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Registro: {fechaEvento(lesion.created_at)} · Último cambio: {fechaEvento(lesion.updated_at)} · Responsable: {lesion.responsable_nombre ?? 'No disponible'}</p>
      <button disabled={guardando} onClick={() => { setEdicion(lesion.id); setDatos({ tipo: lesion.tipo, nombre: lesion.nombre, descripcion: lesion.descripcion, estado: lesion.estado }); setFormulario(true); setExito(''); }}>Actualizar</button> <button onClick={() => { setError(''); setHistorialId(historialId === lesion.id ? null : lesion.id); }}>Historial</button>
      {historialId === lesion.id && <section aria-label="Historial de cambios">
        {cargandoHistorial ? <p role="status">Cargando historial…</p> : historial && <ol>{historial.map(evento => <li key={evento.id} style={{ marginTop: 14 }}>
          <strong>{fechaEvento(evento.created_at)} · {evento.usuario_nombre ?? 'Usuario no disponible'}</strong><div>{evento.nombre} · {evento.tipo === 'lesion' ? 'Lesión' : 'Limitación'} · {evento.estado}</div><div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{evento.descripcion ?? 'Sin descripción'}</div>
        </li>)}</ol>}
      </section>}
    </article>)}
  </div>;
}
