import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../lib/apiClient';
import { invalidateResource } from '../lib/feed';

// Keep other drafts when saving one group; report partial failures honestly.
export default function useSettingsEditor() {
  const [settings, setSettings] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get('/admin/settings');
      if (!Array.isArray(data)) throw new Error();
      setSettings(data);
      setDraft(Object.fromEntries(data.map(item => [item.key, item.value])));
    } catch { setError('No pudimos cargar la configuración. Reintenta para editarla.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const dirty = key => settings.some(item => item.key === key && item.value !== (draft[key] ?? ''));
  const save = async (keys, overrides = {}) => {
    const entries = keys.filter(key => dirty(key) || key in overrides).map(key => [key, overrides[key] ?? draft[key] ?? '']);
    if (!entries.length || saving) return;
    setSaving(true); setError('');
    const results = await Promise.allSettled(entries.map(([key, value]) => apiClient.put(`/admin/settings/${key}`, { value })));
    const succeeded = new Map(entries.filter((_, index) => results[index].status === 'fulfilled'));
    setSettings(items => items.map(item => succeeded.has(item.key) ? { ...item, value: succeeded.get(item.key), using_default: false } : item));
    if (succeeded.size) invalidateResource('/settings');
    const failed = results.find(result => result.status === 'rejected');
    if (failed) setError(failed.reason.response?.data?.error || 'Algunos cambios no se guardaron. Conservamos tu texto para reintentar.');
    else toast.success('Cambios guardados');
    setSaving(false);
  };
  return { settings, draft, setDraft, loading, error, saving, load, dirty, save };
}
