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
export const labels={guide:'Según la ficha',off:'Desactivada',on:'Activada','?':'Sin documentar',low:'Bajo',medium:'Medio',high:'Alto',ultra:'Ultra'};
const qualityNames = {low:'low', bajo:'low', baja:'low', medium:'medium', medio:'medium', media:'medium', high:'high', alto:'high', alta:'high', ultra:'ultra'};
const scaleModes = {native:'Nativo', quality:'Calidad', balanced:'Equilibrado', performance:'Rendimiento', 'ultra-performance':'Ultra rendimiento'};
function quality(p){
 const pair=p.rows.find(([k])=>/^(graphics preset|quality preset|graphics quality preset|overall quality|graphics quality|preset graphics|preset|calidad gráfica)$/i.test(k.trim()));
 return qualityNames[pair?.[1].trim().toLowerCase()] || 'guide';
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
const key = ({profile,r,w,q,scale,gen}) => [profile,r,w,q,scale,gen].join('|');
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
 let initial=anchors[0]||profiles[0];
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
 function calculate(t){
  const base=profiles[t.profile];
  if(!base||!t.w||!t.r||!(base.suite||[base.q]).includes(t.q))return null;
  const same=anchors.filter(a=>a.profile===t.profile&&a.q===t.q&&a.gen===t.gen);
  const direct=atPower(same.filter(a=>a.r===t.r&&a.scale===t.scale),t.w);
  if(direct)return direct;
  if(t.gen==='on')return null;
  // For resolution or documented FSR 3 changes, bracket two idealized scenarios:
  // fixed frame time (CPU-bound) and frame time proportional to pixel count.
  // Never infer a TDP curve, preset, or FG uplift from other titles.
  const requested=internalHeight(t.r,t.scale);
  if(!requested)return null;
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
  return possible.sort((a,b)=>a.distance-b.distance)[0]?.value||null;
 }
 return {
  profiles,anchors,initial,
  evaluate(t){const id=key(t);if(!cache.has(id))cache.set(id,calculate(t));return cache.get(id)},
  options(profile){
   const p=profiles[profile], samples=anchors.filter(a=>a.profile===profile);
   // Offer only combinations documented in this test/profile. For FG, an explicit
   // state is evidence for that state, not for the other one.
   return {qualities:p.suite||[p.q],scales:[...new Set([p.scale,...samples.map(a=>a.scale)])],
    generation:[...new Set([p.gen,...samples.map(a=>a.gen)])]};
  }
 };
}
