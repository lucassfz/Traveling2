// Auditoria offline dos destinos salvos (js/saved.store.js).
import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { readFile } from 'node:fs/promises';
import { createSavedStore, normalizeSaved, normalizeSavedEntry } from '../js/saved.store.js';
import { resolveCity } from '../js/geo/cities.js';

const memoryStore = initial => {
  const memory = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    memory,
    io: {
      countries: COUNTRIES,
      read: (key, fallback) => (memory.has(key) ? JSON.parse(memory.get(key)) : fallback),
      write: (key, value) => { memory.set(key, JSON.stringify(value)); return true; }
    }
  };
};

// Entradas inválidas são descartadas; identificador precisa bater com o tipo.
assert.equal(normalizeSavedEntry({ id: 'country:Japan', type: 'city', countryKey: 'Japan', name: 'Japão' }), null);
assert.equal(normalizeSavedEntry({ id: 'country:Atlantis', type: 'country', countryKey: 'Atlantis', name: 'Atlântida' }, { countries: COUNTRIES }), null);
assert.equal(normalizeSavedEntry({ id: 'place:Q39231', type: 'place', countryKey: 'Japan', name: '' }), null);
assert.equal(normalizeSavedEntry({ id: 'place:Q39231', type: 'place', countryKey: 'Japan', name: 'Monte Fuji', image: 'https://exemplo.com/x.jpg' }).image, undefined, 'imagem só do Wikimedia');
assert.deepEqual(normalizeSaved('lixo'), { version: 1, items: [] });

// Migração da lista "Quero ir": países viram destinos salvos, chave antiga intacta.
const legacy = memoryStore({ 'traveling.wishlist': ['Japan', 'Atlantis', 'Portugal'] });
const migrated = createSavedStore(legacy.io);
assert.deepEqual(migrated.items.map(item => item.id), ['country:Japan', 'country:Portugal']);
assert.ok(legacy.memory.has('traveling.wishlist'), 'lista antiga preservada');
assert.equal(createSavedStore(legacy.io).items.length, 2, 'não migra de novo');

// Salvar, salvar de novo (sem duplicar), alternar e remover.
const { io, memory } = memoryStore({});
const store = createSavedStore(io);
let notified = 0;
store.subscribe(() => { notified += 1; });
const city = { id: 'city:BR-BA-porto-seguro', type: 'city', countryKey: 'Brazil', name: 'Porto Seguro', context: 'Bahia · Brasil', lat: -16.45, lng: -39.06 };
store.save(city);
store.save({ ...city, context: 'Bahia, Brasil' });
assert.equal(store.items.length, 1, 'mesmo destino não duplica');
assert.equal(store.get(city.id).context, 'Bahia, Brasil');
store.save({ id: 'place:Q39231', type: 'place', countryKey: 'Japan', name: 'Monte Fuji', context: 'Região de Chūbu · Japão' });
store.save({ id: 'country:Japan', type: 'country', countryKey: 'Japan', name: 'Japão' });
assert.deepEqual(store.items.map(item => item.id), ['country:Japan', 'place:Q39231', city.id], 'mais recentes primeiro');
assert.equal(store.toggle({ id: 'country:Japan', type: 'country', countryKey: 'Japan', name: 'Japão' }), false, 'alternar remove');
assert.equal(store.has('country:Japan'), false);
assert.equal(store.remove('place:Q39231'), true);
assert.equal(store.remove('place:Q39231'), false);
assert.equal(notified, 6);
assert.deepEqual(JSON.parse(memory.get('traveling.saved')).items.map(item => item.id), [city.id], 'persistido');
assert.equal(createSavedStore(io).items[0].name, 'Porto Seguro', 'sobrevive a recarregar');
assert.equal(memory.has('traveling.trips'), false, 'salvar não cria viagem');

// ---------- Cidade salva depois que data/admin for regenerado ----------
// O id "BR-174" é a posição no arquivo; resolveCity não pode confiar só nele.
{
  const city = (id, name, lat, lng, geonameId = null) => ({ id, name, lat, lng, geonameId, region: 'Bahia' });
  const list = [city('BR-1', 'Vera Cruz', -12.96, -38.6), city('BR-2', 'Vera Cruz', -16.1, -39.4), city('BR-3', 'Salvador', -12.97, -38.49, 3450554)];
  // Homônimo no mesmo estado: decide pelas coordenadas guardadas, não pelo id antigo.
  assert.equal(resolveCity(list, { id: 'BR-1', name: 'Vera Cruz', lat: -16.1, lng: -39.4 }).id, 'BR-2', 'id antigo aponta para o homônimo errado');
  // Id mudou para outra cidade: reencontra pelo nome e coordenadas.
  assert.equal(resolveCity(list, { id: 'BR-1', name: 'Salvador', lat: -12.975, lng: -38.491 }).id, 'BR-3');
  // geonameId tem prioridade sobre tudo.
  assert.equal(resolveCity(list, { id: 'BR-1', name: 'Salvador', geonameId: 3450554 }).id, 'BR-3');
  // Sem coordenadas, id que não confere e cidade removida: nada é adivinhado.
  assert.equal(resolveCity(list, { id: 'BR-1', name: 'Salvador' }), null, 'sem coordenadas não adivinha');
  assert.equal(resolveCity(list, { id: 'BR-9', name: 'Ilhéus', lat: -14.79, lng: -39.04 }), null, 'cidade que saiu do arquivo');
  assert.equal(resolveCity(list, { id: 'BR-1', name: 'Vera Cruz', lat: -20, lng: -40 }), null, 'mesmo nome longe demais');

  // Arquivo real: embaralha as cidades do Brasil (ids mudam) e confere que cada
  // cidade guardada com nome e coordenadas volta para a mesma cidade.
  const admin = JSON.parse(await readFile(new URL('../data/admin/BR.json', import.meta.url), 'utf8'));
  const rows = admin.cities.map(([name, lat, lng], index) => ({ id: `BR-${index}`, name, lat, lng, geonameId: null }));
  let seed = 7;
  const shuffled = rows.map(row => ({ row, key: (seed = (seed * 16807) % 2147483647) })).sort((a, b) => a.key - b.key)
    .map(({ row }, index) => ({ ...row, id: `BR-${index}` }));
  let wrong = 0;
  let ambiguous = 0;
  for (const original of rows) {
    const found = resolveCity(shuffled, { id: original.id, name: original.name, lat: original.lat, lng: original.lng });
    if (!found) ambiguous += 1;
    else if (found.lat !== original.lat || found.lng !== original.lng) wrong += 1;
  }
  assert.equal(wrong, 0, 'nenhuma cidade abre no lugar de outra depois de regenerar');
  assert.equal(ambiguous, 0, 'todas as cidades do Brasil são reencontradas');
}

console.log('Salvos: identificadores, migração da lista antiga, duplicados, remoção, persistência e cidades após regenerar o arquivo verificados.');

// Links compartilháveis (#/PT, #/PT/c123, #/PT/i4).
{
  const { cityHash, countryHash, parseHash, shareUrl, shareLink } = await import('../js/share.link.js');
  const assert = (await import('node:assert/strict')).default;
  assert.equal(countryHash('PT'), '#/PT');
  assert.equal(countryHash('pt'), '');
  assert.equal(cityHash({ country: 'BR', geonameId: 3448439, index: 1 }), '#/BR/c3448439', 'geonameId primeiro');
  assert.equal(cityHash({ country: 'BR', geonameId: null, index: 1 }), '#/BR/i1');
  assert.deepEqual(parseHash('#/PT'), { alpha2: 'PT' });
  assert.deepEqual(parseHash('#/BR/c3448439'), { alpha2: 'BR', geonameId: 3448439 });
  assert.deepEqual(parseHash('#/BR/i1'), { alpha2: 'BR', index: 1 });
  for (const bad of ['', '#', '#/', '#/xx', '#/BR/x1', '#/BR/i1/extra', '#/<script>']) assert.equal(parseHash(bad), null, `rejeita ${bad}`);
  assert.equal(shareUrl('#/PT', { origin: 'https://lucassfz.github.io', pathname: '/Traveling2/' }), 'https://lucassfz.github.io/Traveling2/#/PT');
  const copied = [];
  assert.equal(await shareLink({ url: 'u' }, { clipboard: { writeText: async text => copied.push(text) } }), 'copied');
  assert.deepEqual(copied, ['u']);
  assert.equal(await shareLink({ url: 'u' }, { maxTouchPoints: 5, share: async () => {}, clipboard: {} }), 'shared', 'celular: menu do sistema');
  assert.equal(await shareLink({ url: 'u' }, {}), 'failed');
  console.log('Salvos: links compartilháveis verificados.');
}

// Página do país para compartilhar.
{
  const assert = (await import('node:assert/strict')).default;
  const { pageUrl } = await import('../js/share.link.js');
  const { countryPagePath, countrySlug } = await import('../js/country.slug.js');
  assert.equal(countrySlug('Antígua e Barbuda'), 'antigua-e-barbuda');
  assert.equal(countryPagePath({ namePt: 'Japão' }), 'paises/japao/');
  assert.equal(pageUrl('paises/japao/', { origin: 'https://x.io', pathname: '/Traveling2/' }), 'https://x.io/Traveling2/paises/japao/');
  assert.equal(pageUrl('paises/japao/', { origin: 'https://x.io', pathname: '/Traveling2/index.html' }), 'https://x.io/Traveling2/paises/japao/', 'ignora o nome do arquivo');
  console.log('Salvos: link da página do país verificado.');
}
