const { chromium } = require('../../frontend/node_modules/@playwright/test');
const fs = require('fs');
const out = __dirname;
const publicRoutes = ['/', '/about', '/celulas', '/volunteering', '/events', '/blog', '/gallery', '/conectate', '/prayer', '/donate', '/comprobante', '/login', '/register', '/forgot-password', '/reset-password/audit-token', '/verify-email', '/payment-success', '/404-audit', '/profile'];
const adminRoutes = ['', 'users', 'blog', 'events', 'petitions', 'volunteers', 'cell-reports', 'boletas', 'social', 'announcements', 'gallery', 'faqs', 'leaders', 'cells', 'cell-categories', 'volunteer-areas', 'donation-purposes', 'activity-log', 'receipts', 'donations', 'hero', 'site-photos', 'settings', 'connect-cards', 'profile'].map(p=>'/admin'+(p?'/'+p:''));
const leaderRoutes=['','reports','boletas','volunteers','cell-directory','connect-cards','events','my-directory','my-cell','profile'].map(p=>'/leader'+(p?'/'+p:''));
const token=role=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({user_id:999999,name:'Auditor local',email:'audit@example.invalid',role,exp:2000000000})).toString('base64url'),'local-ui-fixture'].join('.');
(async()=>{
 const browser=await chromium.launch({headless:true}); const results=[];
 for(const [mode,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 for(const [role,routes] of [['anonymous',publicRoutes],['admin',adminRoutes],['leader',leaderRoutes],['volunteer',['/volunteer/dashboard']]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(({t})=>{sessionStorage.setItem('cdr-splash-seen','1');if(t)localStorage.setItem('token',t)}, {t:role==='anonymous'?null:token(role)});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.includes('/api/v1')){
    const path=url.pathname.split('/api/v1')[1]; let body=[];
    if(path==='/settings'||path==='/site-photos')body={};
    else if(path==='/admin/kpis/trend')body=[];
    else if(path.includes('/kpis')||path.includes('/stats')||path.includes('/counts'))body={};
    else if(path.includes('/my-cell')||path.includes('/my-directory-entry'))return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'No hay ficha asignada'})});
    else if(path==='/hero/active'||path==='/volunteer/me'||path.includes('/my-cell')||path.includes('/my-directory-entry'))body=null;
    else if(path==='/auth/verify-email'){return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Token de auditoría inválido'})});}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
   }
   if(url.hostname!=='127.0.0.1'&&url.hostname!=='localhost')return route.abort();
   return route.continue();
  });
  const page=await context.newPage(); let errors=[]; page.on('pageerror',e=>errors.push(e.message));
  for(const path of routes){
   errors=[];try{
    await page.goto('http://127.0.0.1:5173'+path,{waitUntil:'networkidle'});await page.waitForTimeout(200);
    const stats=await page.evaluate(()=>{
     const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
     const labels=e=>e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.labels?.length||e.getAttribute('title');
     return {title:document.title,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),overflow:document.documentElement.scrollWidth>innerWidth,body:document.body.innerText.slice(0,100),brokenImages:[...document.images].filter(e=>e.complete&&e.naturalWidth===0).map(e=>e.getAttribute('src')),unlabelledFields:[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible).filter(e=>!labels(e)).map(e=>({tag:e.tagName,type:e.type,placeholder:e.getAttribute('placeholder')})),smallButtons:[...document.querySelectorAll('button,a')].filter(visible).filter(e=>e.getBoundingClientRect().height<24&&e.getBoundingClientRect().width<24).map(e=>e.textContent?.trim()),svgCount:document.querySelectorAll('svg').length};
    });
    results.push({mode,role,path,url:page.url(),errors:[...errors],...stats});
    if(['/','/about','/celulas','/login','/donate','/prayer','/conectate','/admin','/admin/settings','/leader','/volunteer/dashboard'].includes(path))await page.screenshot({path:out+'/'+mode+'-'+(path==='/'?'home':path.slice(1).replaceAll('/','-'))+'.jpg',fullPage:true,quality:82});
   }catch(e){results.push({mode,role,path,error:e.message})}
  }
  await context.close();
 }
 }
 fs.writeFileSync(out+'/route-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({total:results.length,issues:results.filter(r=>r.error||r.errors?.length||r.overflow||r.h1?.length!==1||r.unlabelledFields?.length||r.brokenImages?.length)},null,2));
 await browser.close();
})();
