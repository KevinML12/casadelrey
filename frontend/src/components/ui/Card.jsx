export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-card border border-line rounded-xl shadow-card p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`pb-4 mb-4 border-b border-line ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={className} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`pt-4 mt-4 border-t border-line flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
