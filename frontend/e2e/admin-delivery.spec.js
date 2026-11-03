import { test, expect } from '@playwright/test';
const photo = '/images/backgrounds/congregacion.webp';
const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 99, name: 'Administrador', role: 'admin', exp: 2000000000 })).toString('base64url'), 'fixture'].join('.');
const cells = [
  { ID: 1, code: 'V1', name: 'Comunidad del norte', type: 'hombres', leader_id: 21, leader: { name: 'José' }, day: 'Miércoles', time: '7 PM', address: 'Dirección existente', map_url: 'https://maps.app.goo.gl/example', is_active: true },
  { ID: 2, code: 'M2', name: 'Mujeres de la comunidad', type: 'mujeres', leader_id: 22, leader: { name: 'Ana' }, is_active: false },
];
async function isolate(page, handler = () => undefined) {
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const result = await handler(path, route.request(), url) || {};
      const defaults = { '/admin/cells': cells, '/admin/leaders': [], '/settings': {}, '/site-photos': {}, '/hero/active': null, '/admin/notifications/counts': {} };
      return route.fulfill({ status: result.status || 200, contentType: 'application/json', body: JSON.stringify(result.body ?? defaults[path] ?? []) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
for (const width of [320, 768, 1440]) {
  test(`cells remain editable and responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); const writes = [];
    await isolate(page, (path, request) => { if (request.method() === 'PUT') { writes.push(request.postDataJSON()); return { body: {} }; } });
    await page.goto('/admin/cells');
    await expect(page.getByRole('status')).toContainText('2 de 2');
    await page.getByLabel('Buscar células').fill('jose');
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Código *', { exact: true })).toHaveValue('V1');
    await expect(dialog.getByLabel('Líder *', { exact: true })).toHaveValue('21');
    await dialog.getByLabel('Nombre *', { exact: true }).fill('Comunidad renovada');
    await dialog.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(writes[0]).toMatchObject({ code: 'V1', leader_id: 21, name: 'Comunidad renovada', address: 'Dirección existente' });
    await page.getByLabel('Buscar células').fill('');
    await page.getByRole('article', { name: 'Mujeres de la comunidad', exact: true }).getByRole('button', { name: 'Editar', exact: true }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Nombre *', { exact: true })).toHaveValue('Mujeres de la comunidad');
    await expect(dialog.getByLabel('Líder *', { exact: true })).toHaveValue('22');
    expect(await dialog.evaluate(el => { const rect = el.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight; })).toBe(true);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('cell load and save failures are explicit and preserve drafts', async ({ page }) => {
  let failLoad = true; let failSave = true;
  await isolate(page, (path, request) => {
    if (path === '/admin/cells' && failLoad) return { status: 503, body: {} };
    if (request.method() === 'PUT' && failSave) return { status: 503, body: { error: 'No se pudo guardar la reunión' } };
  });
  await page.goto('/admin/cells');
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar');
  failLoad = false; await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.getByRole('article').first().getByRole('button', { name: 'Editar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Día', { exact: true }).fill('Viernes');
  await dialog.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('No se pudo guardar la reunión');
  await expect(dialog.getByLabel('Día', { exact: true })).toHaveValue('Viernes');
  failSave = false; await dialog.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
test('categories upload a photograph and retain their draft on a failed save', async ({ page }) => {
  const writes = []; let failSave = true;
  await isolate(page, (path, request) => {
    if (path === '/admin/cell-categories') return { body: [{ ID: 10, name: 'Varones', type_key: 'hombres', description: 'Descripción original', image_url: photo, is_active: true, sort_order: 2 }] };
    if (path === '/upload') return { body: { url: 'https://media.example.org/celulas/group.jpg' } };
    if (request.method() === 'PUT') { writes.push(request.postDataJSON()); return failSave ? { status: 503, body: {} } : { body: {} }; }
  });
  await page.goto('/admin/cell-categories'); await page.getByRole('button', { name: 'Editar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Subir fotografía', { exact: true }).setInputFiles({ name: 'panoramica.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fixture-image') });
  await expect(dialog.getByLabel('Enlace de la fotografía')).toHaveValue('https://media.example.org/celulas/group.jpg');
  await dialog.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByLabel('Enlace de la fotografía')).toHaveValue('https://media.example.org/celulas/group.jpg');
  failSave = false; await dialog.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes.at(-1)).toMatchObject({ image_url: 'https://media.example.org/celulas/group.jpg', type_key: 'hombres', is_active: true, sort_order: 2 });
});
test('social text and profiles are editable and hiding a profile hides it everywhere', async ({ page }) => {
  const settings = { social_title: 'Síguenos', social_intro: 'Nuestra comunidad', social_instagram_url: 'https://instagram.com/ig.casadelrey/', social_instagram_description: '', social_facebook_url: '', social_facebook_description: '', social_tiktok_url: '', social_tiktok_description: '', social_x_url: '', social_x_description: '', social_youtube_url: '', social_youtube_description: '' };
  const requests = [];
  await isolate(page, (path, request) => {
    requests.push(path);
    if (path === '/admin/settings') return { body: Object.entries(settings).map(([key, value]) => ({ key, label: key, value })) };
    if (path.startsWith('/admin/settings/')) { settings[path.split('/').at(-1)] = request.postDataJSON().value; return { body: {} }; }
    if (path === '/settings') return { body: settings };
    if (path === '/social/feed') return { body: [{ caption: 'Cita antigua que ya no debe publicarse' }] };
  });
  await page.goto('/admin/social');
  await page.getByLabel('Título del apartado', { exact: true }).fill('Conecta con nosotros');
  await page.getByLabel('Descripción de Instagram', { exact: true }).fill('Un texto escrito por la iglesia');
  await page.getByRole('button', { name: 'Guardar presentación' }).click();
  await expect(page.getByLabel('Descripción de Instagram', { exact: true })).toHaveValue('Un texto escrito por la iglesia');
  await page.getByRole('button', { name: 'Guardar Instagram', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar Instagram', exact: true })).toBeDisabled();
  await page.goto('/'); const social = page.getByRole('region', { name: 'Redes de la comunidad' });
  await expect(social.getByRole('heading', { name: 'Conecta con nosotros' })).toBeVisible();
  await expect(social.getByText('Un texto escrito por la iglesia')).toBeVisible();
  await expect(social.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', settings.social_instagram_url);
  expect(requests).not.toContain('/social/feed');
  await page.goto('/admin/social'); await page.getByLabel('Enlace del perfil de Instagram', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Guardar Instagram', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar Instagram', exact: true })).toBeDisabled();
  await page.goto('/');
  await expect(page.locator('footer').getByRole('link', { name: 'Instagram', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Redes de la comunidad' })).toHaveCount(0);
});
test('social editor rejects post links and keeps unsaved copy after a failed save', async ({ page }) => {
  await isolate(page, (path, request) => {
    if (path === '/admin/settings') return { body: [{ key: 'social_title', value: 'Redes' }, { key: 'social_instagram_url', value: '' }, { key: 'social_instagram_description', value: '' }] };
    if (request.method() === 'PUT') return { status: 503, body: { error: 'El servidor no está disponible' } };
  });
  await page.goto('/admin/social'); await page.getByLabel('Enlace del perfil de Instagram', { exact: true }).fill('https://instagram.com/p/123/');
  await expect(page.getByRole('button', { name: 'Guardar Instagram', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Enlace del perfil de Instagram', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Enlace del perfil de Instagram', { exact: true }).fill('https://instagram.com/church/');
  await page.getByLabel('Descripción de Instagram', { exact: true }).fill('Texto pendiente');
  await page.getByRole('button', { name: 'Guardar Instagram', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('El servidor no está disponible');
  await expect(page.getByLabel('Descripción de Instagram', { exact: true })).toHaveValue('Texto pendiente');
});
test('mobile admin navigation searches without accents and returns keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await isolate(page); await page.goto('/admin/cells');
  await page.getByRole('button', { name: 'Menú', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Menú de administración' });
  await dialog.getByLabel('Buscar en el panel').fill('celulas');
  await expect(dialog.getByRole('link', { name: 'Categorías de células', exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Menú', exact: true })).toBeFocused();
});
test('dashboard shows actual pending reports and requests only received donations', async ({ page }) => {
  let receivedOnly = false;
  await isolate(page, (path, request, url) => {
    if (path === '/admin/kpis') return { status: 503, body: {} };
    if (path === '/admin/notifications/counts') return { body: { pending_reports: 7 } };
    if (path === '/admin/donations') { receivedOnly = url.searchParams.get('status') === 'received'; return { body: { data: [] } }; }
  });
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: /Reportes de células pendientes 7/ })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Algunos datos no están disponibles');
  await expect(page.getByRole('region', { name: 'Actividad de la iglesia' })).toContainText('—');
  expect(receivedOnly).toBe(true);
});

const supportOptions={modules:[{value:'celulas',label:'Células y reportes'}],states:[{value:'abierto',label:'Abierto'},{value:'en_revision',label:'En revisión'},{value:'esperando_respuesta',label:'Esperando respuesta'},{value:'resuelto',label:'Resuelto'}]};
const supportPNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
async function supportFixture(page,role='admin'){
 const supportToken=[Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url'),Buffer.from(JSON.stringify({user_id:role==='admin'?99:21,name:role==='admin'?'Administrador':'Líder',role,exp:2000000000})).toString('base64url'),'fixture'].join('.');
 await page.addInitScript(value=>localStorage.setItem('token',value),supportToken);await page.emulateMedia({reducedMotion:'reduce'});
 const state={tickets:[],messages:[],attachments:[],creates:[],uploads:[],replies:[],changes:[],failUpload:false,failReply:false,conflict:false};
 await page.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());
 if(url.pathname.includes('/api/v1')){
 const path=url.pathname.split('/api/v1')[1];let body={},status=200;
 if(path==='/support/options')body=supportOptions;
 else if(path==='/settings')body={support_intro:'Incluye los pasos para reproducir el problema.'};
 else if(path.endsWith('/notifications/counts'))body={pending_support:1};
 else if(path==='/support/tickets' && request.method()==='POST'){
 const payload=request.postDataJSON();state.creates.push(payload);const ticket={ID:71,...payload,owner_id:21,owner_name:'Líder de célula',status:'abierto',revision:0,CreatedAt:'2026-11-02T12:00:00Z',UpdatedAt:'2026-11-02T12:00:00Z'};state.tickets=[ticket];state.messages=[{ID:1,body:payload.body,kind:'mensaje',author_name:'Líder de célula',CreatedAt:ticket.CreatedAt}];body=ticket;status=201;
 }else if(path==='/support/tickets')body={data:state.tickets,meta:{total:state.tickets.length,page:1,pages:1}};
 else if(path==='/support/tickets/71')body={ticket:state.tickets[0],messages:[...state.messages].reverse(),attachments:state.attachments,meta:{total:state.messages.length,page:1,pages:1}};
 else if(path==='/support/tickets/71/attachments'){
 state.uploads.push(request.headers()['idempotency-key']);if(state.failUpload){status=503;body={error:'No se pudo guardar la captura. Puedes reintentar.'};}else{body={ID:9,name:'captura.png',size:128,author_name:'Líder de célula',CreatedAt:'2026-11-02T12:00:00Z'};state.attachments=[body];status=201;}
 }else if(path==='/support/tickets/71/attachments/9/file')return route.fulfill({status:200,contentType:'image/png',body:supportPNG});
 else if(path==='/support/tickets/71/messages'){
 state.replies.push(request.postDataJSON());if(state.failReply){status=503;body={error:'No se pudo enviar la respuesta.'};}else{body={ID:state.messages.length+1,body:request.postDataJSON().body,kind:'mensaje',author_name:'Administrador',CreatedAt:'2026-11-02T13:00:00Z'};state.messages.push(body);state.tickets[0].revision++;status=201;}
 }else if(path==='/support/tickets/71/status'){
 const payload=request.postDataJSON();state.changes.push(payload);
 if(state.conflict){state.conflict=false;state.tickets[0].revision++;state.tickets[0].status='en_revision';status=409;body={error:'El caso cambió. Actualízalo antes de cambiar su estado.'};}
 else{const previous=state.tickets[0].status;state.tickets[0].status=payload.status;state.tickets[0].revision++;state.messages.push({ID:state.messages.length+1,kind:'estado',previous_status:previous,status:payload.status,body:payload.note,author_name:role==='admin'?'Administrador':'Líder',CreatedAt:'2026-11-02T13:30:00Z'});body=state.tickets[0];}
 }
 return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 }
 if(!['localhost','127.0.0.1'].includes(url.hostname))return route.abort();return route.continue();
 });return state;
}
for(const width of [320,768,1440])test(`support creates one case and retries private captures at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const state=await supportFixture(page);state.failUpload=true;
 await page.goto('/admin/support');await expect(page.getByText('No hay casos registrados.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Nuevo caso',exact:true}).click();
 const form=page.getByRole('dialog',{name:'Nuevo caso de soporte'});
 await form.getByLabel('Asunto',{exact:true}).fill('No puedo guardar el reporte de asistencia');await form.getByLabel('Módulo afectado',{exact:true}).selectOption('celulas');await form.getByLabel('Descripción del problema',{exact:true}).fill('Al guardar el reporte aparece un error y no se reflejan los asistentes.');
 await form.getByLabel('Capturas del problema',{exact:true}).setInputFiles({name:'captura.png',mimeType:'image/png',buffer:supportPNG});await form.getByRole('button',{name:'Enviar caso',exact:true}).click();
 await expect(form.getByRole('alert')).toContainText('No se pudo guardar');await expect(form.getByLabel('Asunto',{exact:true})).toHaveValue('No puedo guardar el reporte de asistencia');await expect(form.getByLabel('Asunto',{exact:true})).toBeDisabled();
 state.failUpload=false;await form.getByRole('button',{name:'Reintentar capturas',exact:true}).click();
 const detail=page.getByRole('dialog',{name:'Caso de soporte SUP-00071'});await expect(detail.getByRole('heading',{name:'No puedo guardar el reporte de asistencia'})).toBeVisible();expect(state.creates).toHaveLength(1);expect(state.uploads).toHaveLength(2);expect(state.uploads[0]).toEqual(state.uploads[1]);
 if([320,1440].includes(width)){
 await expect.poll(()=>detail.evaluate(element=>`${getComputedStyle(element).opacity}|${getComputedStyle(element.parentElement).opacity}`)).toBe('1|1');
 await page.screenshot({path:`../docs/soporte-2026-11-02/caso-${width}.png`});
 }
 await detail.getByRole('button',{name:/captura.png/}).click();const capture=page.getByRole('dialog',{name:'Captura: captura.png'});await expect(capture.getByRole('img',{name:'captura.png',exact:true})).toHaveAttribute('src',/^blob:/);
 expect(await capture.evaluate(element=>{const r=element.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;})).toBe(true);await capture.getByRole('button',{name:'Cerrar',exact:true}).click();await expect(capture).toHaveCount(0);await expect(detail).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await detail.getByRole('button',{name:'Cerrar',exact:true}).click();await expect(detail).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Casos de soporte'}).getByRole('button',{name:/No puedo guardar el reporte/})).toBeVisible();
 if([320,1440].includes(width))await page.screenshot({path:`../docs/soporte-2026-11-02/lista-${width}.png`});
});
test('support preserves replies on errors and handles concurrent state changes',async({page})=>{
 const state=await supportFixture(page);state.tickets=[{ID:71,subject:'Error en el reporte',module:'celulas',owner_name:'Líder de célula',status:'abierto',revision:0,CreatedAt:'2026-11-02T12:00:00Z',UpdatedAt:'2026-11-02T12:00:00Z'}];state.messages=[{ID:1,kind:'mensaje',author_name:'Líder de célula',body:'El reporte no se guarda.',CreatedAt:'2026-11-02T12:00:00Z'}];state.failReply=true;
 await page.goto('/admin/support?case=71');const detail=page.getByRole('dialog',{name:'Caso de soporte SUP-00071'});await detail.getByLabel('Tu respuesta',{exact:true}).fill('¿Puedes indicar la fecha de la reunión?');await detail.getByRole('button',{name:'Enviar respuesta',exact:true}).click();await expect(detail.getByRole('alert')).toContainText('No se pudo enviar');await expect(detail.getByLabel('Tu respuesta',{exact:true})).toHaveValue('¿Puedes indicar la fecha de la reunión?');
 state.failReply=false;await detail.getByRole('button',{name:'Enviar respuesta',exact:true}).click();await expect(detail.getByLabel('Tu respuesta',{exact:true})).toHaveValue('');await expect(detail.getByText('¿Puedes indicar la fecha de la reunión?',{exact:true})).toBeVisible();
 await detail.getByLabel('Estado del caso',{exact:true}).selectOption('resuelto');await detail.getByLabel('Solución aplicada',{exact:true}).fill('Se corrigió el error y se verificó el reporte.');state.conflict=true;await detail.getByRole('button',{name:'Guardar estado',exact:true}).click();await expect(detail.getByRole('alert')).toContainText('El caso cambió');await expect(detail.getByLabel('Estado del caso',{exact:true})).toHaveValue('en_revision');
 await detail.getByLabel('Estado del caso',{exact:true}).selectOption('resuelto');await expect(detail.getByLabel('Solución aplicada',{exact:true})).toHaveValue('Se corrigió el error y se verificó el reporte.');await detail.getByRole('button',{name:'Guardar estado',exact:true}).click();await expect(detail.getByRole('button',{name:'Reabrir caso',exact:true})).toBeVisible();await expect(detail.getByLabel('Tu respuesta',{exact:true})).toHaveCount(0);await detail.getByRole('button',{name:'Reabrir caso',exact:true}).click();await expect(detail.getByLabel('Tu respuesta',{exact:true})).toBeVisible();expect(state.changes.at(-1).status).toBe('abierto');
});
test('leader support offers reopening without administrative controls',async({page})=>{
 const state=await supportFixture(page,'leader');state.tickets=[{ID:71,subject:'Reporte de asistencia',module:'celulas',owner_name:'Líder de célula',status:'resuelto',revision:2,CreatedAt:'2026-11-02T12:00:00Z',UpdatedAt:'2026-11-02T12:00:00Z'}];await page.goto('/leader/support?case=71');const detail=page.getByRole('dialog',{name:'Caso de soporte SUP-00071'});await expect(detail.getByRole('button',{name:'Reabrir caso'})).toBeVisible();await expect(detail.getByLabel('Estado del caso')).toHaveCount(0);await detail.getByRole('button',{name:'Reabrir caso'}).click();await expect(detail.getByLabel('Tu respuesta')).toBeVisible();await expect(detail.getByLabel('Estado del caso')).toHaveCount(0);
});
