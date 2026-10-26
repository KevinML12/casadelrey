import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';

// Fetch with Authorization, then display a browser-local URL. Neither JWTs
// nor storage credentials appear in image URLs or links.
export default function ReceiptFile({ receipt, thumbnail = false, onClick }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const id = receipt.ID ?? receipt.id;
  useEffect(() => {
    let cancelled = false;
    let objectURL;
    const controller = new AbortController();
    setFile(null);
    setError(null);
    apiClient.get(`/admin/receipts/${id}/file`, { responseType: 'blob', signal: controller.signal })
      .then(({ data }) => {
        if (cancelled) return;
        objectURL = URL.createObjectURL(data);
        setFile({ url: objectURL, type: data.type });
      })
      .catch(err => { if (!cancelled) setError(err.response?.status === 409 ? 'migration' : 'unavailable'); });
    return () => {
      cancelled = true;
      controller.abort();
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [id, retry]);

  if (error === 'migration') return <span className="text-12 text-bg/70">Comprobante pendiente de migración.</span>;
  if (error) return (
    <button type="button" onClick={() => setRetry(n => n + 1)} className="text-12 text-bg/70">
      Archivo no disponible. Reintentar
    </button>
  );
  if (!file) return <span className="text-12 text-bg/50" role="status">Cargando comprobante…</span>;
  const image = file.type.startsWith('image/');
  if (thumbnail) return (
    <button type="button" onClick={onClick} aria-label={`Ver comprobante de ${receipt.payer_name}`} className="shrink-0">
      {image ? <img src={file.url} alt="comprobante" className="w-14 h-14 rounded-xl object-cover border border-bg/10" />
        : <span className="text-13 text-bg font-semibold">PDF</span>}
    </button>
  );
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-14 text-bg font-semibold">
      {image ? <img src={file.url} alt="comprobante" className="w-full max-h-64 object-contain rounded-xl border border-bg/10" />
        : 'Abrir comprobante PDF'}
    </a>
  );
}
