import { Link } from 'react-router-dom';
import SceneCarousel from '../ui/SceneCarousel';

export default function PostCollage({ posts, header, fallbackImage }) {
  const items = posts.map(post => ({ ...post, key: post.ID || post.slug, image: post.cover_image }));
  return <SceneCarousel items={items} header={header} fallbackImage={fallbackImage} previewPanelClassName="min-h-[264px]" photoPreview label="Mensajes" empty="Sin mensajes publicados aún." renderContent={post => <>
    {post.category && <p className="mb-3 text-13 font-semibold text-white/80">{post.category}</p>}
    <h2 className="text-30 sm:text-40 font-semibold tracking-tight leading-[1.12] [text-wrap:balance]">{post.title}</h2>
    {(post.excerpt || post.content) && <p className="mt-4 text-16 text-white/85 leading-relaxed line-clamp-2">{post.excerpt || post.content.replace(/<[^>]+>/g, ' ').slice(0, 180)}</p>}
    {post.redirect_url ? <a href={post.redirect_url} target="_blank" rel="noopener noreferrer" className="ui-action inline-flex mt-6 min-h-11 items-center rounded-[12px] bg-white text-bg px-5 py-3 text-14 font-bold focus-ring">Ver publicación</a> : <Link to={`/blog/${post.slug}`} className="ui-action inline-flex mt-6 min-h-11 items-center rounded-[12px] bg-white text-bg px-5 py-3 text-14 font-bold focus-ring">Leer mensaje</Link>}
  </>} />;
}
