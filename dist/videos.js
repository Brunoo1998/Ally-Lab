let catalog;
let playerLibrary;
let cleanupPlayer;

export function unmountGameVideo() {
  cleanupPlayer?.();
  cleanupPlayer = undefined;
}

function make(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}

function loadHls() {
  playerLibrary ??= new Promise((resolve, reject) => {
    const script = make('script');
    script.src = new URL('./assets/vendor/hls-1.6.15.light.min.js', import.meta.url);
    script.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('HLS'));
    script.onerror = reject;
    document.head.append(script);
  }).catch(error => {
    playerLibrary = undefined;
    throw error;
  });
  return playerLibrary;
}

export async function gameVideo(game, loadCatalog) {
  catalog ??= loadCatalog().catch(() => {
    catalog = undefined;
    return {};
  });
  return (await catalog)[game.id];
}

export async function playGameVideo(container, game, media) {
  unmountGameVideo();
  const title = (media.kind === 'gameplay' ? 'Gameplay' : 'Tráiler') + ' de ' + game.title;
  const frame = make('div');
  frame.className = 'game-video-frame';
  const source = make('a', media.type === 'youtube' ? 'Abrir en YouTube' : 'Abrir en Steam');
  source.href = media.type === 'youtube' ? 'https://www.youtube.com/watch?v=' + media.id : media.source;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.className = 'game-video-source';
  container.replaceChildren(frame, source);
  let playerEngine;
  function clear() {
    playerEngine?.destroy();
    playerEngine = undefined;
    frame.replaceChildren();
  }
  cleanupPlayer = clear;
  if (media.type === 'youtube') {
    const iframe = make('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + media.id + '?autoplay=1&playsinline=1';
    iframe.title = title;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.append(iframe);
    iframe.focus({preventScroll:true});
    return;
  }

  const video = make('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.autoplay = true;
  video.setAttribute('aria-label', title);
  frame.append(video);
  video.tabIndex = 0;
  video.focus({preventScroll:true});
  function showError() {
    if (!video.isConnected) return;
    clear();
    frame.append(make('p', 'El vídeo no se ha podido cargar. Puedes abrirlo en Steam.'));
  }
  video.addEventListener('error', showError, { once:true });
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = media.url;
    return;
  }
  try {
    const Hls = await loadHls();
    if (!video.isConnected) return;
    if (!Hls.isSupported()) {
      showError();
      return;
    }
    playerEngine = new Hls({ enableWorker:false, capLevelToPlayerSize:true });
    playerEngine.on(Hls.Events.ERROR, (_, error) => {
      if (error.fatal) showError();
    });
    playerEngine.attachMedia(video);
    playerEngine.loadSource(media.url);
  } catch {
    showError();
  }
}
