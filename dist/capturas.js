import { gameVideo, playGameVideo, unmountGameVideo } from './videos.js?v=41';

let catalog;

export async function mountCaptures(section, game, loadCatalog, loadVideos, {videoFirst=false}={}) {
  catalog ??= loadCatalog().catch(() => {
    catalog = undefined;
    return {};
  });
  const [images, media] = await Promise.all([catalog, gameVideo(game, loadVideos)]);
  const captures = images[game.id] ?? [];
  if (!section.isConnected || (!media && !captures.length)) return;
  section.hidden = false;

  const stage = document.createElement('div');
  stage.className = 'capture-stage';
  const main = document.createElement('img');
  main.className = 'capture-main';
  main.decoding = 'async';
  main.loading = 'lazy';
  const strip = document.createElement('div');
  strip.className = 'capture-strip';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', 'Seleccionar captura');

  function thumbnail(url, label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.addEventListener('click', action);
    const image = document.createElement('img');
    if(url)image.src = url;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = '';
    button.append(image);
    strip.append(button);
    return button;
  }

  let videoButton, videoPoster;
  function selectVideo() {
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    videoButton.setAttribute('aria-pressed', 'true');
    void playGameVideo(stage, game, media);
  }

  if (media) {
    const poster = media.type === 'youtube'
      ? 'https://i.ytimg.com/vi/' + media.id + '/mqdefault.jpg'
      : captures[0]?.[0] ?? game.cover;
    videoPoster = poster;
    const label = media.kind === 'gameplay' ? 'Reproducir gameplay' : 'Reproducir tráiler';
    videoButton = thumbnail(poster, label, selectVideo);
    videoButton.classList.add('capture-video');
    videoButton.setAttribute('aria-pressed', 'false');
    const icon = document.createElement('span');
    icon.className = 'capture-play';
    icon.textContent = '▶';
    icon.setAttribute('aria-hidden', 'true');
    videoButton.append(icon);
  }

  const buttons = captures.map(([url], index) =>
    thumbnail(url, 'Ver captura ' + (index + 1), () => select(index)));

  function select(index) {
    unmountGameVideo();
    videoButton?.setAttribute('aria-pressed', 'false');
    stage.replaceChildren(main);
    main.alt = 'Captura ' + (index + 1) + ' de ' + game.title;
    main.src = captures[index][1] || captures[index][0];
    buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  }

  function previewVideo(){
    const play = document.createElement('button');
    play.type='button';play.className='capture-preview-play';
    const label=media.kind==='gameplay'?'Reproducir gameplay':'Reproducir tráiler';
    play.setAttribute('aria-label',label+' de '+game.title);
    if(videoPoster){
      const poster=document.createElement('img');
      poster.className='capture-main';poster.alt='';poster.decoding='async';poster.loading='lazy';
      poster.src=media.type==='youtube'?'https://i.ytimg.com/vi/'+media.id+'/hqdefault.jpg':videoPoster;
      poster.addEventListener('error',()=>{if(poster.src!==new URL(videoPoster,location.href).href)poster.src=videoPoster;else poster.remove();});
      play.append(poster);
    }
    const overlay=document.createElement('span');overlay.className='capture-preview-label';
    overlay.textContent='▶  '+label;play.append(overlay);
    play.addEventListener('click',selectVideo);
    stage.replaceChildren(play);
    videoButton.setAttribute('aria-pressed','true');
    buttons.forEach(button=>button.setAttribute('aria-pressed','false'));
  }
  section.append(stage, strip);
  if(media&&(videoFirst||!captures.length))previewVideo();
  else if(captures.length)select(0);
}
