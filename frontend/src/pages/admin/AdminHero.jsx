import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon } from '../../components/ui/Glass';

// Nota importante: el hero público (Home.jsx) NO tiene botón secundario —
// solo lee cta_primary_text/cta_primary_url (como "ctaText"/"ctaUrl"). Los
// campos cta_secondary_* de este formulario NUNCA se renderizaron en el
// sitio — un admin los llenaba pensando que agregaban un segundo botón y
// no pasaba nada. Se eliminan del formulario en vez de dejarlos ahí sin
// función (bug real encontrado al comparar esta preview contra Home.jsx).

const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const EMPTY = {
  label_top: '', title_line_1: '', title_line_2: '', verse_reference: '',
  subtitle: '', schedule_text: '',
  cta_primary_text: '', cta_primary_url: '/events',
  background_image_url: '', overlay_color: '#060D24', overlay_opacity: 50,
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-label-l text-bg/50 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-label-s text-bg/50 mt-1">{hint}</p>}
    </div>
  );
}

// Preview en vivo del hero — replica EXACTAMENTE cómo Home.jsx renderiza
// el slide real (mismo texto blanco sin colores inventados, misma fusión
// de horario+versículo, mismo botón liquid-glass): antes tenía un morado
// #7C3AED que no existe en ningún lado del sitio y una línea 2 con
// contorno que Home.jsx dejó de usar hace tiempo — la vista previa llevaba
// meses sin coincidir con lo que ve un visitante real.
function HeroPreview({ data }) {
  const schedule = [data.schedule_text, data.verse_reference].filter(Boolean).join(' · ');
  return (
    <div className="rounded-2xl overflow-hidden border border-bg/10 relative aspect-video">
      {/* Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: data.background_image_url ? `url(${data.background_image_url})` : 'none',
        backgroundColor: data.background_image_url ? 'transparent' : '#0A1526',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
      {/* Overlay */}
      <div className="absolute inset-0" style={{
        backgroundColor: data.overlay_color,
        opacity: (data.overlay_opacity || 50) / 100,
      }} />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 py-6">
        {data.label_top && (
          <p className="text-white/80 text-[11px] font-semibold mb-2">
            {data.label_top}
          </p>
        )}
        <h1 className="text-white font-black leading-[0.95]" style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          letterSpacing: '-0.04em',
        }}>
          {data.title_line_1 || 'LUZ PARA'}
        </h1>
        {data.title_line_2 && (
          <h1 className="text-white font-black leading-[0.95]" style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            letterSpacing: '-0.04em',
          }}>
            {data.title_line_2}
          </h1>
        )}
        {data.subtitle && (
          <p className="text-white/80 text-xs mt-3">{data.subtitle}</p>
        )}
        {schedule && (
          <p className="text-white/60 text-[10px] font-semibold mt-1">{schedule}</p>
        )}
        {data.cta_primary_text && (
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-white text-[10px] font-bold">
            {data.cta_primary_text}
            <Icon name="arrow" className="w-3 h-3" stroke={2.2} />
          </div>
        )}
      </div>
    </div>
  );
}

function HeroForm({ initial, onSave, onCancel }) {
  const [form, setForm]     = useState(initial || EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload?folder=hero', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, background_image_url: res.data.url }));
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir'); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title_line_1) { toast.error('El título es obligatorio'); return; }
    setLoading(true);
    try {
      if (initial?.ID) {
        await apiClient.put(`/admin/hero/${initial.ID}`, form);
        toast.success('Hero actualizado');
      } else {
        await apiClient.post('/admin/hero', form);
        toast.success('Hero creado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">

      {/* Form */}
      <form onSubmit={submit} className="space-y-5">

        {/* Textos */}
        <div className="glass-light rounded-[24px] card-spring space-y-3 p-5">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest">Textos</p>

          <Field label="Label superior" hint='Ej. "● IGLESIA CRISTIANA · HUEHUETENANGO"'>
            <input value={form.label_top} onChange={set('label_top')} className={fieldCls} placeholder="● IGLESIA CRISTIANA · HUEHUETENANGO" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Título línea 1 *">
              <input value={form.title_line_1} onChange={set('title_line_1')} className={fieldCls} placeholder="LUZ PARA" required />
            </Field>
            <Field label="Título línea 2" hint="Opcional">
              <input value={form.title_line_2} onChange={set('title_line_2')} className={fieldCls} placeholder="LAS NACIONES" />
            </Field>
          </div>

          <Field label="Versículo" hint="Se muestra junto al horario, ej. «Domingos 10am · MATEO 5:14»">
            <input value={form.verse_reference} onChange={set('verse_reference')} className={fieldCls} placeholder="MATEO 5:14" />
          </Field>

          <Field label="Subtítulo">
            <input value={form.subtitle} onChange={set('subtitle')} className={fieldCls} placeholder="Empieza tu propósito aquí." />
          </Field>

          <Field label="Horario / contexto">
            <input value={form.schedule_text} onChange={set('schedule_text')} className={fieldCls} placeholder="Domingos · 10am · Zona 1, Huehuetenango" />
          </Field>
        </div>

        {/* CTA — el hero público solo soporta UN botón */}
        <div className="glass-light rounded-[24px] card-spring space-y-3 p-5">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest">Botón</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto">
              <input value={form.cta_primary_text} onChange={set('cta_primary_text')} className={fieldCls} placeholder="Ver próximos eventos" />
            </Field>
            <Field label="URL">
              <input value={form.cta_primary_url} onChange={set('cta_primary_url')} className={fieldCls} placeholder="/events" />
            </Field>
          </div>
        </div>

        {/* Visual */}
        <div className="glass-light rounded-[24px] card-spring space-y-3 p-5">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest">Imagen de fondo</p>

          <Field label="Foto del hero">
            {form.background_image_url ? (
              <div className="flex items-center gap-3">
                <img src={form.background_image_url} alt="hero" className="w-20 h-20 rounded-xl object-cover border border-bg/10" />
                <button type="button" onClick={() => setForm(p => ({ ...p, background_image_url: '' }))}
                  className="text-label-m text-err hover:underline">Quitar imagen</button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-bg/10 cursor-pointer hover:border-pri transition-colors">
                <Icon name={uploading ? 'hourglass_empty' : 'add_photo_alternate'} className="w-[28px] h-[28px] text-bg/50" stroke={1.8} />
                <p className="text-body-s text-bg">{uploading ? 'Subiendo…' : 'Subir foto del hero'}</p>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
              </label>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color del overlay">
              <input type="color" value={form.overlay_color} onChange={set('overlay_color')} className="w-full h-10 rounded-xl border border-bg/10 cursor-pointer" />
            </Field>
            <Field label={`Opacidad del overlay: ${form.overlay_opacity}%`}>
              <input type="range" min="0" max="100" value={form.overlay_opacity}
                onChange={e => setForm(p => ({ ...p, overlay_opacity: parseInt(e.target.value) }))}
                className="w-full h-10 accent-pri" />
            </Field>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
            {loading ? 'Guardando…' : initial?.ID ? 'Guardar cambios' : 'Crear hero'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 h-11 rounded-xl border border-bg/10 text-label-l text-bg/50 hover:bg-bg/8 transition-colors">
            Cancelar
          </button>
        </div>
      </form>

      {/* Preview sticky */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-label-l text-bg/50 uppercase tracking-widest mb-2">Vista previa</p>
        <HeroPreview data={form} />
        <p className="text-label-s text-bg/50 mt-2 text-center">
          La vista pública se renderizará a tamaño completo
        </p>
      </div>
    </div>
  );
}

export default function AdminHero() {
  const [heroes,  setHeroes]  = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/hero')
      .then(r => setHeroes(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const activate = async (id) => {
    try {
      await apiClient.put(`/admin/hero/${id}/activate`);
      toast.success('Hero activado en el sitio público');
      load();
    } catch { toast.error('Error al activar'); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este hero?')) return;
    try {
      await apiClient.delete(`/admin/hero/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error'); }
  };

  if (editing !== null) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full hover:bg-bg/8 flex items-center justify-center transition-colors">
            <Icon name="arrow_back" className="w-[18px] h-[18px] text-bg/50" stroke={1.8} />
          </button>
          <div>
            <h1 className="text-headline-s text-bg font-black">{editing?.ID ? 'Editar hero' : 'Nuevo hero'}</h1>
            <p className="text-body-s text-bg/50">Personaliza el hero del sitio público</p>
          </div>
        </div>
        <HeroForm initial={editing} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center shrink-0">
            <Icon name="view_carousel" className="w-[22px] h-[22px] text-on-pri-con" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black">Hero del sitio</h1>
            <p className="text-body-s text-bg/50">Controla lo que ven los visitantes al entrar</p>
          </div>
        </div>
        <button onClick={() => setEditing(EMPTY)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
          <Icon name="add" className="w-[18px] h-[18px]" stroke={1.8} />
          Nuevo hero
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : heroes.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <Icon name="view_carousel" className="w-[48px] h-[48px]" stroke={1.8} />
          <div className="text-center">
            <p className="text-body-l text-bg font-medium">Sin heroes guardados</p>
            <p className="text-body-s mt-1">El sitio usa el hero por defecto. Crea uno para personalizarlo.</p>
          </div>
          <button onClick={() => setEditing(EMPTY)}
            className="mt-2 flex items-center gap-2 h-10 px-4 rounded-xl bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity">
            <Icon name="add" className="w-[16px] h-[16px]" stroke={1.8} />
            Crear el primer hero
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {heroes.map(h => (
            <div key={h.ID} className="rounded-2xl border border-bg/10 overflow-hidden">
              <HeroPreview data={h} />
              <div className="p-4 bg-bg/6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-title-s text-bg font-bold">{h.title_line_1} {h.title_line_2}</h3>
                  {h.is_active && (
                    <span className="px-2 py-0.5 rounded-full bg-ter-con text-on-ter-con text-label-s font-semibold flex items-center gap-1">
                      <Icon name="check_circle" className="w-[12px] h-[12px]" stroke={1.8} />
                      Activo en sitio
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!h.is_active && (
                    <button onClick={() => activate(h.ID)}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity">
                      <Icon name="publish" className="w-[14px] h-[14px]" stroke={1.8} />
                      Activar
                    </button>
                  )}
                  <button onClick={() => setEditing(h)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-bg/10 text-label-m text-bg/50 hover:bg-bg/8 transition-colors">
                    <Icon name="edit" className="w-[14px] h-[14px]" stroke={1.8} />
                    Editar
                  </button>
                  <button onClick={() => remove(h.ID)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-label-m text-err hover:bg-err-con transition-colors">
                    <Icon name="delete" className="w-[14px] h-[14px]" stroke={1.8} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
