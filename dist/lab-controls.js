const directions={12:[0,-1],13:[0,1],14:[-1,0],15:[1,0]};
const focusable='a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),summary';
function controls(){
 return [...(keyboard?.open ? keyboard : document).querySelectorAll(focusable)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility==='visible'&&e.tabIndex>=0);
}
function move(dx,dy){
 const items=controls(), active=document.activeElement;
 if(!items.includes(active)){(items.find(e=>e.matches('.mast .active'))||items[0])?.focus();return}
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
 if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}
}
const indicator=document.getElementById('pad-status');
let held='',next=0,timer,editing,keyboard,searchField;

function exitSearch(){
 const field=searchField;
 searchField=undefined;
 keyboard.close();
 if(field?.getClientRects().length)field.focus();
}

function openSearch(field){
 if(!keyboard){
  keyboard=document.createElement('dialog');
  keyboard.className='pad-keyboard';
  keyboard.setAttribute('aria-label','Teclado del buscador');
  const preview=document.createElement('p');
  preview.setAttribute('aria-live','polite');
  const letters=document.createElement('div');
  letters.className='pad-keyboard-letters';
  const actions=document.createElement('div');
  actions.className='pad-keyboard-actions';
  function addKey(label,parent,action){
   const button=document.createElement('button');
   button.type='button';
   button.textContent=label;
   button.addEventListener('click',action);
   parent.append(button);
  }
  function update(value){
   searchField.value=value;
   searchField.dispatchEvent(new Event('input',{bubbles:true}));
   preview.textContent=searchField.value || 'Escribe para buscar';
  }
  for(const key of 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789'){
   addKey(key,letters,()=>update(searchField.value+key.toLowerCase()));
  }
  addKey('Espacio',actions,()=>update(searchField.value+' '));
  addKey('Borrar',actions,()=>update(Array.from(searchField.value).slice(0,-1).join('')));
  addKey('Limpiar',actions,()=>update(''));
  addKey('Listo',actions,exitSearch);
  keyboard.addEventListener('cancel',event=>{event.preventDefault();exitSearch()});
  keyboard.append(preview,letters,actions);
  document.body.append(keyboard);
 }
 searchField=field;
 keyboard.firstElementChild.textContent=field.value || 'Escribe para buscar';
 keyboard.showModal();
 keyboard.querySelector('button').focus();
}

function changeOption(select,step){
 if(select.matches('input[type=range]')){
  if(step<0)select.stepDown();else select.stepUp();
  select.dispatchEvent(new Event('input',{bubbles:true}));return;
 }
 const options=[...select.options];
 for(let i=select.selectedIndex+step;i>=0&&i<options.length;i+=step){
  if(options[i].disabled)continue;
  select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));return;
 }
}
function scan(){
 if(document.hidden){held='';return}
 const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.mapping==='standard');
 if(!pad){held='';return}
 const {buttons,axes}=pad;
 const keys=Object.keys(directions), horizontal=axes[0]||0,vertical=axes[1]||0;
 const arrow=keys.find(k=>buttons[k]?.pressed)||(Math.max(Math.abs(horizontal),Math.abs(vertical))>.58?(Math.abs(horizontal)>Math.abs(vertical)?(horizontal<0?'14':'15'):(vertical<0?'12':'13')):'');
 const key=arrow|| (buttons[0]?.pressed?'A':buttons[1]?.pressed?'B':buttons[3]?.pressed?'Y':'');
 if(key){
  if(indicator)indicator.hidden=false;
  if(key!==held||(arrow&&performance.now()>=next)){
   document.documentElement.classList.add('pad-navigation');
   next=performance.now()+(key===held?130:340);
   if(editing!==document.activeElement)editing=undefined;
   if(arrow&&editing)changeOption(editing,['12','14'].includes(arrow)?-1:1);
   else if(arrow)move(...directions[arrow]);
   else if(key==='Y'){
    if(!keyboard?.open){
     const field=controls().find(el=>el.matches('input[type=search]'));
     if(field){field.focus();openSearch(field)}
    }
   }else if(key==='A'){
    const el=document.activeElement;
    if(el?.matches('input[type=search],input[type=text],textarea'))openSearch(el);
    else if(el?.matches('select,input[type=range]'))editing=editing?undefined:el;
    else if(el?.matches(focusable))el.click();
   }else if(key==='B'){
    if(keyboard?.open)exitSearch();
    else if(editing)editing=undefined;
    else if(!document.activeElement?.matches('input,select,textarea'))document.querySelector('#ficha:not([hidden]) .back a,#details:not([hidden]) > a:first-child')?.click();
   }
  }
 }
 held=key;
}
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('pad-navigation'));
window.addEventListener('gamepadconnected',()=>{if(!timer)timer=setInterval(scan,42)});
window.addEventListener('gamepaddisconnected',()=>{if(!Array.from(navigator.getGamepads?.()||[]).some(Boolean)){clearInterval(timer);timer=undefined;held='';editing=undefined;if(indicator)indicator.hidden=true}});
if(Array.from(navigator.getGamepads?.()||[]).some(Boolean))timer=setInterval(scan,42);
