import {createModel,kinds,labels,publicSource,qualities,qualityFields,qualityPreset,resolutions,scaleLabel} from './sim-model.js?v=55';
import {add,button,formatFPS,formatNumber,renderBars,renderLine} from './sim-chart.js?v=48';

import {campoES,valorES} from './idioma.js?v=20261121';

const names={r:'Resolución',w:'TDP',q:'Calidad',scale:'Reescalado',gen:'Frame Generation'};
const powers=[7,13,17,25,30,35];
const axisOptions={w:['TDP','Potencia de la APU (W)'],r:['Resolución','Resolución de salida (p)'],q:['Calidad','Preajuste gráfico']};
const glyphs={
 fps:'M4 17a8 8 0 1 1 16 0M12 16l4-5M3 19h18',
 r:'M3 5h18v12H3zM8 21h8m-4-4v4',
 w:'m13 2-8 12h6l-1 8 9-12h-6z',
 q:'m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5',
 scale:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 16l8-8',
 gen:'M3 5h13v13H3zm5 0V2h13v13h-5',
 source:'M6 3h8l4 4v14H6zm3 9h6m-6 4h6'
};
function icon(parent,type){
 const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('fps-icon');
 const path=document.createElementNS(ns,'path');path.setAttribute('d',glyphs[type]);svg.append(path);parent.append(svg);
}
function estimatedRange(result){
 return result?.type.startsWith('Estimación')&&result.high!==null&&result.high!==result.low;
}

function headlineFPS(result){
 return estimatedRange(result)?'≈'+formatNumber.format(Math.round(result.center)):formatFPS(result);
}

function setting(k,value,rows=[]){
 if(value==='guide'&&(k==='q'||k==='scale')){
  const preset=k==='q'&&qualityPreset(rows);
  if(preset)return valorES(preset.trim());
  const fields=k==='q'
   ?[/^(?:texture(?: quality| resolution| detail)?|textures(?: quality)?|texturas|calidad de texturas)$/i,
     /^(?:shadow(?:s)?(?: quality| resolution| detail)?|sombras|calidad de sombras)$/i,
     /^(?:effects quality|lighting quality|calidad de efectos|calidad de iluminación)$/i]
   :[/^(?:(?:resolution )?upscal(?:ing|e|er)(?: (?:method|type|technology|technique))?|super resolution|reescalado)$/i,
     /^(?:upscal(?:ing|e|er) (?:mode|quality(?: mode)?)|(?:amd )?fsr(?: [0-9.]+)? (?:mode|quality|preset)|modo de reescalado)$/i];
  const settings=fields.map(pattern=>rows.find(([name,val])=>pattern.test(name.trim())&&val.trim())).filter(Boolean);
  if(settings.length)return settings.slice(0,2).map(([name,val])=>campoES(name.trim())+' '+valorES(val.trim())).join(' · ');
 }
 if(k==='r')return value?value+'p':'Sin indicar';
 if(k==='w')return value?value+' W':'Sin indicar';
 if(k==='scale')return scaleLabel(value);
 return labels[value]||'Sin indicar';
}
function heading(parent,title,sub){
 const head=add(parent,'header',null,'fps-panel-head');
 add(head,'h3',title);
 if(sub)add(head,'p',sub);
 return head;
}
function source(parent,url){
 const href=publicSource(url);
 if(href){const link=add(parent,'a','Consultar prueba');link.href=href;link.target='_blank';link.rel='noopener noreferrer'}
}

export function mountSim(host,games,game,detail,choose,verifiedPoints=null){
 const model=createModel(game,detail,verifiedPoints);
 const sim=add(host,'section',null,'sim fps-lab');
 sim.id='simulador';
 const banner=add(sim,'header',null,'fps-banner');
 const title=add(banner,'div');
 add(title,'h2','Simulador FPS');
 add(title,'p','Xbox ROG Ally X · AMD Ryzen Z2 Extreme');
 const layout=add(sim,'div',null,'fps-layout');
 const controls=add(layout,'section',null,'fps-panel fps-controls');
 heading(controls,'Configuración');
 const form=add(controls,'div',null,'fps-fields');
 function field(title,action,iconType,parent=form){
  const wrap=add(parent,'label');
  const label=add(wrap,'span',null,'fps-field-label');
  if(iconType)icon(label,iconType);
  label.append(title);
  const node=add(wrap,'select');
  node.setAttribute('aria-label',title);
  node.onchange=action;
  return node;
 }
 function setOptions(node,items){
  node.replaceChildren();
  for(const [id,name] of items){
   const option=add(node,'option',name);
   option.value=id;
  }
  node.disabled=items.length<=1;
 }
 const gameSelect=field('Juego',()=>choose(gameSelect.value));
 setOptions(gameSelect,games.slice().sort((a,b)=>a.title.localeCompare(b.title,'es')).map(g=>[g.id,g.title]));
 gameSelect.value=game.id;
 const profile=field('Configuración de partida',()=>apply(model.profiles[+profile.value]));
 gameSelect.parentElement.classList.add('fps-wide-field');
 profile.parentElement.classList.add('fps-wide-field');
 setOptions(profile,model.profiles.map(p=>[p.profile,p.name]));
 const res=field(names.r,manual,'r'),q=field(names.q,manual,'q');
 const w=field('Potencia de la APU (TDP)',manual,'w');
 setOptions(res,[[0,'Sin indicar'],...resolutions.map(n=>[n,setting('r',n)])]);
 setOptions(w,[[0,'Sin indicar'],...Array.from({length:29},(_,i)=>[i+7,setting('w',i+7)])]);
 const powerControl=add(form,'label',null,'fps-slider');
 const powerCaption=add(powerControl,'span','Ajustar TDP');
 powerControl.classList.add('fps-wide-field');
 const slider=add(powerControl,'input');slider.type='range';slider.min=7;slider.max=35;
 slider.oninput=()=>{w.value=slider.value;manual()};
 const scale=field(names.scale,manual,'scale'),gen=field(names.gen,manual,'gen');
 const individual=add(controls,'fieldset',null,'fps-individual');
 add(individual,'legend','Ajustes gráficos individuales');
 const individualFields=add(individual,'div',null,'fps-fields');
 const overrides=Object.fromEntries(Object.entries(qualityFields).map(([id,[name]])=>[id,field(name,manual,'q',individualFields)]));
 const notes=add(controls,'details',null,'fps-values');
 add(notes,'summary','Ajustes de partida de la ficha');
 const rows=add(notes,'dl',null,'fps-value-list');
 const buttons=add(controls,'div',null,'fps-actions');
 const status=add(controls,'p',null,'fps-status');
 status.setAttribute('role','status');
 const output=add(layout,'div',null,'fps-output');
 const primary=add(output,'section',null,'fps-panel fps-primary');
 const gauge=add(primary,'div',null,'fps-gauge');
 const dial=add(gauge,'div',null,'fps-dial');
 const reading=add(dial,'div',null,'fps-reading');
 reading.setAttribute('aria-live','polite');
 const numeric=add(reading,'strong');
 const unit=add(reading,'span','FPS');
 const diagnostic=add(primary,'div',null,'fps-diagnostic');
 const type=add(diagnostic,'p',null,'fps-type');
 const headline=add(diagnostic,'h3');
 const context=add(diagnostic,'p');
 const provenance=add(diagnostic,'p',null,'fps-source');
 const goals=add(diagnostic,'div',null,'fps-segments');
 goals.setAttribute('role','group');goals.setAttribute('aria-label','Objetivo de FPS');
 const goalButtons=[30,60,120].map(n=>button(goals,n+' FPS','',()=>{goal=n;renderPrimary()}));
 const stats=add(output,'dl',null,'fps-stats');
 const statNodes=[['fps','Rendimiento'],['r',names.r],['w','Potencia (TDP)'],['q',names.q],['scale',names.scale],['gen',names.gen],['source','Fiabilidad']].map(([key,label])=>{
  const panel=add(stats,'div',null,'fps-stat');
  const labelNode=add(panel,'dt',null,'fps-field-label');icon(labelNode,key);labelNode.append(label);
  return add(panel,'dd');
 });
 const linePanel=add(output,'section',null,'fps-panel');
 const analysisHead=heading(linePanel,'Curva de rendimiento','Cambia una variable y mantiene los demás ajustes.');
 const axes=add(analysisHead,'div',null,'fps-segments');
 axes.setAttribute('role','group');axes.setAttribute('aria-label','Variable de la gráfica');
 const axisButtons=Object.entries(axisOptions).map(([id,[label]])=>button(axes,label,'',()=>{axis=id;drawChart()}));
 const chart=add(linePanel,'div',null,'fps-line');
 const caption=add(linePanel,'p',null,'fps-point-detail');
 const legend=add(linePanel,'p','● Medición publicada　◇ Modelo　┆ Objetivos de 30 y 60 FPS','fps-legend');
 const compare=add(output,'section',null,'fps-panel fps-compare');
 heading(compare,'Comparar configuraciones');
 const comparisonActions=add(compare,'div',null,'fps-segments');
 const slot='ally-lab:fps-snapshot:'+game.id;
 let saved=null;
 try{const value=JSON.parse(localStorage.getItem(slot));if(model.profiles[value?.profile]&&Object.keys(names).every(k=>typeof value[k]===(['r','w'].includes(k)?'number':'string')))saved=value}catch{}
 function store(value){
  saved=value;
  try{if(value)localStorage.setItem(slot,JSON.stringify(value));else localStorage.removeItem(slot)}catch{}
  renderComparison();
 }
 const pin=button(comparisonActions,'Guardar para comparar','',()=>store({...current}));
 const remove=button(comparisonActions,'Quitar comparación','',()=>{store(null);pin.focus()});
 const comparison=add(compare,'div',null,'fps-comparison');
 const methods=add(sim,'details',null,'fps-methods');
 add(methods,'summary','Metodología, límites y pruebas');
 add(methods,'p','El TDP indica la potencia configurada de la APU. La fiabilidad describe la calidad de la referencia, y el rango orientativo no es un intervalo estadístico.');
 add(methods,'p','La interpolación usa pruebas del mismo juego y de la misma configuración. Si faltan mediciones comparables, el simulador usa cifras de la ficha o una horquilla de otros títulos del catálogo. Estas aproximaciones tienen confianza baja. Los cambios de preajuste, texturas o sombras sin ensayos equivalentes usan una sensibilidad genérica. Si la ficha no documenta el nivel de texturas o sombras, el modelo toma como base el preajuste seleccionado o Media si el preajuste es personalizado.');
 add(methods,'p','Con Frame Generation se muestra el total publicado. Los FPS renderizados con FG activo requieren una medición separada.');
 for(const note of detail.notes||[]) add(methods,'p',note);
 source(methods,game.source);
 if(model.anchors.length){
  const observations=add(sim,'details',null,'fps-methods');
  add(observations,'summary','Seleccionar una medición publicada');
  const picks=add(observations,'div',null,'fps-segments');
  for(const anchor of model.anchors){
   const label=[setting('r',anchor.r),setting('w',anchor.w),setting('q',anchor.q,model.profiles[anchor.profile]?.rows),
    formatFPS(model.evaluate(anchor))+' '+kinds[anchor.gen]].join(' · ');
   button(picks,label,'',()=>{apply(anchor);profile.focus()});
  }
 }
 let current,result,goal=60,axis='w';
 const read=()=>({profile:+profile.value,r:+res.value,w:+w.value,q:q.value,scale:scale.value,gen:gen.value,...Object.fromEntries(Object.entries(overrides).map(([id,node])=>[id,node.value]))});
 const display=(key,value,profile)=>setting(key,value,model.profiles[profile]?.rows);
 const evaluations=(key,items)=>items.map(id=>({id,label:setting(key,id),value:model.evaluate({...current,[key]:id})}));
 function apply(target){
  profile.value=target.profile;
  const options=model.options(target.profile);
  for(const [id,node] of Object.entries(overrides)){
   const available=Object.hasOwn(options.adjustable,id);
   node.parentElement.hidden=!available;
   setOptions(node,available?[['','Heredar del preajuste'],...qualities.map(v=>[v,labels[v]])]:[]);
   node.value=target[id]||'';
  }
  setOptions(q,options.qualities.map(v=>[v,display('q',v,target.profile)]));
  setOptions(scale,options.scales.map(v=>[v,display('scale',v,target.profile)]));
  setOptions(gen,options.generation.map(v=>[v,setting('gen',v)]));
  res.value=target.r||(!verifiedPoints?current?.r||1080:0);w.value=target.w||(!verifiedPoints?current?.w||20:0);q.value=target.q;scale.value=target.scale;gen.value=target.gen;
  rows.replaceChildren();
  const base=model.profiles[target.profile];
  if(!base.rows.length)add(rows,'dd','Consulta las condiciones publicadas en la prueba enlazada.');
  for(const [label,value] of base.rows){
   const row=add(rows,'div');
   add(row,'dt',label);add(row,'dd',value);
  }
  manual();
 }
 function manual(){
  status.textContent='';
  current=read();
  result=model.evaluate(current);
  const base=model.profiles[current.profile];
  for(const [id,node] of Object.entries(overrides)){
   if(node.parentElement.hidden)continue;
   const documented=current.q===base.q?model.options(current.profile).adjustable[id]:null;
   const inherited=documented||(qualities.includes(current.q)?current.q:null);
   node.options[0].textContent=documented?'Ficha: '+labels[documented]:inherited?'Heredar: '+labels[inherited]:'Automático (referencia Media)';
  }
  slider.disabled=!current.w;
  if(current.w)slider.value=current.w;
  powerCaption.textContent=current.w?'Ajustar TDP · '+setting('w',current.w):'Selecciona una potencia';
  renderPrimary();
  drawChart();
  renderComparison();
 }
 function renderPrimary(){
  const value=headlineFPS(result);
  numeric.textContent=result?value:'—';
  unit.textContent=kinds[current.gen];
  const max=Math.max(120,goal,result?.center||0);
  dial.style.setProperty('--fill',Math.min(360,(result?.center||0)/max*360)+'deg');
  dial.style.setProperty('--threshold',goal/max*360+'deg');
  type.textContent=result?result.type+' · Confianza '+result.confidence.toLowerCase():'Datos insuficientes';
  const supportsGoal=result&&result.low>=goal;
  const couldReach=result&&(result.high===null||result.high>=goal);
  headline.textContent=!result?'Sin referencia para esta selección':supportsGoal?(result.confidence==='Baja'?'El modelo sitúa la selección sobre '+goal+' FPS':'Dentro del objetivo de '+goal+' FPS'):couldReach?'Objetivo de '+goal+' FPS incierto':'Por debajo de '+goal+' FPS';
  context.textContent=!result?'Prueba una configuración documentada o consulta los ajustes de la ficha.'
   :[estimatedRange(result)?'Rango orientativo: '+formatFPS(result)+' FPS.':'',result.why,result.limit==='>'?'La prueba publica un mínimo, representado como umbral.':result.high!==result.low&&result.type==='Medición publicada'?'Intervalo observado en la prueba.':'',
      current.gen==='on'?'Incluye fotogramas generados.':current.gen==='?'?'La prueba no separa el tipo de fotogramas.':''].filter(Boolean).join(' ');
  provenance.replaceChildren();if(result)source(provenance,result.source);
  goalButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String([30,60,120][i]===goal)));
  const values=[result?value+' FPS':'Datos insuficientes',...Object.keys(names).map(k=>display(k,current[k],current.profile)),
   result?result.type+' · '+result.confidence:'Sin referencia'];
  statNodes.forEach((node,i)=>node.textContent=values[i]);
 }
 function drawChart(){
  const values=axis==='w'?[...new Set([...powers,...model.anchors.filter(a=>a.profile===current.profile&&a.q===current.q&&a.gen===current.gen).map(a=>a.w),...(current.w?[current.w]:[])])].sort((a,b)=>a-b)
   :axis==='r'?resolutions:qualities;
  const series=evaluations(axis,values);
  legend.hidden=!series.some(p=>p.value);
  renderLine(chart,caption,series,...axisOptions[axis],current[axis]);
  axisButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(Object.keys(axisOptions)[i]===axis)));
 }
 function renderComparison(){
  comparison.replaceChildren();
  remove.hidden=!saved;
  if(!saved){add(comparison,'p','Guarda la selección y modifica los ajustes para compararlos.');return}
  const before=model.evaluate(saved),pair=add(comparison,'div',null,'fps-comparison-pair');
  for(const [label,config,value] of [['Guardada',saved,before],['Actual',current,result]]){
   const card=add(pair,'div',null,'fps-snapshot');
   add(card,'h4',label);
   add(card,'strong',value?headlineFPS(value)+' FPS':'Datos insuficientes');
   add(card,'p',[estimatedRange(value)?'Rango: '+formatFPS(value)+' FPS':null,kinds[config.gen],value?.type,value?'Confianza '+value.confidence.toLowerCase():null].filter(Boolean).join(' · '));
   const list=add(card,'dl',null,'fps-value-list');
   for(const k of Object.keys(names)){
    const row=add(list,'div');add(row,'dt',names[k]);add(row,'dd',display(k,config[k],config.profile));
   }
   for(const [id,[name]] of Object.entries(qualityFields)){
    if(config[id]){const row=add(list,'div');add(row,'dt',name);add(row,'dd',labels[config[id]]);}
   }
  }
  const comparable=before?.type!=='Estimación por catálogo'&&result?.type!=='Estimación por catálogo'&&saved.gen===current.gen&&(saved.gen!=='?'||saved.profile===current.profile);
  const delta=add(comparison,'p',null,'fps-delta');
  renderBars(add(comparison,'div',null,'fps-bars'),[{label:'Guardada',value:before},{label:'Actual',value:result,active:true}]);
  if(before?.type==='Estimación por catálogo'||result?.type==='Estimación por catálogo'){delta.textContent='La horquilla del catálogo sirve de orientación general y no permite cuantificar la mejora de este juego.';return}
  if(!comparable){delta.textContent='Los contadores no son directamente comparables. Para calcular una diferencia, usa el mismo estado conocido de Frame Generation.';return}
  if(!before||!result||before.limit==='>'||result.limit==='>'){
   delta.textContent='El cálculo de diferencias necesita dos valores comparables, más allá de un mínimo publicado.';return;
  }
  const diff=result.center-before.center,percent=100*diff/before.center;
  const signed=n=>(Math.round(n*10)>0?'+':'')+formatNumber.format(n);
  const range=before.low!==before.high||result.low!==result.high;
  const uncertain=range||before.type!=='Medición publicada'||result.type!=='Medición publicada'||before.limit||result.limit;
  delta.textContent=(uncertain?'Diferencia orientativa':'Diferencia')+' · '+signed(diff)+' FPS ('+signed(percent)+' %)'
   +(range?' · Calculada con los puntos medios.':'')+(range&&result.low<=before.high&&before.low<=result.high?' Los intervalos se solapan.':'');
 }
 function recommend(mode){
  if(mode==='60')goal=60;
  const candidates=[...model.anchors];
  for(const p of model.profiles){
   candidates.push(p);
   for(const quality of model.options(p.profile).qualities)for(const r of resolutions){
    candidates.push({...p,q:quality,r,w:current.w||p.w});
   }
  }
  const evaluated=candidates.map(t=>({t,value:model.evaluate(t)})).filter(x=>x.value);
  let options=evaluated;
  if(mode==='60'){
   const rendered=evaluated.filter(({t})=>t.gen==='off');
   const unknown=evaluated.filter(({t})=>t.gen==='?');
   options=rendered.length?rendered:unknown.length?unknown:evaluated;
  }
  const reliable=({t,value})=>t.gen==='off'&&value.low>=60&&value.confidence!=='Baja'&&value.limit!=='≈';
  const score=({value})=>value.low;
  const evidenceRank=({value})=>value.type==='Estimación por catálogo'?0:value.confidence==='Baja'?1:2;
  const rank=(a,b)=>{
   if(mode==='quality')return b.t.r-a.t.r||score(b)-score(a);
   if(mode==='battery')return a.t.w-b.t.w||score(b)-score(a);
   if(mode==='60')return Number(reliable(b))-Number(reliable(a))||(reliable(a)?a.t.w-b.t.w:evidenceRank(b)-evidenceRank(a)||score(b)-score(a));
   return score(b)-score(a)||a.t.w-b.t.w;
  };
  const best=options.sort(rank)[0];
  if(mode==='60'&&!best&&current.gen==='on'){
   status.textContent='Se necesita una referencia comparable para recomendar 60 FPS renderizados.';return;
  }
  const fallback=mode==='quality'||mode==='battery'
   ?model.profiles.filter(p=>p.r&&p.w).sort((a,b)=>mode==='quality'?b.r-a.r:a.w-b.w)[0]:null;
  const next=best?.t||fallback;
  if(!next){renderPrimary();status.textContent='No hay una configuración respaldada para este objetivo.';return}
  const changed=Object.keys(names).filter(k=>next[k]!==current[k]).map(k=>names[k]+' a '+display(k,next[k],next.profile));
  if(next.profile!==current.profile)changed.unshift(model.profiles[next.profile].name);
  apply(next);
  const outcome=mode==='60'?(reliable(best)?'La referencia alcanza 60 FPS renderizados.':'Mejor alternativa disponible. No hay respaldo suficiente para garantizar 60 FPS renderizados.'):'Perfil aplicado.';
  status.textContent=[outcome,result?headlineFPS(result)+' '+kinds[current.gen]+' · Confianza '+result.confidence.toLowerCase()+'.':'Sin cifra respaldada.',
   changed.length?'Cambios: '+changed.join(', ')+'.':'La selección ya coincide.'].join(' ');
 }
 for(const [id,label] of [['speed','Rendimiento'],['quality','Calidad'],['battery','Ahorro de batería'],['60','Optimizar para 60 FPS']]){
  button(buttons,label,id==='60'?'fps-optimize':'',()=>recommend(id));
 }
 apply(model.initial);
}
