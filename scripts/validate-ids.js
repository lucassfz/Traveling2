// Auditoria offline da identidade geográfica (Fase 4.1) e do roteiro por dia (4.5):
// ids estáveis, tabela de ids antigos, migração de salvos e viagens (backup,
// idempotência, nada descartado em silêncio) e operações do roteiro.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { COUNTRIES } from '../js/countries.dataset.js';
import { parseCities, parseDivisions, resolveCity } from '../js/geo/cities.js';
import {
  CITY_ID_RE, DESTINATION_ID_RE, cityIdOf, destinationId, isLegacyCityId, legacyGeonameId,
  parseCityId, parseDestinationId, regionCodeOf, upgradeCityRef
} from '../js/geo/destination.id.js';
import { migrateCityIds, upgradeTripCity } from '../js/geo/id.migration.js';
import { createSavedStore } from '../js/saved.store.js';
import { createTripStore } from '../js/planner/trip.store.js';
import { createTrip, normalizeTrip, duplicateTrip, TRIP_SCHEMA_VERSION } from '../js/planner/trip.model.js';
import {
  MAX_ITINERARY_ITEMS, addItineraryItem, itineraryByDay, itineraryDayCount, moveItineraryItem,
  normalizeItinerary, removeItineraryItem, updateItineraryItem
} from '../js/planner/itinerary.model.js';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const adminCache = new Map();
const admin = async code => {
  if (!adminCache.has(code)) adminCache.set(code, await json(`../data/admin/${code}.json`));
  return adminCache.get(code);
};
const loadCities = async code => parseCities(code, await admin(code));
const legacy = await json('../data/legacy-cities.json');
const loadLegacy = async () => legacy;

// ---------- Formatos de id ----------
assert.equal(cityIdOf('BR', 3452640, 174), 'BR-gn3452640');
assert.equal(cityIdOf('BR', null, 174), 'BR-174', 'sem geonameid, posição (último recurso)');
assert.deepEqual(parseCityId('BR-gn3452640'), { country: 'BR', geonameId: 3452640 });
assert.deepEqual(parseCityId('BR-174'), { country: 'BR', index: 174 });
assert.equal(parseCityId('BR-BA-porto-seguro'), null);
assert.ok(isLegacyCityId('BR-174') && !isLegacyCityId('BR-gn3452640'));
for (const id of ['BR-gn1', 'BR-0']) assert.ok(CITY_ID_RE.test(id));
for (const id of ['br-gn1', 'BR-gn', 'BR-x1', 'BRA-1']) assert.ok(!CITY_ID_RE.test(id), id);
assert.equal(regionCodeOf('BR', { code: 'BR-BA', name: 'Bahia' }), 'BR-BA');
assert.equal(regionCodeOf('BR', { code: 'AR-B', name: 'Bahia' }), 'BR~bahia', 'código de outro país não vale');
assert.equal(regionCodeOf('IE', { code: null, name: 'Dún Laoghaire–Rathdown' }), 'IE~dun-laoghaire-rathdown');
for (const id of [destinationId.country('Japan'), destinationId.region('BR-BA'), destinationId.region('IE~dublin'), destinationId.city('BR-gn3452640'), destinationId.place('Q39231'), 'city:BR-BA-porto-seguro']) {
  assert.ok(DESTINATION_ID_RE.test(id), id);
}
for (const id of ['region:Bahia', 'city:Porto Seguro', 'place:Fuji', 'trip:1', 'country:']) assert.ok(!DESTINATION_ID_RE.test(id), id);
assert.deepEqual(parseDestinationId('region:BR-BA'), { type: 'region', key: 'BR-BA' });

// ---------- Dados: toda cidade e região têm id estável e único ----------
const files = (await readdir(new URL('../data/admin/', import.meta.url))).filter(file => /^[A-Z]{2}\.json$/.test(file));
let cityTotal = 0;
let regionTotal = 0;
let regionIso = 0;
for (const file of files) {
  const code = file.slice(0, 2);
  const data = await admin(code);
  const cities = parseCities(code, data);
  const ids = new Set(cities.map(city => city.id));
  assert.equal(ids.size, cities.length, `${code}: id de cidade repetido`);
  assert.ok(cities.every(city => /^[A-Z]{2}-gn\d+$/.test(city.id)), `${code}: cidade sem geonameid`);
  const regions = parseDivisions(code, data);
  const codes = new Set(regions.map(region => region.code));
  assert.equal(codes.size, regions.length, `${code}: id de região repetido`);
  cityTotal += cities.length;
  regionTotal += regions.length;
  regionIso += regions.filter(region => !region.code.includes('~')).length;
  adminCache.delete(code);
}
assert.ok(cityTotal > 30000 && regionTotal > 4000);

// ---------- Tabela de ids antigos ----------
{
  const br = await loadCities('BR');
  const de = await loadCities('DE');
  const ir = await loadCities('IR');
  assert.equal(legacyGeonameId(legacy, br, 'BR', 174), 3452640, 'posição que não mudou: mesma cidade (Porto Seguro)');
  assert.equal(legacyGeonameId(legacy, de, 'DE', 802), de.find(city => city.name === 'Munster' && city.lat === 52.985).geonameId, 'posição que mudou: tabela');
  assert.equal(legacyGeonameId(legacy, ir, 'IR', 200), null, 'cidade que saiu do arquivo');
  assert.equal(legacyGeonameId(null, br, 'BR', 174), undefined, 'sem tabela, não adivinha');
  for (const [code, moved] of Object.entries(legacy.countries)) {
    const cities = await loadCities(code);
    for (const geonameId of Object.values(moved)) {
      assert.ok(geonameId === null || cities.some(city => city.geonameId === geonameId), `${code}: tabela aponta para geonameid inexistente`);
    }
  }
  // Referências antigas → cidade atual
  const up = (ref, cities) => upgradeCityRef(ref, { cities, legacy, resolveCity });
  assert.equal(up({ id: 'BR-174', name: 'Porto Seguro', lat: -16.45, lng: -39.065 }, br).id, 'BR-gn3452640');
  assert.equal(up({ id: 'DE-802', name: 'Munster', lat: 52.985, lng: 10.09 }, de).name, 'Munster');
  assert.equal(up({ id: 'BR-gn3452640', name: 'x' }, br).name, 'Porto Seguro', 'id novo resolve direto');
  assert.equal(up({ id: 'BR-BA-porto-seguro', name: 'Porto Seguro', lat: -16.449, lng: -39.064, geonameId: 3452640 }, br).id, 'BR-gn3452640', 'lugar de data/geo com geonameid');
  assert.equal(up({ id: 'BR-174', name: 'Salvador' }, br), null, 'nome não confere e sem coordenadas: não adivinha');
}

// ---------- Migração de salvos e viagens ----------
const memoryIo = initial => {
  const memory = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    memory,
    read: (key, fallback) => (memory.has(key) ? JSON.parse(memory.get(key)) : fallback),
    write: (key, value) => { memory.set(key, JSON.stringify(value)); return true; }
  };
};
{
  const savedV1 = {
    version: 1,
    items: [
      { id: 'city:BR-174', type: 'city', countryKey: 'Brazil', name: 'Porto Seguro', lat: -16.45, lng: -39.065, cityId: 'BR-174', savedAt: '2026-10-01' },
      { id: 'city:BR-BA-porto-seguro', type: 'city', countryKey: 'Brazil', name: 'Porto Seguro', lat: -16.449, lng: -39.064, placeId: 'BR-BA-porto-seguro', savedAt: '2026-09-01' },
      { id: 'city:DE-802', type: 'city', countryKey: 'Germany', name: 'Munster', lat: 52.985, lng: 10.09, cityId: 'DE-802', savedAt: '2026-10-02' },
      { id: 'city:IR-200', type: 'city', countryKey: 'Iran', name: 'Cidade removida', lat: 37.301, lng: 49.315, cityId: 'IR-200', savedAt: '2026-10-03' },
      { id: 'country:Japan', type: 'country', countryKey: 'Japan', name: 'Japão', savedAt: '2026-10-04' },
      { id: 'place:Q39231', type: 'place', countryKey: 'Japan', name: 'Monte Fuji', savedAt: '2026-10-05' }
    ]
  };
  const tripsV2 = {
    version: 2,
    activeTripId: 't_aaaa1111',
    trips: [
      { id: 't_aaaa1111', countryKey: 'Brazil', city: { id: 'BR-174', name: 'Porto Seguro', lat: -16.45, lng: -39.065, region: 'Bahia' }, createdAt: '2026-10-01', updatedAt: '2026-10-01', lines: [], checklist: {} },
      { id: 't_bbbb2222', countryKey: 'Iran', city: { id: 'IR-200', name: 'Cidade removida', lat: 37.301, lng: 49.315 }, createdAt: '2026-10-01', updatedAt: '2026-10-01', lines: [], checklist: {} },
      { id: 't_cccc3333', countryKey: 'Japan', createdAt: '2026-10-01', updatedAt: '2026-10-01', lines: [], checklist: {} }
    ]
  };
  const io = memoryIo({ 'traveling.saved': savedV1, 'traveling.trips': tripsV2 });
  const savedStore = createSavedStore({ countries: COUNTRIES, read: io.read, write: io.write });
  const tripStore = createTripStore({ countries: COUNTRIES, read: io.read, write: io.write });
  // Backups gravados antes de qualquer escrita no formato novo, intactos.
  assert.deepEqual(io.read('traveling.saved.backup-v1').data, savedV1, 'backup dos salvos v1');
  assert.deepEqual(io.read('traveling.trips.backup-v2').data, tripsV2, 'backup das viagens v2');
  assert.equal(io.read('traveling.trips.backup-v1', null), null, 'backup v1 das viagens não é tocado');
  assert.equal(io.read('traveling.trips').version, TRIP_SCHEMA_VERSION);
  assert.equal(io.read('traveling.saved').version, 2);
  assert.equal(savedStore.items.length, 6, 'nada descartado ao abrir');

  let reportWritten = null;
  const deps = { savedStore, tripStore, countries: COUNTRIES, loadCities, loadLegacy, resolveCity, writeReport: report => { reportWritten = report; } };
  const { report } = await migrateCityIds(deps);
  const ids = savedStore.items.map(item => item.id);
  assert.deepEqual(ids, ['city:BR-gn3452640', 'city:DE-gn2867542', 'city:IR-200', 'country:Japan', 'place:Q39231'], 'ids trocados, ordem mantida');
  assert.equal(savedStore.get('city:BR-gn3452640').savedAt, '2026-09-01', 'dois salvos da mesma cidade: fica o mais antigo');
  assert.equal(savedStore.get('city:BR-gn3452640').legacyId, 'city:BR-174');
  assert.deepEqual(report.saved.merged, [{ kept: 'city:BR-gn3452640', removed: 'city:BR-BA-porto-seguro' }], 'junção registrada');
  assert.deepEqual(report.saved.unresolved, ['city:IR-200'], 'não resolvido fica e é registrado');
  assert.equal(report.saved.migrated, 3);
  assert.equal(tripStore.get('t_aaaa1111').city.id, 'BR-gn3452640');
  assert.equal(tripStore.get('t_aaaa1111').city.geonameId, 3452640);
  assert.equal(tripStore.get('t_aaaa1111').city.region, 'Bahia', 'demais campos da cidade preservados');
  assert.equal(tripStore.get('t_bbbb2222').city.id, 'IR-200', 'viagem com cidade removida continua com a cidade antiga');
  assert.deepEqual(report.trips.unresolved, ['t_bbbb2222:IR-200']);
  assert.equal(tripStore.activeTripId, 't_aaaa1111', 'viagem ativa preservada');
  assert.equal(tripStore.trips.length, 3);
  assert.ok(reportWritten);

  // Idempotente: rodar de novo (e reabrir os armazenamentos) não muda nada.
  const before = [io.memory.get('traveling.saved'), io.memory.get('traveling.trips')];
  await migrateCityIds(deps);
  const reopened = { ...deps, savedStore: createSavedStore({ countries: COUNTRIES, read: io.read, write: io.write }), tripStore: createTripStore({ countries: COUNTRIES, read: io.read, write: io.write }) };
  await migrateCityIds(reopened);
  assert.deepEqual([io.memory.get('traveling.saved'), io.memory.get('traveling.trips')], before, 'segunda execução não regrava nada');
  assert.deepEqual(io.read('traveling.saved.backup-v1').data, savedV1, 'backup não é sobrescrito');

  // Link compartilhado antigo (#/viagem/ com cidade "BR-174").
  const shared = await upgradeTripCity({ countryKey: 'Brazil', city: { id: 'BR-174', name: 'Porto Seguro', lat: -16.45, lng: -39.065 } }, { countries: COUNTRIES, loadCities, loadLegacy, resolveCity });
  assert.equal(shared.city.id, 'BR-gn3452640');
}

// Armazenamento bloqueado para o backup: nada é regravado no formato novo.
{
  const io = memoryIo({ 'traveling.saved': { version: 1, items: [{ id: 'country:Japan', type: 'country', countryKey: 'Japan', name: 'Japão' }] } });
  const write = (key, value) => (key === 'traveling.saved.backup-v1' ? false : io.write(key, value));
  const store = createSavedStore({ countries: COUNTRIES, read: io.read, write });
  assert.equal(io.read('traveling.saved').version, 1, 'sem backup, o original fica intacto');
  assert.equal(store.persistent, false);
}

// ---------- Viagem: cidade nova, roteiro dentro da viagem ----------
{
  const trip = normalizeTrip({ countryKey: 'Brazil', city: { id: 'BR-gn3452640', geonameId: 3452640, name: 'Porto Seguro', lat: -16.45, lng: -39.065 } }, { countries: COUNTRIES });
  assert.equal(trip.city.id, 'BR-gn3452640');
  assert.deepEqual(trip.itinerary, []);
  assert.equal(normalizeTrip({ countryKey: 'Japan', city: { id: 'BR-gn3452640', name: 'Porto Seguro', lat: -16.45, lng: -39.065 } }, { countries: COUNTRIES }).city, null, 'cidade de outro país');
}

// ---------- Roteiro por dia ----------
{
  let seq = 0;
  const idFactory = () => `i_test${String(seq += 1).padStart(4, '0')}`;
  const porto = { type: 'city', ref: 'city:BR-gn3452640', name: 'Porto Seguro', countryKey: 'Brazil', lat: -16.45, lng: -39.065 };
  const fuji = { type: 'place', ref: 'place:Q39231', name: 'Monte Fuji' };
  let items = [];
  ({ items } = addItineraryItem(items, { ...porto, day: 1 }, { idFactory }));
  ({ items } = addItineraryItem(items, { ...fuji, day: 1 }, { idFactory }));
  ({ items } = addItineraryItem(items, { type: 'note', name: 'Chegada e check-in', day: 2, time: '14:30' }, { idFactory }));
  const duplicate = addItineraryItem(items, { ...porto, day: 1 }, { idFactory });
  assert.equal(duplicate.reason, 'duplicate', 'o mesmo destino não entra duas vezes no mesmo dia');
  assert.equal(addItineraryItem(items, { ...porto, day: 2 }, { idFactory }).reason, null, 'em outro dia pode');
  assert.equal(addItineraryItem(items, { type: 'place', ref: 'city:BR-gn1', name: 'x', day: 1 }).reason, 'invalid', 'ref precisa bater com o tipo');
  assert.equal(addItineraryItem(items, { type: 'note', name: '', day: 1 }).reason, 'invalid');
  assert.equal(addItineraryItem(items, { ...fuji, day: 0 }).reason, 'invalid');

  // Reordenar no dia e mover entre dias
  items = moveItineraryItem(items, 'i_test0002', { direction: -1 });
  assert.deepEqual(items.filter(item => item.day === 1).map(item => item.name), ['Monte Fuji', 'Porto Seguro']);
  assert.equal(moveItineraryItem(items, 'i_test0002', { direction: -1 }), items, 'primeiro do dia não sobe');
  items = moveItineraryItem(items, 'i_test0001', { day: 2 });
  assert.deepEqual(items.filter(item => item.day === 2).map(item => item.name), ['Chegada e check-in', 'Porto Seguro'], 'vai para o fim do outro dia');
  // Horário e anotação
  items = updateItineraryItem(items, 'i_test0001', { time: '09:00', note: '  Praia do Espelho  ' });
  assert.equal(items.find(item => item.id === 'i_test0001').note, 'Praia do Espelho');
  items = updateItineraryItem(items, 'i_test0001', { time: '25:00', note: '' });
  assert.equal(items.find(item => item.id === 'i_test0001').time, undefined, 'horário inválido limpa');
  assert.equal(items.find(item => item.id === 'i_test0001').note, undefined);
  items = removeItineraryItem(items, 'i_test0002');
  assert.equal(items.length, 2);

  // Dias: pelas datas; item fora das datas (datas mudaram) continua visível.
  const trip = { startDate: '2026-12-20', endDate: '2026-12-22', itinerary: [...items, normalizeItinerary([{ type: 'note', name: 'Dia extra', day: 5 }], { idFactory })[0]] };
  assert.equal(itineraryDayCount(3, trip.itinerary), 5);
  const days = itineraryByDay(trip, 3);
  assert.deepEqual(days.map(day => day.date), ['2026-12-20', '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24']);
  assert.deepEqual(days.map(day => day.outside), [false, false, false, true, true]);
  assert.equal(itineraryDayCount(null, []), 1, 'sem datas: um dia para começar');

  // Persistência dentro da viagem: armazenamento, duplicar, backup e importação.
  const io = memoryIo({});
  const store = createTripStore({ countries: COUNTRIES, read: io.read, write: io.write });
  const saved = store.save({ ...createTrip({ countryKey: 'Brazil' }), itinerary: items });
  assert.equal(saved.itinerary.length, 2);
  assert.equal(createTripStore({ countries: COUNTRIES, read: io.read, write: io.write }).trips[0].itinerary.length, 2, 'sobrevive a recarregar');
  assert.equal(duplicateTrip(saved).itinerary.length, 2, 'cópia leva o roteiro');
  const exported = JSON.parse(JSON.stringify(store.exportData()));
  const other = createTripStore({ countries: COUNTRIES, read: memoryIo({}).read, write: () => true });
  assert.equal(other.importData(exported), 1);
  assert.deepEqual(other.trips[0].itinerary, saved.itinerary, 'backup importado mantém o roteiro');

  // Limite e lixo
  const many = Array.from({ length: MAX_ITINERARY_ITEMS + 10 }, (_, index) => ({ type: 'note', name: `n${index}`, day: 1 }));
  assert.equal(normalizeItinerary(many).length, MAX_ITINERARY_ITEMS);
  assert.deepEqual(normalizeItinerary('lixo'), []);
  assert.deepEqual(normalizeItinerary([{ type: 'city', ref: 'city:<script>', name: 'x', day: 1 }]), []);
}

console.log(`Ids: ${cityTotal} cidades e ${regionTotal} regiões com id estável (${regionIso} pelo ISO 3166-2); ids antigos, migração com backup, idempotência e roteiro por dia verificados.`);
