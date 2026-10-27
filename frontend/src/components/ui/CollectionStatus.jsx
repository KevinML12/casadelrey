export default function CollectionStatus({ loading, label, onRetry }) {
  return (
    <div className="liquid-glass rounded-[22px] px-7 py-10 md:px-10 md:py-14 my-6" role={loading ? 'status' : 'alert'} aria-live="polite">
      <p className="text-20 md:text-24 font-bold text-white">
        {loading ? `Cargando ${label}…` : `No pudimos cargar ${label}.`}
      </p>
      <p className="mt-3 text-15 text-white/75 max-w-lg leading-relaxed">
        {loading ? 'En un momento aparecerá el contenido. Puedes seguir recorriendo el sitio.' : 'Inténtalo de nuevo en un momento.'}
      </p>
      {loading ? (
        <div aria-hidden="true" className="mt-7 w-20 h-px bg-white/50 animate-pulse" />
      ) : (
        <button type="button" onClick={onRetry} className="mt-7 rounded-pill bg-white text-bg px-6 py-3 text-14 font-bold focus-ring btn-spring">
          Reintentar
        </button>
      )}
    </div>
  );
}
