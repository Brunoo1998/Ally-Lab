import {mountSim} from './simulador.js?v=39';
const $=id=>document.getElementById(id), mk=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const add=(parent,tag,text,cls)=>{const e=mk(tag,text,cls);parent.append(e);return e};
const fold=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const date=s=>s&&/^\d{4}-\d\d-\d\d/.test(s)?new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(s.slice(0,10)+'T12:00:00Z')):'Sin fecha publicada';
const unknown='Sin confirmar', empty='Sin pruebas publicadas para esta versión en la Xbox Ally X Z2 Extreme.';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const favs=new Set(read('ports-favoritos',[]));let projects,groups,meta,verified,tests,byGroup,page=1,onlyFav=false,onlyExp=false;
function url(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:null}catch{return null}}
function link(parent,label,href){const safe=url(href);if(!safe||/(^|\.)(rogallylife|recomplauncher|recompstore)\.com$/i.test(new URL(safe).hostname))return;const a=add(parent,'a',label);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';return a}
function button(parent,label,fn){const b=add(parent,'button',label);b.type='button';b.onclick=fn;return b}
function img(parent,g){const frame=add(parent,'div',undefined,'port-cover');add(frame,'b',g.game.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase());if(url(g.cover)){const im=add(frame,'img');im.alt='';im.loading='lazy';im.referrerPolicy='no-referrer';im.onerror=()=>im.hidden=true;im.src=url(g.cover)}}
function option(el,value,text){const o=add(el,'option',text);o.value=value}
function press(id,on){$(id).setAttribute('aria-pressed',String(on))}
function experimental(p){return /experimental|prototipo|en desarrollo|anunciado|preliminar|próxim/i.test([p.type,p.status].join(' '))||p.experimental===true||p.upcoming===true}
function list(){
 const query=fold($('query').value).trim().split(/\s+/).filter(Boolean),platform=$('platform').value,type=$('type').value;
 const items=groups.flatMap(g=>{const matches=g.ps.filter(p=>(!platform||p.platform===platform)&&(!type||p.type===type)&&(!onlyFav||favs.has(p.id))&&(!onlyExp||experimental(p))&&query.every(t=>p.search.includes(t)||fold(g.game).includes(t)));return matches.length?[{...g,ps:matches,last:matches.map(p=>p.date||'').sort().at(-1)}]:[]});
 items.sort((a,b)=>($('sort').value==='recent'?(b.last||'').localeCompare(a.last||''):0)||a.game.localeCompare(b.game,'es'));
 press('all',!platform&&!onlyFav&&!onlyExp&&!type&&!query.length);press('sw1',platform===switchName(false));press('sw2',platform===switchName(true));press('favs',onlyFav);press('experimental',onlyExp);
 const pages=Math.max(1,Math.min(20,Math.ceil(items.length/24)));page=Math.min(page,pages);
 const start=Math.ceil((page-1)*items.length/pages), end=Math.ceil(page*items.length/pages);
 $('count').textContent=items.length+' fichas de juegos · '+new Set(items.flatMap(g=>g.ps.map(p=>p.id))).size+' proyectos';
 const cards=$('cards');cards.replaceChildren();
 for(const g of items.slice(start,end)){const a=add(cards,'a',undefined,'port-card');a.href='#'+encodeURIComponent(g.group)+'/'+encodeURIComponent(g.ps[0].id);img(a,g);add(a,'h3',g.game);const badges=add(a,'div',undefined,'platform-tags');for(const platform of new Set(g.ps.map(p=>p.platform)))add(badges,'span',platform);add(a,'p',g.ps.length+(g.ps.length===1?' proyecto':' proyectos'))}
 if(!items.length)add(cards,'p','No hay coincidencias con estos filtros.');
 const nav=$('pages');nav.replaceChildren();if(page>1)button(nav,'Anterior',()=>move(page-1));if(pages>1){const lab=add(nav,'label','Página ');const sel=add(lab,'select');sel.setAttribute('aria-label','Elegir página');for(let i=1;i<=pages;i++)option(sel,i,i+' de '+pages);sel.value=page;sel.onchange=()=>move(+sel.value)}if(page<pages)button(nav,'Siguiente',()=>move(page+1));
}
function move(n){page=n;list();$('count').scrollIntoView({block:'start'})}
function switchName(two){return projects.find(p=>p.origin===(two?'switch2':'switch'))?.platform||('Nintendo Switch'+(two?' 2':''))}
function reset(){page=1;list()}
function panel(parent,title){const s=add(parent,'section',undefined,'port-panel');add(s,'h2',title);return s}
function pair(dl,k,v){add(dl,'dt',k);add(dl,'dd',v||unknown)}
function fact(p,k){return verified[p.id]?.[k]||null}
function repoEndpoint(p){
 const website=url(p.repo);if(!website)return null;const u=new URL(website), bits=u.pathname.split('/').filter(Boolean);
 if(u.hostname==='github.com'&&bits.length===2)return {api:'https://api.github.com/repos/'+bits.map(encodeURIComponent).join('/')+'/releases/latest',releases:website.replace(/\/$/,'')+'/releases',gitlab:false};
 if(u.hostname==='gitlab.com'&&bits.length>=2)return {api:'https://gitlab.com/api/v4/projects/'+encodeURIComponent(bits.join('/'))+'/releases/permalink/latest',releases:website.replace(/\/$/,'')+'/-/releases',gitlab:true};
 return null;
}
function releasePanel(parent,p){
 const ep=repoEndpoint(p),links=add(parent,'div',undefined,'port-pills');link(links,'Repositorio oficial ↗',p.repo);link(links,'Descargas oficiales ↗',fact(p,'download')||ep?.releases||p.repo);
 if(!ep)return;
 const key='ports-release:'+ep.api, cached=read(key,null),line=add(parent,'p',undefined,'muted');
 function show(v){line.textContent='Última versión estable en el repositorio: '+v.version+' · '+date(v.date)+' · Consultado el '+date(v.checked)}
 if(cached)show(cached);
 const b=button(links,'Comprobar versión en origen',async()=>{
  if(cached&&Date.now()-Date.parse(cached.checked)<21600000){show(cached);return}
  b.disabled=true;try{const res=await fetch(ep.api,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error();const j=await res.json();if(typeof j.tag_name!=='string')throw Error();const record={version:j.tag_name,date:j.published_at||j.released_at,checked:new Date().toISOString()};save(key,record);show(record);b.textContent='Versión comprobada'}
  catch{line.textContent=(cached?'Última consulta válida: '+cached.version+'. ':'')+'El repositorio no ha devuelto una versión estable. Puedes consultar sus publicaciones.'}finally{b.disabled=false}
 });
}
function detail(g,p){
 const a=$('details');a.replaceChildren();const back=add(a,'a','← Volver a la biblioteca');back.href='#';
 const head=add(a,'div',undefined,'port-heading');add(head,'h1',g.game);
 const selector=add(a,'label','Proyecto');const sel=add(selector,'select');for(const alt of g.ps)option(sel,alt.id,alt.name+' · '+alt.platform);sel.value=p.id;sel.onchange=()=>location.hash=encodeURIComponent(g.group)+'/'+encodeURIComponent(sel.value);
 const pbox=panel(a,p.name), ph=add(pbox,'div',undefined,'project-head');img(ph,{game:g.game,cover:p.cover});const info=add(ph,'div');add(info,'p',[p.platform,p.type,p.status].filter(Boolean).join(' · '));
 const fav=button(info,'',()=>{if(favs.has(p.id))favs.delete(p.id);else favs.add(p.id);save('ports-favoritos',[...favs]);setFav()});
 function setFav(){fav.textContent=favs.has(p.id)?'★ Guardado en favoritos':'☆ Guardar favorito';fav.setAttribute('aria-pressed',String(favs.has(p.id)))}setFav();
 if(experimental(p)||/archiv|pausa|abandon/i.test(p.status||''))add(pbox,'p','Estado del proyecto: '+(p.status||p.type)+'. Comprueba las limitaciones de la versión antes de instalarla.','port-alert');
 const ddl=add(pbox,'dl');pair(ddl,'Desarrollador',p.author);pair(ddl,'Versión de catálogo',p.version);pair(ddl,'Fecha de publicación de la versión',date(p.date));pair(ddl,'Sistemas declarados',p.systems.join(', '));if(p.license)pair(ddl,'Licencia declarada',p.license);
 releasePanel(pbox,p);
 const metrics=tests[p.id];const comparison=panel(a,'Comparar alternativas');add(comparison,'p',metrics?.recommendationVerified?'Recomendado para Ally X · '+metrics.reason:'Sin recomendación verificada','port-alert');
 const wrap=add(comparison,'div',undefined,'port-table');wrap.tabIndex=0;const table=add(wrap,'table');const h=add(add(table,'thead'),'tr');add(h,'th','Criterio');for(const alt of g.ps)add(h,'th',alt.name);const body=add(table,'tbody');
 const checks=[['Plataforma original',x=>x.platform],['Windows 11',x=>fact(x,'windows')||(x.systems.some(v=>/windows/i.test(v))?'Windows declarado; versión 11 sin confirmar':unknown)],['CPU y GPU AMD',x=>fact(x,'amd')],['Estabilidad',x=>fact(x,'issues')],['Mandos',x=>fact(x,'controller')||(x.features.includes('Mando')?'Mando declarado en el catálogo':null)],['Gráficos y funciones',x=>fact(x,'graphics')||x.features.join(' · ')],['Desarrollo',x=>x.status],['Rendimiento en Ally X',x=>tests[x.id]?.summary||'Sin mediciones verificadas']];
 for(const [key,get] of checks){const tr=add(body,'tr');add(tr,'th',key).scope='row';for(const alt of g.ps)add(tr,'td',get(alt)||unknown)}
 const tech=panel(a,'Configuración para la Xbox Ally X');add(tech,'p','AMD Ryzen Z2 Extreme · Windows 11','muted');const grid=add(tech,'div',undefined,'profile-grid');
 for(const name of ['Rendimiento','Equilibrado','Ahorro de batería']){const block=add(grid,'section');add(block,'h3',name);const data=metrics?.profiles?.[name];if(data){const dl=add(block,'dl');for(const [k,v] of Object.entries(data))pair(dl,k,v)}else add(block,'p',empty)}
 const dl=add(tech,'dl');pair(dl,'API gráfica',fact(p,'api'));pair(dl,'FSR y generación de fotogramas',fact(p,'scaling')||p.features.filter(f=>/FSR|Generación de fotogramas/i.test(f)).join(' · '));pair(dl,'FPS medios y estabilidad',metrics?.summary);pair(dl,'Versión y controlador probados',metrics?.tested);if(metrics?.source)link(tech,'Prueba en el dispositivo ↗',metrics.source);
 if(metrics?.sim?.points?.length){const game={id:p.id,title:p.name,source:metrics.source};mountSim(tech,[game],game,metrics.sim,()=>{},metrics.sim.points)}
 const setup=panel(a,'Instalación y requisitos');if(p.needs)add(setup,'p',p.needs);const steps=add(setup,'ol');
 for(const step of [fact(p,'install')||'Consulta los sistemas admitidos y el formato de los datos de entrada en el README oficial.', 'Elige la versión para Windows cuando esté disponible y sigue el instalador o el procedimiento de compilación del autor.', 'Si el proyecto solicita datos del juego original, importa los archivos de tu propia copia en el formato indicado.'])add(steps,'li',step);
 if(p.minLauncher)add(setup,'p','Versión mínima del lanzador de origen: '+p.minLauncher);
 const issue=add(setup,'dl');pair(issue,'Problemas conocidos',fact(p,'issues'));pair(issue,'Soluciones documentadas',fact(p,'fix'));link(setup,'Documentación del proyecto ↗',fact(p,'official')||p.repo);
 if(fact(p,'source'))link(setup,' · Fuente de verificación ↗',fact(p,'source'));
 document.title=p.name+' · Ports y Recompilaciones';window.scrollTo(0,0);
}
function route(){let parts;try{parts=location.hash.slice(1).split('/').map(decodeURIComponent)}catch{parts=[]}const g=byGroup.get(parts[0]);$('library').hidden=!!g;$('details').hidden=!g;if(g)detail(g,g.ps.find(x=>x.id===parts[1])||g.ps[0]);else{document.title='Ports y Recompilaciones · Ally Lab';list()}}
async function start(){
 const r=await fetch('./datos/ports.json',{cache:'no-cache'});if(!r.ok)throw Error();const data=await r.json();
 projects=data.projects;verified=data.verified||{};tests=data.tests||{};meta=data.meta;byGroup=new Map();
 for(const p of projects){p.search=fold([p.game,p.name,p.author,p.platform,p.origin].join(' '));
  const all=[{group:p.group,game:p.game,cover:p.cover},...(p.includedGames||[])];
  for(const item of all){if(!item.group)continue;const g=byGroup.get(item.group)||{...item,ps:[]};if(!g.ps.some(x=>x.id===p.id))g.ps.push(p);byGroup.set(item.group,g)}
 }
 groups=[...byGroup.values()];for(const [id,k] of [['platform','platform'],['type','type']])for(const v of [...new Set(projects.map(p=>p[k]))].filter(Boolean).sort())option($(id),v,v);
 $('sync').textContent='Sincronización del '+date(meta.synced)+' · '+projects.length+' proyectos. Portadas enlazadas a sus fuentes.';
 for(const id of ['platform','type','sort'])$(id).onchange=reset;$('query').oninput=reset;
 $('all').onclick=()=>{$('query').value=$('platform').value=$('type').value='';onlyFav=onlyExp=false;reset()};
 $('sw1').onclick=()=>{$('platform').value=switchName(false);reset()};$('sw2').onclick=()=>{$('platform').value=switchName(true);reset()};
 $('favs').onclick=()=>{onlyFav=!onlyFav;reset()};$('experimental').onclick=()=>{onlyExp=!onlyExp;reset()};
 window.addEventListener('hashchange',route);route();
}
start().catch(()=>{$('count').textContent='No se ha podido cargar la biblioteca.';button($('pages'),'Reintentar',()=>location.reload())});
