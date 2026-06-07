import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Chip from '../../components/ui/Chip';
import Button, { IconButton } from '../../components/ui/Button';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
      <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
        <span className="ms" style={{ fontSize: 32 }}>inbox</span>
      </div>
      <div className="text-center">
        <p className="text-body-l text-on-surf font-medium">Sin peticiones</p>
        <p className="text-body-s text-on-surf-var mt-1">Las peticiones de oración aparecerán aquí.</p>
      </div>
    </div>
  );
}

function printWeeklyPetitions(data) {
  const { petitions, week_start, week_end } = data;
  if (!petitions?.length) { toast('No hay peticiones esta semana'); return; }

  const fmtDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const pages = petitions.map((p, i) => `
    <div class="page">
      <div class="header">
        <h1>Casa del Rey</h1>
        <p class="sub">Petición de oración — Semana ${fmtDate(week_start)} al ${fmtDate(week_end)}</p>
        <p class="num">${i + 1} / ${petitions.length}</p>
      </div>
      <div class="body">
        <div class="field"><span class="lbl">Nombre</span><span class="val">${p.name || '—'}</span></div>
        ${p.email    ? `<div class="field"><span class="lbl">Correo</span><span class="val">${p.email}</span></div>` : ''}
        ${p.phone    ? `<div class="field"><span class="lbl">Teléfono</span><span class="val">${p.phone}</span></div>` : ''}
        ${p.category ? `<div class="field"><span class="lbl">Categoría</span><span class="val">${p.category}</span></div>` : ''}
        ${p.subject  ? `<div class="field"><span class="lbl">Asunto</span><span class="val">${p.subject}</span></div>` : ''}
        <div class="msg-label">Mensaje de oración</div>
        <div class="msg">${p.message || '—'}</div>
        <div class="date">Recibida el ${p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
      </div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Peticiones Semana ${week_start}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Georgia, serif; color: #0a0a0a; background: white; }
      .page { page-break-after: always; min-height: 100vh; padding: 48px; display: flex; flex-direction: column; gap: 32px; }
      .page:last-child { page-break-after: auto; }
      .header { border-bottom: 2px solid #060D24; padding-bottom: 16px; }
      .header h1 { font-size: 24px; color: #060D24; font-weight: 900; letter-spacing: -0.5px; }
      .header .sub { font-size: 13px; color: #555; margin-top: 4px; }
      .header .num { font-size: 12px; color: #999; margin-top: 2px; }
      .body { flex: 1; display: flex; flex-direction: column; gap: 12px; }
      .field { display: flex; gap: 8px; align-items: baseline; }
      .lbl { font-size: 12px; font-weight: 700; color: #060D24; text-transform: uppercase; letter-spacing: 0.05em; width: 90px; flex-shrink: 0; }
      .val { font-size: 15px; color: #0a0a0a; }
      .msg-label { font-size: 12px; font-weight: 700; color: #060D24; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px; }
      .msg { font-size: 16px; line-height: 1.7; color: #0a0a0a; background: #f4f6fb; border-left: 3px solid #060D24; padding: 16px 20px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap; }
      .date { font-size: 12px; color: #999; margin-top: auto; padding-top: 24px; }
      @media print { .page { padding: 32px; } }
    </style>
  </head><body>${pages}</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export default function AdminPetitions() {
  const [petitions,   setPetitions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pdfLoading,  setPdfLoading]  = useState(false);

  const load = () =>
    apiClient.get('/admin/petitions')
      .then(r => setPetitions(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await apiClient.put(`/admin/petitions/${id}/read`);
      setPetitions(prev => prev.map(p => p.ID === id ? { ...p, is_answered: true } : p));
      toast.success('Marcada como respondida');
    } catch { toast.error('Error al actualizar'); }
  };

  const handleWeeklyPdf = async () => {
    setPdfLoading(true);
    try {
      const r = await apiClient.get('/admin/petitions/weekly');
      printWeeklyPetitions(r.data);
    } catch { toast.error('Error al obtener peticiones de la semana'); }
    finally { setPdfLoading(false); }
  };

  const unread = petitions.filter(p => !p.is_answered).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ter-con flex items-center justify-center shrink-0">
            <span className="ms text-on-ter-con" style={{ fontSize: 22 }}>volunteer_activism</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Peticiones</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">
              {unread > 0
                ? <><span className="text-pri font-semibold">{unread}</span> sin responder</>
                : 'Todas respondidas'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && <Chip color="primary">{unread} nueva{unread > 1 ? 's' : ''}</Chip>}
          <Button variant="outlined" onClick={handleWeeklyPdf} disabled={pdfLoading}>
            <span className="ms" style={{ fontSize: 16 }}>print</span>
            {pdfLoading ? 'Cargando…' : 'PDF semanal'}
          </Button>
        </div>
      </div>

      {loading ? <Spinner /> : petitions.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
          <EmptyState />
        </div>
      ) : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden divide-y divide-outline-var">
          {petitions.map(p => (
            <div key={p.ID}
              className={`flex items-start gap-4 p-5 transition-colors ${
                p.is_answered ? 'opacity-60' : 'hover:bg-surf-high'
              }`}
            >
              {/* Leading icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                p.is_answered ? 'bg-surf-high' : 'bg-ter-con'
              }`}>
                <span className={`ms ${p.is_answered ? 'text-on-surf-var' : 'text-on-ter-con'}`}
                  style={{ fontSize: 18 }}>
                  {p.is_answered ? 'mark_email_read' : 'volunteer_activism'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-body-l text-on-surf font-medium">{p.name}</span>
                  {p.subject && (
                    <span className="text-body-s text-on-surf-var">· {p.subject}</span>
                  )}
                  {!p.is_answered && (
                    <Chip color="primary">Nueva</Chip>
                  )}
                </div>
                {p.email && (
                  <p className="text-body-s text-on-surf-var mb-2">{p.email}</p>
                )}
                {p.message && (
                  <p className="text-body-s text-on-surf-var leading-relaxed bg-surf border border-outline-var rounded-xl px-4 py-3">
                    {p.message}
                  </p>
                )}
                <p className="text-label-s text-on-surf-var mt-2">
                  {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  }) : '—'}
                </p>
              </div>

              {/* Trailing action */}
              {!p.is_answered && (
                <IconButton
                  variant="tonal"
                  onClick={() => markRead(p.ID)}
                  title="Marcar como respondida"
                  className="shrink-0 mt-0.5"
                >
                  <span className="ms" style={{ fontSize: 18 }}>check</span>
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
