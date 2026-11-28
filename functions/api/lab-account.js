const origin='https://ally-lab.pages.dev';
const community='https://ally-community.pages.dev';
const linkName='__Host-ally_lab_link',stateName='__Host-ally_lab_state';
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const game=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,149}$/.test(v);
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const cookie=(request,name)=>request.headers.get('Cookie')?.match(new RegExp('(?:^|;\\s*)'+name+'=([a-f0-9]{64})(?=;|$)'))?.[1];
const setCookie=(name,value,age)=>name+'='+value+'; Path=/; Max-Age='+age+'; Secure; HttpOnly; SameSite=Lax';
const json=(data,status=200,cookies=[])=>{const h=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});for(const c of cookies)h.append('Set-Cookie',c);return Response.json(data,{status,headers:h});};
async function read(request){
 if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')throw Error('Formato no válido');
 const reader=request.body?.getReader();if(!reader)throw Error('Faltan datos');
 const decoder=new TextDecoder();let total=0,s='';
 for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>100000){await reader.cancel();throw Error('Solicitud demasiado grande');}s+=decoder.decode(value,{stream:true});}
 const result=JSON.parse(s+decoder.decode());if(!result||Array.isArray(result)||typeof result!=='object')throw Error('Datos no válidos');return result;
}
async function remote(action,key,data){
 try{
   const response=await fetch(community+'/api/lab-link/'+action,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Origin':origin,'Accept':'application/json','User-Agent':'AllyLab-Account/1.1'},body:JSON.stringify(data),redirect:'manual',signal:AbortSignal.timeout(7000)});
   if(!response.headers.get('Content-Type')?.toLowerCase().includes('application/json'))return {status:503,data:{},failure:'route'};
   let payload;try{payload=await response.json();}catch{return {status:503,data:{},failure:'format'};}
   return {status:response.status,data:payload};
 }catch{return {status:503,data:{},failure:'network'};}
}
function cleanState(data){
 if(typeof data?.username!=='string'||!/^[A-Za-z0-9_]{3,20}$/.test(data.username)||!Array.isArray(data.favorites)||data.favorites.length>500||!data.favorites.every(game))return null;
 return {linked:true,username:data.username,favorites:[...new Set(data.favorites)]};
}
function linkedResponse(r){
 if(r.status===401)return json({linked:false},200,[setCookie(linkName,'',0)]);
 const state=r.status===200?cleanState(r.data):null;
 if(state)return json(state);
 return json({error:r.status===429?'Demasiados cambios o límite de favoritos.':'No se pudo consultar la cuenta. Inténtalo más tarde.'},r.status===429?429:503);
}
export async function onRequestGet({request}){
 const url=new URL(request.url);
 if(url.origin!==origin)return Response.redirect(origin+'/',302);
 if(url.searchParams.get('start')==='1'){
   const state=token(),h=new Headers({Location:community+'/?connectLab='+state,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
   h.append('Set-Cookie',setCookie(stateName,state,600));return new Response(null,{status:303,headers:h});
 }
 const key=cookie(request,linkName);
 if(!key)return json({linked:false});
 return linkedResponse(await remote('state',key,{}));
}
export async function onRequestPost({request}){
 if(new URL(request.url).origin!==origin||request.headers.get('Origin')!==origin)return json({error:'Origen no autorizado.'},403);
 let data;try{data=await read(request);}catch{return json({error:'Solicitud no válida.'},400);}
 const action=data.action;
 if(action==='redeem'){
   const state=cookie(request,stateName);
   if(!hex(data.code)||!hex(data.state)||!state||state!==data.state)return json({error:'Conexión no válida. Inicia el proceso desde Ally Lab.'},403);
   const grant=await remote('redeem',data.code,{state});
   if(grant.status!==200){
     if(grant.status===401)return json({error:'La autorización ha caducado o ya se utilizó. Inicia una conexión nueva.',reason:'AL-EXPIRED'},401);
     if(grant.status===429)return json({error:'Se ha alcanzado el límite de conexiones. Revisa las conexiones desde tu perfil del foro.',reason:'AL-LIMIT'},429);
     if(grant.status===403)return json({error:'El servicio de Ally Community ha rechazado la conexión.',reason:'AL-ORIGIN'},503);
     return json({error:'No se ha podido comunicar con el servicio de cuentas. Vuelve a conectar tu cuenta.',reason:grant.failure==='route'?'AL-ROUTE':grant.failure==='network'?'AL-NETWORK':'AL-SERVICE'},503);
   }
   if(!hex(grant.data?.token)||!Number.isSafeInteger(grant.data.expires)||grant.data.expires<=Math.floor(Date.now()/1000))return json({error:'Respuesta de autorización inválida.',reason:'AL-RESPONSE'},503);
   // Las versiones nuevas entregan el perfil en la misma respuesta. Mantener
   // compatibilidad con el backend anterior durante el despliegue.
   let profile=cleanState(grant.data);
   if(!profile){
     const r=await remote('state',grant.data.token,{});
     profile=r.status===200?cleanState(r.data):null;
   }
   if(!profile){await remote('logout',grant.data.token,{});return json({error:'No se pudo comprobar la cuenta.',reason:'AL-PROFILE'},503);}
   const age=Math.min(2592000,grant.data.expires-Math.floor(Date.now()/1000));
   return json(profile,200,[setCookie(linkName,grant.data.token,age),setCookie(stateName,'',0)]);
 }
 const key=cookie(request,linkName);
 if(!key)return json({linked:false});
 if(action==='logout'){
   const r=await remote('logout',key,{});
   if(r.status!==200&&r.status!==401)return json({error:'No se pudo desconectar la cuenta.'},503);
   return json({linked:false},200,[setCookie(linkName,'',0)]);
 }
 if(action==='favorite'){
   if(!game(data.game)||typeof data.enabled!=='boolean')return json({error:'Favorito no válido.'},400);
   return linkedResponse(await remote(action,key,{game:data.game,enabled:data.enabled}));
 }
 if(action==='merge'){
   if(!Array.isArray(data.games)||data.games.length>500||!data.games.every(game))return json({error:'Lista no válida.'},400);
   return linkedResponse(await remote(action,key,{games:[...new Set(data.games)]}));
 }
 return json({error:'Acción no disponible.'},400);
}
