import { test, expect } from '@playwright/test';
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const token=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({user_id:99,name:'Administrador',role:'admin',exp:2000000000})).toString('base64url'),'fixture'].join('.');
async function isolate(page,handle){
 await page.addInitScript(value=>{localStorage.setItem('token',value);localStorage.setItem('refresh_token','controlled-session');},token);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname.includes('/api/v1')){
   const path=url.pathname.split('/api/v1')[1].replace(/\/$/,'');
   const result=await handle(path,request,url) || {};
   const defaults={'/settings':{},'/site-photos':{},'/admin/notifications/counts':{},'/admin/gallery':{data:[],meta:{total:0,page:1,last_page:1}},'/admin/gallery/albums':['Comunidad']};
   return route.fulfill({status:result.status || 200,contentType:'application/json',body:JSON.stringify(result.body ?? defaults[path] ?? [])});
  }
  if(!['localhost','127.0.0.1'].includes(url.hostname))return route.abort();
  return route.continue();
 });
}
for(const width of [320,768,1440])test(`gallery batch retries only failed saves at ${width}px`,async({page})=>{
 let uploads=0,fail=true;const saved=[];
 await page.setViewportSize({width,height:900});
 await isolate(page,(path,request)=>{
  if(path==='/upload'){uploads++;return{body:{url:`https://media.example.invalid/${uploads}.png`}};}
  if(path==='/admin/gallery' && request.method()==='POST'){
   saved.push({body:request.postDataJSON(),key:request.headers()['idempotency-key']});
   if(fail && saved.length===1)return{status:503,body:{error:'Error controlado de publicación'}};
   return{status:201,body:{}};
  }
 });
 await page.goto('/admin/gallery');
 const section=page.getByRole('region',{name:'Subida de fotografías'});
 await section.getByLabel('Álbum',{exact:true}).fill('Comunidad');
 await section.getByLabel('Fotografías',{exact:true}).setInputFiles([{name:'grupo.png',mimeType:'image/png',buffer:image},{name:'reunion.png',mimeType:'image/png',buffer:image}]);
 await section.getByRole('button',{name:'Subir y publicar'}).click();
 await expect(section.getByRole('alert')).toContainText('Error controlado');
 await expect(section.getByText('Publicada',{exact:false})).toHaveCount(1);
 fail=false;await section.getByRole('button',{name:'Subir y publicar'}).click();
 await expect(section.getByRole('alert')).toHaveCount(0);
 await expect(section.getByRole('button',{name:'Subir y publicar'})).toBeDisabled();
 expect(uploads).toBe(2);expect(saved).toHaveLength(3);expect(saved[0]).toEqual(saved[2]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('administrator edits discovery tags for a newly created department',async({page})=>{
 let saved;
 await isolate(page,(path,request)=>{if(path==='/admin/volunteer-areas' && request.method()==='POST'){saved=request.postDataJSON();return{status:201,body:{}};}});
 await page.goto('/admin/volunteer-areas');
 await page.getByRole('button',{name:/nuevo departamento/i}).click();
 await page.getByLabel(/clave|value/i).first().fill('nuevo_equipo');
 await page.getByLabel(/^Título/).fill('Equipo de comunicación');
 await page.getByLabel('Tecnología',{exact:true}).check();
 await page.getByLabel('Entre bastidores',{exact:true}).check();
 await page.getByRole('button',{name:'Crear departamento',exact:true}).click();
 await expect.poll(()=>saved).toMatchObject({value:'nuevo_equipo',interests:['tecnologia'],visibility:['apoyo']});
});
test('financial history honors a receipt link and exposes failed loads',async({page})=>{
 let fail=true;const urls=[];
 await isolate(page,(path,request,url)=>{
  if(path==='/admin/activity-log'){urls.push(url);return fail?{status:503,body:{}}:{body:{data:[{ID:1,user_name:'Administrador',action:'payment_decision',resource:'receipt',resource_id:42,CreatedAt:'2026-11-02T12:00:00Z',details:JSON.stringify({revision:2,previous_state:'verificado',state:'pendiente',reason:'Revisión solicitada'})}],meta:{total:1}}};}
 });
 await page.goto('/admin/activity-log?resource=receipt&resource_id=42');
 await expect(page.getByRole('alert')).toContainText('No se pudo consultar');
 fail=false;await page.getByRole('button',{name:'Reintentar'}).click();
 await expect(page.getByText(/Revisión 2: verificado/)).toContainText('Revisión solicitada');
 expect(urls.at(-1).searchParams.get('resource_id')).toBe('42');
});
