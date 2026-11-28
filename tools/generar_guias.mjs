import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const base = 'https://ally-lab.pages.dev';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const catalog = read('dist/datos/catalogo.json');
const details = {};
for (const m of new Set(catalog.games.map(g => g.published.slice(0,7)))) {
  if (!/^\d{4}-\d{2}$/.test(m)) throw Error('Mes inválido: ' + m);
  Object.assign(details, read('dist/datos/' + m + '.json'));
}
const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeSource = s => {try {const u=new URL(s);return u.protocol==='https:'?u.href:'';} catch{return ''}};
const write = (p, value) => {fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value)};
const layout = (title, desc, url, body) => '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><meta name="description" content="'+escape(desc)+'"><link rel="canonical" href="'+base+escape(url)+'"><meta name="theme-color" content="#080a10"><link rel="stylesheet" href="/guias.css"><link rel="icon" href="/assets/ally-mark.svg"></head><body><main><nav aria-label="Navegación"><a href="/">Ally Lab</a> · <a href="/guias/">Índice de guías</a></nav>'+body+'</main></body></html>\n';
const games=catalog.games;
assert.ok(Array.isArray(games)&&games.length>0);
assert.equal(new Set(games.map(g=>g.id)).size,games.length,'IDs duplicados');
assert.ok(games.every(g=>/^[a-z0-9][a-z0-9-]*$/.test(g.id)&&typeof g.title==='string'&&g.title.length));
const links=['/','/gratis','/news','/ports','/emulacion','/guias/'];
const table=rows=>Array.isArray(rows)&&rows.length?'<dl>'+rows.filter(r=>Array.isArray(r)&&r.length>=2).map(([k,v])=>'<dt>'+escape(k)+'</dt><dd>'+escape(v)+'</dd>').join('')+'</dl>':'';
let complete=0;
// El directorio se crea desde cero en cada build; no se conservan guías retiradas.
fs.rmSync('dist/guias',{recursive:true,force:true});
for(const g of games){
  const u='/guias/'+g.id+'/'; links.push(u);
  const d=details[g.id]||{};
  if(Array.isArray(d.profiles)&&d.profiles.length)complete++;
  const src=safeSource(g.source);
  const source=src?'<p>Fuente original: <a href="'+escape(src)+'" rel="noopener noreferrer">consultar prueba publicada</a>.</p>':'';
  const profiles=(Array.isArray(d.profiles)?d.profiles:[]).map(p=>'<section><h2>'+escape(p.name||'Configuración publicada')+'</h2>'+table(p.rows)+'</section>').join('');
  const measurements=table(d.metrics);
  const setup=table(d.setup);
  const cover=/^\.\/assets\/portadas\/[a-zA-Z0-9_.-]+$/.test(g.cover||'')?'<img class="cover" width="160" height="240" alt="" src="'+escape(g.cover.slice(1))+'">':'';
  const body='<header>'+cover+'<div><p class="kicker">XBOX ROG ALLY X · RYZEN AI Z2 EXTREME</p><h1>'+escape(g.title)+'</h1><p>Guía publicada: '+escape(g.published)+'</p><p><a class="action" href="/#juego/'+escape(g.id)+'">Abrir ficha interactiva</a></p></div></header><p>'+(g.power?'TDP indicado: '+escape(g.power)+'. ':'')+(g.fps?'FPS indicados en el catálogo: '+escape(g.fps)+'. ':'')+'Las cifras dependen de la configuración y condiciones de cada prueba; no son una garantía.</p>'+source+(measurements?'<section><h2>Datos de rendimiento publicados</h2>'+measurements+'</section>':'')+(setup?'<section><h2>Condiciones de prueba</h2>'+setup+'</section>':'')+profiles+'<p><a href="/#juego/'+escape(g.id)+'?sim=1">Simular otros ajustes</a> · <a href="https://ally-community.pages.dev/?game='+escape(g.id)+'&amp;title='+encodeURIComponent(g.title)+'">Debate de la comunidad</a></p>';
  write('dist'+u+'index.html',layout(g.title+' · Configuración para Xbox ROG Ally X | Ally Lab','Guía de ajustes y rendimiento de '+g.title+' para Xbox ROG Ally X con Ryzen AI Z2 Extreme.',u,body));
}
const index='<h1>Guías de juegos</h1><p>'+games.length+' fichas del catálogo.</p><ul>'+games.slice().sort((a,b)=>a.title.localeCompare(b.title,'es')).map(g=>'<li><a href="/guias/'+escape(g.id)+'/">'+escape(g.title)+'</a></li>').join('')+'</ul>';
write('dist/guias/index.html',layout('Índice de guías de juegos | Ally Lab','Catálogo de guías de configuración de juegos para Xbox ROG Ally X.','/guias/',index));
write('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+links.map(u=>'  <url><loc>'+base+escape(u)+'</loc></url>').join('\n')+'\n</urlset>\n');
assert.equal(new Set(links).size,links.length);
assert.equal(fs.readdirSync('dist/guias',{withFileTypes:true}).filter(x=>x.isDirectory()).length,games.length);
assert.ok(complete>0,'Ninguna guía contiene configuraciones');
console.log('Guías generadas: '+games.length+'; con perfiles: '+complete+'; URLs en sitemap: '+links.length);
