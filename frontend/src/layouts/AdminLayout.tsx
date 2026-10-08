import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminLayout() {
  const { pathname } = useLocation();
  // En pantallas angostas el menú lateral es un cajón que se abre con el botón de la barra superior.
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => { setMenuAbierto(false); }, [pathname]); // al navegar, el cajón se cierra

  useEffect(() => {
    if (!menuAbierto) return;
    const alTecla = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, [menuAbierto]);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>
      <Sidebar abierto={menuAbierto} alCerrar={() => setMenuAbierto(false)} />
      {menuAbierto && <div className="admin-velo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar menuLateralAbierto={menuAbierto} alAbrirMenu={() => setMenuAbierto(true)} />
        <main className="admin-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
