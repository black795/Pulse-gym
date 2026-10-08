import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { clients } from '../../data/mock';
import Avatar from '../../components/Avatar';
import { IconCamera, IconAlertTriangle } from '../../components/Icons';
import { fechaLegible } from '../../features/clientes/clientesApi';
import { ETIQUETA_ESTADO } from '../../features/membresias/membresiasApi';
import { imc, useMiCuenta } from '../../features/miCuenta/miCuentaApi';

const fotoDeEjemplo = clients[0].photo; // solo para la cuenta de demostración de Daniela

export default function MobileProfile() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { cuenta, cargando, error } = useMiCuenta();

  const ficha = cuenta?.ficha ?? null;
  const membresia = cuenta?.membresia ?? null;
  const plan = membresia ? `Plan ${membresia.plan}` : 'Sin plan activo';
  const resumen = cargando && !cuenta ? ' ' : [plan, ficha?.objetivo].filter(Boolean).join(' · ');

  const datos = ficha ? [
    { label: 'Carnet', value: ficha.carnet },
    { label: 'Peso actual', value: `${ficha.peso_kg} kg` },
    { label: 'Altura', value: `${ficha.altura_cm} cm` },
    { label: 'IMC', value: imc(ficha).toFixed(1) },
    { label: 'Objetivo', value: ficha.objetivo ?? 'Sin definir' },
    { label: 'Plan', value: membresia ? `${membresia.plan} · ${ETIQUETA_ESTADO[membresia.estado]}` : 'Sin plan activo' },
    ...(membresia ? [{ label: membresia.dias_restantes >= 0 ? 'Vence el' : 'Venció el', value: fechaLegible(membresia.fecha_vencimiento) }] : []),
  ] : [];

  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      <div style={{
        background: 'var(--sidebar)', padding: '52px 16px 30px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <Avatar name={usuario?.nombre ?? ''} photo={usuario?.email === 'daniela@pulsegym.com' ? fotoDeEjemplo : null} size={80} />
        <div style={{ maxWidth: '100%' }}>
          <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontWeight: 800, fontSize: 20, textAlign: 'center', overflowWrap: 'anywhere' }}>{usuario?.nombre}</div>
          <div style={{ color: '#8fad99', fontSize: 12.5, textAlign: 'center', marginTop: 2, overflowWrap: 'anywhere' }}>{usuario?.email}</div>
          <div style={{ color: '#4d7a5e', fontSize: 13, textAlign: 'center', marginTop: 4 }}>{resumen}</div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && !cuenta && (
          <div role="alert" style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>
            No se pudieron cargar tus datos. {error}
          </div>
        )}

        {cuenta?.lesiones_activas.map(lesion => (
          <div key={lesion.id} style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
            <IconAlertTriangle style={{ color: 'var(--danger)', width: 18, height: 18, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--danger)', overflowWrap: 'anywhere' }}>
                {lesion.tipo === 'lesion' ? 'Lesión activa' : 'Limitación activa'} — {lesion.nombre}
              </div>
              <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>Registrada por tu entrenador. Avísale si mejora o empeora.</div>
            </div>
          </div>
        ))}

        <button onClick={() => navigate('/mobile/camera')} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--sidebar)', border: '1px solid rgba(182,255,69,0.2)', borderRadius: 12, padding: '14px 16px',
          cursor: 'pointer', width: '100%', textAlign: 'left',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(182,255,69,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCamera style={{ color: 'var(--neon)', width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: '#fff' }}>Agregar máquina</div>
            <div style={{ color: '#4d7a5e', fontSize: 12, marginTop: 1 }}>Capturar y clasificar con IA</div>
          </div>
        </button>

        {ficha ? (
          <div style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
            {datos.map((item, i, arr) => (
              <div key={item.label} style={{
                padding: '13px 16px', display: 'flex', justifyContent: 'space-between', gap: 12,
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', textAlign: 'right', overflowWrap: 'anywhere' }}>{item.value}</span>
              </div>
            ))}
          </div>
        ) : cuenta && (
          <div role="status" style={{ background: 'var(--warning-tint)', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13.5, color: 'var(--warning)' }}>Tu ficha aún no está registrada</div>
            <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 2 }}>
              Peso, altura, objetivo y plan aparecerán aquí cuando recepción registre tu ficha con el correo de esta cuenta.
            </div>
          </div>
        )}

        <button onClick={logout} style={{
          height: 44, background: 'var(--danger-tint)', color: 'var(--danger)', border: '1px solid #fecaca',
          borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
