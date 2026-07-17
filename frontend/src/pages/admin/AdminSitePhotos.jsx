// ============================================================
//  AdminSitePhotos — reemplaza las fotos ambiente de secciones
//  fijas del sitio público (página Nosotros) y las fotos de cada
//  categoría de célula, sin tocar código ni pedir un deploy.
//  Sube a R2 vía /upload y guarda la URL en el slot correspondiente.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon } from '../../components/ui/Glass';

function PhotoRow({ label, sublabel, imageUrl, uploading, onPick }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-bg/10">
      <div className="glass-light rounded-[20px] card-spring w-20 h-20 overflow-hidden shrink-0">
        {imageUrl
          ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-bg/50">
              <Icon name="image" className="w-[26px] h-[26px]" stroke={1.8} />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-title-s font-semibold text-bg truncate">{label}</p>
        {sublabel && <p className="text-label-s text-bg/50 mt-0.5">{sublabel}</p>}
        {!imageUrl && <p className="text-label-s mt-1" style={{ color: 'var(--pri)' }}>Usando la imagen por defecto del sitio</p>}
      </div>
      <label className="shrink-0 px-4 py-2.5 rounded-full border border-bg/10 text-label-m font-semibold text-bg hover:bg-bg/6 cursor-pointer transition-colors">
        {uploading ? 'Subiendo…' : 'Cambiar foto'}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onPick} />
      </label>
    </div>
  );
}

export default function AdminSitePhotos() {
  const [sitePhotos, setSitePhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);

  const load = () => {
    Promise.all([
      apiClient.get('/admin/site-photos'),
      apiClient.get('/admin/cell-categories'),
    ]).then(([sp, cats]) => {
      setSitePhotos(sp.data || []);
      setCategories(cats.data || []);
    }).catch(() => toast.error('Error al cargar fotos'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const uploadTo = async (file, folder) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post(`/upload?folder=${folder}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url;
  };

  const handleSitePhoto = async (key, file) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const url = await uploadTo(file, 'site-photos');
      await apiClient.put(`/admin/site-photos/${key}`, { image_url: url });
      setSitePhotos(prev => prev.map(p => p.key === key ? { ...p, image_url: url } : p));
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir la foto'); }
    finally { setUploadingKey(null); }
  };

  const handleCategoryPhoto = async (cat, file) => {
    if (!file) return;
    setUploadingKey(`cat-${cat.ID}`);
    try {
      const url = await uploadTo(file, 'celulas');
      await apiClient.put(`/admin/cell-categories/${cat.ID}`, { image_url: url });
      setCategories(prev => prev.map(c => c.ID === cat.ID ? { ...c, image_url: url } : c));
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir la foto'); }
    finally { setUploadingKey(null); }
  };

  if (loading) {
    return <div className="p-8 text-bg/50">Cargando…</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-headline-s font-bold text-bg">Fotos del sitio</h1>
        <p className="text-body-s text-bg/50 mt-1">
          Estas fotos aparecen como fondo ambiente en la página pública. Si no subes una,
          el sitio usa una imagen por defecto — nunca queda un espacio vacío.
        </p>
      </div>

      <section>
        <h2 className="text-title-m font-bold text-bg mb-4">Página Nosotros</h2>
        <div className="space-y-3">
          {sitePhotos.map(p => (
            <PhotoRow
              key={p.key}
              label={p.label}
              imageUrl={p.image_url}
              uploading={uploadingKey === p.key}
              onPick={e => handleSitePhoto(p.key, e.target.files[0])}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-title-m font-bold text-bg mb-4">Categorías de células</h2>
        <p className="text-label-m text-bg/50 mb-4 -mt-2">
          Esta foto aparece en la vista previa del Home y en el panel de /celulas.
        </p>
        <div className="space-y-3">
          {categories.map(cat => (
            <PhotoRow
              key={cat.ID}
              label={cat.name}
              sublabel={cat.age_group}
              imageUrl={cat.image_url}
              uploading={uploadingKey === `cat-${cat.ID}`}
              onPick={e => handleCategoryPhoto(cat, e.target.files[0])}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
