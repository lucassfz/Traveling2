// Troca dos ids antigos de cidade (posição no arquivo, ex.: BR-174) pelo id
// estável (BR-gn3452640) nos destinos salvos e nas viagens (Fase 4.1).
//
// Regras:
//  - roda depois de os dois armazenamentos terem gravado o backup da versão
//    anterior (saved.store.js e trip.store.js fazem isso ao abrir);
//  - idempotente: só mexe no que ainda tem id antigo; rodar de novo não muda nada;
//  - nada é descartado em silêncio: o que não for reencontrado fica como estava,
//    e o relatório (traveling.migrations) lista cada id não resolvido;
//  - dois salvos que viram a mesma cidade são unidos (fica o primeiro da lista,
//    com a data do salvamento mais antigo) e o
//    relatório registra a junção.
import { cityIdOf, isLegacyCityId, upgradeCityRef } from './destination.id.js';

export const MIGRATION_VERSION = 1;
const STABLE_CITY = /^city:[A-Z]{2}-gn\d+$/;

// Cidades guardadas com o id do lugar em data/geo (city:BR-BA-…) também são
// procuradas no globo: quando há par, passam a usar o id da cidade do globo.
const needsUpgrade = item => item.type === 'city' && !STABLE_CITY.test(item.id);

/**
 * @param {object} deps
 * @param {object} deps.savedStore   saved.store.js
 * @param {object} deps.tripStore    planner/trip.store.js
 * @param {object} deps.countries    catálogo (chave → { alpha2 })
 * @param {(alpha2: string) => Promise<object[]>} deps.loadCities
 * @param {() => Promise<object|null>} deps.loadLegacy  data/legacy-cities.json
 * @param {Function} deps.resolveCity  geo/cities.js#resolveCity
 * @param {(report: object) => void} [deps.writeReport]
 */
export async function migrateCityIds({ savedStore, tripStore, countries, loadCities, loadLegacy, resolveCity, writeReport = () => {} }) {
  const savedPending = savedStore.items.filter(needsUpgrade);
  const tripsPending = tripStore.trips.filter(trip => trip.city && isLegacyCityId(trip.city.id));
  const report = { version: MIGRATION_VERSION, ranAt: new Date().toISOString(), saved: { migrated: 0, merged: [], unresolved: [] }, trips: { migrated: 0, unresolved: [] } };
  if (!savedPending.length && !tripsPending.length) return { report, changed: false };

  const legacy = await loadLegacy().catch(() => null);
  const citiesByCountry = new Map();
  const citiesOf = async alpha2 => {
    if (!citiesByCountry.has(alpha2)) citiesByCountry.set(alpha2, await loadCities(alpha2).catch(() => null));
    return citiesByCountry.get(alpha2);
  };

  // ---------- Destinos salvos ----------
  if (savedPending.length) {
    const next = [];
    const seen = new Map();
    for (const item of savedStore.items) {
      let entry = item;
      if (needsUpgrade(item)) {
        const alpha2 = countries?.[item.countryKey]?.alpha2;
        const cities = alpha2 ? await citiesOf(alpha2) : null;
        const ref = { id: item.cityId ?? item.id.slice('city:'.length), name: item.name, lat: item.lat, lng: item.lng, geonameId: item.geonameId };
        const city = cities ? upgradeCityRef(ref, { cities, legacy, resolveCity }) : null;
        if (city) {
          const cityId = city.id ?? cityIdOf(alpha2, city.geonameId, city.index);
          entry = { ...item, id: `city:${cityId}`, cityId, geonameId: city.geonameId ?? undefined, lat: item.lat ?? city.lat, lng: item.lng ?? city.lng, legacyId: item.id };
          report.saved.migrated += 1;
        } else if (isLegacyCityId(ref.id) || !cities) {
          // Só conta como pendente o que tinha id antigo do globo (ou cujo país não
          // carregou). Um lugar de data/geo sem par no globo continua válido.
          report.saved.unresolved.push(item.id);
        }
      }
      if (seen.has(entry.id)) {
        report.saved.merged.push({ kept: entry.id, removed: item.id });
        // Fica o primeiro da lista (o mais recente), com a data do salvamento mais antigo.
        const kept = seen.get(entry.id);
        if (entry.savedAt < kept.savedAt) {
          const merged = { ...kept, savedAt: entry.savedAt };
          next[next.indexOf(kept)] = merged;
          seen.set(entry.id, merged);
        }
        continue;
      }
      seen.set(entry.id, entry);
      next.push(entry);
    }
    if (report.saved.migrated) savedStore.replaceItems(next);
  }

  // ---------- Viagens ----------
  if (tripsPending.length) {
    let changed = false;
    const trips = [];
    for (const trip of tripStore.trips) {
      if (!trip.city || !isLegacyCityId(trip.city.id)) {
        trips.push(trip);
        continue;
      }
      const alpha2 = countries?.[trip.countryKey]?.alpha2;
      const cities = alpha2 ? await citiesOf(alpha2) : null;
      const city = cities ? upgradeCityRef(trip.city, { cities, legacy, resolveCity }) : null;
      if (!city) {
        report.trips.unresolved.push(`${trip.id}:${trip.city.id}`);
        trips.push(trip);
        continue;
      }
      changed = true;
      report.trips.migrated += 1;
      trips.push({ ...trip, city: { ...trip.city, id: city.id, ...(city.geonameId ? { geonameId: city.geonameId } : {}) } });
    }
    if (changed) tripStore.replaceTrips(trips);
  }

  writeReport(report);
  return { report, changed: report.saved.migrated + report.trips.migrated > 0 };
}

/** Viagem aberta por link ou importada: troca o id antigo da cidade, se houver. */
export async function upgradeTripCity(trip, { countries, loadCities, loadLegacy, resolveCity }) {
  if (!trip?.city || !isLegacyCityId(trip.city.id)) return trip;
  const alpha2 = countries?.[trip.countryKey]?.alpha2;
  if (!alpha2) return trip;
  const [cities, legacy] = await Promise.all([loadCities(alpha2).catch(() => null), loadLegacy().catch(() => null)]);
  const city = cities ? upgradeCityRef(trip.city, { cities, legacy, resolveCity }) : null;
  return city ? { ...trip, city: { ...trip.city, id: city.id, ...(city.geonameId ? { geonameId: city.geonameId } : {}) } } : trip;
}
