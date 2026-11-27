import {createModel, labels, scaleLabel, kinds} from '../../dist/sim-model.js';
import {isBlockedLink} from '../../dist/retro-403.js';
import {retroEmuladores} from '../../dist/retro-emuladores.js';

const remote = 'https://raw.githubusercontent.com/Brunoo1998/Ally-Lab/promociones/';
const consoles = {
  snes:'Super Nintendo|SNES|Super Famicom', nes:'NES|Nintendo Entertainment System|Famicom',
  n64:'Nintendo 64|N64', gba:'Game Boy Advance|GBA', gbc:'Game Boy Color|GBC', gb:'Game Boy|GB',
  ps2:'PlayStation 2|Play Station 2|PS2', psx:'PlayStation|PlayStation 1|PSX|PS1',
  psp:'PlayStation Portable|PSP', psvita:'PlayStation Vita|PS Vita', '3ds':'Nintendo 3DS|3DS',
  nds:'Nintendo DS|NDS', gamecube:'Nintendo GameCube|GameCube', switch:'Nintendo Switch|Switch',
  wiiu:'Nintendo Wii U|Wii U', wii:'Nintendo Wii|Wii', dreamcast:'Dreamcast',
  saturn:'Sega Saturn|Saturn', gamegear:'Sega Game Gear|Game Gear', atari2600:'Atari 2600',
  mastersystem:'Sega Master System|Master System', megadrive:'Sega Mega Drive|Mega Drive|Genesis',
  xbox360:'Xbox 360|X360', xbox:'Xbox original|Xbox'
};
const pages = [
  ['Juegos de PC','/#juegos','catalogo fichas rendimiento juegos pc'],
  ['Simulador de FPS','/#simulador','simulador fps rendimiento optimizar estimar'],
  ['Juegos gratis','/gratis','gratis juegos gratuitos ofertas temporales epic steam gog promociones'],
  ['Retro','/emulacion','retro emulacion consolas roms catalogo'],
  ['Ports y recompilaciones','/ports','ports recompilaciones port recomp zelda'],
  ['Noticias de Ally Lab','/news','noticias novedades actualizaciones amd drivers bios']
];
export const fold = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu,'')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const stop = new Set('a al de del la las el los un una unos unas y o en para por con sin mi me se que quiero jugar busca buscar abre abrelo dame muestra muestrame ensename enseñame ver llevame donde esta cual cuales puedo juego juegos consola consolas mejor configuracion ajustes fps maximo rendimiento recomendado ultimas ultimo alli lab ally'.split(' '));
const id = encodeURIComponent;
const words = s => fold(s).split(' ').filter(w => w && !stop.has(w) && !/^\d{2,4}p?$/.test(w));
const safe = x => typeof x === 'string' && /^(https:\/\/|\.\/assets\/)/i.test(x) ? x.replace(/^\.\//,'/') : '';
const publicCard = (title,url,kind,extra={}) => ({title:String(title).slice(0,240),url,kind,...extra});
function editOne(a,b) {
  if(a.length < 4 || Math.abs(a.length-b.length)>1) return false;
  if(a.length>b.length) return editOne(b,a);
  const i=[...a].findIndex((x,j)=>x!==b[j]);
  if(i<0) return b.length-a.length===1;
  return a.length===b.length ? a.slice(i+1)===b.slice(i+1) ||
    (a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2)) : a.slice(i)===b.slice(i+1);
}
function rank(title, aliases, query) {
  const key=fold(title), all=fold(aliases), terms=new Set(key.split(' ')), related=new Set(all.split(' '));
  let score=0, hits=0;
  for(const word of query){
    if(terms.has(word)){score+=5;hits++;}
    else if(related.has(word)){score+=3;hits++;}
    else if([...terms].some(t=>editOne(word,t))){score+=2;hits++;}
  }
  if(!hits||hits<Math.ceil(query.length*.6))return 0;
  if(key===query.join(' '))score+=12;
  else if(key.includes(query.join(' ')))score+=6;
  return score - key.length/500;
}
async function json(url,assets) {
  const res=assets ? await assets.fetch(url) : await fetch(url,{signal:AbortSignal.timeout(4500),cf:{cacheTtl:600,cacheEverything:true}});
  if(!res.ok)throw Error('Fuente no disponible');
  return res.json();
}
const local=(ctx,path)=>new URL('/datos/'+path+'.json',ctx.request.url);
const data=(ctx,path)=>json(local(ctx,path),ctx.env.ASSETS);
const optional=p=>p.catch(()=>null);
const buckets = new Map();
async function cached(key,load) {
  const existing=buckets.get(key);
  if(existing&&existing.until>Date.now())return existing.value;
  if(buckets.size>=60)buckets.delete(buckets.keys().next().value);
  const value=Promise.resolve().then(load).catch(error=>{if(buckets.get(key)?.value===value)buckets.delete(key);throw error;});
  buckets.set(key,{until:Date.now()+300000,value});
  return value;
}
function performanceCards(game,detail,question) {
  if(!detail?.profiles?.length)return [];
  const model=createModel(game,detail);
  const desired=Number(question.match(/\b(720|900|1080)p\b/i)?.[1]);
  const target=Number(question.match(/\b(\d{2,3})\s*fps\b/i)?.[1]);
  const anchors=model.anchors.filter(a=>!desired||a.r===desired).slice().sort((a,b)=>
    (target?Number(b.gen==='off'&&b.low>=target)-Number(a.gen==='off'&&a.low>=target):0)||b.low-a.low);
  return anchors.slice(0,2).map(a=>{
    const result=model.evaluate(a);
    const params=new URLSearchParams({sim:'1',ref:String(model.anchors.indexOf(a))});
    return {label:'Referencia publicada',fps:a.high&&a.high!==a.low?[a.low,a.high].join('–'):((a.limit==='>'?'≥':a.limit==='≈'?'≈':'')+a.low),
      comparison:result?.type||'Referencia',kind:kinds[a.gen],resolution:a.r?a.r+'p':'Sin documentar',
      quality:labels[a.q]||a.q,tdp:a.w?a.w+' W':'Sin documentar',scale:scaleLabel(a.scale),
      generation:labels[a.gen]||'Sin documentar',url:'/#juego/'+id(game.id)+'?'+params};
  });
}
async function retro(ctx, key, query) {
  const url='https://raw.githubusercontent.com/Arley4d/DescargaMasiva/main/'+key+'.jsonl';
  const rows=await cached(url,async()=>{
    const response=await fetch(url,{signal:AbortSignal.timeout(9000),cf:{cacheTtl:300,cacheEverything:true}});
    if(!response.ok)throw Error('Retro no disponible');
    const out=[];
    for(const line of (await response.text()).split('\n')){
      if(!line.trim())continue;
      const row=JSON.parse(line);
      if(row.type==='file'&&typeof row.n==='string'&&row.urls?.some(e=>/^https?:\/\//i.test(e.u)))
        out.push([row.n,row.urls.some(e=>/^https?:\/\//i.test(e.u)&&!isBlockedLink(e.u))]);
    }
    return out;
  });
  const ranked=rows.map(([title,links])=>{
    const name=title.replace(/\s*[([][^()[\]]+[)\]].*$/,'');
    const aliases=/ocarina of time/i.test(name)?'ocarina del tiempo oot':/majora/i.test(name)?'mascara de majora':/a link to the past/i.test(name)?'enlace al pasado':'';
    const score=rank(name,aliases,query);
    return {title,links,base:fold(name),score:score>0?score+(/\((?:demo|debug|beta|proto)/i.test(title)?-.4:0):0};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
  const families=new Set();
  const selected=ranked.filter(r=>!families.has(r.base)&&families.add(r.base)).slice(0,5);
  if(selected.length<5)selected.push(...ranked.filter(r=>!selected.includes(r)).slice(0,5-selected.length));
  if(!selected.length)return [];
  const response=await optional(ctx.env.ASSETS.fetch(new URL('/datos/retro-caratulas/'+key+'.json.gz',ctx.request.url)));
  let box=null;
  if(response?.ok)box=await optional((async()=>{
    const bytes=new Uint8Array(await response.arrayBuffer());
    return bytes[0]===31&&bytes[1]===139 ? new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json() : JSON.parse(new TextDecoder().decode(bytes));
  })());
  return selected.map(({title,links,score})=>{
    const original=box&&Object.hasOwn(box[1],title)?box[1][title]:'';
    const extra=box?.[2]&&Object.hasOwn(box[2],title)?box[2][title]:null;
    const cover=safe(original?(box[0]?box[0]+id(original):original):extra?'https://images.launchbox-app.com/'+id(extra[0]):'');
    return {...publicCard(title,'/emulacion#consola/'+key+'?juego='+id(title),'Retro',
      {cover,description:consoles[key].split('|')[0]+(links?' · Algunos enlaces requieren iniciar sesión en Archive.org.':' · No hay enlace de descarga visible.')}),
      score};
  });
}
export async function retrieve(ctx, question) {
  const normalized=fold(question);
  const nav=normalized.match(/^(?:llevame a|abre|ir a|abre el|ver) (?:el |la |las |los )?(juegos gratis|simulador(?: de fps)?|retro|noticias(?: de ally lab)?|ports|catalogo|juegos de pc)$/);
  if(nav){
    const q=nav[1], index=q.includes('gratis')?2:q.includes('simulador')?1:q==='retro'?3:q.includes('noticias')?5:q==='ports'?4:0;
    const [title,url]=pages[index];
    return {direct:true,cards:[publicCard(title,url,'Sección')]};
  }
  const consoleMatch=Object.entries(consoles).flatMap(([key,names])=>names.split('|').map(name=>[key,fold(name)]))
    .sort((a,b)=>b[1].length-a[1].length).find(([,name])=>(' '+normalized+' ').includes(' '+name+' '));
  const performance=/\bfps\b|\b(?:720|900|1080)p\b|rendimiento|configuraci[oó]n/i.test(question);
  const news=/notici|drivers|\bbios\b/.test(normalized);
  const offers=/gratis|gratuito|oferta|promocion|temporales/.test(normalized);
  const ports=/\bport\b|\bports\b|recompil/.test(normalized);
  const retroFamilies=/mario|pokemon|zelda|metroid|sonic|donkey kong/.test(normalized);
  const retroIntent=!ports&&(consoleMatch||/retro|emulacion/.test(normalized)||retroFamilies&&!performance);
  const queryText=consoleMatch?(' '+normalized+' ').replace(' '+consoleMatch[1]+' ',' '):normalized;
  const query=words(queryText).filter(w=>!['retro','noticias','gratis','gratuitos','ofertas','recompilaciones','recompilacion','ports','port','ultimas','temporales','emulacion'].includes(w)).slice(0,12);
  const found=[];
  let incomplete=false;
  if(retroIntent){
    const key=consoleMatch?.[0];
    if(key&&!query.length){
      const recommendation=retroEmuladores[key];
      return {direct:true,cards:[publicCard(consoles[key].split('|')[0],'/emulacion#consola/'+key,'Retro',
        {description:recommendation?recommendation[0]+' · '+recommendation[1]:''})]};
    }
    const keys=key?[key]:/pokemon|metroid/.test(normalized)?['gba','gbc','gb','snes','nds','3ds']:
      /sonic/.test(normalized)?['megadrive','dreamcast','saturn','gamegear','mastersystem','gba']:
      /zelda/.test(normalized)?['n64','snes','nes','gba','gamecube','nds']:
      /mario|donkey kong/.test(normalized)?['snes','nes','n64','gba','nds','gamecube']:[];
    const matches=await Promise.allSettled(keys.map(k=>retro(ctx,k,query)));
    for(const item of matches){if(item.status==='fulfilled')found.push(...item.value);else incomplete=true;}
    if(key||found.length)return {cards:found.sort((a,b)=>b.score-a.score).slice(0,6),incomplete,
      noMatch:incomplete?'No he podido consultar todo el catálogo Retro solicitado.':'No he encontrado ese juego en la consola indicada.'};
    return {cards:[publicCard('Catálogo Retro','/emulacion','Sección')],incomplete,
      noMatch:'Indica una consola para buscar dentro de su catálogo Retro.'};
  }
  if(news){
    const entries=await optional(data(ctx,'news'));
    const hints=query.filter(w=>!['drivers','bios'].includes(w));
    const filtered=(entries||[]).filter(n=>!hints.length||rank(n.title,[n.summary,n.source,n.category].join(' '),hints)>0)
      .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
    return {cards:filtered.map(n=>publicCard(n.title,'/news#noticia-'+id(n.id),'Noticia',
      {description:n.date+' · '+n.summary,cover:safe(n.image)})),incomplete:!entries,noMatch:'No he encontrado noticias que coincidan.'};
  }
  if(offers){
    const lists=await Promise.all([optional(data(ctx,'gratis')),optional(json(remote+'gratis.json')),optional(json(remote+'gratis-otras-tiendas.json'))]);
    const now=Date.now(), unique=new Map();
    for(const list of lists)for(const o of list?.offers||[])if(o.region==='ES'&&Date.parse(o.start)<=now&&Date.parse(o.end)>now)unique.set(o.id,o);
    const selection=[...unique.values()].filter(o=>!query.length||rank(o.title,o.platform,query)>0).slice(0,6);
    return {cards:selection.map(o=>publicCard(o.title,'/gratis#oferta='+id(o.id)+'&tipo='+id(o.kind||'keep'),'Oferta activa',
      {description:o.platform+' · Hasta '+o.end,cover:safe(o.cover)})),incomplete:lists.slice(1).some(x=>!x),noMatch:'No he encontrado una oferta activa que coincida.'};
  }
  if(ports){
    const source=await optional(cached(new URL('/datos/ports.json',ctx.request.url).href,()=>data(ctx,'ports')));
    const projects=(source?.projects||[]).flatMap(p=>[{group:p.group,game:p.game,cover:p.cover},...(p.includedGames||[])]
      .filter(g=>g.group).map(g=>({p,g,score:query.length?rank(g.game||p.name,[p.name,p.platform,p.origin].join(' '),query):1})))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
    return {cards:projects.map(({p,g})=>publicCard(g.game||p.name,'/ports#'+id(g.group)+'/'+id(p.id),'Port',
      {description:p.name+' · '+p.platform,cover:safe(g.cover||p.cover)})),incomplete:!source,noMatch:'No he encontrado un proyecto que coincida.'};
  }
  if(/accesorio|almacenamiento|\bssd\b|\bmicrosd\b/.test(normalized))
    return {cards:[],noMatch:'La versión publicada en Cloudflare no tiene una sección de accesorios o almacenamiento indexada.'};
  const source=await optional(cached(new URL('/datos/catalogo.json',ctx.request.url).href,()=>data(ctx,'catalogo')));
  const catalog=source?.games||[];
  const exact=catalog.find(g=>fold(g.title)===normalized);
  let candidates=exact?[exact]:catalog.map(g=>[g,rank(g.title,g.id,query)]).filter(([,s])=>s>0)
    .sort((a,b)=>b[1]-a[1]).slice(0,6).map(([g])=>g);
  const general=performance&&!query.length;
  if(general)candidates=catalog.filter(g=>/60|[789]\d|1\d{2}/.test(String(g.fps)));
  const months=performance?await Promise.all([...new Set(candidates.map(g=>g.published.slice(0,7)))].map(m=>
    optional(cached(local(ctx,m).href,()=>data(ctx,m))))):[];
  const resolution=Number(question.match(/\b(720|900|1080)p\b/i)?.[1]);
  const threshold=Number(question.match(/\b(\d{2,3})\s*fps\b/i)?.[1])||60;
  const cards=candidates.map(g=>{
    const detail=months.find(m=>m&&Object.hasOwn(m,g.id))?.[g.id];
    let documented;
    if(performance&&!general&&detail?.profiles?.length){
      const profileIndex=detail.profiles.findIndex(p=>!resolution||p.name.includes(resolution+'p'));
      if(profileIndex>=0){
        const profile=detail.profiles[profileIndex];
        documented={name:profile.name,settings:profile.rows.filter(([key])=>/resolution|resoluci|preset|quality|quality|fsr|upscal|generat/i.test(key)).slice(0,9),
          notes:(detail.notes||[]).slice(0,2),url:'/#juego/'+id(g.id)+'?ajuste='+(profileIndex+1)};
      }
    }
    return publicCard(g.title,'/#juego/'+id(g.id),'Juego de PC',{cover:safe(g.cover),simulator:'/#juego/'+id(g.id)+'?sim=1',
      ...(performance?{readings:performanceCards(g,detail,question),documented}:{})});
  }).filter(c=>!general||c.readings?.some(r=>r.kind!==kinds.on&&Number(r.fps.replace(/^[≥≈]/,'').split('–')[0])>=threshold));
  return {cards:cards.slice(0,6),direct:!!exact&&!performance,performance,general,incomplete:!source,
    noMatch:general?'No hay referencias suficientes para ese objetivo en los datos consultados. Puedes indicar un juego concreto.':
      'No he encontrado una ficha que coincida. Prueba con el título completo o indica la consola.'};
}
