// ============================================================
//  AdminSettings — datos que NO deben estar hardcodeados: cuenta
//  bancaria, titular, WhatsApp de contacto. El sitio público los lee
//  de /settings; aquí el admin los edita sin deploy.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { Icon } from '../../components/ui/Glass';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-pri/40 bg-pri-con/40">
          <Icon name="account_balance" className="w-[20px] h-[20px] text-on-pri-con mt-0.5" stroke={1.8} />
          <div>
            <p className="text-title-s text-bg font-semibold">Falta la cuenta bancaria real</p>
            <p className="text-body-s text-bg/50 mt-0.5">
              Mientras esté vacía, las páginas de Dar y Comprobante NO muestran ningún número —
              invitan a coordinar el depósito por contacto. Pon la cuenta real abajo.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-bg/50">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {settings.map(s => (
            <div key={s.key} className="p-4 sm:p-5 rounded-2xl bg-bg/4 border border-bg/10">
              <label className="block text-label-l text-bg/50 mb-1.5">
                {s.label}
                {s.using_default && s.value === '' && (
                  <span className="ml-2 text-label-s" style={{ color: 'var(--pri)' }}>· sin configurar</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  value={draft[s.key] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [s.key]: e.target.value }))}
                  className={fieldCls}
                  placeholder={s.value || 'Escribe el valor…'}
                />
                <Button
                  variant="filled"
                  onClick={() => save(s.key)}
                  disabled={saving === s.key || (draft[s.key] ?? '') === s.value}
                  className="shrink-0"
                >
                  {saving === s.key ? '…' : 'Guardar'}
                </Button>
              </div>
              {HINTS[s.key] && (
                <p className="text-label-s text-bg/50 mt-1.5">{HINTS[s.key]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
