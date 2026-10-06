interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'muted';
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  const styles = {
    success: { background: 'var(--primary-tint)', color: 'var(--primary-dark)', border: '1px solid #bbf7d0' },
    warning: { background: 'var(--warning-tint)', color: 'var(--warning)', border: '1px solid #fde68a' },
    danger: { background: 'var(--danger-tint)', color: 'var(--danger)', border: '1px solid #fecaca' },
    muted: { background: '#F1F5F2', color: 'var(--muted)', border: '1px solid var(--border)' },
  };
  return (
    <span
      style={{
        ...styles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'var(--font-manrope)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge variant="success">Activo</Badge>;
    case 'overdue': return <Badge variant="danger">Vencido</Badge>;
    case 'warning': return <Badge variant="warning">Por vencer</Badge>;
    case 'paid': return <Badge variant="success">Pagado</Badge>;
    case 'pending': return <Badge variant="warning">Pendiente</Badge>;
    case 'available': return <Badge variant="success">Disponible</Badge>;
    case 'occupied': return <Badge variant="danger">Ocupada</Badge>;
    case 'maintenance': return <Badge variant="warning">Mantenimiento</Badge>;
    default: return <Badge variant="muted">{status}</Badge>;
  }
}
