import Button from './Button';

export default function AdminResourceState({ loading, error, onRetry, empty }) {
  return <div className="glass-light rounded-[16px] p-6 sm:p-8" role={error ? 'alert' : 'status'}>
    <p className="text-15 font-semibold text-bg">{loading ? 'Cargando…' : error || empty}</p>
    {error && onRetry && <Button type="button" variant="outlined" className="mt-4" onClick={onRetry}>Reintentar</Button>}
  </div>;
}
