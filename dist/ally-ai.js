import {mountMascot} from './ally-mascot.js?v=1';
const examples=['Quiero jugar a Battlefield a 60 FPS','Busca Super Mario World para Super Nintendo','Llévame a los juegos gratis'];
const welcome='Soy Ally AI. Puedo buscar juegos, abrir secciones y mostrar las pruebas de rendimiento disponibles para la Xbox ROG Ally X.';
function add(parent,tag,text,className){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  if(className)node.className=className;
  parent.append(node);
  return node;
}
function button(parent,label,action,className){
  const node=add(parent,'button',label,className);
  node.type='button';
  node.addEventListener('click',action);
  return node;
}
function safeUrl(value,external=false){
  if(typeof value!=='string')return null;
  try{
    const url=new URL(value,location.href);
    return url.origin===location.origin||external&&url.protocol==='https:'?url.href:null;
  }catch{return null}
}
function link(parent,label,url){
  const href=safeUrl(url);
  if(href)add(parent,'a',label,'ally-ai-link').href=href;
}
const root=add(document.body,'div',null,'ally-ai');
const trigger=button(root,'✦ Ally AI',toggle,'ally-ai-trigger');
trigger.setAttribute('aria-expanded','false');
trigger.setAttribute('aria-controls','ally-ai-panel');
const panel=add(root,'section',null,'ally-ai-panel');
panel.id='ally-ai-panel';
panel.hidden=true;
panel.setAttribute('aria-labelledby','ally-ai-title');
const header=add(panel,'header',null,'ally-ai-head');
const heading=add(header,'h2','Ally AI');
heading.id='ally-ai-title';
const controls=add(header,'div',null,'ally-ai-actions');
button(controls,'Nueva',reset).setAttribute('aria-label','Nueva conversación');
const expand=button(controls,'Ampliar',()=>{
  const active=panel.classList.toggle('ally-ai-large');
  expand.textContent=active?'Reducir':'Ampliar';
  expand.setAttribute('aria-pressed',String(active));
});
expand.setAttribute('aria-pressed','false');
button(controls,'×',toggle).setAttribute('aria-label','Cerrar Ally AI');
const transcript=add(panel,'div',null,'ally-ai-transcript');
transcript.setAttribute('role','log');
transcript.setAttribute('aria-live','polite');
const progress=add(panel,'div',null,'ally-ai-progress');
progress.setAttribute('role','status');
const form=add(panel,'form',null,'ally-ai-form');
const label=add(form,'label','Tu consulta','ally-ai-sr');
const input=add(form,'input');
input.id='ally-ai-message';
label.htmlFor=input.id;
input.maxLength=400;
input.placeholder='Pregúntame sobre Ally Lab…';
input.autocomplete='off';
const send=add(form,'button','Enviar');
send.type='submit';
const modes=add(panel,'div',null,'ally-ai-modes');
const search=button(modes,'Solo buscar',()=>submit(input.value,'search'));
const storage='ally-ai-conversation-v1';
let entries=[];
let pending;
try{
  const stored=JSON.parse(sessionStorage.getItem(storage)||'[]');
  if(Array.isArray(stored))entries=stored.slice(-16);
}catch{}
function save(){
  try{sessionStorage.setItem(storage,JSON.stringify(entries.slice(-16)));}catch{}
}
function card(parent,value){
  const item=add(parent,'article',null,'ally-ai-card');
  const head=add(item,'div',null,'ally-ai-card-head');
  const cover=safeUrl(value.cover,true);
  if(cover){
    const img=add(head,'img');
    img.loading='lazy';img.alt='';img.referrerPolicy='no-referrer';img.src=cover;
    img.addEventListener('error',()=>img.remove(),{once:true});
  }
  const info=add(head,'div');
  add(info,'small',value.kind);
  add(info,'h3',value.title);
  if(value.description)add(item,'p',value.description);
  if(Array.isArray(value.readings))for(const r of value.readings){
    const section=add(item,'div',null,'ally-ai-reading');
    add(section,'strong',[r.fps+' FPS',r.kind,r.comparison,r.confidence?'Confianza '+r.confidence:''].filter(Boolean).join(' · '));
    add(section,'p',[r.resolution,r.quality,r.tdp,r.scale,'FG '+r.generation].filter(Boolean).join(' · '));
    if(r.reason)add(section,'p',r.reason);
    link(section,'Abrir ajuste en el simulador',r.url);
  }
  if(value.documented&&!value.readings?.length){
    const section=add(item,'div',null,'ally-ai-reading');
    add(section,'strong',value.documented.name);
    for(const [label,setting] of value.documented.settings||[])add(section,'p',label+' · '+setting);
    for(const note of value.documented.notes||[])add(section,'p',note);
    link(section,'Abrir ajustes de la ficha',value.documented.url);
  }
  link(item,({'Sección':'Abrir sección','Juego de PC':'Abrir ficha','Retro':'Abrir en Retro','Noticia':'Leer noticia','Port':'Abrir proyecto','Oferta activa':'Ver oferta'})[value.kind]||'Abrir en Ally Lab',value.url);
  if(value.simulator&&!value.readings?.length)link(item,'Abrir simulador',value.simulator);
}
function append(entry){
  const bubble=add(transcript,'div',null,entry.user?'ally-ai-user':'ally-ai-answer');
  add(bubble,'p',entry.user||entry.answer);
  if(entry.notice)add(bubble,'p',entry.notice,'ally-ai-notice');
  if(Array.isArray(entry.cards))for(const value of entry.cards)card(bubble,value);
  transcript.scrollTop=transcript.scrollHeight;
}
function showStart(){
  transcript.replaceChildren();
  append({answer:welcome});
  if(entries.length){entries.forEach(append);return;}
  const suggestions=add(transcript,'div',null,'ally-ai-examples');
  examples.forEach(q=>button(suggestions,q,()=>submit(q)));
}
function toggle(){
  panel.hidden=!panel.hidden;
  trigger.hidden=!panel.hidden;
  trigger.setAttribute('aria-expanded',String(!panel.hidden));
  if(panel.hidden)trigger.focus();else input.focus();
}
function reset(){
  pending?.abort();pending=undefined;
  input.value='';entries=[];save();showStart();setBusy(false);input.focus();
}
function setBusy(busy){
  send.disabled=search.disabled=busy;
  progress.textContent=busy?'Buscando y preparando la respuesta…':'';
}
async function submit(message,mode='chat'){
  const value=message.trim();
  if(!value||pending)return;
  const controller=new AbortController();
  pending=controller;
  const context=[...new Set(entries.slice().reverse()
    .filter(entry=>entry.cards?.length===1&&entry.cards[0].gameId)
    .map(entry=>entry.cards[0].gameId))].slice(0,2);
  const user={user:value};entries.push(user);save();append(user);
  input.value='';setBusy(true);
  const timeout=setTimeout(()=>controller.abort('timeout'),24000);
  try{
    const res=await fetch('/api/ally-ai',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:value,mode,context}),signal:controller.signal});
    const entry=await res.json();
    if(pending!==controller)return;
    const answer=res.ok?entry:{answer:entry.error||'No se pudo completar la consulta.'};
    entries.push(answer);save();append(answer);
  }catch{
    if(pending===controller){
      const answer={answer:'Ally AI no ha podido responder. Puedes continuar en el catálogo.',
        cards:[{title:'Catálogo de Ally Lab',kind:'Sección',url:'/#juegos'}]};
      entries.push(answer);save();append(answer);
    }
  }finally{
    clearTimeout(timeout);
    if(pending===controller){pending=undefined;setBusy(false);}
  }
}
form.addEventListener('submit',e=>{e.preventDefault();void submit(input.value);});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();toggle();}});
showStart();

mountMascot(root,trigger);
