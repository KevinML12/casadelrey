import { Link } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import ChurchStory from '../../components/sections/ChurchStory';
import VisitExperience from '../../components/sections/VisitExperience';
import SceneCollection from '../../components/ui/SceneCollection';
import CollectionStatus from '../../components/ui/CollectionStatus';
import SocialSection from '../../components/sections/SocialSection';
import { useApi, useApiResource } from '../../lib/feed';
import { useVolunteerAreasResource } from '../../lib/volunteerAreas';
import useSeo from '../../hooks/useSeo';

const FALLBACK = '/images/backgrounds/congregacion.webp';
const cta = 'inline-flex items-center justify-center min-h-11 mt-6 rounded-pill bg-bg px-6 py-3 text-14 font-bold text-white focus-ring';

export default function AboutPage() {
  useSeo('Nosotros', 'Conoce Casa del Rey y encuentra tu lugar en nuestra comunidad.');
  const settingsResource = useApiResource('/settings');
  const settings = settingsResource.data || {};
  const photos = useApi('/site-photos') || {};
  const volunteers = useVolunteerAreasResource();
  const categories = useApiResource('/cell-categories');
  const areas = volunteers.areas.map(area => ({ ...area, key: area.value, description: area.desc, image: photos[`voluntariado_${area.value}`] || area.photoFallback, images: [photos[`voluntariado_${area.value}`] || area.photoFallback, photos[`voluntariado_${area.value}_2`]].filter(Boolean) }));
  const cells = (Array.isArray(categories.data) ? categories.data : []).filter(category => category.is_active !== false).map(category => ({ ...category, key: `cat-${category.ID || category.id}`, title: category.name, image: category.image_url || photos.about_comunidad || FALLBACK, meta: category.age_group }));
  const institution = [
    { key: 'founders', title: settings.about_founders_names, description: settings.about_founders_description, meta: 'Pastores fundadores', portrait: true, image: photos.about_fundadores || '/images/nosotros/fundadores.jpg', fallbackImage: '/images/nosotros/fundadores.jpg' },
    { key: 'pastors', title: settings.about_pastors_names, description: settings.about_pastors_description, meta: 'Pastores', portrait: true, image: photos.about_pastores || '/images/nosotros/pastores.jpg', fallbackImage: '/images/nosotros/pastores.jpg' },
    { key: 'mission', title: 'Misión', description: settings.about_mission, image: photos.about_servidores || FALLBACK },
    { key: 'vision', title: 'Visión', description: settings.about_vision, image: photos.about_comunidad || FALLBACK },
  ].filter(item => item.description || item.title && !['mission', 'vision'].includes(item.key));
  return <main className="min-h-screen overflow-clip text-white">
    <PageHero title={settings.about_title || 'Nosotros'} subtitle={settings.about_intro || ''} photoSlot="hero_nosotros" photoFallback="/images/backgrounds/comunidad-templo.webp" />
    {(settingsResource.loading || settingsResource.error) && <div className="max-w-4xl mx-auto px-6"><CollectionStatus loading={settingsResource.loading} label="la información de la iglesia" onRetry={settingsResource.retry} /></div>}
    {institution.length > 0 && <ChurchStory items={institution} background={photos.about_comunidad || FALLBACK} />}
    <div className="max-w-4xl mx-auto px-6 pt-12"><h2 className="text-d2">Una familia que sirve.</h2></div>
    {volunteers.loading || volunteers.error ? <div className="max-w-4xl mx-auto px-6"><CollectionStatus loading={volunteers.loading} label="los departamentos" onRetry={volunteers.retry} /></div> : <SceneCollection items={areas} id="about-volunteers" label="Departamentos de voluntariado" empty="Sin departamentos publicados aún." renderInfo={area => <div className="space-y-5">
      {area.desc && <p className="text-16 leading-relaxed">{area.desc}</p>}
      {area.why && <p className="border-t border-bg/15 pt-5 text-15 leading-relaxed">{area.why}</p>}
      {area.testimonial && <blockquote className="text-14 italic">{area.testimonial}{area.testimonialAuthor && <footer className="mt-2 not-italic">{area.testimonialAuthor}</footer>}</blockquote>}
      <Link to={`/volunteering?departamento=${encodeURIComponent(area.value)}`} className={cta}>Aplicar a {area.title}</Link>
    </div>} />}
    <div className="max-w-4xl mx-auto px-6 pt-12"><h2 className="text-d2">Encuentra tu célula.</h2></div>
    {categories.loading || categories.error ? <div className="max-w-4xl mx-auto px-6"><CollectionStatus loading={categories.loading} label="las categorías" onRetry={categories.retry} /></div> : <SceneCollection items={cells} id="about-cells" label="Tipos de células" empty="Sin categorías publicadas aún." renderInfo={cell => <div className="space-y-5">
      {cell.age_group && <p className="text-14 font-semibold">{cell.age_group}</p>}
      {cell.description && <p className="text-16 leading-relaxed">{cell.description}</p>}
      <Link to={`/celulas?tipo=${encodeURIComponent(cell.name)}`} className={cta}>Ver células de {cell.name}</Link>
    </div>} />}
    <VisitExperience />
    <SocialSection />
  </main>;
}
