const endpoint='/api/lab-account',origin='https://ally-lab.pages.dev';
const localKey='ally-lab:favorites',hintKey='ally-lab:account-hint',backupKey='ally-lab:favorites-local-backup',queueKey='ally-lab:favorites-pending';
const validGame=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,149}$/.test(v);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const remove=key=>{try{localStorage.removeItem(key);}catch{}};
const games=()=>{const v=read(localKey,[]);return Array.isArray(v)?[...new Set(v.filter(validGame))].slice(0,500):[];};
let hint=read(hintKey,null),account=null,queue=read(queueKey,null),lastCheck=0,working=false,checking=false;
if(typeof hint!=='string')hint=null;
if(!queue||queue.owner!==hint||!Array.isArray(queue.ops))queue={owner:hint,ops:[]};
queue.ops=queue.ops.filter(o=>validGame(o?.game)&&typeof o.enabled==='boolean').slice(0,500);
const header=document.querySelector('.mast .bar')||document.querySelector('.global-search-page nav');
const control=document.createElement('button');control.type='button';control.className='global-search-link ally-account-button';control.textContent=hint?'@'+hint:'Conectar cuenta';
if(header)header.append(control);
function label(text){control.textContent=text;control.title=text;}
function writeFavorites(ids){const value=[...new Set(ids.filter(validGame))].slice(0,500);save(localKey,value);window.dispatchEvent(new CustomEvent('ally-favorites-synced',{detail:value}));}
function storeQueue(){save(queueKey,queue);}
function adopt(value){
 if(!value.linked){disconnect();return false;}
 if(hint&&hint!==value.username){queue={owner:value.username,ops:[]};remove(queueKey);}
 if(!hint)save(backupKey,games());
 hint=value.username;account=value;save(hintKey,hint);
 if(queue.owner!==hint)queue={owner:hint,ops:[]};
 const list=new Set(value.favorites||[]);for(const o of queue.ops)o.enabled?list.add(o.game):list.delete(o.game);
 writeFavorites([...list]);label('@'+hint+(queue.ops.length?' · pendiente':''));return true;
}
function disconnect(){
 if(hint){const backup=read(backupKey,[]);writeFavorites(Array.isArray(backup)?backup:[]);}
 hint=null;account=null;queue={owner:null,ops:[]};remove(hintKey);remove(queueKey);remove(backupKey);label('Conectar cuenta');
}
async function request(data){
 const r=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(14000),...(data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
 const value=await r.json();if(!r.ok)throw Error(value.error||'Cuenta no disponible');return value;
}
async function refresh(force=false){
 if(checking||working||!force&&Date.now()-lastCheck<60000)return;
 checking=true;try{lastCheck=Date.now();const value=await request();adopt(value);}catch{if(hint)label('@'+hint+' · sin conexión');}finally{checking=false;}
 if(account&&queue.ops.length)void flush();
}
async function flush(){
 if(working||checking||!account||queue.owner!==hint||!queue.ops.length)return;
 working=true;
 try{
   while(queue.ops.length&&account){
     const op=queue.ops[0],value=await request({action:'favorite',game:op.game,enabled:op.enabled});
     if(!value.linked){disconnect();return;}
     const i=queue.ops.findIndex(o=>o.game===op.game&&o.enabled===op.enabled);if(i>=0)queue.ops.splice(i,1);
     storeQueue();adopt(value);
   }
 }catch{if(hint)label('@'+hint+' · pendiente');}
 finally{working=false;}
}
window.addEventListener('ally-favorite-changed',e=>{
 if(!hint||!validGame(e.detail?.game)||typeof e.detail.enabled!=='boolean')return;
 queue.owner=hint;queue.ops=queue.ops.filter(o=>o.game!==e.detail.game);queue.ops.push(e.detail);queue.ops=queue.ops.slice(-500);storeQueue();label('@'+hint+' · pendiente');
 if(account)void flush();else void refresh(true);
});
const dialog=document.createElement('dialog');dialog.className='ally-account-dialog';dialog.setAttribute('aria-label','Cuenta Ally');document.body.append(dialog);
function openAccount(){
 dialog.replaceChildren();const h=document.createElement('h2');h.textContent=hint?'@'+hint:'Cuenta Ally';dialog.append(h);
 const p=document.createElement('p');p.textContent=account?'Tu perfil de Ally Community está conectado. Los favoritos se sincronizan entre dispositivos.':hint?'No se ha podido confirmar la conexión. Los cambios se conservan localmente y se reintentan cuando vuelvas a conectar.':'Conecta el perfil que ya utilizas en Ally Community.';dialog.append(p);
 const make=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;dialog.append(b);return b;};
 if(hint){
   make('Sincronizar ahora',async()=>{await refresh(true);await flush();dialog.close();});
   make('Desconectar de Ally Lab',async()=>{if(queue.ops.length&&!confirm('Hay favoritos pendientes de sincronizar. ¿Desconectar igualmente?'))return;try{await request({action:'logout'});disconnect();dialog.close();}catch(e){p.textContent=e.message;}});
 }else make('Conectar con Ally Community',()=>{location.href=origin+endpoint+'?start=1';});
 const profile=document.createElement('a');profile.href='https://ally-community.pages.dev/';profile.textContent='Abrir Ally Community';dialog.append(profile);
 make('Cerrar',()=>dialog.close());dialog.showModal();
}
control.onclick=async()=>{if(location.origin!==origin){location.href=origin+endpoint+'?start=1';return;}if(!hint)await refresh(true);if(!hint){location.href=endpoint+'?start=1';return;}openAccount();};
async function complete(){
 const params=new URLSearchParams(location.hash.slice(1));if(!params.has('connect'))return false;
 const code=params.get('connect'),state=params.get('state');history.replaceState(null,'','/#juegos');
 if(!/^[a-f0-9]{64}$/.test(code||'')||! /^[a-f0-9]{64}$/.test(state||'')){label('Reintentar conexión');return true;}
 try{
   label('Conectando…');
   const previous=hint,local=games();
   const value=await request({action:'redeem',code,state});
   if(!value.linked)throw Error('No se pudo conectar');
   adopt(value);
   if(!previous&&local.length&&confirm('¿Añadir tus favoritos locales a la cuenta de Ally Community?')){
     try{adopt(await request({action:'merge',games:local}));}catch{label('@'+hint+' · importación pendiente');}
   }
   label('@'+hint);
 }catch(e){label('Reintentar conexión');alert(e.message);}
 return true;
}
if(location.origin===origin){
 const started=complete();started.then(done=>{if(!done&&hint)void refresh(true);});
 window.addEventListener('focus',()=>{if(hint)void refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&hint)void refresh();});
 window.addEventListener('online',()=>{if(hint)void refresh(true);});
}
