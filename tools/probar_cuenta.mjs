import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/lab-account.js';
const origin='https://ally-lab.pages.dev',secret='c'.repeat(64),code='d'.repeat(64);
const start=await onRequestGet({request:new Request(origin+'/api/lab-account?start=1')});
assert.equal(start.status,303);
const state=new URL(start.headers.get('Location')).searchParams.get('connectLab');
assert.match(state,/^[a-f0-9]{64}$/);assert.match(start.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
const stateCookie='__Host-ally_lab_state='+state,linkCookie='__Host-ally_lab_link='+secret;
const prev=globalThis.fetch;
let calls=0;
globalThis.fetch=async(url,opt)=>{
 assert.equal(opt.headers.Origin,origin);assert.ok(String(url).startsWith('https://ally-community.pages.dev/api/lab-link/'));calls++;
 const route=String(url).split('/').at(-1);
 if(route==='redeem'){assert.equal(opt.headers.Authorization,'Bearer '+code);assert.equal(JSON.parse(opt.body).state,state);return Response.json({token:secret,expires:Math.floor(Date.now()/1000)+3600,username:'TestGamer',favorites:['cyberpunk']});}
 assert.equal(opt.headers.Authorization,'Bearer '+secret);
 if(route==='logout')return Response.json({ok:true});
 return Response.json({username:'TestGamer',favorites:['cyberpunk']});
};
const post=(data,cookie=stateCookie,from=origin)=>onRequestPost({request:new Request(origin+'/api/lab-account',{method:'POST',headers:{Origin:from,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(data)})});
try{
 assert.equal((await post({action:'redeem',code,state:'e'.repeat(64)})).status,403);
 assert.equal((await post({action:'redeem',code,state},stateCookie,'https://evil.test')).status,403);assert.equal(calls,0);
 const res=await post({action:'redeem',code,state});assert.equal(res.status,200);assert.match(res.headers.get('set-cookie'),/HttpOnly/);
 const profile=await res.json();assert.equal(profile.username,'TestGamer');assert.ok(!('token' in profile));assert.equal(calls,1);
 const f=await post({action:'favorite',game:'cyberpunk',enabled:true},linkCookie);assert.deepEqual((await f.json()).favorites,['cyberpunk']);
 assert.equal((await post({action:'favorite',game:'../private',enabled:true},linkCookie)).status,400);
 assert.equal((await post({action:'logout'},linkCookie)).status,200);
 globalThis.fetch=async()=>new Response('Cloudflare routing error',{status:403,headers:{'Content-Type':'text/html'}});
 const routed=await post({action:'redeem',code,state});assert.equal(routed.status,503);assert.equal((await routed.json()).reason,'AL-ROUTE');
 globalThis.fetch=async()=>Response.json({error:'expired'},{status:401});
 const expired=await post({action:'redeem',code,state});assert.equal(expired.status,401);assert.equal((await expired.json()).reason,'AL-EXPIRED');
 globalThis.fetch=async()=>Response.json({error:'origin'},{status:403});
 const blocked=await post({action:'redeem',code,state});assert.equal(blocked.status,503);assert.equal((await blocked.json()).reason,'AL-ORIGIN');
 globalThis.fetch=async()=>{throw Error('network');};
 const down=await post({action:'redeem',code,state});assert.equal(down.status,503);assert.equal((await down.json()).reason,'AL-NETWORK');
}finally{globalThis.fetch=prev;}
console.log('Cuenta Ally: state, CSRF, cookies HttpOnly, favoritos y cierre: OK');
