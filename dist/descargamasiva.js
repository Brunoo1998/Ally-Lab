const platform = document.getElementById('masiva-console');
const query = document.getElementById('masiva-search');
const status = document.getElementById('masiva-status');
const results = document.getElementById('masiva-games');
const pager = document.getElementById('masiva-pager');
const previous = document.getElementById('masiva-prev');
const next = document.getElementById('masiva-next');
const limit = 24;
let games = [];
let page = 0;
let request;

function render() {
  const term = query.value.trim().toLocaleLowerCase('es');
  const matches = games.filter(game => game.n.toLocaleLowerCase('es').includes(term));
  const pages = Math.ceil(matches.length / limit);
  results.replaceChildren();
  for (const game of matches.slice(page * limit, (page + 1) * limit)) {
    const row = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = game.n;
    row.append(title);
    for (const [index, {u}] of game.urls.entries()) {
      const link = document.createElement('a');
      link.href = u;
      link.textContent = game.urls.length === 1 ? 'Abrir enlace' : 'Abrir enlace ' + (index + 1);
      link.setAttribute('aria-label', link.textContent + ' de ' + game.n);
      row.append(link);
    }
    results.append(row);
  }
  pager.hidden = pages < 2;
  previous.disabled = page === 0;
  next.disabled = page + 1 >= pages;
  status.textContent = pages ? `${matches.length.toLocaleString('es-ES')} entradas · Página ${page + 1} de ${pages}` : 'No hay resultados.';
}

platform.addEventListener('change', async () => {
  request?.abort();
  const current = new AbortController();
  request = current;
  games = [];
  page = 0;
  query.value = '';
  query.disabled = true;
  results.replaceChildren();
  pager.hidden = true;
  status.textContent = '';
  const key = platform.value;
  if (!/^(nes|snes|n64|gb|gbc|gba|psx|ps2|dreamcast)$/.test(key)) return;
  status.textContent = 'Cargando juegos…';
  try {
    const response = await fetch('https://raw.githubusercontent.com/Arley4d/DescargaMasiva/main/' + key + '.jsonl', {signal: current.signal});
    if (!response.ok) throw new Error('Catálogo no disponible');
    const data = await response.text();
    if (request !== current) return;
    for (const line of data.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      if (record.type !== 'file' || typeof record.n !== 'string' || !Array.isArray(record.urls)) continue;
      const urls = record.urls.filter(entry => typeof entry?.u === 'string' && /^https?:\/\//i.test(entry.u));
      if (urls.length) games.push({n: record.n, urls});
    }
    query.disabled = false;
    render();
  } catch {
    if (request === current && !current.signal.aborted) status.textContent = 'No se pudo cargar la lista. Selecciona de nuevo la consola para reintentar.';
  }
});
query.addEventListener('input', () => { page = 0; render(); });
for (const [button, offset] of [[previous, -1], [next, 1]]) {
  button.addEventListener('click', () => {
    page += offset;
    render();
    (offset > 0 ? (next.disabled ? previous : next) : (previous.disabled ? next : previous)).focus();
  });
}
