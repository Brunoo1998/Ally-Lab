// Cada tupla enlaza una lectura de la nota publicada con su tabla, potencia y estado de FG.
// El indicador "?" conserva la incertidumbre cuando la fuente no desglosa el contador.
const evidence = {
 'world-of-warcraft-forever-rog-xbox-ally-x-game-settings':[[0,35,'?',60],[1,18,'?',60],[2,15,'?',40,'>']],
 'nierautomata-rog-xbox-ally-x-game':[[0,18,'?',60],[0,20,'?',60],[1,15,'?',60]],
 'the-outlast-trials-rog-xbox-ally-x-game-settings':[[0,35,'?',90,'>'],[0,20,'?',60,'>'],[0,18,'?',60,'>'],[0,15,'?',40,'>']],
 'payday-3-rog-xbox-ally-x-game-settings':[[0,35,'?',60,'>']],
 'void-breaker-rog-xbox-ally-x-game-settings':[[0,35,'?',60,'≈']],
 'psychonauts-2-rog-xbox-ally-x-game-settings':[[0,35,'?',60,'>'],[1,20,'?',60,'≈'],[1,18,'?',60,'≈'],[1,15,'?',40,'>']],
 'tape-to-tape-rog-xbox-ally-x-game-settings':[[0,7,'?',80,'>'],[0,10,'?',120]],
 'metro-last-light-redux-rog-xbox-ally-x-game-settings':[[0,18,'?',60,'>'],[0,20,'?',60,'>'],[0,35,'?',60,'>'],[1,15,'?',50,'>']],
 'cyberpunk-2077-rog-xbox-ally-x':[[0,35,'off',40,'>'],[0,35,'on',80,'>'],[1,35,'on',100,'>'],[1,18,'?',30,'≈']],
 'borderlands-4-rog-xbox-ally-x':[[0,35,'off',50,'>'],[1,35,'off',40,'>']],
 'the-legend-of-khiimori-rog-xbox-ally-x':[[1,35,'off',30,45],[1,35,'on',60,'>']],
 'death-stranding-2-on-the-beach-xbox':[[1,35,'off',30,45],[1,35,'on',50,75]]
};
export const labels={guide:'Preajuste no indicado',off:'Desactivada',on:'Activada','?':'Sin documentar',low:'Bajo',medium:'Medio',high:'Alto',ultra:'Ultra'};
const qualityNames = {low:'low', bajo:'low', baja:'low', medium:'medium', medio:'medium', media:'medium', high:'high', alto:'high', alta:'high', ultra:'ultra'};
const scaleModes = {native:'Nativo', quality:'Calidad', balanced:'Equilibrado', performance:'Rendimiento', 'ultra-performance':'Ultra rendimiento'};
export function qualityPreset(rows){
 return rows.find(([k,v])=>/^(graphics preset|quality preset|graphics quality preset|overall quality|graphics quality|preset graphics|preset|calidad gráfica)$/i.test(k.trim()) && v.trim())?.[1];
}
function quality(p){
 return qualityNames[qualityPreset(p.rows)?.trim().toLowerCase()] || 'guide';
}
function resolution(p){
 const name=p.name.match(/\b(720|900|1080)p\b/i);
 if(name)return +name[1];
 const setting=p.rows.find(([k])=>/^(resolution|screen resolution|display resolution|output resolution|resolución)$/i.test(k));
 const height=setting?.[1].match(/(?:[x×]\s*|\b)(720|900|1080)(?:p\b|\s*$)/i);
 return height ? +height[1] : 0;
}
function powers(p){
 return (p.name.match(/\b(\d{1,2}(?:\s*\/\s*\d{1,2})*)\s*W\b/i)?.[1] || '')
  .split('/').map(Number).filter(w=>w>=7 && w<=35);
}
function scaling(p){
 const native=p.rows.some(([k,v])=>/^(?:upscal(?:er|ing)(?: method)?|super resolution|fsr(?: [0-9.]+)?)$/i.test(k.trim())&&/^(?:off|disabled|native|none|desactivado)$/i.test(v.trim()));
 const settings=p.rows.filter(([k,v])=>!/generat|sharp|dynamic/i.test(k)&&
  /upscal|super resolution|anti.alias|^(?:AMD )?FSR/i.test(k)&&!/^(off|disabled|unsupported|no)$/i.test(v.trim()));
 const techs=[...new Set(settings.flatMap(([k,v])=>{
  const tech=v.match(/\b(?:FSR|XeSS|TSR|TAAU|RSR)\b(?:\s*\d+(?:\.\d+)*)?/i)||
   k.match(/\b(?:FSR|XeSS|TSR|TAAU|RSR)\b(?:\s*\d+(?:\.\d+)*)?/i);
  return tech ? [tech[0].toUpperCase()] : [];
 }))];
 // Un campo específico del modo puede mencionar FSR sin repetir la versión.
 const technologies=techs.filter(t=>!techs.some(other=>other.startsWith(t+' ')));
 if(technologies.length!==1)return !technologies.length&&native?'native':'guide';
 const modes=[...new Set(settings.flatMap(([,v])=>{
  const mode=v.trim().toLowerCase().match(/(?:native aa|ultra performance|quality|balanced|performance)\s*$/)?.[0];
  return mode&&!/\bor\b|\//i.test(v) ? [mode==='native aa'?'native':mode.replace(' ','-')] : [];
 }))];
 return technologies[0]+(modes.length===1?':'+modes[0]:'');
}
export function scaleLabel(value){
 const [tech,mode]=value.split(':');
 return tech==='native'?'Nativo':tech==='guide' ? 'Sin detallar en la ficha' : [tech,scaleModes[mode]].filter(Boolean).join(' · ');
}
function fg(p){
 const v=p.rows.find(([k])=>/frame gen|generación de fotogramas/i.test(k))?.[1]||'';
 return /^(off|disabled|desactivad[oa])$/i.test(v.trim())?'off':/\bor\b/i.test(v)?'?':/^(on|enabled|activad[oa]|amd|fsr|2x|3x)/i.test(v.trim())?'on':'?';
}
function readings(game,d){
 if(evidence[game.id])return evidence[game.id];
 const explicit=d.profiles.flatMap((profile,i)=>{
  const power=powers(profile);
  if(power.length!==1)return [];
  const note=profile.rows.find(([key])=>/^FPS observados$/i.test(key))?.[1]||'';
  const reading=note.match(/^(más de +)?(\d+) +FPS(?:$| +(?:de media|estables)$)/i);
  return reading?[[i,power[0],fg(profile),Number(reading[2]),reading[1]?'>':undefined]]:[];
 });
 if(explicit.length)return explicit;
 // Solo asignar la media global si resolución, potencia, tabla y cifra son inequívocas.
 const p=d.profiles[0], metrics=Object.fromEntries(d.metrics);
 if(d.profiles.length!==1||!/^\d+W$/i.test(metrics['TESTED TDP']||'')||!/^\d+$/.test(metrics['AVERAGE FPS']||''))return [];
 const w=parseInt(metrics['TESTED TDP']), n=Number(metrics['AVERAGE FPS']);
 if(!new RegExp('^'+w+'W\\s').test(p.name)||!/(720|900|1080)p/i.test(p.name)||!n)return [];
 if(d.notes.some(s=>/generación|con el mod|sin el mod|al activar|al desactivar/i.test(s)))return [];
 return [[0,w,fg(p),n]];
}
export function publicSource(value) {
 try {
  const url=new URL(value);
  const host=url.hostname.replace(/^www\./,'');
  if(url.protocol==='https:'&&!/(^|\.)(rogallylife|recomplauncher|recompstore)\.com$/i.test(host))return url.href;
 } catch {}
 return null;
}

export const qualities = ['low','medium','high','ultra'];
export const resolutions = [720,900,1080];
export const kinds = {off:'FPS renderizados',on:'FPS mostrados con FG','?':'FPS sin desglose'};
export const qualityFields={
 texture:['Texturas',/^(?:textures?(?: quality| resolution| detail)?|texturas|calidad de texturas)$/i,.035],
 shadow:['Sombras',/^(?:shadows?(?: quality| resolution| detail)?|sombras|calidad de sombras)$/i,.08]
};
const levels={low:0,medium:1,high:2,ultra:3};
const key = ({profile,r,w,q,scale,gen,texture,shadow}) => [profile,r,w,q,scale,gen,texture,shadow].join('|');
const notebookcheck = 'https://www.notebookcheck.net/Full-screen-Xbox-experience-for-gaming-handhelds-Asus-ROG-Xbox-Ally-X-review.1139045.0.html';
// 1080p results grouped by matching test conditions and by sustained TDP.
const benchmarkSuites = {
 'cyberpunk-2077-rog-xbox-ally-x':{scale:'native',gen:'off',settings:[['Resolución','1920 × 1080'],['FSR','Desactivado']],presets:{
 low:[28.8,36.1,48,49.5],
 medium:[22.3,32.4,38.1,40.5],
 high:[18.4,26.8,30.7,31.9],
 ultra:[15.5,23,26.7,28]
 }},
 'baldurs-gate-3-rog-xbox-ally-x':{scale:'guide',gen:'?',settings:[['Resolución','1920 × 1080'],['Antialiasing','TAA']],presets:{
 medium:[21.3,32.1,35.9,39.8],
 high:[18.8,27.1,29.9,33.2],
 ultra:[18.6,26.5,29.7,32.5]
 }}
};
const fsrRatios = {native:1,quality:1.5,balanced:1.7,performance:2,'ultra-performance':3};
function internalHeight(r, scale) {
 if(scale==='native')return r;
 const [tech,mode]=scale.split(':');
 return /^FSR 3(?:\.1(?:\.\d+)?)?$/.test(tech)&&fsrRatios[mode] ? r/fsrRatios[mode] : null;
}
const round = n => Math.round(n*10)/10;

// Cuartiles de 224 lecturas del catálogo normalizadas a 1080p y 20 W.
const catalogue = {low:31,high:55,r:1080,w:20,gen:'?',origin:'catalogue'};

function contextReadings(game,detail){
 const rows=[];
 for(const note of detail.notes||[]){
  for(const clause of note.split(/[.!?;]+\s*/)){
   if(!/\b(?:observaron|registraron|obtuvieron|alcanzaron|superaron|midieron|observó|registró|obtuvo|alcanzó|superó|midió|de media)\b/i.test(clause))continue;
   const m=clause.match(/(?:(\d{1,3})\s*[–-]\s*)?(\d{1,3})\s*FPS\b/i);
   if(!m||/\b(?:límite|limitador|objetivo|hasta|ca[ií]das?|perdi[oó]|aument[oó]|mejora)\b/i.test(clause.slice(0,m.index)))continue;
   const low=Number(m[1]||m[2]), high=Number(m[2]);
   if(low<5||low>high||high>240)continue;
   const prefix=clause.slice(0,m.index);
   const limits=/\bsuper(?:ó|aron)\b|más de/i.test(prefix);
   const resolutions=[...new Set([...clause.matchAll(/\b(720|900|1080)p\b/gi)].map(x=>+x[1]))];
   const powers=[...new Set([...clause.matchAll(/\b(\d{1,2})\s*W\b/gi)].map(x=>+x[1]))];
   const off=/sin (?:FG|generación de fotogramas)/i.test(clause);
   const on=/con (?:FG|generación de fotogramas)|al activarla|FPS mostrados/i.test(clause);
   const ambiguous=/(?:FPS[^.]*\by\b[^.]*FPS|sin generación[^.]*\by\b[^.]*(?:con ella|al activarla))/i.test(clause);
   if(ambiguous)continue;
   rows.push({low,high:limits?Math.max(high,Math.round(low*1.2)):high,r:resolutions.length===1?resolutions[0]:0,
    w:powers.length===1&&powers[0]>=7&&powers[0]<=35?powers[0]:0,
    gen:off?'off':on?'on':'?',origin:'note',url:game.source});
  }
 }
 const metrics=Object.fromEntries(detail.metrics||[]);
 const average=Number(metrics['AVERAGE FPS']);
 const power=metrics['TESTED TDP']?.match(/^\s*(\d{1,2})\s*W\s*$/i);
 if(average>=5&&average<=240)rows.push({low:average,high:average,r:0,w:power?+power[1]:0,gen:'?',origin:'average',url:game.source});
 return rows;
}

export function createModel(game, detail, verifiedPoints) {
 const profiles=detail.profiles.map((p,profile)=>({
  profile,name:(p.gameTitle?p.gameTitle+' · ':'')+p.name,rows:p.rows,r:resolution(p),
  w:powers(p)[0]||0,q:quality(p),scale:scaling(p),gen:fg(p)
 }));
 const anchors=(verifiedPoints??readings(game,detail)).flatMap(([i,w,gen,low,limit])=>{
  const base=profiles[i];
  if(!base?.r||!Number.isFinite(low)||low<=0||w<7||w>35)return [];
  return [{...base,w,gen,low,high:typeof limit==='number'?limit:limit==='>'?null:low,
   limit:typeof limit==='string'?limit:null,url:game.source}];
 });
 let initial=anchors[0]||profiles.find(p=>p.r&&p.w)||profiles[0];
 const suite=verifiedPoints?null:benchmarkSuites[game.id];
 if(suite){
  const available=Object.keys(suite.presets);
  const profile={profile:profiles.length,name:'Prueba de Notebookcheck',rows:suite.settings,r:1080,w:35,
   q:'medium',scale:suite.scale,gen:suite.gen,suite:available};
  profiles.push(profile);
  for(const [q,samples] of Object.entries(suite.presets))samples.forEach((low,j)=>{
   anchors.push({...profile,q,w:[13,17,25,35][j],low,high:low,url:notebookcheck});
  });
  initial=profile;
 }
 if(!verifiedPoints&&initial)initial={...initial,r:initial.r||1080,w:initial.w||20};
 const cache=new Map();
 const result=(type,confidence,source,low,high,limit=null,why='')=>({
  type,confidence,source,low,high,limit,why,center:high===null?low:round((low+high)/2)
 });
 function atPower(samples,w){
  const measured=samples.find(a=>a.w===w);
  if(measured)return result('Medición publicada',measured.limit==='≈'?'Media':'Alta',measured.url,measured.low,measured.high,measured.limit);
  const ordered=samples.filter(a=>!a.limit&&a.low===a.high).slice().sort((a,b)=>a.w-b.w);
  const lower=ordered.filter(a=>a.w<w).pop(),upper=ordered.find(a=>a.w>w);
  if(!lower||!upper||lower.url!==upper.url)return null;
  const value=round(lower.low+(upper.low-lower.low)*(w-lower.w)/(upper.w-lower.w));
  return result('Interpolación','Media',lower.url,value,value,null,'Entre mediciones a '+lower.w+' y '+upper.w+' W.');
 }
 const context=verifiedPoints?[]:contextReadings(game,detail);
 if(!verifiedPoints&&initial?.gen==='on'&&![...anchors,...context].some(a=>a.gen==='on'))initial={...initial,gen:'?'};
 const generationFor=base=>[...new Set([base.gen,...anchors.filter(a=>a.profile===base.profile).map(a=>a.gen),
  ...(!verifiedPoints&&base.gen==='on'&&!anchors.some(a=>a.profile===base.profile&&a.gen==='on')?['?']:[])])];
 function approximate(t,base){
  const sameGame=[
   ...anchors.map(a=>({...a,high:a.high??Math.round(a.low*1.2),origin:'anchor'})),
   ...context
  ].filter(a=>t.gen==='on'?a.gen==='on':t.gen==='off'?a.gen==='off':a.gen!=='on');
  if(t.gen==='on'&&!sameGame.length)return null;
  const distance=a=>(a.profile!==undefined&&a.profile!==t.profile?0.4:0)
   +(a.q&&a.q!==t.q?0.35:0)+(a.scale&&a.scale!==t.scale?0.35:0)
   +(a.r?Math.abs(Math.log(a.r/t.r)):.43)+(a.w?Math.abs(Math.log(a.w/t.w)):.45)
   +(a.origin==='average'?.25:0);
  const ref=sameGame.reduce((best,a)=>!best||distance(a)<distance(best)?a:best,null)
   ??(verifiedPoints?null:catalogue);
  if(!ref)return null;
  const r=ref.r||base.r||t.r,w=ref.w||base.w||t.w;
  const nativeFrom=ref.scale&&internalHeight(r,ref.scale);
  const nativeTo=internalHeight(t.r,t.scale);
  const pixels=nativeFrom&&nativeTo?nativeFrom/nativeTo:r/t.r;
  const power=t.w/w;
  // Escenarios conservadores: sensibilidad parcial a resolución y potencia.
  const factor=pixels**.7 * power**.35;
  const indirect=ref.origin==='catalogue';
  const spread=indirect?.35:Math.min(.55,.17+distance(ref)*.2);
  const step=indirect?5:1;
  const low=Math.max(1,Math.floor(ref.low*factor*(1-spread)/step)*step);
  const high=Math.max(low+step,Math.ceil(ref.high*factor*(1+spread)/step)*step);
  const reference=indirect?'Cuartiles de otros juegos del catálogo, normalizados a 1080p y 20 W.'
   :ref.origin==='average'?'Media global de la ficha del juego con condiciones incompletas.'
   :'Rendimiento observado del mismo juego en condiciones diferentes o incompletas.';
  return result(indirect?'Estimación por catálogo':'Estimación del juego','Baja',ref.url,low,high,null,
   reference+' La horquilla aplica un ajuste aproximado por resolución y TDP. '+(indirect?'Sin referencia específica para esta configuración.':''));
 }

 function adjustable(base){
  return Object.fromEntries(Object.entries(qualityFields).flatMap(([id,[,pattern]])=>{
   const value=base.rows.find(([name])=>pattern.test(name.trim()))?.[1];
   const preset=qualityNames[value?.trim().toLowerCase()];
   return preset?[[id,preset]]:[];
  }));
 }
 function calculate(t){
  const base=profiles[t.profile];
  if(!base||!selectable(base).includes(t.q))return null;
  const available=adjustable(base);
  const simulatedPreset=t.q!==base.q&&!base.suite?.includes(t.q);
  const changes=Object.entries(available).filter(([id,from])=>qualities.includes(t[id])&&from!==t[id]);
  if(!simulatedPreset&&!changes.length)return calculateBase(t);
  const source=calculateBase({...t,q:simulatedPreset?base.q:t.q});
  if(!source)return null;
  const from=levels[base.q]??1;
  const presetDelta=simulatedPreset?(from-levels[t.q])*.14:0;
  const detailDelta=changes.reduce((sum,[id,previous])=>sum+(levels[simulatedPreset?t.q:previous]-levels[t[id]])*qualityFields[id][2],0);
  const factor=Math.exp(presetDelta+detailDelta);
  const low=Math.max(1,Math.floor(source.low*factor*.88));
  const high=Math.max(low+1,Math.ceil((source.high??source.low*1.2)*factor*1.12));
  return result(source.type==='Estimación por catálogo'?source.type:'Estimación de calidad','Baja',source.source,low,high,null,
   'Ajuste orientativo por calidad con una sensibilidad genérica. '+(source.type==='Estimación por catálogo'?'La base procede de otros juegos del catálogo.':'La base procede de una referencia del juego.'));
 }
 const selectable=base=>verifiedPoints?(base.suite||[base.q]):[...new Set([base.q,...qualities])];

 function calculateBase(t){
  const base=profiles[t.profile];
  if(!base||!t.w||!t.r||!(base.suite||[base.q]).includes(t.q)||
    !generationFor(base).includes(t.gen))return null;
  const same=anchors.filter(a=>a.profile===t.profile&&a.q===t.q&&a.gen===t.gen);
  const direct=atPower(same.filter(a=>a.r===t.r&&a.scale===t.scale),t.w);
  if(direct)return direct;
  if(t.gen==='on')return approximate(t,base);
  // For resolution or documented FSR 3 changes, bracket two idealized scenarios:
  // fixed frame time (CPU-bound) and frame time proportional to pixel count.
  // Never infer a TDP curve, preset, or FG uplift from other titles.
  const requested=internalHeight(t.r,t.scale);
  if(!requested)return approximate(t,base);
  const refs=same.filter(a=>!a.limit&&a.low===a.high&&(
   a.scale===t.scale || a.scale.split(':')[0]===t.scale.split(':')[0]
  )&&internalHeight(a.r,a.scale));
  const groups=new Map();
  for(const ref of refs){
   const id=ref.r+'|'+ref.scale;
   if(!groups.has(id))groups.set(id,[]);
   groups.get(id).push(ref);
  }
  const possible=[];
  for(const rows of groups.values()){
   const original=internalHeight(rows[0].r,rows[0].scale);
   const ref=atPower(rows,t.w);
   const ratio=original/requested;
   if(!ref||ratio===1)continue;
   const bound=ref.center*ratio**2;
   possible.push({
    distance:Math.abs(Math.log(ratio)),
    value:result('Estimación por escenarios','Baja',ref.source,
     Math.max(1,Math.floor(Math.min(ref.center,bound))),Math.ceil(Math.max(ref.center,bound)),null,
     'Escenarios de carga fija y carga proporcional a píxeles. El rango es orientativo y no incorpora un límite de FPS ni costes del juego sin medir.')
   });
  }
  return possible.sort((a,b)=>a.distance-b.distance)[0]?.value||approximate(t,base);
 }
 return {
  profiles,anchors,initial,
  evaluate(t){const id=key(t);if(!cache.has(id))cache.set(id,calculate(t));return cache.get(id)},
  options(profile){
   const p=profiles[profile], samples=anchors.filter(a=>a.profile===profile);
   // Offer only combinations documented in this test/profile. For FG, an explicit
   // state is evidence for that state, not for the other one.
   return {qualities:selectable(p),adjustable:adjustable(p),scales:[...new Set([p.scale,...samples.map(a=>a.scale)])],
    generation:generationFor(p)};
  }
 };
}
