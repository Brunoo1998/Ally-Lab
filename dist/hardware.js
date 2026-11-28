export const hardwareModels=[['xbox-x','Xbox ROG Ally X'],['xbox','Xbox ROG Ally'],['ally-x-2024','ROG Ally X (2024)'],['z1e','ROG Ally Z1 Extreme'],['z1','ROG Ally Z1'],['other','Otro / sin identificar']];
export function modelKey(name){
 const v=String(name||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 if(v.includes('xbox')&&(/\bally x\b/.test(v)||/\bz2 extreme\b/.test(v)))return 'xbox-x';
 if(v.includes('xbox')&&v.includes('ally'))return 'xbox';
 if(/\bally x\b/.test(v)&&(/\b2024\b/.test(v)||/\bz1 extreme\b/.test(v)))return 'ally-x-2024';
 if(/\bz1 extreme\b/.test(v)&&!/\bally x\b/.test(v))return 'z1e';
 if(/\bz1\b/.test(v)&&!/\bextreme\b/.test(v)&&!/\bally x\b/.test(v))return 'z1';
 return 'other';
}
export const modelLabel=key=>hardwareModels.find(([id])=>id===key)?.[1]||hardwareModels[0][1];
export function hardwareChoice(){try{const key=localStorage.getItem('ally-lab:hardware');return hardwareModels.some(([id])=>id===key)?key:'xbox-x';}catch{return 'xbox-x';}}
export function saveHardware(key){try{localStorage.setItem('ally-lab:hardware',key);}catch{}}
