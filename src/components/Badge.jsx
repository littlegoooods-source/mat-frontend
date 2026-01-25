function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-500/20 text-slate-300',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };

  return (
    <span className={`badge ${variants[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;
