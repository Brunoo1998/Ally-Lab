import assert from 'node:assert/strict';
const lab='https://ally-lab.pages.dev',forum='https://ally-community.pages.dev';
async function get(url,opts={}){
 const r=await fetch(url,{...opts,signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,200,new URL(url).pathname+' HTTP '+r.status);return r;
}
const sitemap=await (await get(lab+'/sitemap.xml')).text();
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.ok(urls.length>=100);assert.equal(new Set(urls).size,urls.length);
assert.ok(urls.every(u=>new URL(u).origin===lab));
const robots=await (await get(lab+'/robots.txt')).text();assert.ok(robots.includes(lab+'/sitemap.xml'));
for(const url of [...urls.filter(u=>!u.includes('/guias/')), ...urls.filter(u=>u.includes('/guias/')&&u!==lab+'/guias/').slice(0,5)]){
 const r=await get(url);const html=await r.text();assert.match(html,/<html\b/i);assert.match(html,/<title>/i);
}
const index=await (await get(lab+'/datos/retro-busqueda.json')).json();assert.ok(index.length>=24);
const search=await get(forum+'/api/public-search?q=cyberpunk',{headers:{Origin:lab}});
assert.equal(search.headers.get('access-control-allow-origin'),lab);
assert.ok(Array.isArray((await search.json()).rows));
for(const path of ['/api/admin/settings','/api/chat/999999']){
 const r=await fetch(forum+path,{signal:AbortSignal.timeout(10000)});
 assert.ok([401,403,404].includes(r.status),path+' '+r.status);
}
const account=await (await get(lab+'/api/lab-account')).json();assert.equal(account.linked,false);
console.log('Producción: sitemap '+urls.length+' URLs, '+index.length+' consolas, API pública y rutas privadas comprobadas.');

for(const base of [lab,forum]){
 const r=await get(base+'/');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.match(r.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
 assert.match(r.headers.get('permissions-policy')||'',/camera=\(\)/);
}
const searchPage=await get(lab+'/buscar');
assert.match((searchPage.headers.get('x-robots-tag')||'')+' '+await searchPage.text(),/noindex/i);
for(const [origin,path] of [[lab,'/api/lab-account'],[forum,'/api/profile/avatar']]){
 const r=await fetch(origin+path,{method:'POST',headers:{Origin:'https://audit.invalid','Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
 assert.equal(r.status,403,path+' debe rechazar origen ajeno');
}
const guest=await get(lab+'/api/lab-account');
assert.match(guest.headers.get('cache-control')||'',/no-store/);
console.log('Seguridad HTTP: cabeceras estáticas, noindex, rechazo de origen ajeno y cache de cuenta OK.');
