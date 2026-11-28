import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for(const file of ['index','ports','emulacion','news','gratis']){
 const html=readFileSync('dist/'+file+'.html','utf8');
 assert.equal((html.match(/id="mast-quick-actions"/g)||[]).length,1);
 assert.ok(html.indexOf('id="mast-quick-actions"')<html.indexOf('aria-label="Principal"'));
 assert.ok(html.includes('/lab-account.js?v=3'));
 assert.ok(html.includes('/buscar.css?v=compact-profile-1'));
}
const css=readFileSync('dist/buscar.css','utf8');
assert.match(css,/\.mast \.bar>\.mast-quick-actions\{[^}]*display:flex/);
assert.match(css,/\.ally-account-name\{[^}]*text-overflow:ellipsis/);
const js=readFileSync('dist/lab-account.js','utf8');
assert.match(js,/getElementById\('mast-quick-actions'\)/);
assert.match(js,/aria-haspopup','dialog'/);
assert.match(js,/name\.textContent=connected/);
console.log('Cabecera: acceso de cuenta compacto, accesible y compartido en las cinco secciones.');
