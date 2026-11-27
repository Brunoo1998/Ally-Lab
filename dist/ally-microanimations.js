const preference='ally-mascot-decorative-motion';
const editable='input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';
const effects=['peek','play','blink','energy'];
const minDelay=30_000, maxDelay=45_000, sequenceMs=1600;
const randomDelay=()=>minDelay+Math.floor(Math.random()*(maxDelay-minDelay+1));

export function mountMicroanimations(root,trigger,greeting,controls) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mouse=matchMedia('(hover: hover) and (pointer: fine)');
  const robot=document.createElement('button');
  robot.type='button';
  robot.className='ally-micro-robot';
  robot.hidden=true;
  robot.setAttribute('aria-label','Abrir Ally AI');
  const image=document.createElement('img');
  image.src='/assets/ally-robot.svg';
  image.alt='';
  image.width=56;
  image.height=56;
  robot.append(image);
  root.insertBefore(robot,trigger);

  const label=document.createElement('label');
  label.className='ally-micro-setting';
  const toggle=document.createElement('input');
  toggle.type='checkbox';
  label.append(toggle,' Animaciones de la mascota');
  controls.append(label);
  function enabled() {
    try { return localStorage.getItem(preference)!=='off'; }
    catch { return true; }
  }
  toggle.checked=enabled();

  let due=Date.now()+randomDelay(), cursorAfter=Date.now()+minDelay;
  let timer, finish, effect='';
  function eligible() {
    return toggle.checked&&!reduced.matches&&!document.hidden&&!trigger.hidden&&greeting.hidden&&
      !document.activeElement?.closest(editable);
  }
  function stop() {
    clearTimeout(finish);
    robot.hidden=true;
    root.removeAttribute('data-mascot-effect');
    root.removeAttribute('data-mascot-sequence');
    robot.style.removeProperty('--ally-gaze');
    effect='';
  }
  function queue() {
    clearTimeout(timer);
    if(!eligible())return;
    const wait=due-Date.now();
    timer=setTimeout(tick,Math.max(0,wait));
  }
  function play(name) {
    if(effect||!eligible())return false;
    effect=name;
    // Una sola señal en el mismo fotograma inicia robot, borde y latido.
    root.dataset.mascotEffect=name;
    root.dataset.mascotSequence='micro';
    robot.hidden=false;
    due=Date.now()+randomDelay();
    cursorAfter=Date.now()+minDelay;
    finish=setTimeout(stop,sequenceMs);
    queue();
    return true;
  }
  function tick() {
    if(!eligible())return;
    if(Date.now()<due){queue();return;}
    if(!play(effects[Math.floor(Math.random()*effects.length)]))queue();
  }
  function startGreetingSequence() {
    // El saludo se muestra desde ally-mascot.js y emite el inicio en el mismo turno.
    stop();
    if(toggle.checked&&!reduced.matches&&!document.hidden&&!trigger.hidden&&
       !document.activeElement?.closest(editable)){
      root.dataset.mascotSequence='greeting';
      finish=setTimeout(()=>{
        if(root.dataset.mascotSequence==='greeting')root.removeAttribute('data-mascot-sequence');
      },sequenceMs);
    }
    // No disparar otra microanimación inmediatamente después de un saludo.
    due=Math.max(due,Date.now()+minDelay);
    queue();
  }
  function stateChanged() {
    const paused=!toggle.checked||reduced.matches||document.hidden||trigger.hidden||
      !!document.activeElement?.closest(editable);
    if(paused||(!greeting.hidden&&effect)||(greeting.hidden&&root.dataset.mascotSequence==='greeting'))stop();
    queue();
  }
  robot.addEventListener('click',()=>trigger.click());
  trigger.addEventListener('pointerenter',event=>{
    if(mouse.matches&&event.pointerType==='mouse'&&Date.now()>=cursorAfter)play('cursor');
  });
  root.addEventListener('pointermove',event=>{
    if(effect!=='cursor'||event.pointerType!=='mouse')return;
    const box=trigger.getBoundingClientRect();
    const gaze=Math.max(-7,Math.min(7,(event.clientX-box.left-box.width/2)/10));
    robot.style.setProperty('--ally-gaze',gaze+'deg');
  });
  toggle.addEventListener('change',()=>{
    try { localStorage.setItem(preference,toggle.checked?'on':'off'); } catch {}
    stateChanged();
  });
  window.addEventListener('storage',event=>{
    if(event.key===preference){toggle.checked=enabled();stateChanged();}
  });
  root.addEventListener('ally-mascot-greeting-start',startGreetingSequence);
  root.addEventListener('ally-mascot-greeting-end',()=>{
    if(root.dataset.mascotSequence==='greeting')stop();
    queue();
  });
  const observer=new MutationObserver(stateChanged);
  observer.observe(trigger,{attributes:true,attributeFilter:['hidden']});
  observer.observe(greeting,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',stateChanged);
  document.addEventListener('focusin',stateChanged);
  document.addEventListener('focusout',()=>queueMicrotask(stateChanged));
  reduced.addEventListener('change',stateChanged);
  queue();
}
