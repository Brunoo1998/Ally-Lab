import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../dist/',import.meta.url);
const file=name=>readFileSync(new URL(name,root),'utf8');
const json=name=>JSON.parse(file('datos/'+name+'.json'));
const {createModel,resolutions,qualities}=await import('data:text/javascript;base64,'+
 Buffer.from(file('sim-model.js')).toString('base64'));
const games=json('catalogo').games;
const months=new Map();
let combinations=0,available=0,catalogueWithData=0;
const coverage={};
for(const game of games){
 const month=game.published.slice(0,7);
 if(!months.has(month)) months.set(month,json(month));
 const model=createModel(game,months.get(month)[game.id]);
 const original=model.evaluate(model.initial);
 if(model.anchors.length)catalogueWithData++;
 assert.ok(original,game.title);
 coverage[original.type]=(coverage[original.type]||0)+1;
 for(const anchor of model.anchors){
  const result=model.evaluate(anchor);
  assert.equal(result.type,'Medición publicada',game.title);
  assert.equal(result.low,anchor.low,game.title);
  assert.equal(result.high,anchor.high,game.title);
 }
 for(const base of model.profiles){
  const options=model.options(base.profile);
  for(const r of resolutions)for(let w=7;w<=35;w++){
   for(const q of options.qualities)for(const scale of options.scales)for(const gen of options.generation){
    const config={profile:base.profile,r,w,q,scale,gen};
    const result=model.evaluate(config);
    assert.strictEqual(result,model.evaluate(config));
    combinations++;
    if(!result)continue;
    available++;
    assert.ok(Number.isFinite(result.low)&&result.low>0);
    assert.ok(result.high===null?result.limit==='>':result.high>=result.low);
    assert.ok(result.center>=result.low&&(result.high===null||result.center<=result.high));
    if(gen==='on')assert.ok(result.type!=='Estimación por escenarios');
   }
  }
 }
 const active=model.options(model.initial.profile);
 const low=model.evaluate({...model.initial,q:'low'});
 const ultra=model.evaluate({...model.initial,q:'ultra'});
 if(low&&ultra)assert.ok(low.center>=ultra.center,game.title);
 if(game.id==='death-stranding-2-on-the-beach-xbox'){
  assert.ok(active.qualities.includes('ultra'));
  assert.notEqual(low.center,ultra.center);
  assert.equal(ultra.confidence,'Baja');
  for(const [id,level] of Object.entries(active.adjustable)){
   assert.deepEqual(model.evaluate({...model.initial,[id]:level}),original);
   const changed=model.evaluate({...model.initial,[id]:level==='ultra'?'low':'ultra'});
   assert.equal(changed.type,'Estimación de calidad');
  }
 }
 if(game.title==='Cyberpunk 2077'){
  assert.equal(original.low,40.5);
  assert.deepEqual(qualities.map(q=>model.evaluate({...model.initial,q}).low),[49.5,40.5,31.9,28]);
  assert.equal(model.evaluate({...model.initial,w:21}).type,'Interpolación');
  assert.equal(model.evaluate({...model.initial,w:21}).center,35.3);
  assert.equal(model.evaluate({...model.initial,r:900}).confidence,'Baja');
  assert.equal(model.evaluate({...model.initial,w:7}).confidence,'Baja');
  assert.equal(model.evaluate({...model.initial,gen:'on'}),null);
 }
 if(game.id==='death-stranding-2-on-the-beach-xbox'){
  assert.equal(original.low,30);
  assert.equal(model.evaluate({...model.initial,gen:'on'}).high,75);
  assert.equal(model.evaluate({...model.initial,gen:'on',w:34}).type,'Estimación del juego');
 }
}
const ports=json('ports');
let embedded=0;
for(const [id,test] of Object.entries(ports.tests)){
 if(!test.sim?.points?.length)continue;
 const model=createModel({id,source:test.source},test.sim,test.sim.points);
 assert.ok(model.evaluate(model.initial));
 embedded++;
}
console.log(JSON.stringify({juegos:games.length,perfilesConReferencia:catalogueWithData,combinaciones:combinations,conResultado:available,simuladoresDePorts:embedded,coverage}));
