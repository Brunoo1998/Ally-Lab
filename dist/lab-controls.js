const directions={12:[0,-1],13:[0,1],14:[-1,0],15:[1,0]};
const focusable='a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),summary';
function controls(){
 return [...document.querySelectorAll(focusable)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility==='visible'&&e.tabIndex>=0);
}
function focusControl(control){
 control.focus({preventScroll:true});
 control.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
}
function move(dx,dy){
 const items=controls(), active=document.activeElement;
 if(!items.includes(active)){(items.find(e=>e.matches('.mast .active'))||items[0])?.focus();return}
 const search=document.querySelector('#q');
 const order=document.querySelector('#orden');
 if(dy===0 && dx>0 && active===search && items.includes(order)){
  focusControl(order);
  return;
 }
 if(dy===0 && dx<0 && active===order && items.includes(search)){
  focusControl(search);
  return;
 }
 const firstCard=items.find(e=>e.matches('#grid > .card'));
 if(dx===0 && dy>0 && active===search && firstCard){
  focusControl(firstCard);
  return;
 }
 if(dx===0 && dy<0 && search && firstCard && active.matches('#grid > .card') &&
    Math.abs(active.getBoundingClientRect().top-firstCard.getBoundingClientRect().top)<2 &&
    items.includes(search)){
  search.focus();
  return;
 }
 const r=active.getBoundingClientRect(), x=r.x+r.width/2,y=r.y+r.height/2;
 let best=Infinity,target;
 for(const e of items){
  if(e===active)continue;
  const b=e.getBoundingClientRect(),u=b.x+b.width/2-x,v=b.y+b.height/2-y;
  const forward=u*dx+v*dy, across=Math.abs(u*dy-v*dx);
  if(forward<=6)continue;
  const score=forward+across*2.8;
  if(score<best){best=score;target=e}
 }
 if(target)focusControl(target);
}
const indicator=document.getElementById('pad-status');
const statusLabel=indicator?.querySelector('.pad-status-label');
function connectedPads(){
 return Array.from(navigator.getGamepads?.()||[]).filter(p=>p?.mapping==='standard');
}
function isAlly(pad){
 return /\b(?:rog|asus)\b.*\bally\b/i.test(pad.id);
}
function updatePadStatus(){
 const pads=connectedPads();
 const ally=pads.some(isAlly);
 if(indicator){
  indicator.hidden=pads.length===0;
  indicator.classList.toggle('pad-ally',ally);
 }
 if(statusLabel){
  const label=ally?'ROG Ally conectada':'Mando conectado';
  if(statusLabel.textContent!==label)statusLabel.textContent=label;
 }
 return pads.length>0;
}
let held='',next=0,timer,editing;

function activateSearch(field){
 field.focus();
 navigator.virtualKeyboard?.show();
}

let picker;
function openOptions(select){
 const dialog=document.createElement('dialog');
 dialog.className='pad-options';
 const title=document.createElement('h2');
 title.id='pad-options-title';
 title.textContent=select.getAttribute('aria-label')||select.labels[0]?.firstChild?.textContent.trim()||'Seleccionar opción';
 dialog.setAttribute('aria-labelledby',title.id);
 dialog.append(title);
 let selectedButton;
 for(const option of select.options){
  const button=document.createElement('button');
  button.type='button';
  button.className='btn';
  button.textContent=option.label;
  button.disabled=option.matches(':disabled');
  button.setAttribute('aria-pressed',String(option.selected));
  if(option.selected&&!button.disabled)selectedButton=button;
  button.addEventListener('click',()=>{
   if(select.selectedIndex!==option.index){
    select.selectedIndex=option.index;
    select.dispatchEvent(new Event('input',{bubbles:true}));
    select.dispatchEvent(new Event('change',{bubbles:true}));
   }
   dialog.close();
  });
  dialog.append(button);
 }
 dialog.addEventListener('close',()=>{
  if(picker===dialog)picker=undefined;
  dialog.remove();
  if(controls().includes(select))focusControl(select);
 },{once:true});
 document.body.append(dialog);
 dialog.showModal();
 picker=dialog;
 (selectedButton||dialog.querySelector('button:not([disabled])'))?.focus();
}

function stepRange(range,step){
 if(step<0)range.stepDown();else range.stepUp();
 range.dispatchEvent(new Event('input',{bubbles:true}));
}
function navigateOptions(key){
 if(key==='B')picker.close();
 else if(key==='A')document.activeElement?.click();
 else if(key==='12'||key==='13'){
  const buttons=[...picker.querySelectorAll('button:not([disabled])')];
  const index=buttons.indexOf(document.activeElement);
  buttons[Math.max(0,Math.min(buttons.length-1,index+(key==='12'?-1:1)))]?.focus();
 }
}

function scan(){
 if(document.hidden){held='';return}
 const pads=connectedPads();
 const pad=pads.find(isAlly)||pads[0];
 if(!pad){held='';return}
 const {buttons,axes}=pad;
 const scrollAxis=axes[3]||0;
 const tilt=Math.abs(scrollAxis);
 const deadZone=.2;
 if(tilt>deadZone&&!picker?.open){
  const strength=(tilt-deadZone)/(1-deadZone);
  window.scrollBy({top:Math.sign(scrollAxis)*strength**2*40,behavior:'instant'});
 }
 const keys=Object.keys(directions), horizontal=axes[0]||0,vertical=axes[1]||0;
 const arrow=keys.find(k=>buttons[k]?.pressed)||(Math.max(Math.abs(horizontal),Math.abs(vertical))>.58?(Math.abs(horizontal)>Math.abs(vertical)?(horizontal<0?'14':'15'):(vertical<0?'12':'13')):'');
 const key=buttons[0]?.pressed?'A':buttons[1]?.pressed?'B':buttons[3]?.pressed?'Y':buttons[2]?.pressed?'X':arrow;
 if(key){
  if(key!==held||(key===arrow&&performance.now()>=next)){
   document.documentElement.classList.add('pad-navigation');
   next=performance.now()+(key===held?130:340);
   if(editing!==document.activeElement)editing=undefined;
   if(picker?.open)navigateOptions(key);
   else if(key===arrow&&editing)stepRange(editing,['12','14'].includes(arrow)?-1:1);
   else if(key===arrow)move(...directions[arrow]);
   else if(key==='X'){
    const order=controls().find(el=>el.id==='orden');
    if(order)openOptions(order);
   }else if(key==='Y'){
    const field=controls().find(el=>el.matches('input[type=search]'));
    if(field)activateSearch(field);
   }else if(key==='A'){
    const el=document.activeElement;
    if(el?.matches('input[type=search],input[type=text],textarea'))activateSearch(el);
    else if(el?.matches('select:not([multiple])'))openOptions(el);
    else if(el?.matches('input[type=range]'))editing=editing?undefined:el;
    else if(el?.matches(focusable))el.click();
   }else if(key==='B'){
    if(editing)editing=undefined;
    else if(!document.activeElement?.matches('input,select,textarea'))document.querySelector('#ficha:not([hidden]) .back a,#details:not([hidden]) > a:first-child')?.click();
   }
  }
 }
 held=key;
}
document.addEventListener('keydown',event=>{
 if(event.key!=='Enter'||event.repeat||event.isComposing||!event.target.matches?.('input[type=search]'))return;
 activateSearch(event.target);
});
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('pad-navigation'));
function syncGamepads(){
 if(updatePadStatus()){
  if(!timer)timer=setInterval(scan,42);
 }else{
  clearInterval(timer);
  timer=undefined;
  held='';
  editing=undefined;
 }
}
window.addEventListener('gamepadconnected',syncGamepads);
window.addEventListener('gamepaddisconnected',syncGamepads);
syncGamepads();
