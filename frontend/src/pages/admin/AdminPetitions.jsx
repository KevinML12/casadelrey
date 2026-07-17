import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Chip from '../../components/ui/Chip';
import Button, { IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Glass';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
  </div>
);

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-bg/50">
      <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
        <Icon name="inbox" className="w-[32px] h-[32px]" stroke={1.8} />
      </div>
      <div className="text-center">
        <p className="text-body-l text-bg font-medium">Sin peticiones</p>
        <p className="text-body-s text-bg/50 mt-1">Las peticiones de oración aparecerán aquí.</p>
      </div>
    </div>
  );
}

// Escapa HTML — las peticiones vienen de un formulario PÚBLICO sin
// autenticación (POST /contact/petition): sin esto, un nombre o mensaje
// con <script> se ejecuta en la ventana de impresión del admin (XSS
// almacenado). Todo campo con datos del usuario pasa por aquí antes de
// interpolarse en el HTML.
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function printWeeklyPetitions(data) {
  const { petitions, week_start, week_end } = data;
  if (!petitions?.length) { toast('No hay peticiones esta semana'); return; }

  const fmtDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const pages = petitions.map((p, i) => `
    <div class="page">
      <div class="header">
        <h1>Casa del Rey</h1>
        <p class="sub">Petición de oración — Semana ${esc(fmtDate(week_start))} al ${esc(fmtDate(week_end))}</p>
        <p class="num">${i + 1} / ${petitions.length}</p>
      </div>
      <div class="body">
        <div class="field"><span class="lbl">Nombre</span><span class="val">${esc(p.name) || '—'}</span></div>
        ${p.email    ? `<div class="field"><span class="lbl">Correo</span><span class="val">${esc(p.email)}</span></div>` : ''}
        ${p.phone    ? `<div class="field"><span class="lbl">Teléfono</span><span class="val">${esc(p.phone)}</span></div>` : ''}
        ${p.category ? `<div class="field"><span class="lbl">Categoría</span><span class="val">${esc(p.category)}</span></div>` : ''}
        ${p.subject  ? `<div class="field"><span class="lbl">Asunto</span><span class="val">${esc(p.subject)}</span></div>` : ''}
        <div class="msg-label">Mensaje de oración</div>
        <div class="msg">${esc(p.message) || '—'}</div>
        <div class="date">Recibida el ${p.CreatedAt ? esc(new Date(p.CreatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })) : '—'}</div>
      </div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Peticiones Semana ${esc(week_start)}</title>
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
            <Icon name="volunteer_activism" className="w-[22px] h-[22px] text-on-ter-con" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Peticiones</h1>
            <p className="text-body-s text-bg/50 mt-0.5">
              {unread > 0
                ? <><span className="text-pri font-semibold">{unread}</span> sin responder</>
                : 'Todas respondidas'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && <Chip color="primary">{unread} nueva{unread > 1 ? 's' : ''}</Chip>}
          <Button variant="outlined" onClick={handleWeeklyPdf} disabled={pdfLoading}>
            <Icon name="print" className="w-[16px] h-[16px]" stroke={1.8} />
            {pdfLoading ? 'Cargando…' : 'PDF semanal'}
          </Button>
        </div>
      </div>

      {loading ? <Spinner /> : petitions.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden">
          <EmptyState />
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {petitions.map(p => (
            <div key={p.ID}
              className={`flex items-start gap-4 p-5 transition-colors ${
                p.is_answered ? 'opacity-60' : 'hover:bg-bg/8'
              }`}
            >
              {/* Leading icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                p.is_answered ? 'bg-bg/8' : 'bg-ter-con'
              }`}>
                <Icon name={p.is_answered ? 'mark_email_read' : 'volunteer_activism'}
                  className={`w-[18px] h-[18px] ${p.is_answered ? 'text-bg/50' : 'text-on-ter-con'}`}
                  stroke={1.8} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-body-l text-bg font-medium">{p.name}</span>
                  {p.subject && (
                    <span className="text-body-s text-bg/50">· {p.subject}</span>
                  )}
                  {!p.is_answered && (
                    <Chip color="primary">Nueva</Chip>
                  )}
                </div>
                {p.email && (
                  <p className="text-body-s text-bg/50 mb-2">{p.email}</p>
                )}
                {p.message && (
                  <p className="text-body-s text-bg/50 leading-relaxed bg-bg/4 border border-bg/10 rounded-xl px-4 py-3">
                    {p.message}
                  </p>
                )}
                <p className="text-label-s text-bg/50 mt-2">
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
                  <Icon name="check" className="w-[18px] h-[18px]" stroke={1.8} />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
