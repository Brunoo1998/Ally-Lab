const delay=20_000, spacing=300_000, dismissal=86_400_000;
const keys={count:'ally-mascot-count',last:'ally-mascot-last',dismissed:'ally-mascot-dismissed'};
const editable='input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

export function mountMascot(root, trigger) {
  const memory={};
  function read(key) {
    try {
      const storage=key===keys.count?sessionStorage:localStorage;
      return Number(storage.getItem(key))||memory[key]||0;
    } catch { return memory[key]||0; }
  }
  function write(key,value) {
    memory[key]=value;
    try {
      const storage=key===keys.count?sessionStorage:localStorage;
      storage.setItem(key,String(value));
    } catch { /* Keep the limits for this page if storage is unavailable. */ }
  }
  const peek=document.createElement('div');
  peek.className='ally-mascot';
  peek.hidden=true;
  const hello=document.createElement('button');
  hello.type='button';
  hello.className='ally-mascot-hello';
  hello.setAttribute('aria-label','¡Hola! ¿Necesitas ayuda? Abrir Ally AI');
  const robot=document.createElement('img');
  robot.src='/assets/ally-robot.svg';
  robot.alt='';
  robot.width=52;
  robot.height=52;
  const message=document.createElement('span');
  message.textContent='¡Hola! ¿Necesitas ayuda?';
  hello.append(robot,message);
  const close=document.createElement('button');
  close.type='button';
  close.className='ally-mascot-dismiss';
  close.textContent='×';
  close.setAttribute('aria-label','Ocultar el saludo durante 24 horas');
  peek.append(hello,close);
  root.insertBefore(peek,trigger);

  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let earliest=Date.now()+delay;
  let timer, exit;
  function hide(animated=false) {
    clearTimeout(exit);
    if(animated&&!motion.matches&&!peek.hidden){
      peek.classList.add('ally-mascot-leaving');
      exit=setTimeout(()=>hide(),260);
      return;
    }
    const wasVisible=!peek.hidden;
    peek.hidden=true;
    peek.classList.remove('ally-mascot-leaving');
    if(wasVisible)root.dispatchEvent(new Event('ally-mascot-greeting-end'));
  }
  function schedule() {
    clearTimeout(timer);
    if(document.hidden||trigger.hidden||motion.matches||read(keys.count)>=2||
       document.activeElement?.closest(editable))return;
    const now=Date.now();
    const next=Math.max(earliest,read(keys.last)+spacing,read(keys.dismissed)+dismissal);
    if(next>now){
      timer=setTimeout(schedule,next-now);
      return;
    }
    write(keys.count,read(keys.count)+1);
    write(keys.last,now);
    peek.hidden=false;
    // Señal síncrona: la entrada del saludo comparte fotograma con brillo y latido.
    root.dispatchEvent(new Event('ally-mascot-greeting-start'));
    exit=setTimeout(()=>hide(true),4000);
    timer=setTimeout(schedule,spacing);
  }
  function pause() {
    earliest=Date.now()+delay;
    hide();
    schedule();
  }
  hello.addEventListener('click',()=>trigger.click());
  close.addEventListener('click',()=>{
    write(keys.dismissed,Date.now());
    pause();
    trigger.focus({preventScroll:true});
  });
  trigger.addEventListener('click',pause);
  new MutationObserver(pause).observe(trigger,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',pause);
  document.addEventListener('focusin',event=>{if(event.target.closest?.(editable))pause();});
  document.addEventListener('focusout',event=>{
    if(event.target.closest?.(editable))queueMicrotask(pause);
  });
  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('form, '+editable))pause();
  },{passive:true});
  motion.addEventListener('change',pause);
  window.addEventListener('storage',event=>{
    if(event.key===keys.dismissed||event.key===keys.last)pause();
  });
  schedule();
  return peek;
}
