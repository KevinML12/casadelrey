import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CellReportForm from './CellReportForm';
import Button from '../ui/Button';

const loadReports = () => apiClient.get('/admin/cell-reports').then(r => r.data || []);
const loadStats   = () => apiClient.get('/admin/cell-reports/stats').then(r => r.data).catch(() => null);

const emptyRow = () => ({ leader_name: '', cell_name: '', meeting_date: '', attendance: 0, new_visitors: 0, notes: '' });

const inputCls = 'px-2 py-1 rounded-md border border-outline-var bg-transparent text-body-s text-on-surf';

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function CellReportsPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';
  const [reports,     setReports]     = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [importing,   setImporting]   = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [manualRows,  setManualRows]  = useState([emptyRow()]);
  const [sendingBulk, setSendingBulk] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([loadReports(), loadStats()])
      .then(([reps, st]) => { setReports(reps || []); setStats(st); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleImport = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    setImporting(true);
    setImportResult(null);
    try {
      const res = await apiClient.post('/admin/cell-reports/import', formData, { headers: { 'Content-Type': undefined } });
      setImportResult(res.data);
      toast.success(`${res.data.imported} reportes importados`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar');
    } finally { setImporting(false); e.target.value = ''; }
  };

  const addRow    = () => setManualRows(r => [...r, emptyRow()]);
  const removeRow = (i) => setManualRows(r => r.filter((_, j) => j !== i));
  const updateRow = (i, field, val) => {
    setManualRows(r => r.map((row, j) => j === i ? { ...row, [field]: val } : row));
  };

  const handleBulkSubmit = async () => {
    const leaderName = user?.role === 'leader' ? (user?.name || '') : '';
    const rows = manualRows
      .map(r => ({
        leader_name: user?.role === 'leader' ? leaderName : (r.leader_name || '').trim(),
        cell_name: (r.cell_name || '').trim(),
        meeting_date: (r.meeting_date || '').trim(),
        attendance: parseInt(r.attendance, 10) || 0,
        new_visitors: parseInt(r.new_visitors, 10) || 0,
        notes: (r.notes || '').trim(),
      }))
      .filter(r => r.cell_name && r.meeting_date);

    if (rows.length === 0) { toast.error('Agrega al menos una fila con célula y fecha'); return; }
    setSendingBulk(true);
    try {
      const res = await apiClient.post('/admin/cell-reports/bulk', { reports: rows });
      toast.success(`${res.data?.created ?? rows.length} reportes guardados`);
      setManualRows([emptyRow()]);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSendingBulk(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-headline-s text-on-surf font-black mb-6">Reportes de Células</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-surf-low border border-outline-var">
          <h3 className="text-title-s text-on-surf font-semibold mb-2 flex items-center gap-2">
            <span className="ms text-pri" style={{ fontSize: 20 }}>upload_file</span>
            Importar CSV
          </h3>
          <p className="text-body-s text-on-surf-var mb-4">Sube un archivo CSV con líder, célula, fecha, asistencia, visitantes.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-pri-con text-on-pri-con hover:opacity-80 cursor-pointer transition-opacity text-label-m font-medium">
            <span className="ms" style={{ fontSize: 16 }}>upload</span>
            {importing ? 'Importando...' : 'Elegir archivo'}
            <input type="file" accept=".csv" multiple className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>

        <div className="p-6 rounded-xl bg-surf-low border border-outline-var">
          <h3 className="text-title-s text-on-surf font-semibold mb-2 flex items-center gap-2">
            <span className="ms text-pri" style={{ fontSize: 20 }}>add_circle</span>
            Entrada manual
          </h3>
          <p className="text-body-s text-on-surf-var mb-4">Agrega filas o usa el formulario. Mismo formato que el CSV.</p>
          <button onClick={() => setShowForm(true)} className="text-label-m font-medium text-pri hover:underline">
            + Formulario de un reporte
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-6 p-4 rounded-xl bg-ter-con border border-outline-var">
          <p className="text-body-s text-on-ter-con font-medium">
            ✓ {importResult.imported} importados · {importResult.skipped} omitidos
          </p>
          {importResult.errors?.length > 0 && (
            <ul className="text-label-s text-on-surf-var mt-2 space-y-0.5 max-h-20 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 rounded-xl bg-surf-low border border-outline-var">
          <CellReportForm onSuccess={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {/* Bulk input table */}
      <div className="mb-8 p-6 rounded-xl bg-surf-low border border-outline-var">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-s text-on-surf font-semibold">Cargar varios a la vez</h3>
          <div className="flex gap-2">
            <button onClick={addRow}
              className="text-label-m px-3 py-1.5 rounded-lg bg-surf border border-outline-var hover:border-pri/30 text-on-surf-var transition-colors">
              + Fila
            </button>
            <button onClick={handleBulkSubmit} disabled={sendingBulk}
              className="text-label-m px-4 py-1.5 rounded-lg bg-pri text-on-pri hover:opacity-90 disabled:opacity-50 transition-opacity">
              {sendingBulk ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-s">
            <thead>
              <tr className="border-b border-outline-var text-left text-label-s text-on-surf-var uppercase">
                <th className="py-2 pr-2">Líder</th>
                <th className="py-2 pr-2">Célula</th>
                <th className="py-2 pr-2">Fecha</th>
                <th className="py-2 pr-2">Asist.</th>
                <th className="py-2 pr-2">Visit.</th>
                <th className="py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {manualRows.map((row, i) => (
                <tr key={i} className="border-b border-outline-var last:border-0">
                  <td className="py-2 pr-2">
                    <input
                      value={user?.role === 'leader' ? user?.name : row.leader_name}
                      readOnly={user?.role === 'leader'}
                      onChange={e => updateRow(i, 'leader_name', e.target.value)}
                      className={`${inputCls} w-full max-w-[120px]`} placeholder="Líder"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input value={row.cell_name} onChange={e => updateRow(i, 'cell_name', e.target.value)}
                      className={`${inputCls} w-full max-w-[120px]`} placeholder="Célula" />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="date" value={row.meeting_date} onChange={e => updateRow(i, 'meeting_date', e.target.value)}
                      className={inputCls} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min="0" value={row.attendance} onChange={e => updateRow(i, 'attendance', e.target.value)}
                      className={`${inputCls} w-16`} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min="0" value={row.new_visitors} onChange={e => updateRow(i, 'new_visitors', e.target.value)}
                      className={`${inputCls} w-16`} />
                  </td>
                  <td className="py-2">
                    <button onClick={() => removeRow(i)}
                      className="text-on-surf-var hover:text-err p-1 transition-colors">
                      <span className="ms" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats & reports */}
      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="text-center py-16 bg-surf-low border border-outline-var rounded-xl">
          <div className="leading-icon mx-auto mb-3">
            <span className="ms" style={{ fontSize: 26 }}>inbox</span>
          </div>
          <p className="text-body-s text-on-surf-var">No hay reportes aún.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Reportes',   value: stats?.total_reports ?? reports.length, icon: 'article' },
              { label: 'Asistentes', value: stats?.total_attendance ?? 0,           icon: 'person' },
              { label: 'Visitantes', value: stats?.total_visitors ?? 0,             icon: 'person_add' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-surf-low border border-outline-var rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="ms text-pri" style={{ fontSize: 18 }}>{icon}</span>
                  <span className="text-label-s text-on-surf-var uppercase tracking-widest">{label}</span>
                </div>
                <p className="text-headline-s text-on-surf font-black">{value}</p>
              </div>
            ))}
          </div>

          {stats?.by_cell?.length > 0 && (
            <div className="mb-8 p-5 rounded-xl bg-surf-low border border-outline-var">
              <h3 className="text-title-s text-on-surf font-semibold mb-4 flex items-center gap-2">
                <span className="ms text-pri" style={{ fontSize: 18 }}>bar_chart</span>
                Por célula
              </h3>
              <div className="space-y-2">
                {stats.by_cell.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-outline-var last:border-0">
                    <span className="text-body-s text-on-surf font-medium">{c.cell_name}</span>
                    <span className="text-body-s text-on-surf-var">
                      {c.reports} reportes · {c.attendance} asistentes · {c.visitors} visitantes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.ID} className="bg-surf-low border border-outline-var rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-title-s text-on-surf font-semibold">{r.cell_name}</span>
                    {isAdmin && <span className="text-body-s text-on-surf-var ml-2">— {r.leader_name}</span>}
                  </div>
                  <span className="text-label-s text-on-surf-var">
                    {r.meeting_date ? new Date(r.meeting_date).toLocaleDateString('es-ES') : '—'}
                  </span>
                </div>
                <p className="text-body-s text-on-surf-var">
                  Asistencia: <strong className="text-on-surf">{r.attendance ?? 0}</strong>
                  {' · '}
                  Visitantes: <strong className="text-on-surf">{r.new_visitors ?? 0}</strong>
                </p>
                {r.notes && (
                  <p className="text-body-s text-on-surf-var mt-2 bg-surf rounded-lg px-3 py-2">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
