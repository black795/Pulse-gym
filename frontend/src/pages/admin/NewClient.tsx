import { useState } from 'react';
import { useNavigate } from 'react-router';

const goals = ['Pérdida de grasa', 'Fuerza', 'Masa muscular', 'Acondicionamiento', 'Salud general'];
const plans = ['Mensual — Bs 150', 'Trimestral — Bs 400', 'Semestral — Bs 700'];

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{label}</label>
      <input type={type} placeholder={placeholder} style={{
        width: '100%', height: 40, padding: '0 12px',
        border: '1px solid var(--border)', borderRadius: 8,
        fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink)',
        background: 'var(--surface)', outline: 'none',
      }} />
    </div>
  );
}

export default function NewClient() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState('Fuerza');
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate('/admin'), 1800);
  };

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 64, height: 64, background: 'var(--primary-tint)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✓</div>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>Cliente registrado</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Redirigiendo a la lista de clientes...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>Nuevo cliente</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Completa el formulario para registrar un nuevo miembro</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Personal data */}
          <Section title="Datos personales">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Nombre" placeholder="Nombre" />
              <Field label="Apellido" placeholder="Apellido" />
              <Field label="Teléfono" type="tel" placeholder="+591 7..." />
              <Field label="Correo" type="email" placeholder="correo@email.com" />
              <Field label="Fecha de nacimiento" type="date" />
              <Field label="Ciudad" placeholder="La Paz" />
            </div>
          </Section>

          {/* Physical */}
          <Section title="Datos físicos y objetivo">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="Peso (kg)" type="number" placeholder="65" />
              <Field label="Altura (cm)" type="number" placeholder="170" />
              <Field label="Lesiones / limitaciones" placeholder="Ninguna" />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Objetivo principal</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {goals.map(g => (
                  <button key={g} onClick={() => setSelectedGoal(g)} style={{
                    padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13,
                    background: selectedGoal === g ? 'var(--primary)' : 'var(--bg)',
                    color: selectedGoal === g ? '#fff' : 'var(--muted)',
                    border: selectedGoal === g ? 'none' : '1px solid var(--border)',
                  }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Plan */}
          <Section title="Plan y membresía">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {plans.map((p, i) => (
                <button key={p} onClick={() => setSelectedPlan(i)} style={{
                  flex: 1, minWidth: 150, padding: '14px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: selectedPlan === i ? 'var(--primary-tint)' : 'var(--bg)',
                  border: `2px solid ${selectedPlan === i ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{p}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <Field label="Fecha de inicio" type="date" />
              <Field label="Método de pago" />
            </div>
          </Section>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} style={{
              padding: '11px 28px', background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Guardar cliente
            </button>
            <button onClick={() => navigate('/admin')} style={{
              padding: '11px 22px', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)',
              borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Sidebar card */}
        <div>
          <div style={{
            borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <img
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=240&fit=crop&auto=format"
              alt="Nutrición"
              style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ background: 'var(--surface)', padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Rutina automática</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Al guardar este cliente, el sistema puede generar automáticamente una rutina personalizada según su objetivo, condición física y lesiones registradas.
              </p>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--primary-tint)', borderRadius: 8, fontSize: 12, color: 'var(--primary-dark)', fontWeight: 600 }}>
                ✓ El Entrenador IA ajustará la rutina si detecta lesiones activas
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, marginBottom: 16, color: 'var(--ink)' }}>{title}</div>
      {children}
    </div>
  );
}
