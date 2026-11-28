import assert from 'node:assert/strict';
import {parseRetro} from './retro-index.mjs';
const entries=[{type:'file',n:'Con portada',urls:[{u:'https://example.test/a'}]},{type:'file',n:'Sin portada',urls:[{u:'https://example.test/b'}]},{type:'file',n:'Sin portada',urls:[{u:'https://example.test/b2'}]},{type:'directory',n:'Carpeta',urls:[]},{type:'file',n:'Sin URL',urls:[]}];
assert.deepEqual(parseRetro(entries.map(x=>JSON.stringify(x)).join('\n')),['Con portada','Sin portada']);
assert.throws(()=>parseRetro('{"type":'));
assert.throws(()=>parseRetro(''));
console.log('Índice Retro: sin carátula, deduplicación y detección de datos incompletos OK');
