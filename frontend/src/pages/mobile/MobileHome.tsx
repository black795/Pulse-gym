import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { primerNombre } from '../../features/auth/permisos';
import { clients } from '../../data/mock';
import { IconZap } from '../../components/Icons';
import Avatar from '../../components/Avatar';
import { fechaLegible } from '../../features/clientes/clientesApi';
import { aFecha, fechaCorta, imc, useMiCuenta } from '../../features/miCuenta/miCuentaApi';

const fotoDeEjemplo = clients[0].photo; // solo para la cuenta de demostración de Daniela
const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const tarjeta = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' } as const;

export default function MobileHome() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { cuenta, cargando, error, recargar } = useMiCuenta();

  const ficha = cuenta?.ficha ?? null;
  const membresia = cuenta?.membresia ?? null;
  const lesion = cuenta?.lesiones_activas[0] ?? null;
  const color = membresia?.estado === 'vencida' ? 'var(--danger)' : membresia?.estado === 'por_vencer' ? 'var(--warning)' : 'var(--primary)';
  const mes = cuenta ? new Intl.DateTimeFormat('es-BO', { month: 'long' }).format(aFecha(cuenta.hoy)) : '';

  const stats = [
    { label: 'Peso', value: ficha ? `${ficha.peso_kg} kg` : '—', sub: ficha ? `IMC ${imc(ficha).toFixed(1)}` : 'Sin ficha' },
    { label: 'Racha', value: cuenta ? `${cuenta.racha_dias} ${cuenta.racha_dias === 1 ? 'día' : 'días'}` : '—', sub: cuenta && cuenta.racha_dias > 0 ? '🔥' : 'Ven hoy' },
    { label: 'Este mes', value: cuenta ? `${cuenta.asistencias_mes} ses.` : '—', sub: mes.charAt(0).toUpperCase() + mes.slice(1) },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'var(--sidebar)',
        padding: '52px 20px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#4d7a5e', fontSize: 13, fontWeight: 500 }}>{cuenta ? fechaCorta(cuenta.hoy) : ' '}</div>
          <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontSize: 22, fontWeight: 800, marginTop: 2, overflowWrap: 'anywhere' }}>
            Hola, {primerNombre(usuario)} 👋
          </div>
        </div>
        <Avatar name={usuario?.nombre ?? ''} photo={usuario?.email === 'daniela@pulsegym.com' ? fotoDeEjemplo : null} size={42} />
      </div>

      <div style={{ padding: '20px 16px' }}>
        {error && !cuenta && (
          <div role="alert" style={{ background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>
            No se pudieron cargar tus datos. {error}{' '}
            <button onClick={recargar} style={{ background: 'none', border: 'none', color: 'var(--danger)', textDecoration: 'underline', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Reintentar</button>
          </div>
        )}

        {cuenta && !ficha && (
          <div role="status" style={{ background: 'var(--warning-tint)', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13.5, color: 'var(--warning)' }}>Tu ficha aún no está registrada</div>
            <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 2 }}>Acércate a recepción con tu carnet para completarla. Usa el mismo correo de esta cuenta.</div>
          </div>
        )}

        {/* Routine card: el módulo de rutinas aún no está conectado */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <div style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop&auto=format)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            height: 140, position: 'relative',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,18,13,0.85))' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
              <div style={{ color: 'var(--neon)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>TU RUTINA</div>
              <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontSize: 17, fontWeight: 800, marginTop: 2 }}>
                Aún no tienes una rutina asignada
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--sidebar)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#8fad99' }}>Tu entrenador la preparará pronto</div>
            <button onClick={() => navigate('/mobile/workout')} style={{
              background: 'var(--neon)', color: 'var(--sidebar)', border: 'none', flexShrink: 0,
              borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
              Ver ejemplo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--bg)', borderRadius: 12, padding: '14px 8px',
              border: '1px solid var(--border)', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{cargando && !cuenta ? '…' : s.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Membresía: días restantes */}
        {membresia ? (
          <div role="status" style={{
            background: 'var(--bg)', borderRadius: 14, padding: '14px 16px', marginBottom: 20,
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700 }}>MEMBRESÍA {membresia.plan.toUpperCase()}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                {membresia.dias_restantes >= 0 ? 'Vence el' : 'Venció el'} {fechaLegible(membresia.fecha_vencimiento)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {membresia.dias_restantes >= 0 ? (
                <>
                  <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, color, lineHeight: 1 }}>{membresia.dias_restantes}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{membresia.dias_restantes === 1 ? 'día restante' : 'días restantes'}</div>
                </>
              ) : (
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color }}>Membresía vencida</div>
              )}
            </div>
          </div>
        ) : cuenta && ficha && (
          <div role="status" style={{ background: 'var(--bg)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700 }}>MEMBRESÍA</div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>Todavía no tienes un plan activo</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Elige y paga tu plan en recepción.</div>
          </div>
        )}

        {/* AI trainer card */}
        <button onClick={() => navigate('/mobile/ai')} style={{
          background: 'var(--sidebar)', borderRadius: 14, padding: '16px 18px', width: '100%', textAlign: 'left',
          marginBottom: 20, cursor: 'pointer',
          border: '1px solid rgba(182,255,69,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: 'var(--neon)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconZap style={{ color: 'var(--sidebar)', width: 20, height: 20 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-sora)', color: '#fff', fontWeight: 800, fontSize: 14 }}>Entrenador IA</div>
              <div style={{ color: '#4d7a5e', fontSize: 12, marginTop: 1, overflowWrap: 'anywhere' }}>
                {lesion ? `Tiene en cuenta tu ${lesion.tipo === 'lesion' ? 'lesión' : 'limitación'}: ${lesion.nombre}` : 'Resuelve tus dudas de entrenamiento'}
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--neon)', fontSize: 20 }}>›</div>
        </button>

        {/* Week progress */}
        <div style={tarjeta}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>Esta semana</div>
            {cuenta && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {cuenta.ultima_asistencia ? `Última visita: ${fechaLegible(cuenta.ultima_asistencia)}` : 'Aún sin visitas'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {(cuenta?.semana ?? INICIALES.map(() => null)).map((dia, i) => {
              const asistio = dia?.asistio ?? false;
              const esHoy = !!dia && dia.fecha === cuenta?.hoy;
              return (
                <div key={INICIALES[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    aria-label={dia ? `${fechaCorta(dia.fecha)}: ${asistio ? 'asististe' : esHoy ? 'hoy, aún sin entrada' : 'sin entrada'}` : undefined}
                    style={{
                      width: '100%', maxWidth: 36, aspectRatio: '1', borderRadius: '50%',
                      background: asistio ? 'var(--primary)' : esHoy ? 'var(--primary-tint)' : 'var(--bg)',
                      border: `1.5px solid ${asistio || esHoy ? 'var(--primary)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      color: asistio ? '#fff' : esHoy ? 'var(--primary)' : 'var(--muted-2)',
                    }}
                  >
                    {asistio ? '✓' : INICIALES[i]}
                  </div>
                  <div style={{ fontSize: 10, color: esHoy ? 'var(--primary)' : 'var(--muted-2)', fontWeight: 700 }}>{esHoy ? 'HOY' : INICIALES[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
