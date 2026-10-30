import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AdminResourceState from '../../components/ui/AdminResourceState';
import useSettingsEditor from '../../hooks/useSettingsEditor';
import { SOCIAL_CHANNELS, validSocialProfile } from '../../lib/socialProfiles';

export default function AdminSocial() {
  const editor = useSettingsEditor();
  const { draft, setDraft, settings, loading, error, saving, load, dirty, save } = editor;
  const set = key => event => setDraft(values => ({ ...values, [key]: event.target.value }));
  const introKeys = ['social_title', 'social_intro'];
  const ready = settings.some(item => item.key === 'social_title');
  return <div className="mx-auto max-w-4xl space-y-6">
    <header>
      <h1 className="text-28 font-bold text-bg tracking-tightish">Redes de la iglesia</h1>
      <p className="mt-2 max-w-2xl text-15 leading-relaxed text-bg/65">Promueve los perfiles de la comunidad. El título, la presentación y las descripciones se editan aquí y se muestran en Inicio y Nosotros.</p>
    </header>
    {loading || !ready ? <AdminResourceState loading={loading} error={error || (!loading ? 'Esta versión del servidor aún no admite editar las redes.' : '')} onRetry={load} /> : <>
      {error && <AdminResourceState error={error} />}
      <form onSubmit={event => { event.preventDefault(); save(introKeys); }} className="glass-light rounded-[16px] p-5 sm:p-7">
        <fieldset disabled={saving} className="space-y-5">
          <h2 className="text-18 font-bold">Presentación</h2>
          <Input label="Título del apartado" value={draft.social_title ?? ''} onChange={set('social_title')} />
          <Textarea label="Texto de presentación" rows={3} value={draft.social_intro ?? ''} onChange={set('social_intro')} helperText="Puedes dejarlos vacíos si prefieres mostrar únicamente las redes." />
          <Button type="submit" disabled={!introKeys.some(dirty) || saving}>{saving ? 'Guardando…' : 'Guardar presentación'}</Button>
        </fieldset>
      </form>
      <div className="glass-light rounded-[16px] divide-y divide-bg/10">
        {SOCIAL_CHANNELS.map(channel => {
          const urlKey = `social_${channel.key}_url`;
          const textKey = `social_${channel.key}_description`;
          const url = draft[urlKey] ?? '';
          const invalid = url.trim() && !validSocialProfile(channel.key, url.trim());
          return <form key={channel.key} onSubmit={event => { event.preventDefault(); if (!invalid) save([urlKey, textKey], { [urlKey]: url.trim() }); }} className="p-5 sm:p-7">
            <fieldset disabled={saving} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-18 font-bold">{channel.label}</h2><span className="text-12 font-semibold text-bg/60">{url.trim() ? 'Perfil configurado' : 'Oculto'}</span></div>
              <Input label={`Enlace del perfil de ${channel.label}`} type="url" value={url} onChange={set(urlKey)} error={invalid ? 'Escribe el enlace https:// de un perfil o canal de esta red.' : undefined} helperText="Déjalo vacío para ocultar esta red también en el pie de página." />
              <Textarea label={`Descripción de ${channel.label}`} rows={2} value={draft[textKey] ?? ''} onChange={set(textKey)} helperText="Texto opcional y editable para presentar esta red." />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={saving || invalid || ![urlKey, textKey].some(dirty)}>{saving ? 'Guardando…' : `Guardar ${channel.label}`}</Button>
                {url.trim() && !invalid && <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="min-h-11 inline-flex items-center px-3 text-13 font-bold focus-ring rounded-lg">Abrir perfil</a>}
              </div>
            </fieldset>
          </form>;
        })}
      </div>
    </>}
  </div>;
}
