const svgNS='http://www.w3.org/2000/svg';
export const formatNumber=new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});

export function formatFPS(result){
 if(!result)return 'Sin datos';
 const n=formatNumber.format(result.low);
 if(result.limit==='>')return '>'+n;
 if(result.high!==result.low)return n+'–'+formatNumber.format(result.high);
 return (result.limit==='≈'||result.type==='Interpolación'?'≈':'')+n;
}

export function add(parent,tag,text,className){
 const node=document.createElement(tag);
 if(text!=null)node.textContent=text;
 if(className)node.className=className;
 parent.append(node);
 return node;
}

export function button(parent,text,className,action){
 const node=add(parent,'button',text,className);
 node.type='button';
 node.onclick=action;
 return node;
}

function graphic(parent,tag,attributes){
 const node=document.createElementNS(svgNS,tag);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
 parent.append(node);
 return node;
}

export function renderLine(host,caption,series,metric,axisLabel,active){
 host.replaceChildren();
 const available=series.filter(({value})=>value);
 caption.textContent='';
 if(!available.length){
  add(host,'p','Datos insuficientes para trazar esta variación con los ajustes seleccionados.','fps-empty');
 }else{
  const max=Math.ceil(Math.max(60,...available.map(({value})=>value.high??value.low))/30)*30;
  const division=Math.max(30,Math.ceil(max/120)*30);
  const box=add(host,'div',null,'fps-plot');
  const svg=graphic(box,'svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none','aria-hidden':'true'});
  const numeric=typeof series[0].id==='number';
  const first=numeric?series[0].id:0,last=numeric?series[series.length-1].id:series.length-1;
  const x=i=>first===last?50:4+((numeric?series[i].id:i)-first)*92/(last-first);
  const y=n=>96-n*92/max;
  const grid=new Set([0,30,60,max]);
  for(let n=division;n<max;n+=division)grid.add(n);
  for(const n of [...grid].sort((a,b)=>a-b)){
   graphic(svg,'line',{x1:0,x2:100,y1:y(n),y2:y(n),class:n===30||n===60?'fps-target':'fps-gridline'});
   const tick=add(box,'span',String(n),'fps-axis-y');
   tick.style.top=y(n)+'%';
  }
  for(let i=1;i<series.length;i++){
   const before=series[i-1].value,after=series[i].value;
   if(!before||!after||before.limit||after.limit)continue;
   const start=x(i-1),end=x(i);
   const y0=y(before.center),y1=y(after.center),mid=(start+end)/2;
   const curve='M '+start+' '+y0+' C '+mid+' '+y0+', '+mid+' '+y1+', '+end+' '+y1;
   graphic(svg,'path',{d:curve,class:before.confidence==='Alta'&&after.confidence==='Alta'?'fps-curve':'fps-curve fps-modelled'});
  }
  const focusPoint=(point,item)=>{
   for(const node of box.querySelectorAll('button'))node.setAttribute('aria-pressed',String(node===point));
   const {label,value}=item;
   caption.textContent=label+' · '+formatFPS(value)+' FPS · '+value.type+' · Confianza '+value.confidence.toLowerCase()+(value.why?' · '+value.why:'');
  };
  let selected;
  series.forEach((item,i)=>{
   const {label,value}=item, pos=x(i);
   const touchesMiddle=numeric&&i>0&&i<series.length-1&&(pos-x(i-1)<9||x(i+1)-pos<9);
   if(!touchesMiddle){
    const tick=add(box,'span',label,'fps-axis-x');
    tick.style.left=pos+'%';
   }
   if(!value)return;
   if(value.high!==null&&value.low!==value.high){
    graphic(svg,'line',{x1:pos,x2:pos,y1:y(value.low),y2:y(value.high),class:'fps-uncertainty'});
   }
   const point=button(box,null,'fps-point',()=>focusPoint(point,item));
   point.classList.add(value.type==='Medición publicada'?'is-measured':'is-modelled');
   point.style.left=pos+'%';
   point.style.top=y(value.center)+'%';
   point.setAttribute('aria-label',label+', '+formatFPS(value)+' FPS, '+value.type);
   point.onpointerenter=()=>focusPoint(point,item);
   point.onfocus=()=>focusPoint(point,item);
   if(!selected||item.id===active)selected=[point,item];
  });
  focusPoint(...selected);
  add(host,'p',axisLabel,'fps-axis-title');
 }
 const table=add(host,'details',null,'fps-values');
 add(table,'summary','Ver valores de '+metric.toLowerCase());
 const rows=add(table,'dl',null,'fps-value-list');
 for(const item of series){
  const row=add(rows,'div');
  add(row,'dt',item.label);
  add(row,'dd',item.value?formatFPS(item.value)+' FPS · '+item.value.type:'Datos insuficientes');
 }
}

export function renderBars(host,series){
 host.replaceChildren();
 const max=Math.max(60,...series.map(({value})=>value?.high??value?.low??0));
 for(const {label,value,missing,active} of series){
  const row=add(host,'div',null,'fps-bar'+(active?' is-active':''));
  add(row,'span',label);
  const track=add(row,'span',null,'fps-track');
  track.setAttribute('aria-hidden','true');
  if(value){
   const fill=add(track,'span',null,'fps-fill '+(value.type==='Medición publicada'?'is-measured':'is-modelled'));
   fill.style.width=(value.center/max*100)+'%';
   if(value.high!==null&&value.high!==value.low){
    const range=add(track,'span',null,'fps-range');
    range.style.left=value.low/max*100+'%';
    range.style.width=(value.high-value.low)/max*100+'%';
   }
  }
  add(row,'strong',value?formatFPS(value)+' FPS':missing||'Datos insuficientes');
 }
}
