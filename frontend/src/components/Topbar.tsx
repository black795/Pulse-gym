import { useEffect, useRef, useState } from 'react';
import { IconBell, IconChevronDown, IconSearch, IconX } from './Icons';
import { useAuth } from '../features/auth/AuthContext';
import { ROLES_UI, primerNombre } from '../features/auth/permisos';

export default function Topbar() {
  const { usuario, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera o al presionar Escape.
  useEffect(() => {
    if (!menuAbierto) return;
    const alClic = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [menuAbierto]);

  if (!usuario) return null;
  const nombre = primerNombre(usuario);

  return (
    <header style={{
      height: 60, background: 'var(--sidebar)', borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', paddingInline: 24, gap: 16, position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ flex: 1, maxWidth: 400, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <IconSearch style={{ position: 'absolute', left: 12, color: '#4d7a5e', width: 16, height: 16 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar clientes, rutinas..."
          aria-label="Buscar"
          style={{
            width: '100%', height: 36, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, paddingLeft: 36, paddingRight: 12, color: '#b3c8bb', fontSize: 13.5,
            fontFamily: 'var(--font-manrope)', outline: 'none',
          }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button aria-label="Notificaciones" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#8fad99', padding: 4, display: 'flex' }}>
          <IconBell style={{ width: 20, height: 20 }} />
          <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '1.5px solid var(--sidebar)' }} />
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuAbierto(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--neon)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: 'var(--sidebar)',
            }}>
              {nombre.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#b3c8bb', fontSize: 13.5, fontFamily: 'var(--font-sora)', fontWeight: 600 }}>{nombre}</span>
            <IconChevronDown style={{ color: '#4d7a5e', width: 15, height: 15, transform: menuAbierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
          </button>

          {menuAbierto && (
            <div role="menu" style={{
              position: 'absolute', right: 0, top: 46, width: 240, background: 'var(--surface)', borderRadius: 12,
              border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(10,18,13,0.18)', overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{usuario.nombre}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.email}</div>
                <span style={{
                  display: 'inline-block', marginTop: 8, padding: '2px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                  background: ROLES_UI[usuario.rol].fondo,
                  color: usuario.rol === 'administrador' ? 'var(--neon)' : ROLES_UI[usuario.rol].color,
                }}>
                  {ROLES_UI[usuario.rol].etiqueta}
                </span>
              </div>
              <button role="menuitem" onClick={logout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--danger)', fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 13.5,
              }}>
                <IconX style={{ width: 16, height: 16 }} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
