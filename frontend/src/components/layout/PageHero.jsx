export default function PageHero({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-navy py-20 relative overflow-hidden">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-10 container mx-auto px-4 text-center">
        {Icon && (
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Icon size={22} className="text-white" />
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
