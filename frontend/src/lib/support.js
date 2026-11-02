import apiClient from './apiClient';

export const supportNumber = id => `SUP-${String(id).padStart(5,'0')}`;
export const supportDate = value => new Date(value).toLocaleString('es-GT',{dateStyle:'medium',timeStyle:'short'});
export const refreshSupportCounts = () => window.dispatchEvent(new Event('notifications:refresh'));
export const supportLabel = (options,key,value) => options?.[key]?.find(item=>item.value===value)?.label || value;
export function supportFiles(files) {
  const selection=Array.from(files || []);
  if(selection.length>3)throw new Error('Selecciona hasta 3 capturas a la vez.');
  for(const file of selection){
    if(!['image/png','image/jpeg'].includes(file.type) || file.size>5*1024*1024)throw new Error('Selecciona capturas PNG o JPG de hasta 5 MB.');
  }
  return selection.map(file=>({file,key:crypto.randomUUID(),done:false,error:''}));
}
export async function uploadSupportFiles(ticketId,jobs,onChange) {
  let failed=false;
  for(const job of jobs.filter(item=>!item.done)){
    onChange(job.key,{error:'',uploading:true});
    try {
      const data=new FormData();data.append('file',job.file);
      await apiClient.post(`/support/tickets/${ticketId}/attachments`,data,{headers:{'Content-Type':'multipart/form-data','Idempotency-Key':job.key}});
      onChange(job.key,{done:true,uploading:false});
    }catch(error){failed=true;onChange(job.key,{uploading:false,error:error.response?.data?.error || 'No se pudo guardar. Puedes reintentar esta captura.'});}
  }
  return !failed;
}
