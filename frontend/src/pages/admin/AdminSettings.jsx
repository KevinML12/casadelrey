import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AdminResourceState from '../../components/ui/AdminResourceState';
import useSettingsEditor from '../../hooks/useSettingsEditor';

const HINTS = {
  bank_account: 'Si no hay cuenta, el sitio invita a coordinar el depósito por contacto.',
  contact_whatsapp: 'Número de WhatsApp con código de país, por ejemplo 502 seguido de 8 dígitos.',
  about_podcast_url: 'Enlace público para escuchar. Déjalo vacío si todavía no tienen uno.',
};
const GROUPS = [
  { key: 'about', label: 'Información de la iglesia', includes: key => key.startsWith('about_') },
  { key: 'contact', label: 'Depósitos y contacto', includes: key => key.startsWith('bank_') || key === 'contact_whatsapp' },
  { key: 'backgrounds', label: 'Fondos', includes: key => key.endsWith('_bg') || key.startsWith('public_bg_') },
];

export default function AdminSettings() {
  const { settings, draft, setDraft, loading, error, saving, load, dirty, save } = useSettingsEditor();
  const [group, setGroup] = useState('about');
  const [uploading, setUploading] = useState('');
  const [uploadError, setUploadError] = useState('');
  const groups = GROUPS.filter(group => settings.some(item => group.includes(item.key)));
  const selected = groups.find(item => item.key === group) || groups[0];
  const photo = async (key, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setUploadError('Elige una imagen de hasta 10 MB.'); return; }
    setUploading(key); setUploadError('');
    try {
      const data = new FormData(); data.append('file', file);
      const response = await apiClient.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!response.data.url) throw new Error();
      setDraft(values => ({ ...values, [key]: response.data.url }));
    } catch { setUploadError('No pudimos subir la imagen. Inténtalo de nuevo.'); }
    finally { setUploading(''); }
  };
  return <div className="mx-auto max-w-4xl space-y-6">
    <header><h1 className="text-28 font-bold tracking-tightish">Configuración</h1><p className="mt-2 text-15 text-bg/65">Edita los datos del sitio. Cada campo se guarda por separado, sin perder los otros cambios que estés preparando.</p></header>
    <Link to="/admin/social" className="focus-ring inline-flex min-h-11 items-center rounded-[10px] bg-white/65 px-4 text-13 font-bold">Editar textos y perfiles de redes</Link>
    {loading ? <AdminResourceState loading /> : !settings.length ? <AdminResourceState error={error || 'No pudimos cargar la configuración.'} onRetry={load} /> : <>
      {(error || uploadError) && <AdminResourceState error={error || uploadError} />}
      <div role="group" aria-label="Tipo de configuración" className="flex flex-wrap gap-2">{groups.map(item => <Button key={item.key} variant={selected?.key === item.key ? 'filled' : 'outlined'} aria-pressed={selected?.key === item.key} onClick={() => setGroup(item.key)}>{item.label}</Button>)}</div>
      {selected?.key === 'contact' && !draft.bank_account && <p className="rounded-[12px] border border-bg/15 bg-white/50 p-4 text-14">La cuenta bancaria está vacía. El sitio mostrará la opción de coordinar el depósito.</p>}
      <div className="glass-light divide-y divide-bg/10 rounded-[16px]">
        {settings.filter(item => selected?.includes(item.key)).map(item => {
          const isPhoto = item.key.endsWith('_bg') || item.key.startsWith('public_bg_');
          const Field = item.key.startsWith('about_') && !item.key.endsWith('_url') ? Textarea : Input;
          return <form key={item.key} className="p-5 sm:p-6" onSubmit={event => { event.preventDefault(); save([item.key]); }}>
            <fieldset disabled={saving || !!uploading} className="space-y-4">
              {isPhoto && <div className="flex flex-wrap items-center gap-4">
                {draft[item.key] && <img src={draft[item.key]} alt="Vista previa del fondo" className="h-20 w-32 rounded-[10px] object-cover" />}
                <label className="text-13 font-semibold">{uploading === item.key ? 'Subiendo…' : 'Subir otro fondo'}<input aria-label={`Subir ${item.label}`} type="file" accept="image/*" className="mt-2 block w-full max-w-xs text-12" onChange={event => photo(item.key, event.target.files[0])} /></label>
              </div>}
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 w-full"><Field label={item.label} value={draft[item.key] ?? ''} onChange={event => setDraft(values => ({ ...values, [item.key]: event.target.value }))} helperText={HINTS[item.key]} /></div><Button type="submit" disabled={saving || !!uploading || !dirty(item.key)}>{saving ? 'Guardando…' : 'Guardar'}</Button></div>
            </fieldset>
          </form>;
        })}
      </div>
    </>}
  </div>;
}
