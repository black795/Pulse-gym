import { useEffect, useState } from 'react';
import { fechaLegible } from '../clientes/clientesApi';
import { asistenciasApi, type Asistencia } from './asistenciasApi';

/** Pestaña "Asistencia" de la ficha: historial de entradas del cliente, de la más reciente a la más antigua. */
export default function AsistenciasCliente({ clienteId }: { clienteId: number }) {
  const [entradas, setEntradas] = useState<Asistencia[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    asistenciasApi.deCliente(clienteId)
      .then(lista => { if (vigente) setEntradas(lista); })
      .catch(err => { if (vigente) setError((err as Error).message); });
    return () => { vigente = false; };
  }, [clienteId]);

  const caja = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

  if (error) return <div role="alert" style={{ ...caja, padding: 28, color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>{error}</div>;
  if (!entradas) return <div style={{ ...caja, padding: 28, color: 'var(--muted)', fontSize: 14 }}>Cargando…</div>;
  if (entradas.length === 0) return <div style={{ ...caja, padding: 28, color: 'var(--muted)', fontSize: 14 }}>Este cliente todavía no tiene entradas registradas.</div>;

  return (
    <div style={{ ...caja, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15 }}>
        Historial de asistencia · {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['FECHA', 'HORA', 'MÉTODO', 'REGISTRÓ'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entradas.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: i < entradas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: 13.5 }}>{fechaLegible(a.fecha)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{a.hora}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{a.metodo === 'qr' ? 'QR' : 'Manual'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13.5 }}>{a.registrado_por_nombre ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
