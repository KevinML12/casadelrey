import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi, useApiResource } from '../../lib/feed';
import apiClient from '../../lib/apiClient';
import { submissionKey, clearSubmissionKey } from '../../lib/submissionKey';
import { supportNumber, supportDate, supportLabel, supportFiles, uploadSupportFiles, refreshSupportCounts } from '../../lib/support';
import ModalWrapper from '../../components/ui/ModalWrapper';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import AdminResourceState from '../../components/ui/AdminResourceState';
import Paginator from '../../components/ui/Paginator';

const errorText = (error,fallback) => error.response?.data?.error || fallback;
function Status({ticket,options}){
  return <span className={`inline-flex max-w-full rounded-[8px] border px-2.5 py-1 text-12 font-semibold ${ticket.status==='resuelto'?'border-emerald/25 bg-emerald/10 text-bg':ticket.status==='esperando_respuesta'?'border-amber/30 bg-amber/10 text-bg':'border-bg/15 bg-white/60 text-bg'}`}>{supportLabel(options,'states',ticket.status)}</span>;
}
function FileSelection({jobs,onSelect,disabled}){
  return <div className="space-y-2">
    <label className="block text-14 font-semibold">Capturas del problema<input type="file" accept="image/png,image/jpeg" multiple disabled={disabled} onChange={onSelect} className="mt-2 block w-full max-w-full text-13 font-normal file:mr-3 file:min-h-11 file:rounded-[10px] file:border file:border-bg/15 file:bg-white/80 file:px-3 file:text-bg" /></label>
    <p className="text-12 text-bg/65">Hasta 3 PNG o JPG de 5 MB por selección; 12 por caso. Las capturas sólo son visibles para quien reportó y los administradores.</p>
    {jobs.length>0 && <ul aria-live="polite" className="space-y-2 text-13">{jobs.map(job=><li key={job.key} className="rounded-[10px] border border-bg/10 bg-white/40 p-3 [overflow-wrap:anywhere]"><span className="font-semibold">{job.file.name}</span> · {job.done?'Guardada':job.uploading?'Subiendo…':'Pendiente'}{job.error && <p role="alert" className="mt-1 text-rose">{job.error}</p>}</li>)}</ul>}
  </div>;
}
function NewCase({options,intro,onClose,onDone}){
  const [form,setForm]=useState({subject:'',module:'',body:''});
  const [jobs,setJobs]=useState([]);const [created,setCreated]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const set=key=>event=>setForm(previous=>({...previous,[key]:event.target.value}));
  const change=(key,patch)=>setJobs(values=>values.map(job=>job.key===key?{...job,...patch}:job));
  const close=()=>{if(!busy)onClose();};
  const submit=async event=>{
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    try {
      let ticket=created;
      if(!ticket){const key=await submissionKey('support:new',form);const response=await apiClient.post('/support/tickets',form,{headers:{'Idempotency-Key':key}});ticket=response.data;setCreated(ticket);clearSubmissionKey('support:new');refreshSupportCounts();}
      if(await uploadSupportFiles(ticket.ID,jobs,change))onDone(ticket.ID);
    }catch(error){setError(errorText(error,'No se pudo crear el caso. Tu descripción sigue aquí.'));}
    finally{setBusy(false);}
  };
  return <ModalWrapper ariaLabel="Nuevo caso de soporte" wide busy={busy} onClose={close}>
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <header><p className="text-12 font-semibold text-bg/55">Soporte</p><h2 className="mt-1 text-26 font-bold">{created?`${supportNumber(created.ID)} creado`:'Cuéntanos qué ocurrió'}</h2>{intro && <p className="mt-2 text-14 text-bg/70 whitespace-pre-line">{intro}</p>}</header>
      {error && <p role="alert" className="rounded-[12px] border border-rose/25 p-4 text-14">{error}</p>}
      {created && <p role="status" className="rounded-[12px] border border-bg/15 bg-white/55 p-4 text-14">El caso ya está guardado. Puedes reintentar las capturas pendientes o continuar la conversación.</p>}
      <fieldset disabled={busy || !!created} className="space-y-4">
        <Input label="Asunto" value={form.subject} onChange={set('subject')} required minLength={5} maxLength={160} placeholder="¿Qué necesitas resolver?" />
        <Select label="Módulo afectado" value={form.module} onChange={set('module')} required options={options.modules} placeholder="Selecciona el módulo" />
        <Textarea label="Descripción del problema" rows={5} value={form.body} onChange={set('body')} required minLength={10} maxLength={5000} helperText="Qué intentabas hacer, qué ocurrió y qué esperabas. Omite contraseñas y datos bancarios." />
      </fieldset>
      <FileSelection jobs={jobs} disabled={busy || !!created} onSelect={event=>{try{setJobs(supportFiles(event.target.files));setError('');}catch(error){setError(error.message);}}} />
      <div className="flex flex-wrap gap-3 border-t border-bg/10 pt-4"><Button type="submit" disabled={busy}>{busy?'Guardando…':created?'Reintentar capturas':'Enviar caso'}</Button>{created && <Button type="button" variant="outlined" disabled={busy} onClick={()=>onDone(created.ID)}>Continuar al caso</Button>}</div>
    </form>
  </ModalWrapper>;
}
function Capture({ticketId,file,onClose}){
  const [url,setUrl]=useState('');const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true,objectURL;const controller=new AbortController();setError('');setUrl('');
    apiClient.get(`/support/tickets/${ticketId}/attachments/${file.ID}/file`,{responseType:'blob',signal:controller.signal}).then(response=>{
      if(!active)return;if(!['image/png','image/jpeg'].includes(response.data.type))throw new Error();
      objectURL=URL.createObjectURL(response.data);setUrl(objectURL);
    }).catch(()=>{if(active)setError('No se pudo abrir la captura privada.');});
    return()=>{active=false;controller.abort();if(objectURL)URL.revokeObjectURL(objectURL);};
  },[ticketId,file.ID,attempt]);
  return <ModalWrapper ariaLabel={`Captura: ${file.name}`} wide onClose={onClose}>
    <h2 className="text-20 font-bold">{file.name}</h2>
    {error?<AdminResourceState error={error} onRetry={()=>setAttempt(value=>value+1)} />:!url?<AdminResourceState loading />:<figure className="mt-4"><img src={url} alt={file.name} className="max-h-[65svh] w-full rounded-[12px] border border-bg/10 bg-white/40 object-contain" /><figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-13 text-bg/65"><span>{file.author_name} · {supportDate(file.CreatedAt)}</span><a href={url} download={file.name} className="focus-ring inline-flex min-h-11 items-center rounded-[10px] border border-bg/20 bg-white/75 px-4 font-semibold text-bg">Descargar captura</a></figcaption></figure>}
  </ModalWrapper>;
}
function CaseDetail({id,options,onClose,onChanged}){
  const {isAdmin}=useAuth();const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [loadError,setLoadError]=useState('');const [error,setError]=useState('');
  const [page,setPage]=useState(1);const [attempt,setAttempt]=useState(0);const [reply,setReply]=useState('');const [status,setStatus]=useState('');const [note,setNote]=useState('');
  const [busy,setBusy]=useState(false);const [jobs,setJobs]=useState([]);const [capture,setCapture]=useState(null);
  useEffect(()=>{
    const controller=new AbortController();let active=true;setLoading(true);setLoadError('');
    apiClient.get(`/support/tickets/${id}?page=${page}&limit=20`,{signal:controller.signal}).then(response=>{if(active){setData(response.data);setStatus(response.data.ticket.status);}}).catch(error=>{if(active)setLoadError(errorText(error,'No se pudo cargar el caso.'));}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;controller.abort();};
  },[id,page,attempt]);
  const refresh=()=>{setPage(1);setAttempt(value=>value+1);onChanged();refreshSupportCounts();};
  const change=(key,patch)=>setJobs(values=>values.map(job=>job.key===key?{...job,...patch}:job));
  const close=()=>{if(!busy)onClose();};
  const send=async event=>{
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    try{const key=await submissionKey(`support:reply:${id}`,{body:reply});await apiClient.post(`/support/tickets/${id}/messages`,{body:reply},{headers:{'Idempotency-Key':key}});clearSubmissionKey(`support:reply:${id}`);setReply('');refresh();}catch(error){setError(errorText(error,'No se pudo enviar. Tu respuesta se conserva.'));if(error.response?.status===409)setAttempt(value=>value+1);}finally{setBusy(false);}
  };
  const update=async(next)=>{
    if(busy)return;setBusy(true);setError('');
    try{await apiClient.patch(`/support/tickets/${id}/status`,{status:next,revision:data.ticket.revision,note});setNote('');refresh();}catch(error){setError(errorText(error,'No se pudo cambiar el estado.'));if(error.response?.status===409)setAttempt(value=>value+1);}finally{setBusy(false);}
  };
  const upload=async()=>{if(busy)return;setBusy(true);setError('');try{const complete=await uploadSupportFiles(id,jobs,change);if(complete)setJobs([]);refresh();}finally{setBusy(false);}};
  const ticket=data?.ticket;
  return <ModalWrapper ariaLabel={`Caso de soporte ${supportNumber(id)}`} wide busy={busy} onClose={close}>
    <div className="space-y-5">
      {!ticket && loading && <AdminResourceState loading />}
      {loadError && <AdminResourceState error={loadError} onRetry={()=>setAttempt(value=>value+1)} />}
      {ticket && <>
        <header><div className="flex flex-wrap items-center gap-3"><p className="text-12 font-semibold text-bg/55">{supportNumber(id)} · {supportLabel(options,'modules',ticket.module)}</p><Status ticket={ticket} options={options} /></div><h2 className="mt-3 text-24 font-bold leading-tight">{ticket.subject}</h2><p className="mt-2 text-13 text-bg/65">{ticket.owner_name} · {supportDate(ticket.CreatedAt)}</p></header>
        {error && <p role="alert" className="rounded-[12px] border border-rose/30 p-4 text-14">{error}</p>}
        <section aria-label="Conversación del caso" className="space-y-3 border-t border-bg/10 pt-5">
          {[...(data.messages || [])].reverse().map(message=><article key={message.ID} className={`rounded-[12px] border border-bg/10 p-4 ${message.kind==='estado'?'bg-bg/5':'bg-white/55'}`}>
            <div className="flex flex-wrap justify-between gap-2 text-12 text-bg/60"><span className="font-semibold text-bg">{message.author_name}</span><time dateTime={message.CreatedAt}>{supportDate(message.CreatedAt)}</time></div>
            {message.kind==='estado' && <p className="mt-2 text-13 font-semibold">{supportLabel(options,'states',message.previous_status)} → {supportLabel(options,'states',message.status)}</p>}
            {message.body && <p className="mt-2 whitespace-pre-wrap text-14 leading-relaxed [overflow-wrap:anywhere]">{message.body}</p>}
          </article>)}
          <Paginator meta={data.meta} onPage={setPage} />
          <Button variant="text" onClick={()=>setAttempt(value=>value+1)} disabled={busy || loading}>{loading?'Actualizando…':'Actualizar conversación'}</Button>
        </section>
        <section aria-label="Capturas del caso" className="space-y-3 border-t border-bg/10 pt-5"><h3 className="text-16 font-bold">Capturas del caso</h3>
          {data.attachments?.length?<ul className="grid gap-2 sm:grid-cols-2">{data.attachments.map(file=><li key={file.ID}><button type="button" className="focus-ring min-h-14 w-full rounded-[12px] border border-bg/15 bg-white/50 p-3 text-left" onClick={()=>setCapture(file)}><span className="block text-13 font-semibold [overflow-wrap:anywhere]">{file.name}</span><span className="mt-1 block text-12 text-bg/60">Ver captura · {(file.size/1024/1024).toFixed(1)} MB</span></button></li>)}</ul>:<p className="text-13 text-bg/60">Este caso todavía no tiene capturas.</p>}
          {ticket.status!=='resuelto' && <><FileSelection jobs={jobs} disabled={busy || loading} onSelect={event=>{try{setJobs(supportFiles(event.target.files));setError('');}catch(error){setError(error.message);}}} />{jobs.length>0 && <Button onClick={upload} disabled={busy || loading || !jobs.some(job=>!job.done)}>{busy?'Guardando…':'Guardar capturas'}</Button>}</>}
        </section>
        {ticket.status!=='resuelto'?<form onSubmit={send} className="space-y-3 border-t border-bg/10 pt-5"><Textarea label="Tu respuesta" value={reply} onChange={event=>setReply(event.target.value)} minLength={2} maxLength={5000} rows={4} required disabled={busy || loading} /><Button type="submit" disabled={busy || loading || !reply.trim()}>{busy?'Guardando…':'Enviar respuesta'}</Button></form>:<div className="rounded-[12px] border border-bg/15 bg-white/50 p-4"><p className="text-14">El caso está resuelto. Puedes reabrirlo si el problema continúa.</p><Button className="mt-3" variant="outlined" onClick={()=>update('abierto')} disabled={busy || loading}>Reabrir caso</Button></div>}
        {isAdmin && <form className="space-y-3 border-t border-bg/10 pt-5" onSubmit={event=>{event.preventDefault();update(status);}}><h3 className="text-16 font-bold">Seguimiento</h3><Select label="Estado del caso" value={status} onChange={event=>setStatus(event.target.value)} disabled={busy || loading} options={options.states} required /><Textarea label={status==='resuelto'?'Solución aplicada':status==='esperando_respuesta'?'Información que necesitas':'Nota de seguimiento (opcional)'} value={note} onChange={event=>setNote(event.target.value)} required={['resuelto','esperando_respuesta'].includes(status)} minLength={['resuelto','esperando_respuesta'].includes(status)?5:undefined} maxLength={2000} rows={3} disabled={busy || loading} /><Button type="submit" disabled={busy || loading || status===ticket.status}>{busy?'Guardando…':'Guardar estado'}</Button></form>}
      </>}
    </div>
    {capture && <Capture ticketId={id} file={capture} onClose={()=>setCapture(null)} />}
  </ModalWrapper>;
}
export default function SupportPage(){
  const {isAdmin}=useAuth();const optionsResource=useApiResource('/support/options');const options=optionsResource.data;const settings=useApi('/settings') || {};
  const [query,setQuery]=useSearchParams();const [newOpen,setNewOpen]=useState(false);const [tickets,setTickets]=useState([]);const [meta,setMeta]=useState(null);const [status,setStatus]=useState('');const [search,setSearch]=useState('');
  const [page,setPage]=useState(1);const [attempt,setAttempt]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const selected=/^[1-9]\d*$/.test(query.get('case') || '')?query.get('case'):null;
  const open=id=>setQuery(previous=>{const next=new URLSearchParams(previous);next.set('case',id);return next;});
  const close=()=>setQuery(previous=>{const next=new URLSearchParams(previous);next.delete('case');return next;});
  const refresh=useCallback(()=>setAttempt(value=>value+1),[]);
  useEffect(()=>{
    const controller=new AbortController();let active=true;setLoading(true);setError('');
    const timer=setTimeout(()=>{
      const params=new URLSearchParams({page,limit:15});if(status)params.set('status',status);if(search.trim())params.set('q',search.trim());
      apiClient.get(`/support/tickets?${params}`,{signal:controller.signal}).then(response=>{if(active){setTickets(response.data.data || []);setMeta(response.data.meta);}}).catch(error=>{if(active)setError(errorText(error,'No se pudieron cargar los casos.'));}).finally(()=>{if(active)setLoading(false);});
    },200);
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[page,status,search,attempt]);
  return <div className={`mx-auto max-w-5xl space-y-6 [overflow-wrap:anywhere] ${!isAdmin?'p-4 sm:p-6':''}`}>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-12 font-semibold text-bg/55">Acompañamiento</p><h1 className="mt-1 text-28 font-bold tracking-tightish">Centro de soporte</h1><p className="mt-2 max-w-2xl text-14 text-bg/65">{isAdmin?'Atiende los casos del equipo y conserva cada respuesta y solución en un solo lugar.':'Reporta un problema y sigue la respuesta del equipo desde tus propios casos.'}</p></div><Button onClick={()=>setNewOpen(true)} disabled={!options || optionsResource.loading || optionsResource.error}>Nuevo caso</Button></header>
    {optionsResource.error && <AdminResourceState error="No se pudieron cargar las opciones de soporte." onRetry={optionsResource.retry} />}
    <section aria-label="Casos de soporte" className="glass-light rounded-[16px] border border-white/70 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]"><Input label="Buscar por asunto" type="search" value={search} maxLength={160} onChange={event=>{setSearch(event.target.value);setPage(1);}} /><Select label="Filtrar por estado" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}} options={options?.states || []} placeholder="Todos los estados" /></div>
      <p className="mt-4 text-12 text-bg/60">{meta?`${meta.total} ${meta.total===1?'caso':'casos'}`:'Consultando casos…'}</p>
      {loading?<AdminResourceState loading />:error?<AdminResourceState error={error} onRetry={refresh} />:tickets.length===0?<AdminResourceState empty={search || status?'No hay casos con esos filtros.':'No hay casos registrados. Cuando necesites ayuda, abre uno desde Nuevo caso.'} />:<ul className="mt-3 divide-y divide-bg/10">{tickets.map(ticket=><li key={ticket.ID}><button type="button" onClick={()=>open(ticket.ID)} className="focus-ring w-full rounded-[10px] px-2 py-4 text-left transition-colors duration-150 hover:bg-white/45"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-12 font-semibold text-bg/55">{supportNumber(ticket.ID)} · {supportLabel(options,'modules',ticket.module)}</span><Status ticket={ticket} options={options} /></div><span className="mt-2 block text-16 font-bold">{ticket.subject}</span><span className="mt-2 block text-12 text-bg/60">{ticket.owner_name} · {supportDate(ticket.UpdatedAt)} · Abrir conversación</span></button></li>)}</ul>}
      <Paginator meta={meta} onPage={setPage} />
    </section>
    {newOpen && options && <NewCase options={options} intro={settings.support_intro} onClose={()=>setNewOpen(false)} onDone={id=>{setNewOpen(false);refresh();open(id);}} />}
    {selected && options && <CaseDetail key={selected} id={selected} options={options} onClose={close} onChanged={refresh} />}
  </div>;
}
