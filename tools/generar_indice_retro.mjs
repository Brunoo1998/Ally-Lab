import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const names={snes:'Super Nintendo',nes:'NES',n64:'Nintendo 64',gba:'Game Boy Advance',gbc:'Game Boy Color',gb:'Game Boy',ps2:'PlayStation 2',psx:'PlayStation',psp:'PSP',psvita:'PS Vita','3ds':'Nintendo 3DS',nds:'Nintendo DS',gamecube:'GameCube',switch:'Nintendo Switch',wiiu:'Wii U',wii:'Wii',dreamcast:'Dreamcast',saturn:'Sega Saturn',gamegear:'Game Gear',atari2600:'Atari 2600',mastersystem:'Master System',megadrive:'Mega Drive',xbox360:'Xbox 360',xbox:'Xbox'};
const rows=[];
for(const [key,name] of Object.entries(names)){
 const file='dist/datos/retro-caratulas/'+key+'.json.gz';
 if(!fs.existsSync(file))continue;
 const buffer=fs.readFileSync(file);
 const j=JSON.parse((buffer[0]===31&&buffer[1]===139?gunzipSync(buffer):buffer).toString('utf8'));
 const titles=[...new Set([...Object.keys(j[1]||{}),...Object.keys(j[2]||{})])].sort((a,b)=>a.localeCompare(b,'es'));
 if(titles.length)rows.push([key,name,titles]);
}
if(!rows.length)throw Error('Índice Retro vacío');
fs.writeFileSync('dist/datos/retro-busqueda.json',JSON.stringify(rows));
console.log('Índice Retro: '+rows.length+' consolas, '+rows.reduce((n,r)=>n+r[2].length,0)+' títulos con carátula');
