export function parseRetro(text){
 const titles=new Set();let malformed=0;
 for(const line of text.split(/\r?\n/)){
   if(!line.trim())continue;
   let r;try{r=JSON.parse(line);}catch{malformed++;continue;}
   if(r.type==='file'&&typeof r.n==='string'&&r.n.trim()&&Array.isArray(r.urls)&&r.urls.some(e=>typeof e?.u==='string'&&/^https?:\/\//i.test(e.u)))titles.add(r.n);
 }
 if(malformed||!titles.size)throw Error('Catálogo incompleto o inválido');
 return [...titles].sort((a,b)=>a.localeCompare(b,'es'));
}
