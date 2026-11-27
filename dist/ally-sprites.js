const poses = {
  idle: [0,[0,1,2,3,4,5,0],145],
  blink: [0,[0,2,3,4,0],130],
  walk: [1,[0,1,3,4,5,7],145],
  run: [2,[0,1,2,3,4,5,6,7],95],
  wave: [3,[0,1,2,3,2,3,1,0],130],
  jump: [4,[0,1,2,3,4],115],
  confused: [5,[0,1,2,5,6,7,0],125],
  celebrate: [6,[0,1,2,3,4,2,1,0],115],
  reply: [7,[0,1,2,3,4,5,0],125],
  think: [8,[1,2,3,3,4,5],185],
  lookRight: [9,[0,1,2,3,4,3,2,1,0],100],
  lookLeft: [10,[0,1,2,3,4,3,2,1,0],100],
  sleep: [5,[1,2,3,4,4,5,6],190]
};

export function createAllySprite() {
  const node = document.createElement('span');
  node.className = 'ally-sprite';
  node.setAttribute('aria-hidden','true');
  let timer;
  function stop() {
    clearTimeout(timer);
    node.classList.remove('ally-sprite-active');
  }
  function play(name, loop=false) {
    stop();
    if (!poses[name] || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [row, frames, delay] = poses[name];
    let index = 0;
    const frame = () => {
      node.style.setProperty('--ally-frame-x', (frames[index] / 7 * 100)+'%');
      node.style.setProperty('--ally-frame-y', (row * 10)+'%');
      if (++index < frames.length) timer=setTimeout(frame,delay);
      else if (loop) { index=0; timer=setTimeout(frame,delay+330); }
    };
    node.classList.add('ally-sprite-active');
    frame();
  }
  return {node,play,stop};
}
