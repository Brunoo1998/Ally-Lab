// Source-linked measured results. Never use another console's data.
export const benchmarkSources={
  "nc": {
    "name": "Notebookcheck · comparativa Xbox Ally (2025)",
    "url": "https://www.notebookcheck.net/Slower-than-the-Steam-Deck-OLED-Asus-ROG-Xbox-Ally-handheld-review.1143681.0.html",
    "note": "Comparativa publicada. El TDP y el estado de Frame Generation no se especifican en cada fila; no se extrapola."
  },
  "ncx": {
    "name": "Notebookcheck · ROG Ally X (2024)",
    "url": "https://www.notebookcheck.net/Asus-ROG-Ally-X-Review-The-best-gaming-handheld-thanks-to-faster-RAM-and-a-huge-80-Wh-battery.865721.0.html",
    "note": "Modos de potencia de la APU con límites nominales y boost. No se equiparan los modos de batería y corriente."
  },
  "pcgn": {
    "name": "PCGamesN · ROG Ally X (2024)",
    "url": "https://www.pcgamesn.com/asus/rog-ally-x-review",
    "note": "8 GB de VRAM; preajustes de potencia. Reescalado y FG no especificados en la tabla. El autor observó retrasos al cambiar TDP; las interpolaciones son orientativas de confianza baja."
  },
  "reviewed": {
    "name": "Reviewed · ROG Ally Z1 (2023)",
    "url": "https://www.reviewed.com/gaming/content/asus-rog-ally-z1-review",
    "note": "TDP de la prueba de juego y FG no especificados. No se infieren."
  }
};
export const benchmarkRows=[
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "xbox",
    "res": 1080,
    "quality": "Ultra",
    "fps": 12.4,
    "src": "nc",
    "scale": "FSR desactivado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Ultra",
    "fps": 22.9,
    "src": "nc",
    "scale": "FSR desactivado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "z1e",
    "res": 1080,
    "quality": "Ultra",
    "fps": 20.3,
    "src": "nc",
    "scale": "FSR desactivado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "baldurs-gate-3-rog-xbox-ally-x",
    "model": "xbox",
    "res": 1080,
    "quality": "Ultra",
    "fps": 16.8,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "baldurs-gate-3-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Ultra",
    "fps": 25.8,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "baldurs-gate-3-rog-xbox-ally-x",
    "model": "z1e",
    "res": 1080,
    "quality": "Ultra",
    "fps": 24,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "shadow-of-the-tomb-raider-xbox-ally-x",
    "model": "xbox",
    "res": 1080,
    "quality": "Máxima",
    "fps": 24,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "shadow-of-the-tomb-raider-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Máxima",
    "fps": 37,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "shadow-of-the-tomb-raider-xbox-ally-x",
    "model": "z1e",
    "res": 1080,
    "quality": "Máxima",
    "fps": 33,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "dota-2-rog-xbox-ally-x-game-settings",
    "model": "xbox",
    "res": 1080,
    "quality": "Ultra",
    "fps": 48.7,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "dota-2-rog-xbox-ally-x-game-settings",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Ultra",
    "fps": 76.2,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "dota-2-rog-xbox-ally-x-game-settings",
    "model": "z1e",
    "res": 1080,
    "quality": "Ultra",
    "fps": 75.5,
    "src": "nc",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "z1",
    "res": 720,
    "quality": "Steam Deck",
    "fps": 29,
    "src": "reviewed",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "starfield-rog-xbox-ally-x-game-settings",
    "model": "z1",
    "res": 1080,
    "quality": "Baja",
    "fps": 25,
    "src": "reviewed",
    "scale": "FSR, resolución interna 50%",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "z1e",
    "res": 720,
    "quality": "Steam Deck",
    "fps": 42,
    "src": "reviewed",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "starfield-rog-xbox-ally-x-game-settings",
    "model": "z1e",
    "res": 1080,
    "quality": "Baja",
    "fps": 35,
    "src": "reviewed",
    "scale": "FSR, resolución interna 50%",
    "fg": "No indicado",
    "tdp": null,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Media",
    "fps": 16.3,
    "src": "ncx",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 13,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Media",
    "fps": 26.4,
    "src": "ncx",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 17,
    "power": "No indicado"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Media",
    "fps": 31.1,
    "src": "ncx",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 25,
    "power": "Batería"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Media",
    "fps": 34.3,
    "src": "ncx",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 30,
    "power": "Corriente"
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 720,
    "quality": "Baja",
    "fps": 36.2,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 13,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 900,
    "quality": "Baja",
    "fps": 26.6,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 13,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Baja",
    "fps": 15.5,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 13,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 720,
    "quality": "Baja",
    "fps": 69.2,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 17,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 900,
    "quality": "Baja",
    "fps": 43.8,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 17,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Baja",
    "fps": 26.1,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 17,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 720,
    "quality": "Baja",
    "fps": 75.6,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 25,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 900,
    "quality": "Baja",
    "fps": 53.3,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 25,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Baja",
    "fps": 32.8,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 25,
    "power": "No indicado",
    "interpolate": true
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 720,
    "quality": "Baja",
    "fps": 80.3,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 30,
    "power": "Corriente",
    "interpolate": false
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 900,
    "quality": "Baja",
    "fps": 62.9,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 30,
    "power": "Corriente",
    "interpolate": false
  },
  {
    "game": "cyberpunk-2077-rog-xbox-ally-x",
    "model": "ally-x-2024",
    "res": 1080,
    "quality": "Baja",
    "fps": 35.1,
    "src": "pcgn",
    "scale": "No indicado",
    "fg": "No indicado",
    "tdp": 30,
    "power": "Corriente",
    "interpolate": false
  }
];
export function modelBenchmarks(game,model){return benchmarkRows.filter(r=>r.game===game&&r.model===model);}
export function measurementGroups(rows){
 const groups=new Map();
 for(const r of rows){
   const key=JSON.stringify([r.src,r.res,r.quality,r.scale,r.fg,r.power]);
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(r);
 }
 return [...groups.values()].map(g=>g.sort((a,b)=>(a.tdp??0)-(b.tdp??0)));
}
export function estimateGroup(group,watts){
 if(!group?.length||!Number.isFinite(watts))return null;
 const first=group[0];if(!group.every(r=>['game','model','src','res','quality','scale','fg','power'].every(k=>r[k]===first[k])))return null;
 const exact=group.find(r=>r.tdp===watts);if(exact)return {fps:exact.fps,type:'Medición publicada'};
 const points=group.filter(r=>r.interpolate===true&&Number.isFinite(r.tdp)).sort((a,b)=>a.tdp-b.tdp);
 const lo=points.filter(r=>r.tdp<watts).at(-1),hi=points.find(r=>r.tdp>watts);
 if(!lo||!hi)return null;
 return {fps:Math.round((lo.fps+(hi.fps-lo.fps)*(watts-lo.tdp)/(hi.tdp-lo.tdp))*10)/10,type:'Estimación interpolada · confianza baja',bounds:[lo.tdp,hi.tdp]};
}
