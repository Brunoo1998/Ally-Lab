import {catalogBaseline} from './referencia-catalogo.js?v=39';

// Modelos externos del mismo juego y dispositivo, con sus condiciones publicadas.
const externas = {
 'Killing Floor 3':[24,36,'high','https://pcgaming.io/en-us/games/killing-floor-3'],
 'Grand Theft Auto IV':[37,50,'low','grand-theft-auto-iv'],
 'Mindseye':[26,26,null,'https://pcgaming.io/en-us/games/mindseye'],
 'Resident Evil 4':[37,51,'low','resident-evil-4'],
 'Fortnite':[82,99,'low','fortnite'],
 'Slay the Spire 2':[53,63,'low','slay-the-spire-2'],
 'Dispatch':[48,59,'low','dispatch'],
 'Hollow Knight Silksong':[73,89,'low','hollow-knight-silksong'],
 'Warhammer 40000 Space Marine 2':[26,40,'low','https://pcgaming.io/en-us/games/warhammer-40-000-space-marine-2/on/rog-xbox-ally-x'],
 'Hogwarts Legacy':[26,38,'medium','https://pcgaming.io/en-us/games/hogwarts-legacy/on/rog-xbox-ally-x'],
 'Starfield':[37,37,null,'https://pcgaming.io/en-us/games/starfield']
};
export function referencias(game,d){
 const refs=[];
 for(const note of d.notes){
  for(const sentence of note.split(/(?<=[.!?])\s+/)){
   const m=sentence.match(/(?:(\d+)\s*(?:–|-|y|a)\s*)?(\d+)\s*FPS\b/i);
   if(!m||/caídas? de\s*$|perdió\s*$|aumentó\s*$|mejora de\s*$|objetivo de\s*$|límite de\s*$|casi\s*$/i.test(sentence.slice(0,m.index)))continue;
   const first=Number(m[1]||m[2]),last=Number(m[2]);
   if(first>last||first<1||last>500)continue;
   const before=sentence.slice(0,m.index);
   const resolution=before.match(/\b(720|900|1080)p/i);
   const power=before.match(/(?<![\d.,])\b(\d{1,2})\s*W\b/i);
   refs.push({low:first,high:last,r:Number(resolution?.[1])||null,w:Number(power?.[1])||null,text:sentence,url:game.source});
  }
 }
 if(refs.length)return refs;
 if(Number(game.fps)>0)return [{low:+game.fps,high:+game.fps,text:'Media global de la ficha: '+game.fps+' FPS.',url:game.source}];
 if(game.title==='Cronos The New Dawn')return [{low:30,high:30,cap:30,r:900,w:35,text:'El curador de Steam informa de 30 FPS con limitador a 900p, 30–35 W y FSR 4 en Rendimiento.',url:'https://store.steampowered.com/app/2101960/_/?curator_clanid=46106673&l=english'}];
 if(game.title==='Anger Foot')return [{low:60,high:60,r:900,text:'La reseña del curador en Steam indica unos 60 FPS a 900p y 25–35 W, con tirones.',url:'https://store.steampowered.com/app/1978590/Anger_Foot/?curator_clanid=46106673'}];
 if(game.title==='PowerWash Simulator 2')return [{low:60,high:60,r:1080,q:'medium',text:'Vandal observó unos 60 FPS con pequeñas caídas a 1080p en Medio.',url:'https://vandal.elespanol.com/analisis/pc/powerwash-simulator-2/197374'}];
 const ext=externas[game.title];
 if(ext)return [{low:ext[0],high:ext[1],q:ext[2],r:ext[2]?1080:null,text:'Modelo externo para este juego en ROG Xbox Ally X: '+ext[0]+'–'+ext[1]+' FPS'+(ext[2]?' a 1080p en '+({medium:'Medio',low:'Bajo',high:'Alto'})[ext[2]]:'')+'.',url:ext[3].startsWith('https')?ext[3]:'https://fpshq.com/en/rog-xbox-ally-x/'+ext[3]+'/'}];
 for(const p of d.profiles)for(const [k,v] of p.rows){
  if(!/FPS.*(?:observ|medid|obtenid)|(?:observ|medid|obtenid).*FPS/i.test(k))continue;
  const m=v.match(/\d+/);if(m)return [{low:+m[0],high:+m[0],text:k+' · '+v,url:game.source}];
 }
 return [];
}
const qualityFactors = {low:1.15, medium:1, high:.85, ultra:.7};

// Ratios por dimensión de FSR 3 publicados por AMD GPUOpen.
const fsr3Ratios = {native:1, quality:1.5, balanced:1.7, performance:2, 'ultra-performance':3};

function renderHeight(settings) {
 const [technology, mode] = (settings.scale ?? '').split(':');
 return /^(?:FSR 3|FSR 3.1)$/.test(technology) && fsr3Ratios[mode]
  ? settings.r / fsr3Ratios[mode] : null;
}

export function proyectar(refs, target, baseline) {
 const candidates = [];
 for (const ref of refs) {
  // Las referencias cualitativas o externas pueden omitir condiciones.
  if ((ref.gen ?? baseline.gen) !== target.gen) continue;
  const referenceScale = ref.scale ?? baseline.scale;
  const changedScale = referenceScale !== target.scale;
  const sourceHeight = changedScale ? renderHeight(ref) : ref.r;
  const targetHeight = changedScale ? renderHeight(target) : target.r;
  if (changedScale && (!sourceHeight || !targetHeight ||
      referenceScale.split(':')[0] !== target.scale.split(':')[0])) continue;
  if (target.r !== baseline.r && (!ref.r || !target.r)) continue;
  if (target.w !== baseline.w && (!ref.w || !target.w)) continue;
  if (target.q !== 'guide' && !qualityFactors[ref.q]) continue;
  if (target.q === 'guide' && ref.profile !== undefined && ref.profile !== target.profile) continue;
  // Un modo no documentado en una referencia genérica solo sirve como contexto.
  if (ref.scale === undefined && (target.scale !== baseline.scale ||
      (target.scale !== 'guide' && (target.r !== baseline.r || target.w !== baseline.w || target.q !== baseline.q)))) continue;

  const resolutionDistance = sourceHeight && targetHeight ? Math.log(sourceHeight / targetHeight) : 0;
  const powerDistance = ref.w && target.w ? Math.log(target.w / ref.w) : 0;
  const qualityDistance = qualityFactors[target.q] && qualityFactors[ref.q]
   ? Math.log(qualityFactors[target.q] / qualityFactors[ref.q]) : 0;
  const distance = Math.abs(resolutionDistance) + Math.abs(powerDistance) + Math.abs(qualityDistance);
  const score = distance + (ref.profile === target.profile ? 0 : .3)
   + (!ref.r || !ref.w ? .5 : 0);
  const factor = Math.exp(.9 * resolutionDistance + .45 * powerDistance + qualityDistance);
  const margin = Math.min(.5,.18 + .12 * distance + (changedScale ? .08 : 0));
  const cap = ref.cap ?? Infinity;
  candidates.push({
   low:Math.min(cap,Math.max(1,Math.floor(ref.low * factor * (1-margin)))),
   high:Math.min(cap,Math.max(1,Math.ceil(ref.high * factor * (1+margin)))),
   ref, score, changedScale
  });
 }
 return candidates.reduce((best, candidate) => !best || candidate.score < best.score ? candidate : best, null);
}

// Cuartiles de las referencias del catálogo, normalizadas a 1080p y 20 W.
// Se usan exclusivamente cuando el juego carece de una cifra aprovechable.

export function aproximar(refs, target, baseline) {
 const quality = qualityFactors[target.q] ?? qualityFactors[baseline.q] ?? 1;
 const catalogue = {...catalogBaseline,r:1080,w:20,q:'medium',gen:'?',scale:'guide',
  text:'Horquilla típica del catálogo de Ally Lab a 1080p y 20 W.'};
 const usable = refs.filter(ref=>Number.isFinite(ref.low)&&ref.low>0&&ref.high>=ref.low);
 const candidates = (usable.length ? usable : [catalogue]).map(ref=>{
  const sourceR=ref.r||baseline.r||1080, outputR=target.r||baseline.r||1080;
  const sourceW=ref.w||baseline.w||20, power=target.w||baseline.w||20;
  const sourceQ=qualityFactors[ref.q]??qualityFactors[baseline.q]??1;
  const sourceScale=ref.scale??baseline.scale;
  const sourceRender=renderHeight({r:sourceR,scale:sourceScale});
  const targetRender=renderHeight({r:outputR,scale:target.scale});
  const changedScale=sourceScale!==target.scale&&Boolean(sourceRender&&targetRender);
  const resolutionFactor=changedScale?sourceRender/targetRender:sourceR/outputR;
  const referenceFG=ref.gen??baseline.gen;
  const generation=state=>state==='on'?1.5:1;
  const fgFactor=target.gen==='?'?1:generation(target.gen)/generation(referenceFG);
  const factor=resolutionFactor**.9*(power/sourceW)**.45*(quality/sourceQ)*fgFactor;
  const distance=Math.abs(Math.log(resolutionFactor))+Math.abs(Math.log(power/sourceW));
  const score=distance+(ref.profile===target.profile?0:.4)+(referenceFG===target.gen?0:.65)
   +(ref.r&&ref.w?0:.3)+(ref.limit==='>'?.3:0);
  const margin=Math.min(.58,.27+distance*.1+(referenceFG!==target.gen?.08:0));
  const high=ref.limit==='>'?ref.high*1.2:ref.high;
  return {low:Math.max(1,Math.floor(ref.low*factor*(1-margin))),
   high:Math.max(1,Math.ceil(high*factor*(1+margin))),ref,score,changedScale,
   approximate:true, catalogue:ref===catalogue};
 });
 return candidates.reduce((a,b)=>a.score<=b.score?a:b);
}
