const $ = id => document.getElementById(id);
const fields = ['query','platform','genre','order'].map(key=>$('free-'+key));
const [query,platform,genre,order] = fields;
const tabs = [...document.querySelectorAll('[data-view]')];
const grid = $('free-grid');
const hour = 3600000;
const local = './datos/gratis.json';
const remote = 'https://raw.githubusercontent.com/Brunoo1998/Ally-Lab/promociones/gratis.json';
const date = new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'});
const price = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const fold = s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
let data, games = new Map(), view='active', lastState='';
const now = ()=>Date.now();

function add(parent,tag,text,css){
 const node=document.createElement(tag);
 if(text)node.textContent=text;
 if(css)node.className=css;
 parent.append(node);
 return node;
}
function safe(url){
 try{return new URL(url).protocol==='https:'}catch{return false}
}
function link(parent,label,url,css){
 const a=add(parent,'a',label,css);
 a.href=url;
 if(safe(url)){a.target='_blank';a.rel='noopener noreferrer'}
}
async function get(url){
 const response=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(5500)});
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
}
function status(offer,t){
 if(t>=Date.parse(offer.end))return offer.seenActive?'history':'expired';
 if(t<Date.parse(offer.start))return 'upcoming';
 return offer.seenActive?'active':'awaiting';
}
function countdown(end,t){
 const mins=Math.max(0,Math.ceil((end-t)/60000));
 const days=Math.floor(mins/1440), hours=Math.floor(mins/60)%24, rest=mins%60;
 return [days&&days+' d',hours&&hours+' h',rest+' min'].filter(Boolean).join(' ');
}
function card(offer,state,t,soon){
 const item=add(grid,'article',null,'card free-card');
 const cover=add(item,'div',null,'cover free-cover');
 if(safe(offer.cover)){const img=add(cover,'img');img.src=offer.cover;img.alt='';img.loading='lazy'}
 else add(cover,'span',offer.title.slice(0,2).toUpperCase());
 const box=add(item,'div',null,'card-body free-copy');
 add(box,'p',offer.platform+(soon?' · Termina pronto':state==='active'&&t-Date.parse(offer.added)<24*hour?' · Nuevo':''),'card-meta free-badge');
 add(box,'h3',offer.title);
 if(offer.description&&offer.description!==offer.title)add(box,'p',offer.description);
 add(box,'p',(offer.genre||'Género sin confirmar')+' · '+(offer.rating!=null?offer.rating+'/5':'Valoración sin confirmar'),'free-muted');
 const prices=add(box,'div',null,'free-prices');add(prices,'del',price.format(offer.original));add(prices,'strong',price.format(0));
 add(box,'p',date.format(new Date(offer.start))+' → '+date.format(new Date(offer.end))+' · hora peninsular','free-muted');
 if(state!=='history'){
  const counter=add(box,'p',null,'free-clock');
  counter.dataset.until=state==='active'?offer.end:offer.start;
  counter.dataset.prefix=state==='active'?'Termina en ':'Empieza en ';
 }
 if(offer.gallery?.some(safe)){
  const gallery=add(box,'details');add(gallery,'summary','Ver galería');
  gallery.addEventListener('toggle',()=>{
   if(!gallery.open||gallery.querySelector('img'))return;
   for(const url of offer.gallery.filter(safe)){const img=add(gallery,'img');img.src=url;img.alt='Captura de '+offer.title;img.loading='lazy'}
  });
 }
 const game=games.get(fold(offer.title));
 if(!game?.fps)add(box,'p','Rendimiento en Ally X sin datos verificados.','free-muted');
 if(safe(offer.url))link(box,state==='active'?'Conseguir gratis':'Ver ficha oficial',offer.url,'btn');
}
function render(){
 if(!data)return;
 const t=now();
 const offers=data.offers.filter(o=>o.region==='ES');
 const active=offers.filter(o=>status(o,t)==='active');
 $('free-count').textContent=active.length+' '+(active.length===1?'juego disponible':'juegos disponibles');
 const stale=data.stale||!data.checked||t-Date.parse(data.checked)>2*hour;
 $('free-status').textContent=(data.checked?'Última comprobación válida: '+date.format(new Date(data.checked))+'. ':'')+(stale?'Datos pendientes de actualizar.':'');
 const results=offers.filter(o=>{
  const s=status(o,t), ending=s==='active'&&Date.parse(o.end)-t<=24*hour;
  return (s===view||(view==='ending'&&ending))&&(!platform.value||o.platform===platform.value)
   &&(!genre.value||(o.genre||'unknown')===genre.value)&&fold(o.title).includes(fold(query.value.trim()));
 });
 const byEnd=(a,b)=>Date.parse(a.end)-Date.parse(b.end);
 results.sort(order.value==='added'?(a,b)=>Date.parse(b.added)-Date.parse(a.added):order.value==='rating'?(a,b)=>(b.rating??-1)-(a.rating??-1)||byEnd(a,b):byEnd);
 grid.replaceChildren();
 for(const offer of results)card(offer,status(offer,t),t,Date.parse(offer.end)-t<=24*hour);
 if(!results.length)add(grid,'p','No hay promociones verificadas para esta selección.','free-muted');
 tick();
}
function tick(){
 if(!data)return;
 const t=now(), signature=data.offers.map(o=>status(o,t)+String(Date.parse(o.end)-t<=24*hour)).join('|');
 if(lastState!==signature){lastState=signature;render();return}
 for(const el of grid.querySelectorAll('[data-until]'))el.textContent=el.dataset.prefix+countdown(Date.parse(el.dataset.until),t);
}
function apply(next){
 if(!Array.isArray(next?.offers))return;
 if(data&&Date.parse(next.checked)<Date.parse(data.checked))return;
 data=next;
 for(const [select,values] of [[platform,next.offers.map(o=>o.platform)],[genre,next.offers.map(o=>o.genre)]]){
  for(const value of [...new Set(values)].filter(Boolean).sort()){
   if([...select.options].some(o=>o.value===value))continue;
   add(select,'option',value).value=value;
  }
 }
 render();
}
for(const button of tabs)button.onclick=()=>{
 view=button.dataset.view;
 for(const other of tabs)other.setAttribute('aria-pressed',String(other===button));
 render();
};
fields.forEach(field=>field.addEventListener(field===query?'input':'change',render));
get(local).then(apply).catch(()=>{$('free-status').textContent='Datos pendientes de actualizar.'});
get(remote).then(apply).catch(()=>{});
get('./datos/catalogo.json').then(c=>{games=new Map(c.games.map(g=>[fold(g.title),g]));render()}).catch(()=>{});
setInterval(tick,1000);
setInterval(()=>get(remote).then(apply).catch(()=>render()),5*60000);
