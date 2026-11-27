import {fold} from './ally-data.js';

const fields={
  fps:/\b([1-9]\d{1,2})\s*fps\b/,
  watts:/\b([7-9]|[12]\d|3[0-5])\s*(?:w|vatios?)\b/,
  resolution:/\b(720|900|1080)p\b/
};

export function conversation(question, input) {
  const normalized=fold(question);
  const settings={};
  for(const [key, pattern] of Object.entries(fields)){
    const previous=input?.settings?.[key];
    const suffix={fps:' fps',watts:' w',resolution:'p'}[key];
    if(Number.isInteger(previous)&&pattern.test(previous+suffix))settings[key]=previous;
    const current=normalized.match(pattern);
    if(current)settings[key]=Number(current[1]);
  }
  const power=/\b(?:sin (?:tenerla |estar )?enchufad[ao]|sin cargador|bateria|desenchufad[ao])\b/.test(normalized)?'battery':
    /\b(?:con cargador|enchufad[ao]|corriente)\b/.test(normalized)?'plugged':null;
  settings.power=power||(['battery','plugged'].includes(input?.settings?.power)?input.settings.power:null);
  const explicitChange=/\b(?:baj[oa] (?:la )?resolucion|menor resolucion)\b/.test(normalized);
  const relative=explicitChange&&!normalized.match(fields.resolution);
  if(relative&&settings.resolution>720)settings.resolution=settings.resolution===1080?900:720;
  const constraints=Object.entries(settings).flatMap(([key,value])=>{
    if(key==='power'||!value)return [];
    return [value+{fps:' fps',watts:' w',resolution:'p'}[key]];
  }).join(' ');
  return {settings,power,relative,constraints};
}
