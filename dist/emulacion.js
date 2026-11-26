const byId = id => document.getElementById(id);
const search = byId('emu-search');
const results = byId('emu-results');
const heading = byId('emu-results-title');
const detail = byId('details');
const pageSize = 12;
const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
const searchKeys = byId('emu-keys');
let catalog, system = '', page = 1, lastCard;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function artwork(url) {
  const img = element('img');
  img.loading = 'lazy';
  img.alt = '';
  img.src = url;
  return img;
}

function showResults() {
  const query = normalize(search.value.trim());
  results.hidden = !system && !query;
  if (results.hidden) return;
  const matches = catalog.games.filter(game => {
    const name = catalog.systems[game.system].name;
    return (query || system === game.system) &&
      (!query || normalize(game.title + ' ' + name).includes(query));
  });
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, pages);
  heading.textContent = query ? 'Resultados de búsqueda' : catalog.systems[system].name;
  byId('emu-count').textContent = matches.length ? `${matches.length} ${matches.length === 1 ? "juego" : "juegos"}` : "No se encontraron juegos.";
  byId('emu-games').replaceChildren(...matches.slice((page - 1) * pageSize, page * pageSize).map(game => {
    const link = element('a', '', 'card emu-card');
    link.href = '#juego/' + game.id;
    link.id = 'emu-game-' + game.id;
    link.append(artwork(game.cover), element('strong', game.title),
      element('span', catalog.systems[game.system].name + ' · ' + game.edition));
    link.addEventListener('click', () => { lastCard = link.id; });
    return link;
  }));
  byId('emu-pages').hidden = pages === 1;
  byId('emu-prev').disabled = page === 1;
  byId('emu-next').disabled = page === pages;
  byId('emu-page').textContent = page + ' / ' + pages;
}

function renderRoute() {
  const id = location.hash.startsWith('#juego/') ? location.hash.slice(7) : '';
  const game = catalog.games.find(entry => entry.id === id);
  const wasOpen = !detail.hidden;
  detail.hidden = !game;
  byId('emu-browser').hidden = Boolean(game);
  if (!game) {
    if (wasOpen) (byId(lastCard) || search).focus();
    return;
  }
  const platform = catalog.systems[game.system];
  const facts = element('dl');
  for (const [title, value] of Object.entries({
    Consola: platform.name, Edición: game.edition, Idioma: game.language,
    Tamaño: game.size, Formato: game.format, Emulador: platform.emulator
  })) {
    const pair = element('div');
    pair.append(element('dt', title), element('dd', value));
    facts.append(pair);
  }
  const download = element('a', 'Descarga oficial del autor', 'btn');
  download.href = game.download;
  const emulator = element('a', 'Descargar mGBA para Windows', 'btn');
  emulator.href = platform.emulatorUrl;
  byId('emu-detail').replaceChildren(element('h1', game.title), artwork(game.cover), facts,
    element('h2', 'Xbox ROG Ally X · Ryzen AI Z2 Extreme'),
    element('p', platform.setup), element('p', game.setup), download, emulator);
  detail.querySelector('a').focus();
  window.scrollTo(0, 0);
}

async function start() {
  const response = await fetch('./datos/emulacion.json');
  if (!response.ok) throw new Error('No se pudo cargar el catálogo');
  catalog = await response.json();
  for (const [id, platform] of Object.entries(catalog.systems)) {
    const button = element('button', '', 'btn emu-card');
    button.type = 'button';
    button.append(artwork(platform.image), element('strong', platform.name));
    button.addEventListener('click', () => {
      system = id;
      search.value = '';
      page = 1;
      showResults();
      heading.focus();
    });
    byId('emu-consoles').append(button);
  }
  const updateSearch = () => { page = 1; showResults(); };
  search.addEventListener('input', updateSearch);
  const keys = searchKeys.querySelector('.emu-keys');
  for (const key of [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789', 'Espacio', 'Borrar']) {
    const button = element('button', key, 'btn');
    button.type = 'button';
    button.addEventListener('click', () => {
      if (key === 'Borrar') search.value = Array.from(search.value).slice(0, -1).join('');
      else search.value += key === 'Espacio' ? ' ' : key;
      updateSearch();
    });
    keys.append(button);
  }
  byId('emu-reset').addEventListener('click', () => {
    system = ''; search.value = ''; page = 1; showResults(); search.focus();
  });
  for (const [id, offset] of [['emu-prev', -1], ['emu-next', 1]]) {
    byId(id).addEventListener('click', () => { page += offset; showResults(); heading.focus(); });
  }
  window.addEventListener('hashchange', renderRoute);
  byId('emu-status').hidden = true;
  renderRoute();
}
start().catch(() => {
  byId('emu-status').textContent = 'No se pudo cargar el catálogo. Recarga la página para reintentar.';
});
