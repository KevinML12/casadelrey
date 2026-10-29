import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useSearchParams } from 'react-router-dom';
import { groupAlbums } from '../../lib/feed';
import PageHero from '../../components/layout/PageHero';
import SceneCarousel from '../../components/ui/SceneCarousel';
import WindowStack from '../../components/ui/WindowStack';
import CollectionStatus from '../../components/ui/CollectionStatus';
import PhotoTabs from '../../components/ui/PhotoTabs';

export default function GalleryPage() {
  const [params] = useSearchParams();
  const requestedAlbum = params.get('album');
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openKey, setOpenKey] = useState(null);
  const [tab, setTab] = useState('gallery');
  const albums = useMemo(() => Object.entries(groupAlbums(gallery)).map(([title, photos]) => ({
    key: title, title, image: photos[0]?.url, photos,
    images: photos.map(photo => photo.url),
    meta: `${photos.length} ${photos.length === 1 ? 'fotografía' : 'fotografías'}`,
  })), [gallery]);

  useEffect(() => {
    const album = albums.find(item => item.title === requestedAlbum);
    if (album) { setTab('gallery'); setOpenKey(album.key); }
  }, [albums, requestedAlbum]);

  useEffect(() => {
    let active = true;
    setLoading(true); setFeedError(false);
    (async () => {
      try {
        let next = 1;
        const photos = [];
        do {
          const { data } = await apiClient.get(`/gallery/?limit=200&page=${next}`);
          photos.push(...(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []));
          next = data?.meta?.pages > next ? next + 1 : 0;
        } while (active && next);
        if (active) setGallery(photos);
      } catch { if (active) setFeedError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [attempt]);

  return <main className="min-h-screen overflow-clip">
    <PageHero title="Galería" subtitle="Abre un álbum y recorre sus fotografías, una a la vez." photoSlot="hero_galeria" photoFallback="/images/backgrounds/comunidad-templo.webp" />
    {loading || feedError ? <div className="max-w-4xl mx-auto px-6"><CollectionStatus loading={loading} label="los álbumes" onRetry={() => setAttempt(value => value + 1)} /></div> : <SceneCarousel items={albums} label="Álbumes" empty="Sin fotos publicadas aún." onOpen={key => { setTab('gallery'); setOpenKey(key); }} />}
    <WindowStack items={albums.map(album => ({ ...album, images: tab === 'photos' ? album.images : [album.image] }))} openKey={openKey} onChange={setOpenKey} height="min(76svh, 580px)" light photoBackdrop animated neighborTitles renderContent={(album, { photoIndex }) => <>
      <PhotoTabs value={tab} onChange={setTab} id="gallery" />
      <div key={tab} role="tabpanel" id="gallery-panel" aria-labelledby={`gallery-tab-${tab}`} tabIndex={0} className="focus-ring rounded-[8px] text-bg">
        {tab === 'gallery' && <button type="button" className="w-full py-5 text-left focus-ring rounded-[8px]" onClick={() => { setTab('photos'); document.getElementById('gallery-tab-photos')?.focus(); }}><span className="block text-20 font-bold">{album.title}</span><span className="block mt-2 text-14 text-bg/70">{album.meta} · Ver fotos</span></button>}
        {tab === 'photos' && <div className="py-5 space-y-3" aria-live="polite">
          <p className="text-17 font-semibold">{album.photos[photoIndex]?.title}</p>
          {album.photos[photoIndex]?.description && <p className="text-15 text-bg/75 leading-relaxed">{album.photos[photoIndex].description}</p>}
          <p className="text-13 text-bg/65">Cambia la fotografía con los controles de fondo.</p>
        </div>}
        {tab === 'info' && <div className="space-y-4 py-5">{album.photos.some(photo => photo.description) ? album.photos.filter(photo => photo.description).map(photo => <p key={photo.ID || photo.url} className="text-15 text-bg/80 leading-relaxed">{photo.description}</p>) : <p className="text-15 text-bg/70">Sin descripción publicada.</p>}</div>}
      </div>
    </>} />
  </main>;
}
