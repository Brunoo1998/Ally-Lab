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
