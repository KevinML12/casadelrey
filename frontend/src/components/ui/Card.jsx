export default function Card({ children, className = '', title, ...props }) {
  return (
    <div
      className={`bg-card-bg dark:bg-dark-card-bg rounded-lg shadow-sm hover:shadow-base transition-soft border border-border-light dark:border-dark-border p-6 ${className}`}
      {...props}
    >
      {title && <CardHeader>{title}</CardHeader>}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 pb-4 border-b border-border-light dark:border-dark-border text-primary font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-border-light dark:border-dark-border flex gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}