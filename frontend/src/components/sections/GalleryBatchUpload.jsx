import { useId, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { uploadGalleryFile } from '../../lib/galleryUpload';

export default function GalleryBatchUpload({ albums, onDone }) {
  const [album,setAlbum]=useState('');
  const [jobs,setJobs]=useState([]);
  const [busy,setBusy]=useState(false);
  const id=useId();
  const change=(key,patch)=>setJobs(current=>current.map(job=>job.key===key?{...job,...patch}:job));
  const run=async()=>{
    setBusy(true);
    try {
      for (const job of jobs.filter(item=>item.status!=='done')) {
        let url=job.url;
        try {
          change(job.key,{status:'Subiendo',error:''});
          if (!url) {url=await uploadGalleryFile(job.file);change(job.key,{url});}
          change(job.key,{status:'Guardando'});
          await apiClient.post('/admin/gallery/',{album:album.trim(),title:job.file.name.replace(/\.[^.]+$/,''),url,is_active:true}, {headers:{'Idempotency-Key':job.key}});
          change(job.key,{status:'done'});
        } catch(error) {change(job.key,{status:'error',error:error.response?.data?.error || error.message || 'No se pudo guardar. Puedes reintentar.'});}
      }
      onDone();
    } finally {setBusy(false);}
  };
  return <section className="glass-light rounded-[16px] p-5 mb-6 text-bg space-y-4" aria-label="Subida de fotografías">
    <h2 className="text-20 font-bold">Subir fotografías a un álbum</h2>
    <label className="block text-14 font-semibold">Álbum<input className="input-light mt-2" list={id} value={album} onChange={event=>setAlbum(event.target.value)} maxLength={150} disabled={busy || jobs.some(job=>job.status==='done')} placeholder="Elige uno o escribe un nuevo nombre" /></label>
    <datalist id={id}>{albums.map(name=><option key={name} value={name}/>)}</datalist>
    <label className="block text-14 font-semibold">Fotografías<input type="file" accept="image/*" multiple disabled={busy} className="block mt-2 max-w-full text-14" onChange={event=>setJobs(Array.from(event.target.files || []).slice(0,20).map(file=>({file,key:crypto.randomUUID(),status:'Pendiente',url:''})))} /></label>
    <p className="text-13 text-bg/70">Hasta 20 fotografías por selección. Se preparan para la web y se publican en el álbum elegido.</p>
    {jobs.length>0 && <ul aria-live="polite" className="space-y-2">{jobs.map(job=><li key={job.key} className="border-t border-bg/10 pt-2 text-13 [overflow-wrap:anywhere]"><span className="font-semibold">{job.file.name}</span> · {job.status==='done'?'Publicada':job.status==='error'?'Pendiente de reintento':job.status}{job.error && <p role="alert" className="text-rose mt-1">{job.error}</p>}</li>)}</ul>}
    <button type="button" disabled={busy || !album.trim() || !jobs.some(job=>job.status!=='done')} onClick={run} className="min-h-11 px-5 rounded-[12px] bg-bg text-white font-semibold focus-ring disabled:opacity-50">{busy?'Procesando fotografías…':'Subir y publicar'}</button>
  </section>;
}
