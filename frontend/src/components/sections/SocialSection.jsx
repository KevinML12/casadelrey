import CollectionStatus from '../ui/CollectionStatus';
import SectionBg from '../ui/SectionBg';
import { useApiResource, useSitePhoto } from '../../lib/feed';
import { socialProfiles } from '../../lib/socialProfiles';

export default function SocialSection() {
  const resource = useApiResource('/settings');
  const settings = resource.data || {};
  const profiles = socialProfiles(settings);
  const photo = useSitePhoto('about_comunidad', '/images/backgrounds/congregacion.webp');
  if (!resource.loading && !resource.error && !profiles.length) return null;
  return <section aria-label="Redes de la comunidad" className="relative isolate overflow-hidden border-t border-white/5 px-5 py-20 sm:px-8 sm:py-28">
    <SectionBg src={photo} opacity="opacity-100" scrimClassName="bg-bg/50" />
    <div className="relative mx-auto max-w-3xl">
      {resource.loading || resource.error ? <CollectionStatus loading={resource.loading} label="las redes" onRetry={resource.retry} /> : (
        <div className="glass-light rounded-[16px] p-6 sm:p-10 text-bg">
          {settings.social_title && <h2 className="text-28 sm:text-40 font-bold tracking-tightish leading-tight [overflow-wrap:anywhere]">{settings.social_title}</h2>}
          {settings.social_intro && <p className="mt-4 max-w-xl text-16 leading-relaxed text-bg/70 whitespace-pre-line">{settings.social_intro}</p>}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {profiles.map(profile => <a key={profile.key} href={profile.href} target="_blank" rel="noopener noreferrer" className="focus-ring rounded-[12px] border border-bg/20 bg-white/30 px-5 py-4 text-bg transition-colors duration-150 hover:bg-white/65 active:bg-white/80 motion-reduce:transition-none">
              <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-17 font-bold">{profile.label}</span><span className="text-12 font-semibold text-bg/60">Visitar perfil</span></span>
              {profile.description && <span className="mt-2 block text-14 leading-relaxed text-bg/70 whitespace-pre-line [overflow-wrap:anywhere]">{profile.description}</span>}
            </a>)}
          </div>
        </div>
      )}
    </div>
  </section>;
}
