import { isBlockedLink } from "./retro-403.js?v=79";

const consoles = document.getElementById('masiva-consoles');
const details = document.getElementById('details');
const title = document.getElementById('masiva-title');
let selected;
const cache = new Map();
const query = document.getElementById('masiva-search');
const status = document.getElementById('masiva-status');
const results = document.getElementById('masiva-games');
const pager = document.getElementById('masiva-pager');
const previous = document.getElementById('masiva-prev');
const next = document.getElementById('masiva-next');
const limit = 48;
let games = [];
let page = 0;
let request;
const additionalCoverBase = "https://images.launchbox-app.com/";

async function recoverCover(image) {
  if (image.src.startsWith('https://raw.githubusercontent.com/')) {
    try {
      const response = await fetch(image.src);
      if (response.ok && response.headers.get('content-type')?.startsWith('text/plain')) {
        const filename = (await response.text()).trim();
        if (/^[^/\\\r\n]+\.png$/i.test(filename)) {
          const target = new URL(encodeURIComponent(filename), image.src).href;
          if (target !== image.src) {
            image.addEventListener('error', () => image.remove(), {once:true});
            image.src = target;
            return;
          }
        }
      }
    } catch {
      // Keep showing the fallback when the artwork source is unavailable.
    }
  }
  image.remove();
}

function render() {
  const term = query.value.trim().toLocaleLowerCase('es');
  const matches = games.filter(game => game.n.toLocaleLowerCase('es').includes(term));
  const pages = Math.ceil(matches.length / limit);
  results.replaceChildren();
  for (const game of matches.slice(page * limit, (page + 1) * limit)) {
    const row = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = game.n;
    const cover = document.createElement('span');
    cover.className = 'retro-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = 'Sin carátula';
    const info = document.createElement('div');
    info.className = 'retro-game-info';
    info.append(title);
    if (game.cover) {
      const image = document.createElement('img');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => recoverCover(image), {once:true});
      if (game.approximateCover) {
        image.addEventListener('load', () => {
          const label = document.createElement('small');
          label.className = 'retro-cover-label';
          label.textContent = 'Carátula aproximada';
          title.append(label);
        }, {once:true});
      }
      image.src = game.cover;
      cover.append(image);
    }
    row.append(cover, info);
    for (const [index, {u}] of game.urls.entries()) {
      const link = document.createElement('a');
      link.href = u;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = game.urls.length === 1 ? 'Abrir enlace' : 'Abrir enlace ' + (index + 1);
      link.setAttribute('aria-label', link.textContent + ' de ' + game.n);
      info.append(link);
    }
    results.append(row);
  }
  pager.hidden = pages < 2;
  previous.disabled = page === 0;
  next.disabled = page + 1 >= pages;
  status.textContent = pages ? `${matches.length.toLocaleString('es-ES')} entradas · Página ${page + 1} de ${pages}` : 'No hay resultados.';
}

async function loadCoverIndex(key, signal) {
  try {
    const response = await fetch('./datos/retro-caratulas/' + key + '.json.gz?v=81', {signal});
    if (!response.ok) return ['', {}];
    const data = new Uint8Array(await response.arrayBuffer());
    if (data[0] !== 31 || data[1] !== 139) return JSON.parse(new TextDecoder().decode(data));
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).json();
  } catch {
    return ['', {}];
  }
}

async function loadConsole(key) {
  request?.abort();
  const current = new AbortController();
  request = current;
  games = [];
  page = 0;
  query.value = '';
  query.disabled = true;
  results.replaceChildren();
  pager.hidden = true;
  status.textContent = 'Cargando juegos…';
  if (cache.has(key)) {
    games = cache.get(key);
    query.disabled = false;
    render();
    return;
  }
  try {
    const coverIndex = loadCoverIndex(key, current.signal);
    const response = await fetch('https://raw.githubusercontent.com/Arley4d/DescargaMasiva/main/' + key + '.jsonl', {signal: current.signal});
    if (!response.ok) throw new Error('Catálogo no disponible');
    const [data, [coverBase, covers, extraCovers = {}]] = await Promise.all([response.text(), coverIndex]);
    if (request !== current) return;
    for (const line of data.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      if (record.type !== 'file' || typeof record.n !== 'string' || !Array.isArray(record.urls)) continue;
      const urls = record.urls.filter(entry => typeof entry?.u === 'string' && /^https?:\/\//i.test(entry.u));
      if (!urls.length) continue;
      const image = Object.hasOwn(covers, record.n) ? covers[record.n] : '';
      const [extraImage, approximateCover] = Object.hasOwn(extraCovers, record.n) ? extraCovers[record.n] : [];
      const cover = image ? (coverBase ? coverBase + encodeURIComponent(image) : image)
        : extraImage ? additionalCoverBase + encodeURIComponent(extraImage) : '';
      games.push({n: record.n, cover, approximateCover, urls: urls.filter(({u}) => !isBlockedLink(u))});
    }
    games.sort((a, b) => a.n.localeCompare(b.n, 'es', {numeric: true}));
    cache.set(key, games);
    query.disabled = false;
    render();
  } catch {
    if (request === current && !current.signal.aborted) status.textContent = 'No se pudo cargar la lista. Vuelve a las consolas y abre de nuevo esta lista.';
  }
}

function route() {
  const key = location.hash.startsWith('#consola/') ? location.hash.slice(9) : '';
  const card = document.getElementById('console-' + key);
  consoles.hidden = Boolean(card);
  details.hidden = !card;
  if (!card) {
    request?.abort();
    request = undefined;
    selected?.focus();
    selected = undefined;
    return;
  }
  selected = card;
  title.textContent = card.querySelector('strong').textContent;
  details.querySelector('a').focus();
  loadConsole(key);
}

window.addEventListener('hashchange', route);
route();
query.addEventListener('input', () => { page = 0; render(); });
for (const [button, offset] of [[previous, -1], [next, 1]]) {
  button.addEventListener('click', () => {
    page += offset;
    render();
    (offset > 0 ? (next.disabled ? previous : next) : (previous.disabled ? next : previous)).focus();
  });
}
