import { useEffect, useState } from 'react';
import { Inbox, Upload, BarChart3, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CellReportForm from '../../components/sections/CellReportForm';

const loadReports = () => apiClient.get('/admin/cell-reports').then(r => r.data || []);
const loadStats = () => apiClient.get('/admin/cell-reports/stats').then(r => r.data).catch(() => null);

const emptyRow = () => ({ leader_name: '', cell_name: '', meeting_date: '', attendance: 0, new_visitors: 0, notes: '' });

export default function LeaderReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [manualRows, setManualRows] = useState([emptyRow()]);
  const [sendingBulk, setSendingBulk] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([loadReports(), loadStats()])
      .then(([reps, st]) => {
        setReports(reps || []);
        setStats(st);
      })
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
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const addRow = () => setManualRows(r => [...r, emptyRow()]);
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

    if (rows.length === 0) {
      toast.error('Agrega al menos una fila con célula y fecha');
      return;
    }

    setSendingBulk(true);
    try {
      const res = await apiClient.post('/admin/cell-reports/bulk', { reports: rows });
      toast.success(`${res.data?.created ?? rows.length} reportes guardados`);
      setManualRows([emptyRow()]);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-6">Reportes de Células</h1>

      {/* Import CSV + Manual */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-card border border-line">
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <Upload size={18} /> Importar CSV
          </h3>
          <p className="text-sm text-ink-3 mb-4">Sube un archivo CSV con líder, célula, fecha, asistencia, visitantes.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue/10 text-blue hover:bg-blue/20 cursor-pointer transition-colors text-sm font-medium">
            <Upload size={16} />
            {importing ? 'Importando...' : 'Elegir archivo'}
            <input type="file" accept=".csv" multiple className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-line">
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <Plus size={18} /> Entrada manual
          </h3>
          <p className="text-sm text-ink-3 mb-4">Agrega filas y envía como lote. Mismo formato que el CSV.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-blue hover:text-blue-d"
          >
            + Formulario de un reporte
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-line">
          <p className="text-sm font-medium text-ink">✓ {importResult.imported} importados · {importResult.skipped} omitidos</p>
          {importResult.errors?.length > 0 && (
            <ul className="text-xs text-ink-3 mt-2 space-y-0.5 max-h-20 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-card border border-line">
          <CellReportForm onSuccess={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {/* Tabla manual */}
      <div className="mb-8 p-6 rounded-2xl bg-card border border-line">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink">Cargar varios a la vez</h3>
          <div className="flex gap-2">
            <button onClick={addRow} className="text-sm px-3 py-1.5 rounded-lg bg-bg border border-line hover:border-blue/30 text-ink-2">
              + Fila
            </button>
            <button
              onClick={handleBulkSubmit}
              disabled={sendingBulk}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue text-white hover:bg-blue-d disabled:opacity-50"
            >
              {sendingBulk ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-3 uppercase">
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
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2">
                    <input
                      value={user?.role === 'leader' ? user?.name : row.leader_name}
                      readOnly={user?.role === 'leader'}
                      onChange={e => updateRow(i, 'leader_name', e.target.value)}
                      className="w-full max-w-[120px] px-2 py-1 rounded border border-line bg-transparent text-ink text-xs"
                      placeholder="Líder"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={row.cell_name}
                      onChange={e => updateRow(i, 'cell_name', e.target.value)}
                      className="w-full max-w-[120px] px-2 py-1 rounded border border-line bg-transparent text-ink text-xs"
                      placeholder="Célula"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="date"
                      value={row.meeting_date}
                      onChange={e => updateRow(i, 'meeting_date', e.target.value)}
                      className="px-2 py-1 rounded border border-line bg-transparent text-ink text-xs"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      value={row.attendance}
                      onChange={e => updateRow(i, 'attendance', e.target.value)}
                      className="w-16 px-2 py-1 rounded border border-line bg-transparent text-ink text-xs"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      value={row.new_visitors}
                      onChange={e => updateRow(i, 'new_visitors', e.target.value)}
                      className="w-16 px-2 py-1 rounded border border-line bg-transparent text-ink text-xs"
                    />
                  </td>
                  <td className="py-2">
                    <button onClick={() => removeRow(i)} className="text-ink-3 hover:text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="mb-6 p-4 rounded-xl bg-bg border border-line text-sm text-ink-2">
        <summary className="font-medium text-ink cursor-pointer">Formato CSV</summary>
        <p className="text-xs mt-2">Columnas: líder, célula, fecha, asistencia, visitantes, notas. Soporta comas, punto y coma o tabulador.</p>
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
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase mb-1">Reportes</p>
              <p className="text-2xl font-black text-ink">{stats?.total_reports ?? reports.length}</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase mb-1">Asistentes</p>
              <p className="text-2xl font-black text-ink">{stats?.total_attendance ?? 0}</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase mb-1">Visitantes</p>
              <p className="text-2xl font-black text-ink">{stats?.total_visitors ?? 0}</p>
            </div>
          </div>

          {stats?.by_cell?.length > 0 && (
            <div className="mb-8 p-5 rounded-xl bg-card border border-line">
              <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><BarChart3 size={18} /> Por célula</h3>
              <div className="space-y-2">
                {stats.by_cell.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-line last:border-0 text-sm">
                    <span className="font-medium text-ink">{c.cell_name}</span>
                    <span className="text-ink-3">{c.reports} reportes · {c.attendance} asistentes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.ID} className="bg-card border border-line rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-ink text-sm">{r.cell_name}</span>
                  <span className="text-xs text-ink-3">{r.meeting_date ? new Date(r.meeting_date).toLocaleDateString('es-ES') : '—'}</span>
                </div>
                <div className="text-sm text-ink-2">
                  Asistencia: <strong>{r.attendance ?? 0}</strong> · Visitantes: <strong>{r.new_visitors ?? 0}</strong>
                </div>
                {r.notes && <p className="text-sm text-ink-3 mt-2 bg-bg rounded-lg px-3 py-2">{r.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
