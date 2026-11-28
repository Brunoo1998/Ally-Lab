const form=document.querySelector('#global-search'),term=document.querySelector('#term'),scope=document.querySelector('#scope'),status=document.querySelector('#search-status'),results=document.querySelector('#search-results');
const labels={pc:'Juegos de PC',ports:'Ports y recompilaciones',news:'Noticias',free:'Juegos gratis',retro:'Retro',community:'Comunidad'};
const community='https://ally-community.pages.dev';
const remote='https://raw.githubusercontent.com/Brunoo1998/Ally-Lab/promociones/';
const fold=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const get=async(u,signal)=>{const r=await fetch(u,{signal,credentials:'omit'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
const safeId=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,149}$/.test(s);
const card=(title,url,extra='')=>({title:String(title),url,extra:String(extra)});
function rank(item,q){const t=fold(item.title),a=fold(item.extra),parts=q.split(' ');if(!parts.every(w=>t.includes(w)||a.includes(w)))return 0;return t===q?100:t.startsWith(q)?80:t.includes(q)?60:20;}
const pick=(items,q)=>items.map(x=>({...x,score:rank(x,q)})).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'es')).slice(0,12);
const cache=new Map();
async function local(path,signal){if(cache.has(path))return cache.get(path);const j=await get(path,signal);cache.set(path,j);return j;}
let controller,version=0;
async function source(k,q,raw,signal){
 if(k==='pc'){const c=await local('/datos/catalogo.json',signal);return pick(c.games.filter(g=>safeId(g.id)).map(g=>card(g.title,'/#juego/'+g.id,'Configuraciones · '+(g.fps||'')+' FPS')),q);}
 if(k==='ports'){const c=await local('/datos/ports.json',signal);return pick(c.projects.flatMap(p=>[{group:p.group,game:p.game},...(p.includedGames||[])].filter(g=>g.group).map(g=>card(g.game||p.name,'/ports#'+encodeURIComponent(g.group)+'/'+encodeURIComponent(p.id),p.name+' · '+p.platform))),q);}
 if(k==='news'){const c=await local('/datos/news.json',signal);return pick(c.map(n=>card(n.title,'/news#noticia-'+encodeURIComponent(n.id),[n.date,n.source,n.summary].join(' · '))),q);}
 if(k==='free'){const sets=await Promise.allSettled([get('/datos/gratis.json',signal),get(remote+'gratis.json',signal),get(remote+'gratis-otras-tiendas.json',signal)]);if(sets.every(r=>r.status==='rejected'))throw Error('Ofertas no disponibles');const unique=new Map();for(const r of sets)if(r.status==='fulfilled')for(const o of r.value.offers||[])if(o.region==='ES'&&Date.parse(o.start)<=Date.now()&&Date.parse(o.end)>Date.now())unique.set(o.id,o);return pick([...unique.values()].map(o=>card(o.title,'/gratis#oferta='+encodeURIComponent(o.id)+'&tipo='+encodeURIComponent(o.kind||'keep'),o.platform+' · Hasta '+new Date(o.end).toLocaleDateString('es-ES'))),q);}
 if(k==='retro'){const index=await local('/datos/retro-busqueda.json',signal);return pick(index.flatMap(([key,name,titles])=>titles.map(title=>card(title,'/emulacion#consola/'+key+'?juego='+encodeURIComponent(title),name))),q);}
 if(k==='community'){const j=await get(community+'/api/public-search?q='+encodeURIComponent(raw),signal);return (j.rows||[]).filter(r=>Number.isSafeInteger(r.id)&&r.id>0).slice(0,12).map(r=>card(r.title,community+'/?post='+r.id,r.category||'Publicación pública'));}
 return [];
}
function show(k,rows,error=false){
 const section=document.createElement('section'),h=document.createElement('h2');h.textContent=labels[k];section.append(h);
 if(error||!rows.length){const p=document.createElement('p');p.className='source-warning';p.textContent=error?'No se ha podido consultar esta sección.':'Sin coincidencias.';section.append(p);}
 for(const r of rows){const a=document.createElement('a');a.className='global-result';a.href=r.url;const title=document.createElement('strong');title.textContent=r.title;const extra=document.createElement('small');extra.textContent=r.extra;a.append(title,extra);section.append(a);}
 if(k==='retro'){const note=document.createElement('small');note.textContent='Índice local de títulos con carátula; puede no incluir todas las entradas Retro.';section.append(note);}
 if(k==='community'){const a=document.createElement('a');a.href=community+'/?q='+encodeURIComponent(term.value.trim());a.textContent='Ver más en Ally Community';section.append(a);}
 results.append(section);
}
async function search(){
 const raw=term.value.trim(),q=fold(raw);if(!q){status.textContent='Introduce un título o palabra clave.';return;}
 controller?.abort();controller=new AbortController();const timeout=AbortSignal.timeout(14000);const signal=AbortSignal.any([controller.signal,timeout]);const current=++version;
 const keys=scope.value==='all'?Object.keys(labels):[scope.value];results.replaceChildren();status.textContent='Buscando…';
 const params=new URLSearchParams({q:raw,scope:scope.value});history.replaceState(null,'','?'+params);
 let total=0,errors=0;
 const jobs=keys.map(async k=>{try{return {k,rows:await source(k,q,raw,signal)};}catch{return {k,rows:[],error:true};}});
 for(const j of await Promise.all(jobs)){if(current!==version)return;total+=j.rows.length;errors+=Number(!!j.error);show(j.k,j.rows,j.error);}
 status.textContent=total+' resultados mostrados'+(errors?' · '+errors+' secciones no disponibles':'')+'.';
}
form.addEventListener('submit',e=>{e.preventDefault();void search();});
scope.addEventListener('change',()=>{if(term.value.trim())void search();});
const params=new URLSearchParams(location.search);term.value=(params.get('q')||'').slice(0,100);if(Object.hasOwn(labels,params.get('scope')))scope.value=params.get('scope');if(term.value.trim())void search();
