import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {benchmarkRows,benchmarkSources,modelBenchmarks,measurementGroups,estimateGroup} from '../dist/model-benchmarks.js';
import {hardwareModels} from '../dist/hardware.js';
const ids=new Set(JSON.parse(readFileSync('dist/datos/catalogo.json','utf8')).games.map(g=>g.id));
for(const r of benchmarkRows){assert.ok(ids.has(r.game));assert.ok(hardwareModels.some(([id])=>id===r.model));assert.ok(benchmarkSources[r.src]?.url.startsWith('https://'));assert.ok(Number.isFinite(r.fps)&&r.fps>0);}
const cp='cyberpunk-2077-rog-xbox-ally-x';
for(const model of ['xbox','ally-x-2024','z1e','z1'])assert.ok(modelBenchmarks(cp,model).length);
assert.equal(modelBenchmarks(cp,'other').length,0);
const groups=measurementGroups(modelBenchmarks(cp,'ally-x-2024'));
const g=groups.find(g=>g[0].src==='pcgn'&&g[0].res===1080&&g[0].interpolate);
assert.equal(estimateGroup(g,17).fps,26.1);
assert.equal(estimateGroup(g,20).type,'Estimación interpolada · confianza baja');
assert.equal(estimateGroup(g,30),null);
assert.equal(estimateGroup([...g,modelBenchmarks(cp,'z1')[0]],20),null);
console.log('Referencias de modelos: '+benchmarkRows.length+' mediciones; sin extrapolación ni mezcla de modelos.');
