import SceneCarousel from '../ui/SceneCarousel';
import CollectionStatus from '../ui/CollectionStatus';
import { useApiResource } from '../../lib/feed';

export default function SocialSection({ title = 'Síguenos en redes' }) {
  const resource = useApiResource('/social/feed');
  const rows = Array.isArray(resource.data) ? resource.data : resource.data?.data || [];
  const items = rows.filter(post => post.is_active !== false).map(post => ({
    key: post.ID || post.id,
    title: post.platform,
    description: post.caption,
    image: post.image_url || '/images/backgrounds/congregacion.webp',
    href: post.post_url,
  }));
  return <section className="relative border-t border-white/5">
    <div className="max-w-6xl mx-auto px-6 py-12"><h2 className="text-d2 text-white">{title}</h2></div>
    {resource.loading || resource.error
      ? <div className="px-6 pb-12"><CollectionStatus loading={resource.loading} label="las publicaciones" onRetry={resource.retry} /></div>
      : <SceneCarousel items={items} label="Publicaciones de la comunidad" photoPreview empty="Sin publicaciones en redes aún." renderContent={post => <>
        <h3 className="text-24 sm:text-28 font-bold capitalize">{post.title}</h3>
        {post.description && <p className="mt-3 text-16 text-white/85 line-clamp-3">{post.description}</p>}
        {post.href && <a href={post.href} target="_blank" rel="noopener noreferrer" className="btn-spring focus-ring inline-flex mt-5 min-h-11 items-center rounded-pill bg-white px-5 py-2 text-14 font-bold text-bg">Ver publicación</a>}
      </>} />}
  </section>;
}
