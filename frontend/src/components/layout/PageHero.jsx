export default function PageHero({ icon, title, subtitle, children }) {
  return (
    <div className="hero-surf py-20 relative overflow-hidden">
      <div className="hero-grid" />
      <div className="absolute pointer-events-none" style={{
        right: -150, top: -150, width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(21,101,192,.2) 0%, transparent 65%)',
      }} />
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
        {icon && (
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
            <span className="ms text-white" style={{ fontSize: 22 }}>{icon}</span>
          </div>
        )}
        <h1 className="text-display-s text-white mb-3 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-body-l max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,.6)' }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
