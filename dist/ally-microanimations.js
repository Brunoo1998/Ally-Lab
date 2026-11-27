const preference='ally-mascot-decorative-motion';
const editable='input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';
const effects=['peek','play','blink','energy'];
const quiet=2400;
const randomDelay=()=>90_000+Math.floor(Math.random()*90_001);

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

  let due=Date.now()+randomDelay(), cursorAfter=Date.now()+90_000;
  let lastActivity=Date.now(), timer, finish, effect='';
  function eligible() {
    return toggle.checked&&!reduced.matches&&!document.hidden&&!trigger.hidden&&greeting.hidden&&
      !document.activeElement?.closest(editable);
  }
  function stop() {
    clearTimeout(finish);
    robot.hidden=true;
    root.removeAttribute('data-mascot-effect');
    robot.style.removeProperty('--ally-gaze');
    effect='';
  }
  function queue() {
    clearTimeout(timer);
    if(!eligible())return;
    const wait=Math.max(due,lastActivity+quiet)-Date.now();
    timer=setTimeout(tick,Math.max(0,wait));
  }
  function play(name) {
    if(effect||!eligible()||Date.now()-lastActivity<quiet)return false;
    effect=name;
    root.dataset.mascotEffect=name;
    robot.hidden=name==='energy';
    due=Date.now()+randomDelay();
    cursorAfter=Date.now()+90_000;
    finish=setTimeout(stop,1600);
    queue();
    return true;
  }
  function tick() {
    if(!eligible())return;
    if(Date.now()<Math.max(due,lastActivity+quiet)){queue();return;}
    if(!play(effects[Math.floor(Math.random()*effects.length)]))queue();
  }
  function activity(event) {
    if(event?.target===robot||robot.contains(event?.target||null))return;
    lastActivity=Date.now();
    stop();
    queue();
  }
  function stateChanged() {
    if(!eligible())stop();
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
  const observer=new MutationObserver(stateChanged);
  observer.observe(trigger,{attributes:true,attributeFilter:['hidden']});
  observer.observe(greeting,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',activity);
  document.addEventListener('pointerdown',activity,{passive:true});
  document.addEventListener('scroll',activity,{capture:true,passive:true});
  document.addEventListener('keydown',activity);
  document.addEventListener('focusin',stateChanged);
  document.addEventListener('focusout',()=>queueMicrotask(stateChanged));
  reduced.addEventListener('change',stateChanged);
  queue();
}
