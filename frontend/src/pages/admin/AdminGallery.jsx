import { useCallback, useEffect, useId, useState } from 'react';
import PhotoImage from '../../components/ui/PhotoImage';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Paginator from '../../components/ui/Paginator';
import GalleryBatchUpload from '../../components/sections/GalleryBatchUpload';
import { uploadGalleryFile } from '../../lib/galleryUpload';

const EMPTY = { title: '', album: '', description: '', url: '', thumbnail_url: '', sort_order: 0, is_active: true };

function PhotoForm({ photo, albums, onSave, onCancel }) {
  const [form, setForm] = useState(photo ? {...photo,album:photo.album || (photo.title?.includes(' - ') ? photo.title.split(' - ')[0] : 'Otros')} : EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading,setUploading]=useState(false);
  const albumId=useId();
  const set = k => e => setForm(p => ({ ...p, [k]: k === 'sort_order' ? Number(e.target.value) : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast.error('La URL de la foto es obligatoria'); return; }
    setLoading(true);
    try {
      if (photo) await apiClient.put(`/admin/gallery/${photo.ID}`, form);
      else await apiClient.post('/admin/gallery/', form);
      toast.success(photo ? 'Foto actualizada' : 'Foto agregada');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-14 font-semibold">Álbum<input className="input-light mt-2" list={albumId} value={form.album} onChange={set('album')} maxLength={150} placeholder="Elige uno o escribe un nombre" /></label>
      <datalist id={albumId}>{albums.map(name=><option key={name} value={name}/>)}</datalist>
      <label className="block text-14 font-semibold">Subir fotografía<input type="file" accept="image/*" disabled={uploading || loading} className="block max-w-full mt-2 text-14" onChange={async event=>{
        const file=event.target.files?.[0];if(!file)return;setUploading(true);
        try {const url=await uploadGalleryFile(file);setForm(previous=>({...previous,url}));}catch(error){toast.error(error.response?.data?.error || error.message || 'No se pudo subir.');}finally{setUploading(false);}
      }} /></label>
      {uploading && <p role="status">Preparando fotografía…</p>}
      <Input
        label={<>URL de la foto <span className="text-rose">*</span></>}
        value={form.url} onChange={set('url')} placeholder="https://…" required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Título" value={form.title} onChange={set('title')} placeholder="Álbum - Nombre de la foto" />
        <Input label="URL miniatura" value={form.thumbnail_url} onChange={set('thumbnail_url')} placeholder="https://… (opcional)" />
      </div>
      <Textarea label="Descripción" rows={2} value={form.description} onChange={set('description')} placeholder="Descripción breve…" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Orden" type="number" value={form.sort_order} onChange={set('sort_order')} min={0} />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded" />
            <span className="text-body-s text-bg">Activa</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading || uploading} className="flex-1 justify-center">
          {loading ? 'Guardando…' : photo ? 'Guardar cambios' : 'Agregar foto'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminGallery() {
  const [photos, setPhotos]   = useState([]);
  const [meta,   setMeta]     = useState(null);
  const [page,   setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [albums,setAlbums]=useState([]);
  const [error,setError]=useState('');

  const load = useCallback((p = page) => {
    setLoading(true);
    setError('');
    apiClient.get(`/admin/gallery/?page=${p}&limit=24`)
      .then(r => { setPhotos(r.data.data || []); setMeta(r.data.meta); })
      .catch(()=>setError('No se pudieron cargar las fotografías. Tus cambios sin guardar se conservan.'))
      .finally(() => setLoading(false));
    apiClient.get('/admin/gallery/albums').then(response=>setAlbums(Array.isArray(response.data)?response.data:[])).catch(()=>{});
  },[page]);

  useEffect(() => { load(page); }, [page,load]);

  const handleToggle = async (photo) => {
    try {
      await apiClient.put(`/admin/gallery/${photo.ID}`, { ...photo, is_active: !photo.is_active });
      toast.success(photo.is_active ? 'Foto ocultada' : 'Foto activada');
      load(page);
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await apiClient.delete(`/admin/gallery/${id}`);
      toast.success('Foto eliminada');
      load(page);
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Galería</h1>
            <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} foto{meta?.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(s => !s); }}>
          {showForm ? 'Cancelar' : 'Agregar foto'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring mb-8 p-6">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest mb-5">{editing ? 'Editar foto' : 'Nueva foto'}</p>
          <PhotoForm key={editing?.ID || 'new'} photo={editing} albums={albums} onSave={() => { setEditing(null); setShowForm(false); load(1); setPage(1); }} onCancel={() => {setEditing(null);setShowForm(false);}} />
        </div>
      )}

      <GalleryBatchUpload albums={albums} onDone={()=>load(page)} />
      {error && <div role="alert" className="rounded-[12px] border border-rose/30 p-4 mb-4"><p>{error}</p><button type="button" onClick={()=>load(page)} className="min-h-11 underline font-semibold focus-ring">Reintentar</button></div>}
      {loading ? (
        <p role="status" className="py-16 text-bg/70">Cargando fotografías…</p>
      ) : photos.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <p className="text-body-l text-bg font-medium">Sin fotos</p>
          <p className="text-body-s text-bg/50">Agrega la primera foto con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map(p => (
            <div key={p.ID} className="glass-light rounded-[20px] card-spring group relative overflow-hidden aspect-square">
              <PhotoImage
                src={p.thumbnail_url || p.url}
                alt={p.title}
                className={`w-full h-full object-cover transition-opacity ${p.is_active ? 'opacity-100' : 'opacity-40'}`}
                fallbackSrc={p.thumbnail_url ? p.url : '/images/backgrounds/congregacion.webp'}
              />
              {!p.is_active && (
                <div className="absolute top-2 left-2 bg-black/60 text-ink text-xs px-2 py-0.5 rounded-full">
                  Oculta
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="min-h-11 px-3 rounded-full bg-white text-bg text-12 font-semibold focus-ring">Editar</button>
                <button onClick={() => handleToggle(p)}
                  className="px-3 min-h-11 rounded-full bg-white text-bg text-12 font-semibold hover:bg-white transition-colors">
                  {p.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => handleDelete(p.ID)}
                  className="px-3 min-h-11 rounded-full bg-rose/90 text-ink text-12 font-semibold hover:bg-rose transition-colors">
                  Eliminar
                </button>
              </div>
              {p.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-ink font-medium line-clamp-1">{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
