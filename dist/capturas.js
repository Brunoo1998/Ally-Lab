import { gameVideo, playGameVideo, unmountGameVideo } from './videos.js?v=41';

let catalog;

export async function mountCaptures(section, game, loadCatalog, loadVideos) {
  catalog ??= loadCatalog().catch(() => {
    catalog = undefined;
    return {};
  });
  const [images, media] = await Promise.all([catalog, gameVideo(game, loadVideos)]);
  const captures = images[game.id] ?? [];
  if (!section.isConnected || (!media && !captures.length)) return;
  section.hidden = false;

  const stage = document.createElement('div');
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
    image.src = url;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = '';
    button.append(image);
    strip.append(button);
    return button;
  }

  let videoButton;
  function selectVideo() {
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    videoButton.setAttribute('aria-pressed', 'true');
    void playGameVideo(stage, game, media);
  }

  if (media) {
    const poster = media.type === 'youtube'
      ? 'https://i.ytimg.com/vi/' + media.id + '/mqdefault.jpg'
      : captures[0]?.[0] ?? game.cover;
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
    main.src = captures[index][1];
    buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  }

  section.append(stage, strip);
  if (captures.length) select(0);
}
