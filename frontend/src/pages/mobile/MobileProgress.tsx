import { fechaLegible } from '../../features/clientes/clientesApi';
import { aFecha, imc, useMiCuenta } from '../../features/miCuenta/miCuentaApi';

const caja = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' } as const;

export default function MobileProgress() {
  const { cuenta, cargando, error } = useMiCuenta();
  const ficha = cuenta?.ficha ?? null;
  const mes = cuenta ? new Intl.DateTimeFormat('es-BO', { month: 'long' }).format(aFecha(cuenta.hoy)) : '';

  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      <div style={{ background: 'var(--sidebar)', padding: '52px 16px 20px' }}>
        <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontWeight: 800, fontSize: 20 }}>Mi progreso</div>
        <div style={{ color: '#4d7a5e', fontSize: 13, marginTop: 4 }}>Tu asistencia y tus medidas</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cargando && !cuenta && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Cargando…</div>}
        {error && !cuenta && (
          <div role="alert" style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>
            No se pudieron cargar tus datos. {error}
          </div>
        )}

        {cuenta && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              { label: `Visitas en ${mes}`, value: cuenta.asistencias_mes },
              { label: 'Racha (días)', value: cuenta.racha_dias },
              { label: 'Esta semana', value: cuenta.semana.filter(d => d.asistio).length },
            ].map(k => (
              <div key={k.label} style={{ ...caja, padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{k.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {ficha && (
          <div style={{ ...caja, background: 'var(--primary-tint)', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{ficha.peso_kg} kg</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Actualizado el {fechaLegible(ficha.updated_at.slice(0, 10))}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>IMC: <strong>{imc(ficha).toFixed(1)}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Altura: <strong>{ficha.altura_cm} cm</strong></span>
              {ficha.objetivo && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Objetivo: <strong>{ficha.objetivo}</strong></span>}
            </div>
          </div>
        )}

        {cuenta && !ficha && (
          <div role="status" style={{ background: 'var(--warning-tint)', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13.5, color: 'var(--warning)' }}>Tu ficha aún no está registrada</div>
            <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 2 }}>Tus medidas aparecerán aquí cuando recepción registre tu ficha.</div>
          </div>
        )}

        {cuenta && (
          <div style={{ ...caja, color: 'var(--muted)', fontSize: 13 }}>
            El historial de mediciones (peso, cintura y más a lo largo del tiempo) estará disponible cuando tu entrenador empiece a registrarlas.
          </div>
        )}
      </div>
    </div>
  );
}
