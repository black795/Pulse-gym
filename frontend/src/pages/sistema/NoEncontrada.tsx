import { Link } from 'react-router';

export default function NoEncontrada() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar)', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 72, color: 'var(--neon)', lineHeight: 1 }}>404</div>
        <p style={{ color: '#8fad99', fontSize: 15, margin: '12px 0 24px' }}>Esta página no existe.</p>
        <Link to="/" style={{ color: 'var(--sidebar)', background: 'var(--neon)', padding: '11px 20px', borderRadius: 10, fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
