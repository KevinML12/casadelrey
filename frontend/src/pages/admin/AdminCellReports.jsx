import { useEffect, useState } from 'react';
import { Inbox, Upload } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const loadReports = () => apiClient.get('/admin/cell-reports').then(r => r.data || []);

export default function AdminCellReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const refresh = () => {
    setLoading(true);
    loadReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleImport = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setImporting(true);
    setImportResult(null);
    try {
      const res = await apiClient.post('/admin/cell-reports/import', formData, {
        headers: { 'Content-Type': undefined }, // Axios pone multipart/form-data con boundary
      });
      setImportResult(res.data);
      toast.success(`${res.data.imported} reportes importados`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const totalAttendance = reports.reduce((s, r) => s + (r.attendance || 0), 0);
  const totalVisitors = reports.reduce((s, r) => s + (r.new_visitors || 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black text-ink">Reportes de Células</h1>

        {/* Import CSV */}
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue/10 text-blue hover:bg-blue/20 cursor-pointer transition-colors text-sm font-medium">
          <Upload size={16} />
          {importing ? 'Importando...' : 'Importar CSV'}
          <input
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {/* Resultado de importación */}
      {importResult && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-line">
          <p className="text-sm font-medium text-ink mb-1">
            ✓ {importResult.imported} importados · {importResult.skipped} omitidos
          </p>
          {importResult.errors?.length > 0 && (
            <ul className="text-xs text-ink-3 mt-2 space-y-0.5 max-h-24 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 5 && (
                <li>... y {importResult.errors.length - 5} más</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Formato esperado */}
      <details className="mb-6 p-4 rounded-xl bg-bg border border-line text-sm text-ink-2">
        <summary className="font-medium text-ink cursor-pointer">Formato CSV (Excel → Guardar como CSV)</summary>
        <p className="text-xs font-mono mt-2">líder, célula, fecha, asistencia, visitantes, notas</p>
        <p className="text-xs mt-1">También: leader_name, cell_name, meeting_date, attendance, new_visitors, notes</p>
        <p className="text-xs mt-2 text-ink-3">Puedes subir varios archivos CSV a la vez.</p>
      </details>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl">
          <Inbox size={32} className="mx-auto text-ink-3 mb-3" />
          <p className="text-ink-3 text-sm">No hay reportes aún.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-1">Total asistentes</p>
              <p className="text-3xl font-black text-ink">{totalAttendance}</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-1">Visitantes nuevos</p>
              <p className="text-3xl font-black text-ink">{totalVisitors}</p>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.ID} className="bg-card border border-line rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-semibold text-ink text-sm">{r.cell_name}</span>
                    <span className="text-ink-3 text-xs ml-2">— {r.leader_name}</span>
                  </div>
                  <span className="text-xs text-ink-3">
                    {r.meeting_date ? new Date(r.meeting_date).toLocaleDateString('es-ES') : '—'}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-ink-2">
                  <span>Asistencia: <strong>{r.attendance ?? 0}</strong></span>
                  <span>Visitantes: <strong>{r.new_visitors ?? 0}</strong></span>
                </div>
                {r.notes && (
                  <p className="text-sm text-ink-3 mt-2 bg-bg rounded-lg px-3 py-2">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
