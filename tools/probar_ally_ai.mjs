import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {onRequestPost} from '../functions/api/ally-ai.js';

const origin='https://ally-lab.pages.dev';
let modelCalls=0;
const buckets=new Map();
const env={
  ASSETS:{async fetch(url){
    try{return new Response(await readFile(new URL('../dist'+url.pathname,import.meta.url)));}
    catch{return new Response(null,{status:404});}
  }},
  ALLY_AI_RATE_SECRET:'test fixture for request throttling',
  ALLY_AI_LIMITS:{prepare(sql){return {
    bind(...args){return {async run(){},async first(){
      assert.match(sql,/RETURNING hits/);
      const [key,units,,max]=args;
      const hits=(buckets.get(key)||0)+units;
      if(hits>max)return null;
      buckets.set(key,hits);
      return {hits};
    }};}
  };}},
  AI:{async run(){modelCalls++;return {response:{ids:[1],intent:'rendimiento'}};}}
};
async function ask(message, params={}, bindings=env){
  const response=await onRequestPost({env:bindings,request:new Request(origin+'/api/ally-ai',{
    method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},
    body:JSON.stringify({message,...params})
  })});
  assert.equal(response.status,200);
  return response.json();
}

const result=await ask('Quiero jugar al ciberpunk a 60 fps');
assert.match(result.cards[0].title,/Cyberpunk/i);
assert.equal(result.memory.fps,60);
const context=[result.cards[0].gameId];
const follow=await ask('¿Y si lo juego a 30 vatios?',{context,memory:{settings:result.memory}});
assert.equal(follow.cards[0].gameId,context[0]);
assert.deepEqual(follow.memory,{fps:60,watts:30,power:null});
assert.ok(follow.cards[0].readings.every(reading=>reading.tdp==='30 W'));
const battery=await ask('¿Y sin tenerla enchufada?',{context,memory:{settings:follow.memory}});
assert.equal(battery.memory.power,'battery');
assert.match(battery.answer,/batería/);
const lower=await ask('¿Qué pasa si bajo la resolución?',{context,memory:{settings:{...battery.memory,resolution:1080}}});
assert.equal(lower.memory.resolution,900);
assert.ok(lower.cards[0].readings.every(reading=>reading.resolution==='900p'));
const limit=await ask('¿Qué ajustes tiene Cyberpunk 2077?');
assert.equal(limit.availability,'limited');
assert.equal(modelCalls,4);
const links=await ask('Abre el simulador y llévame a juegos gratis');
assert.deepEqual(links.cards.map(card=>card.url),['/#simulador','/gratis']);
assert.match((await ask('¿Qué diferencia hay entre FSR y Frame Generation?')).answer,/intercala/);
const offline=await ask('Quiero jugar al ciberpunk a 60 fps',{},{
  ...env,ALLY_AI_LIMITS:{prepare(){throw Error('D1 fuera de servicio');}}
});
assert.equal(offline.availability,'database_unavailable');
assert.equal(modelCalls,4);
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async (url)=>{assert.match(String(url),/^https:\/\/ally-community\.pages\.dev\/api\/public-search\?q=/);return Response.json({rows:[{id:7,title:'Cyberpunk: solución',excerpt:'Ajustes',solution:'Prueba de usuario'}]});};
 const community=await ask('Busca Cyberpunk en la comunidad');
 assert.equal(community.mode,'search');assert.equal(community.cards[0].url,'https://ally-community.pages.dev/?post=7');assert.match(community.cards[0].description,/no verificada/);assert.equal(modelCalls,4);
}finally{globalThis.fetch=originalFetch;}
console.log('Memoria, filtros de rendimiento, navegación, cuota, caída D1 y foro público: OK');
