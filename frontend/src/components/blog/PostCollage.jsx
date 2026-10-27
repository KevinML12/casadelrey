import { Link } from 'react-router-dom';
import SceneCarousel from '../ui/SceneCarousel';

// Kept as the feed's public interface; the collage is now one fixed scene.
export default function PostCollage({ posts }) {
  const items = posts.map(post => ({ ...post, key: post.ID || post.slug, image: post.cover_image }));
  return <SceneCarousel items={items} photoPreview label="Mensajes" empty="Sin mensajes publicados aún." renderContent={post => <>
    <h2 className="text-24 sm:text-28 font-bold tracking-tight line-clamp-2">{post.title}</h2>
    {(post.excerpt || post.content) && <p className="mt-3 text-15 text-white/80 leading-relaxed line-clamp-2">{post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 180)}</p>}
    {post.redirect_url ? <a href={post.redirect_url} target="_blank" rel="noopener noreferrer" className="inline-flex mt-5 min-h-11 items-center rounded-pill bg-white text-bg px-6 text-14 font-bold focus-ring">Ver publicación</a> : <Link to={`/blog/${post.slug}`} className="inline-flex mt-5 min-h-11 items-center rounded-pill bg-white text-bg px-6 text-14 font-bold focus-ring">Leer mensaje</Link>}
  </>} />;
}
