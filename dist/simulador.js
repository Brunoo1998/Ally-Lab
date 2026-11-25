import {referencias,proyectar,aproximar} from './proyeccion.js?v=39';
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
 'borderlands-4-rog-xbox-ally-x':[[0,35,'off',50,'>'],[1,35,'off',40,'>']],
 'the-legend-of-khiimori-rog-xbox-ally-x':[[1,35,'off',30,45],[1,35,'on',60,'>']],
 'death-stranding-2-on-the-beach-xbox':[[1,35,'off',30,45],[1,35,'on',50,75]]
};
const labels={guide:'Según la ficha',off:'Desactivada',on:'Activada','?':'Sin documentar',low:'Bajo',medium:'Medio',high:'Alto',ultra:'Ultra'};
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
 const settings=p.rows.filter(([k,v])=>!/generat|sharp|dynamic/i.test(k)&&
  /upscal|super resolution|anti.alias|^FSR/i.test(k)&&!/^(off|disabled|unsupported|no)$/i.test(v.trim()));
 const techs=[...new Set(settings.flatMap(([k,v])=>{
  const tech=v.match(/\b(?:FSR|XeSS|TSR|TAAU|RSR)\b(?:\s*\d+(?:\.\d+)*)?/i)||
   k.match(/\b(?:FSR|XeSS|TSR|TAAU|RSR)\b(?:\s*\d+(?:\.\d+)*)?/i);
  return tech ? [tech[0].toUpperCase()] : [];
 }))];
 // Un campo específico del modo puede mencionar FSR sin repetir la versión.
 const technologies=techs.filter(t=>!techs.some(other=>other.startsWith(t+' ')));
 if(technologies.length!==1)return 'guide';
 const modes=[...new Set(settings.flatMap(([,v])=>{
  const mode=v.trim().toLowerCase().match(/(?:native aa|ultra performance|quality|balanced|performance)\s*$/)?.[0];
  return mode&&!/\bor\b|\//i.test(v) ? [mode==='native aa'?'native':mode.replace(' ','-')] : [];
 }))];
 return technologies[0]+(modes.length===1?':'+modes[0]:'');
}
function scaleLabel(value){
 const [tech,mode]=value.split(':');
 return tech==='guide' ? 'Sin detallar en la ficha' : [tech,scaleModes[mode]].filter(Boolean).join(' · ');
}
function fg(p){
 const v=p.rows.find(([k])=>/frame gen|generación de fotogramas/i.test(k))?.[1]||'';
 return /^(off|disabled|desactivad[oa])$/i.test(v)?'off':/\bor\b/i.test(v)?'?':/^(on|enabled|activad[oa]|amd|fsr|2x|3x)/i.test(v)?'on':'?';
}
function readings(game,d){
 if(evidence[game.id])return evidence[game.id];
 // Solo asignar la media global si resolución, potencia, tabla y cifra son inequívocas.
 const p=d.profiles[0], metrics=Object.fromEntries(d.metrics);
 if(d.profiles.length!==1||!/^\d+W$/i.test(metrics['TESTED TDP']||'')||!/^\d+$/.test(metrics['AVERAGE FPS']||''))return [];
 const w=parseInt(metrics['TESTED TDP']), n=Number(metrics['AVERAGE FPS']);
 if(!new RegExp('^'+w+'W\\s').test(p.name)||!/(720|900|1080)p/i.test(p.name)||!n)return [];
 if(d.notes.some(s=>/generación|con el mod|sin el mod|al activar|al desactivar/i.test(s)))return [];
 return [[0,w,fg(p),n]];
}
function publicSource(value) {
 try {
  const url=new URL(value);
  const host=url.hostname.replace(/^www\./,'');
  if(url.protocol==='https:'&&!/(^|\.)(rogallylife|recomplauncher|recompstore)\.com$/i.test(host))return url.href;
 } catch {}
 return null;
}
export function mountSim(host,games,game,d,choose,verifiedPoints=null){
 const make=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(cls)e.className=cls;return e};
 const append=(parent,tag,txt,cls)=>{const e=make(tag,txt,cls);parent.append(e);return e};
 const sim=append(host,'section',null,'sim');sim.id='simulador';
 append(sim,'h2','Simulador de FPS');append(sim,'p','ROG Xbox Ally X · Ryzen Z2 Extreme','sim-device');
 const layout=append(sim,'div',null,'lab-workbench');
 const bench=append(layout,'div',null,'lab-inputs');
 const output=append(layout,'div',null,'lab-output');
 const form=append(bench,'div',null,'sim-fields');
 function field(title,items,fn){
  const l=append(form,'label');append(l,'span',title);const s=append(l,'select');
  for(const [v,t] of items){const o=append(s,'option',t);o.value=v}
  s.onchange=fn;return s;
 }
 const opts=a=>a.map(v=>[v,labels[v]||v]);
 const gameSelect=field('Juego',games.slice().sort((a,b)=>a.title.localeCompare(b.title,'es')).map(g=>[g.id,g.title]),()=>choose(gameSelect.value));gameSelect.value=game.id;
 const profiles=d.profiles, points=verifiedPoints||readings(game,d), resolutions=profiles.map(resolution);
 const refs=verifiedPoints ? [] : referencias(game,d);
 const profileSettings=profiles.map((p,profile)=>({profile,r:resolutions[profile],w:powers(p)[0]||0,q:quality(p),scale:scaling(p),gen:fg(p)}));
 const anchors=points.map(t=>({...profileSettings[t[0]],gen:t[2],w:t[1],low:t[3],
  high:typeof t[4]==='number'?t[4]:t[3],limit:t[4],text:null,url:game.source}));
 const pick=field('Configuración de partida',profiles.map((p,i)=>[i,(p.gameTitle?p.gameTitle+' · ':'')+p.name+' · '+(i+1)]),()=>apply(+pick.value));
 const res=field('Resolución',[720,900,1080].map(n=>[n,n+'p']),manual);
 const q=field('Calidad gráfica',opts(['guide','low','medium','high','ultra']),manual);
 const w=field('Potencia (TDP)',Array.from({length:29},(_,i)=>[i+7,(i+7)+' W']),manual);
 const sliderLabel=append(form,'label',null,'tdp-slider');
 const sliderText=append(sliderLabel,'span','Ajustar TDP');
 const slider=append(sliderLabel,'input');slider.type='range';slider.min='7';slider.max='35';
 slider.addEventListener('input',()=>{w.value=slider.value;manual()});

 const documentedScales=[...new Set(profileSettings.map(p=>p.scale))];
 const scale=field('Reescalado',documentedScales.map(value=>[value,scaleLabel(value)]),manual);
 scale.disabled=documentedScales.every(value=>value==='guide');
 const hasFG=profiles.some(p=>p.rows.some(([k,v])=>/frame gen|generación de fotogramas/i.test(k)&&!/not supported|unsupported|no compatible|unavailable/i.test(v)))||points.some(p=>p[2]==='on'||p[2]==='off');
 const gen=field('Frame Generation',opts(hasFG?['?','off','on']:['?']),manual);gen.disabled=!hasFG;
 const actions=append(bench,'div',null,'sim-actions');const status=append(bench,'p',null,'sim-status');status.setAttribute('role','status');
 const result=append(output,'div',null,'sim-reading');result.setAttribute('aria-live','polite');
 const compare=append(output,'section',null,'sim-compare');
 const pin=append(compare,'button','Guardar para comparar','btn');pin.type='button';
 const remove=append(compare,'button','Quitar comparación','btn');remove.type='button';remove.hidden=true;
 const comparisons=append(compare,'div',null,'sim-pair');
 let saved,current;
 function showComparison(){
  comparisons.replaceChildren();
  if(!saved)return;
  for(const [name,value] of [['Guardada',saved],['Actual',current]]){
   const column=append(comparisons,'div',null,'sim-snapshot');
   append(column,'small',name+' · '+value.type);
   append(column,'strong',value.number);
   append(column,'p',value.settings);
  }
 }
 pin.onclick=()=>{saved=current;remove.hidden=false;showComparison()};
 remove.onclick=()=>{saved=null;remove.hidden=true;showComparison()};
 const chart=append(output,'div',null,'sim-chart');
 const indicators=append(output,'dl',null,'sim-indicators');
 const format=([,,,n,hi])=>typeof hi==='number'?n+'–'+hi:(hi||'')+n;
 const kind=f=>f==='on'?'Mostrados con FG':f==='off'?'Renderizados':'Contador sin desglose';
 function manual(){status.textContent='';draw()}
 function apply(i,pt,power){
  const base=profileSettings[i];
  pick.value=i;res.value=base.r||'';w.value=pt?.[1]??power??(base.w||'');
  q.value=base.q;scale.value=base.scale;gen.value=pt?.[2]??base.gen;manual();
 }
 function evaluate(target){
  const base=profileSettings[target.profile];
  const sameSettings=ref=>ref.profile===target.profile&&ref.r===target.r&&
   ref.q===target.q&&ref.scale===target.scale&&ref.gen===target.gen;
  const exact=anchors.filter(sameSettings);
  const measured=exact.find(ref=>ref.w===target.w&&ref.r);
  if(measured)return {hit:points[anchors.indexOf(measured)]};
  const samples=exact.filter(ref=>ref.r&&ref.limit===undefined).sort((a,b)=>a.w-b.w);
  const lower=samples.filter(ref=>ref.w<target.w).pop(), upper=samples.find(ref=>ref.w>target.w);
  if(lower&&upper)return {estimate:Math.round(lower.low+(upper.low-lower.low)*(target.w-lower.w)/(upper.w-lower.w))};
  // Los mínimos publicados no son medias y no se extrapolan como si lo fueran.
  const compatible=anchors.filter(ref=>ref.gen===target.gen&&ref.limit!=='>'&&ref.r&&ref.w);
  const hasGenericReference=target.gen==='?'&&base.gen==='?';
  const referencePool=anchors.length ? compatible : hasGenericReference ? refs : [];
  return {guess:(!verifiedPoints && proyectar(referencePool,target,base)) || aproximar([...anchors,...refs],target,base)};
 }
 function draw(){
  const i=+pick.value,p=profiles[i];
  slider.disabled=!w.value;if(w.value)slider.value=w.value;sliderText.textContent=w.value?'Ajustar TDP · '+w.value+' W':'Selecciona una potencia';
  const target={profile:i,r:+res.value,w:+w.value,q:q.value==='guide'?profileSettings[i].q:q.value,scale:scale.value,gen:gen.value};
  const {hit,estimate,guess}=evaluate(target);
  const qualityLabel=q.selectedOptions[0]?.textContent;
  const scaleName=scale.selectedOptions[0]?.textContent;
  current={type:hit?'Medición de referencia':guess?.approximate?'Estimación aproximada':'Estimación',
   number:hit?format(hit)+' FPS':estimate!==undefined?'≈'+estimate+' FPS':guess.low+'–'+guess.high+' FPS',
   settings:[res.value&&res.value+'p',w.value&&w.value+' W',kind(gen.value),qualityLabel,scaleName,p.name].filter(Boolean).join(' · ')};
  indicators.replaceChildren();
  for(const [label,value] of [['Potencia',w.value&&w.value+' W'],['Resolución',res.value&&res.value+'p'],['Calidad',q.selectedOptions[0]?.textContent],['Reescalado',scale.selectedOptions[0]?.textContent]]){
   const cell=append(indicators,'div');
   append(cell,'dt',label);
   append(cell,'dd',value||'Sin indicar');
  }
  result.replaceChildren();
  append(result,'small',current.type);
  append(result,'strong',current.number);
  showComparison();
  if(hit){
   append(result,'p',kind(hit[2])+' · Referencia medida con estos ajustes. El rendimiento puede variar según la escena.');
  }else if(estimate!==undefined){
   append(result,'p',kind(gen.value)+' · Interpolación entre dos potencias medidas con la misma configuración.');
  }else{
   const {ref}=guess;
   append(result,'p',kind(gen.value)+' · Intervalo orientativo calculado por Ally Lab.');
   const detail=ref.text||[ref.low===ref.high?(ref.limit==='≈'?'≈':'')+ref.low+' FPS':ref.low+'–'+ref.high+' FPS',ref.r+'p',ref.w+' W',labels[ref.q],scaleLabel(ref.scale)].filter(Boolean).join(' · ');
   const base=append(result,'p','Referencia: '+detail+' ');
   const href=publicSource(ref.url);
   if(href){const link=append(base,'a','Ver fuente');link.href=href;link.target='_blank';link.rel='noopener noreferrer';}
   if(guess.changedScale)append(result,'small','La estimación de FSR 3 usa la resolución interna de los modos comparados.');
   const meter=append(result,'meter');meter.min=0;meter.max=Math.max(120,guess.high);meter.value=(guess.low+guess.high)/2;meter.setAttribute('aria-label','Punto medio del intervalo estimado');
   if(guess.approximate)append(result,'small',guess.catalogue
    ?'Confianza baja · Rango de otros juegos del catálogo ajustado a tu selección.'
    :'Confianza baja · El cálculo usa supuestos para los ajustes que la prueba no detalla.');
  }
  if(hit?.[2]==='on')append(result,'p','La cifra incluye fotogramas generados. La prueba no separa cuántos se renderizaron mientras FG estaba activo.');
 }
 function recommend(mode){
  if(!points.length && mode!=='60'){
   const settings=profiles.flatMap((p,i)=>{
    const match=p.name.match(/(\d+(?:\/\d+)*)W/i);
    return match&&resolutions[i]?match[1].split('/').map(power=>({i,w:Number(power),r:Number(resolutions[i])})):[];});
   if(settings.length&&mode!=='speed'){
    const best=settings.sort((a,b)=>mode==='quality'?b.r-a.r||b.w-a.w:a.w-b.w||b.r-a.r)[0];
    apply(best.i);w.value=best.w;draw();status.textContent='Ajustes de la ficha seleccionados por '+(mode==='quality'?'resolución.':'menor potencia.');return;
   }
  }
  let choices=points.slice();
  if(mode==='60')choices=choices.filter(t=>t[3]>=60&&t[2]==='off'&&t[4]!=='≈');
  const rank=(a,b)=>mode==='quality'?+resolutions[b[0]]-resolutions[a[0]]||b[3]-a[3]:mode==='speed'?b[3]-a[3]||a[1]-b[1]:a[1]-b[1]||b[3]-a[3];
  const best=choices.sort(rank)[0];
  if(!best){
   const candidates=profileSettings.flatMap(base=>(base.w?powers(profiles[base.profile]):[20]).map(power=>{
    const {guess,estimate,hit}=evaluate({...base,w:power});
    return {i:base.profile,power,low:guess?.low??estimate??hit?.[3]};
   })).filter(candidate=>candidate.low!==undefined).sort((a,b)=>b.low-a.low||a.power-b.power);
   const candidate=candidates[0];
   if(candidate){
    apply(candidate.i,undefined,candidate.power);
    status.textContent=mode==='60'?(candidate.low>=60?'Objetivo plausible según el modelo.':'Mejor previsión entre los perfiles publicados. Puede quedar por debajo de 60 FPS.'):'Perfil con mejor previsión.';
   }else status.textContent='La recomendación se basa en la estimación aproximada del perfil actual.';
   return;
  }
  apply(best[0],best);status.textContent=mode==='60'?'Referencia de 60 FPS o más. '+kind(best[2])+'.':({quality:'Mayor resolución documentada.',speed:'Mayor cifra de FPS documentada.',battery:'Menor potencia documentada.'})[mode];
 }
 for(const [key,name] of [['speed','Rendimiento'],['quality','Calidad'],['battery','Ahorro de batería'],['60','Optimizar para 60 FPS']]){
  const b=append(actions,'button',name,'btn');b.type='button';b.onclick=()=>recommend(key);
 }
 append(chart,'h3','Rendimiento medido');if(points.length){
  const max=Math.max(...points.map(t=>typeof t[4]==='number'?t[4]:t[3]));
  for(const t of points){const row=append(chart,'div',null,'sim-bar');append(row,'span',resolutions[t[0]]+'p · '+t[1]+' W · '+kind(t[2]));const bar=append(row,'i');bar.style.width=(100*t[3]/max)+'%';append(row,'b',format(t)+' FPS')}
 }else append(chart,'p','Consulta la previsión de la selección y su referencia arriba.');
 const notes=append(sim,'details');append(notes,'summary','Pruebas y condiciones de la guía');for(const n of d.notes)append(notes,'p',n);const href=publicSource(game.source);if(href){const a=append(notes,'a','Consultar prueba original');a.href=href;a.target='_blank';a.rel='noopener noreferrer';}
 apply(points[0]?.[0]??0,points[0]);
}
