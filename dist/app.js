import { unmountGameVideo } from './videos.js?v=41';
import { mountCaptures } from './capturas.js?v=41';
import { mountSim } from './simulador.js?v=ally-ai-2';
import { campoES, valorES } from './idioma.js?v=20261121';

const id = name => document.getElementById(name);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
function anchor(text, href, cls = '', external = false) {
  const a = el('a',cls,text);
  a.href = href;
  if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  return a;
}
const fold = s => String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const units = s => String(s || '').replace(/(\d)\s*(GB|MB|W)\b/gi,(_,n,u) => n + ' ' + u.toUpperCase());
const asFPS = s => /fps/i.test(s) ? s : s + ' FPS';
const dateFmt = new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const prettyDate = s => dateFmt.format(new Date(s+'T12:00:00Z'));
const sortTitles = new Intl.Collator('es',{sensitivity:'base',numeric:true});
const pageSize = 36;
const months = new Map();
const dataVersion = new URL(import.meta.url).search;
let catalog;
let state = { query:'', order:'recientes', page:1 };
let lastHash = '#juegos', lastCard = '', savedScroll = 0, inDetail = false, routeId = 0;
let original = false;
try { original = localStorage.getItem('ally-lab-etiquetas') === 'original'; } catch {}

async function fetchJson(name) {
  const res = await fetch('./datos/' + name + '.json' + dataVersion, { cache: 'no-cache' });
  if (!res.ok) throw new Error('No se han leído los datos.');
  return res.json();
}
function catalogHash(s) {
  const params = new URLSearchParams();
  if (s.query) params.set('q',s.query);
  if (s.order !== 'recientes') params.set('orden',s.order);
  if (s.page > 1) params.set('pagina',s.page);
  return '#juegos' + (params.size ? '?' + params : '');
}
const gameRating = game => Number.isFinite(game.editorialRating) && game.editorialRating>0 && game.editorialRating<=5;
function editorialLabel(game) {
  return 'Valoración editorial: '+game.editorialRating.toLocaleString('es-ES')+' de 5';
}
function editorialStars(game) {
  const badge=el('div','editorial-stars');
  badge.setAttribute('aria-hidden','true');
  const stars=el('b','rating-stars','★★★★★');
  stars.style.setProperty('--rating-fill',game.editorialRating*20+'%');
  badge.append(stars,el('b','rating-number',game.editorialRating.toLocaleString('es-ES')+' / 5'));
  return badge;
}
function cover(g,eager = false) {
  const frame = el('div','cover');
  const initial = el('span','',g.title.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase());
  initial.setAttribute('aria-hidden','true');
  const img = el('img');
  img.alt = ''; img.loading = eager ? 'eager':'lazy'; img.width=600; img.height=900; img.decoding='async'; img.referrerPolicy='no-referrer';
  img.addEventListener('error',()=>img.remove(),{once:true});
  img.src = g.cover;
  frame.append(initial,img);
  if (gameRating(g)) frame.append(editorialStars(g));
  return frame;
}
function card(game,i) {
  const a = anchor('','#juego/'+game.id,'card');
  a.setAttribute('aria-label',game.title+(gameRating(game)?' · '+editorialLabel(game):''));
  const body = el('div','card-body');
  body.append(el('h3','',game.title));
  const metrics = el('div','card-meta');
  if (game.power) metrics.append(el('span','w',units(game.power)));
  if (game.fps) metrics.append(el('span','',asFPS(game.fps)));
  if (metrics.childElementCount) body.append(metrics);
  a.append(cover(game,i<4),body);
  a.addEventListener('click',() => {
    savedScroll = window.scrollY; lastCard = game.id;
  });
  return a;
}
function box(title,description) {
  const b = el('section','empty');
  b.append(el('h2','',title));
  if (description) b.append(el('p','',description));
  return b;
}
function button(text,handle,cls='btn') {
  const b=el('button',cls,text);
  b.type='button'; b.addEventListener('click',handle);
  return b;
}
function renderCatalog(next,replaceUrl=false) {
  const tokens = fold(next.query).split(' ').filter(Boolean);
  let games = tokens.length ? catalog.games.filter(g=>tokens.every(k=>g.key.includes(k))) : catalog.games;
  if (next.order !== 'recientes') {
    const direction = next.order === 'az' ? 1:-1;
    games = games.slice().sort((a,b)=>direction*sortTitles.compare(a.title,b.title));
  }
  const pages = Math.max(1,Math.ceil(games.length/pageSize));
  next.page = Math.min(next.page,pages);
  state=next; lastHash=catalogHash(next);
  if (replaceUrl || (location.hash.startsWith('#juegos?') && location.hash !== lastHash)) history.replaceState(null,'',lastHash);
  if (id('q').value !== next.query) id('q').value=next.query;
  id('orden').value=next.order;
  const start=(next.page-1)*pageSize; const list=games.slice(start,start+pageSize);
  id('resultados').textContent = games.length === 0 ? '0 juegos encontrados' : games.length === 1 ? '1 juego encontrado' : 'Mostrando '+(start+1)+'–'+(start+list.length)+' de '+games.length+' juegos';
  const grid=id('grid'); grid.replaceChildren(...list.map(card));
  const pager=id('pager'); pager.replaceChildren();
  if (!list.length) {
    const b=box('No hay coincidencias','Prueba a escribir otra parte del título.');
    b.append(button('Borrar búsqueda',()=>{renderCatalog({...state,query:'',page:1},true); id('q').focus();}));
    grid.append(b);
  }
  if (pages === 1) return;
  if (next.page > 1) pager.append(anchor('Anterior',catalogHash({...next,page:next.page-1}),'btn'));
  const label=el('label','','Página');
  const select=el('select'); select.setAttribute('aria-label','Ir a la página');
  for(let n=1;n<=pages;n++){
    const option=el('option','',n+' de '+pages); option.value=String(n); select.append(option);
  }
  select.value=String(next.page);
  select.addEventListener('change',()=>{location.hash=catalogHash({...next,page:Number(select.value)});});
  label.append(select); pager.append(label);
  if (next.page < pages) pager.append(anchor('Siguiente',catalogHash({...next,page:next.page+1}),'btn'));
}
function header(game) {
  const h=el('header','game-head'), copy=el('div');
  const title=el('h1','',game.title); title.id='game-title'; title.tabIndex=-1;
  copy.append(el('span','hardware','ROG XBOX ALLY X · Z2 EXTREME'),title,el('p','','Ficha del '+prettyDate(game.published)));
  h.append(cover(game,true),copy);
  return h;
}
function panel(title) {
  const p=el('section','box'); p.append(el('h2','',title)); return p;
}
function specs(detail,game) {
  const p=panel('Datos de la prueba'),dl=el('dl','stats');
  function stat(label,val) {
    if (!val) return;
    const item=el('div'); item.append(el('dt','',label),el('dd','',val)); dl.append(item);
  }
  const parts=new Map(detail.setup.map(([label,value,hint])=>[label.toUpperCase(),[value,hint]]));
  const metrics=new Map(detail.metrics);
  const power = parts.get('TDP');
  const powerHint = power?.[1] === 'TURBO MODE' ? ' · Turbo' : '';
  stat('Potencia probada (TDP)',units(metrics.get('TESTED TDP') || game.power || power?.[0]) + powerHint);
  const vram=parts.get('VRAM');
  if (vram) stat('Memoria de GPU',units(vram[0])+(vram[1]==='OR ABOVE'?' o más':''));
  if (metrics.has('AVERAGE FPS')) stat('FPS medios de la guía',asFPS(metrics.get('AVERAGE FPS')));
  for(const [label,val] of detail.metrics) {
    if (!['TESTED TDP','AVERAGE FPS'].includes(label)) stat(({'INCLUDED WITH':'Incluido con','ALSO ON':'También en'})[label] || campoES(label),valorES(val));
  }
  for(const [label,val] of detail.setup) {
    if(!['TDP','VRAM'].includes(label.toUpperCase())) stat(campoES(label),units(val));
  }
  p.append(dl);
  if (detail.tested) p.append(el('p','small','Fecha de la prueba · '+prettyDate(detail.tested)));
  if (detail.mentionsX20) p.append(el('p','small','Esta prueba también menciona la X20.'));
  if (detail.stores?.length) p.append(el('p','small','Tiendas de la guía · '+detail.stores.join(' · ')));
  return p;
}
function notes(target,title,items) {
  if (!items?.length) return;
  const p=panel(title), list=el('ul','notes');
  for (const s of items) list.append(el('li','',s));
  p.append(list); target.append(p);
}
function labelForPreset(presets, index) {
  const choice = presets[index];
  const same = presets.filter(p => p.name === choice.name);
  const label = units(choice.name);
  if (choice.gameTitle) return choice.gameTitle + ' · ' + label;
  if (same.length === 1) return label;
  const alternatives = same.filter(p => p !== choice).map(p => new Map(p.rows));
  const difference = choice.rows.find(([key,value]) => /scal|resoluti|frame gen/i.test(key) && alternatives.every(other => other.has(key) && other.get(key) !== value));
  return label + ' · ' + (difference ? campoES(difference[0]) + ' ' + valorES(difference[1]) : 'Opción ' + (same.indexOf(choice) + 1));
}
function settings(game,detail,requested) {
  const p=panel('Configuración del juego'), presets=detail.profiles;
  if(!presets.length) throw new Error('La tabla no se ha cargado.');
  let current=requested>=1 && requested<=presets.length ? requested-1:0;
  const picker=el('div',presets.length>1?'presets':'solo');
  if(presets.length>1) {
    picker.setAttribute('role','group'); picker.setAttribute('aria-label','Configuraciones disponibles');
    presets.forEach((preset,i)=>{
      const btn=button(labelForPreset(presets,i),()=>{
        current=i; history.replaceState(null,'','#juego/'+game.id+(i?'?ajuste='+(i+1):'')); draw();
      },'preset');
      btn.setAttribute('aria-controls','ajustes'); picker.append(btn);
    });
  } else picker.textContent=units(presets[0].name);
  p.append(picker);
  const community = new URL('https://ally-community.pages.dev/');
  community.search = new URLSearchParams({game:game.id,title:game.title});
  const links=el('div','hero-links');
  const share=anchor('Compartir mi configuración',community.href,'btn');
  links.append(anchor('Debate de la comunidad',community.href,'btn'),share);
  p.append(links);
  if(detail.fromText) p.append(el('p','small','Ajustes descritos en el texto de la guía.'));
  const controls=el('div','table-tools'), count=el('span');
  count.setAttribute('role','status'); controls.append(count);
  if(!detail.fromText) {
    const label=el('label'), check=el('input');
    check.type='checkbox'; check.checked=original;
    check.addEventListener('change',()=>{
      original=check.checked;
      try {localStorage.setItem('ally-lab-etiquetas',original?'original':'es');} catch {}
      draw();
    });
    label.append(check,document.createTextNode('Ver términos originales')); controls.append(label);
  }
  const table=el('table'); table.id='ajustes'; const caption=el('caption','sr');
  const thead=el('thead'),row=el('tr'),body=el('tbody');
  for(const title of ['Ajuste','Valor']) {const th=el('th','',title);th.scope='col';row.append(th);}
  thead.append(row); table.append(caption,thead,body); p.append(controls,table);
  function draw(){
    const preset=presets[current];
    const draft=new URL(community);
    draft.searchParams.set('share','1');
    draft.searchParams.set('model','Xbox ROG Ally X');
    const find=(pattern)=>preset.rows.find(([key])=>pattern.test(key))?.[1];
    const resolution=find(/^(?:output |screen |display )?resolution$/i)||preset.name.match(/\b(?:720|900|1080)p\b/i)?.[0];
    const known={resolution,quality:find(/^(?:graphic[s]? )?(?:quality|preset)$/i),scaling:find(/upscal|fsr/i),frameGeneration:find(/frame generation/i)};
    for(const [key,value] of Object.entries(known))if(value)draft.searchParams.set(key,String(value).slice(0,100));
    share.href=draft.href;
    if(presets.length>1) Array.from(picker.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
    caption.textContent='Configuración de '+game.title+' · '+preset.name;
    count.textContent=preset.rows.length+(preset.rows.length===1?' ajuste':' ajustes');
    const rows=preset.rows.map(([key,val])=>{
      const tr=el('tr'),translate=!original&&!detail.fromText;
      tr.append(el('td','',(translate?campoES(key):key)||'Sin etiqueta en la guía'),el('td','',(translate?valorES(val):val)||'Sin valor indicado'));
      return tr;
    });
    body.replaceChildren(...rows);
  }
  draw(); return p;
}
function rating(game) {
  const section=panel('Valoración');
  if (gameRating(game)) section.append(el('p','',editorialLabel(game)));
  return section;
}

async function detailView(game,selected,token,standalone){
  const host=id('ficha');
  if(standalone)host.classList.add('lab-page');else host.classList.remove('lab-page');
  const load=el('p','info','Cargando configuración…'); load.setAttribute('role','status'); if(!standalone){
    const gallery=panel('Galería del juego');
    gallery.classList.add('game-captures');
    gallery.hidden=true;
    host.append(header(game),gallery);
    void mountCaptures(gallery,game,()=>fetchJson('capturas'),()=>fetchJson('videos'));
  }
  host.append(load);
  try{
    const month=game.published.slice(0,7);
    if(!months.has(month)) months.set(month,fetchJson(month).catch(err=>{months.delete(month);throw err;}));
    const data=(await months.get(month))[game.id];
    if(token!==routeId) return;
    if(!data) throw new Error('Falta la ficha.');
    if(standalone){
      load.remove();
      mountSim(host,catalog.games,game,data,slug=>{location.hash='juego/'+slug+'?sim=1'});
      return;
    }
    const columns=el('div','columns'),side=el('aside','side');
    side.append(specs(data,game));
    if(gameRating(game))side.append(rating(game));
    notes(side,'Rendimiento observado',data.notes);notes(side,'Ajustes adicionales',data.extras);
    columns.append(settings(game,data,selected),side); load.replaceWith(columns);
    mountSim(id('ficha'),catalog.games,game,data,slug=>{location.hash='juego/'+slug+'?sim=1'});

  }catch {
    if(token!==routeId) return;
    const b=box('No se pudo cargar la ficha','Puedes volver a intentarlo.');
    b.append(button('Reintentar',()=>route()));load.replaceWith(b);
  }
}
function route(initial=false){
  if(!catalog)return;
  unmountGameVideo();
  const token=++routeId, wasDetail=inDetail;
  let [path,raw='']=location.hash.slice(1).split('?');
  if(path==='simulador'){
    const demo=catalog.games.find(g=>g.id==='cyberpunk-2077-rog-xbox-ally-x')||catalog.games[0];
    path='juego/'+demo.id;raw='sim=1';
  }
  const params=new URLSearchParams(raw), standalone=path.startsWith('juego/')&&params.has('sim');
  document.querySelector('.mast a[href="#juegos"]').classList.toggle('active',!standalone);
  id('sim-link').classList.toggle('active',standalone);
  for(const item of [document.querySelector('.mast a[href="#juegos"]'),id('sim-link')]){
    if(item.classList.contains('active'))item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
  }
  inDetail=path.startsWith('juego/');
  id('catalog').hidden=inDetail;const article=id('ficha');article.hidden=!inDetail;
  if(inDetail){
    const game=catalog.games.find(g=>g.id===path.slice(6));
    const back=el('p','back');back.append(anchor(standalone?'← Ver ficha del juego':'← Volver al catálogo',standalone?'#'+path:lastHash));article.replaceChildren(back);
    if(game){document.title=game.title+' · Ally Lab';detailView(game,Number(params.get('ajuste')),token,standalone);if(!initial&&!standalone)id('game-title').focus({preventScroll:true});}
    else{document.title='Ficha no encontrada · Ally Lab';article.append(box('Ficha no encontrada','Vuelve al catálogo para buscar el juego por su título.'));}
    window.scrollTo(0,0);return;
  }
  document.title='Ally Lab · Catálogo de juegos';
  const lastPage=state.page,order=params.get('orden'),page=Number(params.get('pagina'));
  renderCatalog({query:params.get('q')||'',order:['az','za'].includes(order)?order:'recientes',page:Number.isSafeInteger(page)&&page>0?page:1});
  if(wasDetail) {
    window.scrollTo(0,savedScroll);
    const focus=Array.from(id('grid').children).find(a=>a.hash==='#juego/'+lastCard);
    (focus || id('library-heading')).focus({preventScroll:true});
  }
  else if(!initial && state.page!==lastPage){id('library-heading').scrollIntoView();id('library-heading').focus({preventScroll:true});}
}
id('q').addEventListener('input',()=>{if(catalog)renderCatalog({...state,query:id('q').value,page:1},true);});
id('orden').addEventListener('change',()=>{if(catalog)renderCatalog({...state,order:id('orden').value,page:1},true);});
window.addEventListener('hashchange',()=>route());
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();id('contenido').focus();id('contenido').scrollIntoView();});
async function boot(){
  try{
    const data=await fetchJson('catalogo');
    for(const game of data.games) game.key=fold(game.title);
    data.games.sort((a,b)=>b.published.localeCompare(a.published));catalog=data;
    id('total').hidden=false;id('total').textContent=data.games.length;
    id('revision').textContent='Catálogo revisado el '+prettyDate(data.checked);route(true);
  }catch{
    id('resultados').textContent='No se pudo cargar el catálogo.';
    id('grid').replaceChildren(button('Reintentar',boot));
  }
}
boot();

id('browse-games').addEventListener('click',event=>{event.preventDefault();id('q').focus({preventScroll:true});id('biblioteca').scrollIntoView({block:'start'})});
