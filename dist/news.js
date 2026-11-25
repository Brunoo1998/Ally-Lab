const categories={destacadas:'Noticias destacadas',juegos:'Actualizaciones de juegos',drivers:'Drivers y BIOS',rendimiento:'Rendimiento'};
const impacts={positivo:'Impacto positivo',negativo:'Impacto negativo',informativo:'Informativo'};
const $=id=>document.getElementById(id);
function add(parent,tag,text,cls){
 const node=document.createElement(tag);
 if(text)node.textContent=text;
 if(cls)node.className=cls;
 parent.append(node);
 return node;
}
const fold=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const date=value=>new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
function link(parent,title,url,external=false){
 const a=add(parent,'a',title);
 a.href=url;
 if(external){a.target='_blank';a.rel='noopener noreferrer'}
}
async function json(name){
 const response=await fetch('./datos/'+name+'.json',{cache:'no-cache'});
 if(!response.ok)throw new Error('No se pudo cargar '+name);
 return response.json();
}
function card(parent,n,games){
 const article=add(parent,'article','','news-card');
 const img=add(article,'img');img.src=n.image||'./assets/consola.webp';img.alt='';img.loading='lazy';
 img.onerror=()=>{img.onerror=null;img.src='./assets/consola.webp'};
 const content=add(article,'div','','news-copy');
 const meta=[categories[n.category],date(n.date)];
 if(n.scope==='pc'||n.scope==='model')meta.push(n.scope==='pc'?'PC general':'Xbox Ally X');
 add(content,'p',meta.join(' · '),'news-meta');
 add(content,'h3',n.title);
 add(content,'p',n.summary);
 if(impacts[n.impact])add(content,'p',impacts[n.impact],'news-impact '+n.impact);
 if(n.fpsBefore!=null&&n.fpsAfter!=null&&n.conditions)add(content,'p',n.fpsBefore+' → '+n.fpsAfter+' FPS · '+n.conditions);
 link(content,'Fuente original · '+n.source,n.url,true);
 const game=games.get(n.gameId);
 if(game)link(content,'Ver ficha de '+game.title,'./index.html#juego/'+encodeURIComponent(game.id));
}
async function start(){
 const list=$('news-list');
 if(!list)return;
 const now=new Date();
 const cutoff=new Date(now.getFullYear(),now.getMonth()-1,1);
 const lastDay=new Date(now.getFullYear(),now.getMonth(),0).getDate();
 cutoff.setDate(Math.min(now.getDate(),lastDay));
 const day=value=>[value.getFullYear(),value.getMonth()+1,value.getDate()].map((n,i)=>String(n).padStart(i?2:4,'0')).join('-');
 const news=(await json('news')).filter(n=>n.date>=day(cutoff)&&n.date<=day(now));
 news.sort((a,b)=>b.date.localeCompare(a.date));
 const catalog=await json('catalogo');
 const games=new Map(catalog.games.map(g=>[g.id,g]));
 const category=$('news-category'),impact=$('news-impact'),query=$('news-query'),scope=$('news-scope');
 let selected='';
 const tabs=Object.entries({'':'Todas',...categories}).map(([key,title])=>{
  const button=add(category,'button',title);
  button.type='button';
  button.addEventListener('click',()=>{selected=key;render()});
  return [key,button];
 });
 function render(){
  list.replaceChildren();
  for(const [key,button] of tabs)button.setAttribute('aria-pressed',String(key===selected));
  const search=fold(query.value.trim());
  const items=news.filter(n=>(!selected||n.category===selected)
    &&(!impact.value||n.impact===impact.value)
    &&(!scope.value||n.scope===scope.value)
    &&fold([n.title,n.summary,n.source,games.get(n.gameId)?.title].join(' ')).includes(search));
  for(const n of items)card(list,n,games);
  if(!items.length){
   add(list,'p','No hay noticias que coincidan con los filtros.');
   const reset=add(list,'button','Quitar filtros','btn');
   reset.type='button';
   reset.addEventListener('click',()=>{selected=query.value=scope.value=impact.value='';render();query.focus()});
  }
  $('news-count').textContent=items.length+(items.length===1?' noticia':' noticias');
 }
 query.addEventListener('input',render);
 impact.addEventListener('change',render);
 scope.addEventListener('change',render);
 render();
}
start().catch(()=>{const target=$('news-count');if(target)target.textContent='No se pudieron cargar las noticias. Recarga para volver a intentarlo.'});
