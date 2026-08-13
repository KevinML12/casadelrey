// ============================================================
//  AdminSettings — datos que NO deben estar hardcodeados: cuenta
//  bancaria, titular, WhatsApp de contacto. El sitio público los lee
//  de /settings; aquí el admin los edita sin deploy.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Pistas por llave para guiar al admin
const HINTS = {
  bank_account: 'Sin este dato, el sitio invita a coordinar el depósito por contacto (no muestra ninguna cuenta).',
  contact_whatsapp: 'Formato 502XXXXXXXX. Se usa como respaldo cuando no hay cuenta configurada.',
};

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/settings')
      .then(r => {
        const list = r.data || [];
        setSettings(list);
        setDraft(Object.fromEntries(list.map(s => [s.key, s.value])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (key) => {
    setSaving(key);
    try {
      await apiClient.put(`/admin/settings/${key}`, { value: draft[key] ?? '' });
      toast.success('Guardado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(null); }
  };

  const handlePhotoUpload = async (key, file) => {
    if (!file) return;
    setSaving(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDraft(d => ({ ...d, [key]: res.data.url }));
      await apiClient.put(`/admin/settings/${key}`, { value: res.data.url });
      toast.success('Fondo guardado');
      load();
    } catch { toast.error('Error al subir foto'); }
    finally { setSaving(null); }
  };

  const accountMissing = settings.find(s => s.key === 'bank_account')?.using_default;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-title-l text-bg mb-1">Configuración</h1>
        <p className="text-body-m text-bg/50">
          Datos bancarios y de contacto del sitio. Se actualizan al instante, sin publicar de nuevo.
        </p>
      </div>

      {accountMissing && (
        <div className="p-4 rounded-2xl border border-amber/40 bg-amber/10">
          <p className="text-title-s text-bg font-semibold">Falta la cuenta bancaria real</p>
          <p className="text-body-s text-bg/50 mt-0.5">
            Mientras esté vacía, las páginas de Dar y Comprobante NO muestran ningún número —
            invitan a coordinar el depósito por contacto. Pon la cuenta real abajo.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {settings.map(s => (
            <div key={s.key} className="p-4 sm:p-5 hover:bg-bg/6 transition-colors">
              {s.key.endsWith('_bg') ? (
                <div className="flex flex-col gap-3">
                  <p className="text-label-l text-bg font-semibold">{s.label}</p>
                  <div className="flex items-center gap-4">
                    {(draft[s.key] || s.value) && (
                      <img src={draft[s.key] || s.value} alt="bg" className="h-16 w-24 object-cover rounded-xl border border-bg/10 shadow-sm" />
                    )}
                    <label className={`flex items-center justify-center h-10 px-4 rounded-xl border border-bg/10 text-label-m font-bold cursor-pointer transition-colors ${saving === s.key ? 'opacity-50' : 'hover:border-bg/30 hover:bg-bg/5'} text-bg/70`}>
                      {saving === s.key ? 'Subiendo…' : 'Cambiar foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(s.key, e.target.files[0])} disabled={saving === s.key} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 min-w-0">
                    <Input
                      label={<>{s.label}{s.using_default && s.value === '' && (
                        <span className="ml-2 text-label-s text-amber">· sin configurar</span>
                      )}</>}
                      value={draft[s.key] ?? ''}
                      onChange={e => setDraft(d => ({ ...d, [s.key]: e.target.value }))}
                      placeholder={s.value || 'Escribe el valor…'}
                    />
                  </div>
                  <Button
                    variant="filled"
                    onClick={() => save(s.key)}
                    disabled={saving === s.key || (draft[s.key] ?? '') === s.value}
                    className="shrink-0"
                  >
                    {saving === s.key ? '…' : 'Guardar'}
                  </Button>
                </div>
              )}
              {HINTS[s.key] && (
                <p className="text-label-s text-bg/50 mt-2">{HINTS[s.key]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
