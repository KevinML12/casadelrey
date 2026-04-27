/**
 * M3 Chip — https://m3.material.io/components/chips
 *
 * variant: 'assist' | 'filter' | 'input' | 'suggestion'
 * color:   'default' | 'primary' | 'secondary'
 */

const colors = {
  default:   'bg-transparent text-on-surf-var border border-outline-var',
  primary:   'bg-pri-con text-on-pri-con border-transparent',
  secondary: 'bg-sec-con text-on-sec-con border-transparent',
};

export default function Chip({ color = 'default', icon, children, className = '', ...props }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm border ' +
        'text-label-m font-semibold tracking-widest uppercase whitespace-nowrap ' +
        `${colors[color]} ${className}`
      }
      {...props}
    >
      {icon && <span className="ms" style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </span>
  );
}
