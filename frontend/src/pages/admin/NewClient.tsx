import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { clientesApi, type DatosCliente } from '../../features/clientes/clientesApi';

const goals = ['Pérdida de grasa', 'Fuerza', 'Masa muscular', 'Acondicionamiento', 'Salud general'];

type Campo = 'nombre' | 'carnet' | 'telefono' | 'email' | 'fecha_nacimiento' | 'peso_kg' | 'altura_cm';
type Formulario = Record<Campo, string> & { objetivo: string | null };
type Errores = Partial<Record<Campo, string>>;

const VACIO: Formulario = {
  nombre: '', carnet: '', telefono: '', email: '', fecha_nacimiento: '', peso_kg: '', altura_cm: '', objetivo: null,
};

/** Mismas reglas que el backend, para avisar antes de enviar. */
function validar(f: Formulario): Errores {
  const e: Errores = {};
  if (f.nombre.trim().length < 2) e.nombre = 'Escribe el nombre completo.';
  if (f.carnet.trim().length < 4) e.carnet = 'Escribe el carnet de identidad.';
  if (!f.fecha_nacimiento) e.fecha_nacimiento = 'Indica la fecha de nacimiento.';
  else if (f.fecha_nacimiento >= new Date().toISOString().slice(0, 10)) e.fecha_nacimiento = 'Debe ser anterior a hoy.';
  const peso = Number(f.peso_kg);
  if (!f.peso_kg) e.peso_kg = 'Indica el peso.';
  else if (!(peso >= 20 && peso <= 400)) e.peso_kg = 'Entre 20 y 400 kg.';
  const altura = Number(f.altura_cm);
  if (!f.altura_cm) e.altura_cm = 'Indica la altura.';
  else if (!(altura >= 80 && altura <= 250)) e.altura_cm = 'Entre 80 y 250 cm.';
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'El correo no es válido.';
  return e;
}

function aDatos(f: Formulario): DatosCliente {
  return {
    nombre: f.nombre.trim(), carnet: f.carnet.trim(),
    telefono: f.telefono.trim() || null, email: f.email.trim() || null,
    fecha_nacimiento: f.fecha_nacimiento, peso_kg: Number(f.peso_kg), altura_cm: Number(f.altura_cm),
    objetivo: f.objetivo,
  };
}

/** Sirve para registrar un cliente nuevo y, si la ruta trae un id, para editar su ficha. */
export default function NewClient() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = id !== undefined;

  const [form, setForm] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!editando) return;
    clientesApi.obtener(Number(id))
      .then(c => setForm({
        nombre: c.nombre, carnet: c.carnet, telefono: c.telefono ?? '', email: c.email ?? '',
        fecha_nacimiento: c.fecha_nacimiento, peso_kg: String(c.peso_kg), altura_cm: String(c.altura_cm),
        objetivo: c.objetivo,
      }))
      .catch(err => setError((err as Error).message))
      .finally(() => setCargando(false));
  }, [editando, id]);

  const campo = (k: Campo) => ({
    value: form[k],
    error: errores[k],
    onChange: (valor: string) => {
      setForm(f => ({ ...f, [k]: valor }));
      setErrores(e => ({ ...e, [k]: undefined }));
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    setError(null);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    try {
      const guardado = editando ? await clientesApi.editar(Number(id), aDatos(form)) : await clientesApi.crear(aDatos(form));
      setSaved(true);
      setTimeout(() => navigate(`/admin/clients/${guardado.id}`), 1200);
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  };

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 64, height: 64, background: 'var(--primary-tint)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✓</div>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{editando ? 'Ficha actualizada' : 'Cliente registrado'}</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Abriendo la ficha del cliente...</div>
      </div>
    );
  }

  if (cargando) return <div style={{ color: 'var(--muted)', padding: 24 }}>Cargando…</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, margin: 0 }}>{editando ? 'Editar ficha' : 'Nuevo cliente'}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
          {editando ? 'Corrige o actualiza los datos del cliente' : 'Completa el formulario para registrar un nuevo miembro'}
        </p>
      </div>

      <div className="cols-form-lateral" style={{ gap: 20 }}>
        <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-tint)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Personal data */}
          <Section title="Datos personales">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
              <Field label="Nombre completo *" placeholder="Nombre y apellido" {...campo('nombre')} />
              <Field label="Carnet de identidad *" placeholder="1234567 LP" {...campo('carnet')} />
              <Field label="Teléfono" type="tel" placeholder="+591 7..." {...campo('telefono')} />
              <Field label="Correo" type="email" placeholder="correo@email.com" {...campo('email')} />
              <Field label="Fecha de nacimiento *" type="date" {...campo('fecha_nacimiento')} />
            </div>
          </Section>

          {/* Physical */}
          <Section title="Datos físicos y objetivo">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
              <Field label="Peso (kg) *" type="number" placeholder="65" {...campo('peso_kg')} />
              <Field label="Altura (cm) *" type="number" placeholder="170" {...campo('altura_cm')} />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Objetivo principal</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {goals.map(g => {
                  const elegido = form.objetivo === g;
                  return (
                    <button key={g} type="button" aria-pressed={elegido} onClick={() => setForm(f => ({ ...f, objetivo: elegido ? null : g }))} style={{
                      padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                      fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13,
                      background: elegido ? 'var(--primary)' : 'var(--bg)',
                      color: elegido ? '#fff' : 'var(--muted)',
                      border: elegido ? '1px solid var(--primary)' : '1px solid var(--border)',
                    }}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={guardando} style={{
              padding: '11px 28px', background: guardando ? 'var(--muted-2)' : 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar cliente'}
            </button>
            <button type="button" onClick={() => navigate(editando ? `/admin/clients/${id}` : '/admin')} style={{
              padding: '11px 22px', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)',
              borderRadius: 9, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Cancelar
            </button>
          </div>
        </form>

        {/* Sidebar card */}
        <div>
          <div style={{
            borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <img
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=240&fit=crop&auto=format"
              alt=""
              style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ background: 'var(--surface)', padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Antes de guardar</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                Los campos con * son obligatorios. El carnet identifica al cliente: el sistema no deja registrar dos fichas con el mismo.
              </p>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--primary-tint)', borderRadius: 8, fontSize: 12, color: 'var(--primary-dark)', fontWeight: 600 }}>
                ✓ Teléfono y correo se pueden completar después
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}

function Field({ label, value, onChange, error, type = 'text', placeholder }: FieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!!error}
        style={{
          width: '100%', height: 40, padding: '0 12px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8,
          fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink)',
          background: 'var(--surface)', outline: 'none',
        }}
      />
      {error && <span role="alert" style={{ display: 'block', color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{error}</span>}
    </label>
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
