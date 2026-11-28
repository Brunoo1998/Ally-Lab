import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parseRetro} from './retro-index.mjs';
const names={snes:'Super Nintendo',nes:'NES',n64:'Nintendo 64',gba:'Game Boy Advance',gbc:'Game Boy Color',gb:'Game Boy',ps2:'PlayStation 2',psx:'PlayStation',psp:'PSP',psvita:'PS Vita','3ds':'Nintendo 3DS',nds:'Nintendo DS',gamecube:'GameCube',switch:'Nintendo Switch',wiiu:'Wii U',wii:'Wii',dreamcast:'Dreamcast',saturn:'Sega Saturn',gamegear:'Game Gear',atari2600:'Atari 2600',mastersystem:'Master System',megadrive:'Mega Drive',xbox360:'Xbox 360',xbox:'Xbox'};
const html=fs.readFileSync('dist/emulacion.html','utf8');
const enabled=[...new Set([...html.matchAll(/id="console-([a-z0-9-]+)"/g)].map(m=>m[1]))];
if(!enabled.length||enabled.some(k=>!Object.hasOwn(names,k)))throw Error('Consolas sin nombre en el índice');
const source='https://raw.githubusercontent.com/Arley4d/DescargaMasiva/main/';
function covers(key){
 const file='dist/datos/retro-caratulas/'+key+'.json.gz';
 if(!fs.existsSync(file))return [];
 const b=fs.readFileSync(file),j=JSON.parse((b[0]===31&&b[1]===139?gunzipSync(b):b).toString('utf8'));
 return [...new Set([...Object.keys(j[1]||{}),...Object.keys(j[2]||{})])].sort((a,b)=>a.localeCompare(b,'es'));
}
async function collect(key){
 for(let attempt=0;attempt<2;attempt++){
   try{
     const response=await fetch(source+key+'.jsonl',{signal:AbortSignal.timeout(20000),redirect:'error'});
     if(!response.ok)throw Error('HTTP '+response.status);
     const titles=parseRetro(await response.text());
     return [key,names[key],titles,'full'];
   }catch(e){if(attempt===1)console.warn('Índice parcial '+key+': '+e.message);}
 }
 return [key,names[key],covers(key),'covers'];
}
const rows=[];
for(let i=0;i<enabled.length;i+=6)rows.push(...await Promise.all(enabled.slice(i,i+6).map(collect)));
if(!rows.some(r=>r[2].length))throw Error('Índice Retro vacío');
fs.writeFileSync('dist/datos/retro-busqueda.json',JSON.stringify(rows));
const full=rows.filter(r=>r[3]==='full').length;
console.log('Índice Retro: '+full+'/'+rows.length+' consolas completas; '+rows.reduce((n,r)=>n+r[2].length,0)+' títulos; '+(rows.length-full)+' parciales');
