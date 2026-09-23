import { COUNTRIES } from '../js/countries.dataset.js';
import { LANDMARK_MEDIA } from '../js/landmarks.media.js';

const warnings = [];
const mediaUrls = new Map();
const wikidataIds = new Map();
const globalCoordinates = new Map();
let reviewed = 0;
let verified = 0;
let americas = 0;
let americasWithMedia = 0;

const normalizeName = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

for (const [countryKey, country] of Object.entries(COUNTRIES)) {
  if (['NA', 'SA'].includes(country.continent)) {
    americas++;
    if (LANDMARK_MEDIA[countryKey]?.some(item => item.media?.verified)) americasWithMedia++;
    else warnings.push(`${countryKey}: país americano sem mídia verificada`);
  }
  const names = new Set();
  const coordinates = new Map();
  for (const landmark of country.landmarks ?? []) {
    reviewed++;
    const identity = `${countryKey}: ${landmark.name || '(sem nome)'}`;
    const nameKey = normalizeName(landmark.name);
    if (nameKey && names.has(nameKey)) warnings.push(`${identity}: nome duplicado`);
    if (nameKey) names.add(nameKey);
    if (!landmark.city?.trim()) warnings.push(`${identity}: cidade ausente`);
    if (landmark.status !== 'verified') warnings.push(`${identity}: identidade ainda não verificada`);
    else verified++;
    if (landmark.wikidataId) {
      if (wikidataIds.has(landmark.wikidataId)) warnings.push(`${identity}: Wikidata ${landmark.wikidataId} também em ${wikidataIds.get(landmark.wikidataId)}`);
      wikidataIds.set(landmark.wikidataId, identity);
    } else if (landmark.status === 'verified') warnings.push(`${identity}: Wikidata ID ausente`);
    if (Array.isArray(landmark.coordinates)) {
      const coord = landmark.coordinates.join(',');
      if (coordinates.has(coord)) warnings.push(`${identity}: coordenadas duplicadas com ${coordinates.get(coord)}`);
      coordinates.set(coord, identity);
      if (globalCoordinates.has(coord) && globalCoordinates.get(coord) !== identity) warnings.push(`${identity}: coordenadas iguais às de ${globalCoordinates.get(coord)}`);
      globalCoordinates.set(coord, identity);
      if (landmark.coordinates.length !== 2 || Math.abs(landmark.coordinates[0]) > 90 || Math.abs(landmark.coordinates[1]) > 180) warnings.push(`${identity}: coordenadas inválidas`);
    }
    if (landmark.imageUrl) warnings.push(`${identity}: URL legada de imagem ainda presente no dado de produção`);
  }
}

for (const [countryKey, landmarks] of Object.entries(LANDMARK_MEDIA)) {
  const country = COUNTRIES[countryKey];
  const localNames = new Set();
  for (const item of landmarks) {
    const identity = `${countryKey}: ${item.name}`;
    if (!item.media?.verified || !item.media?.sourcePage || !item.media?.author || !item.media?.license || !item.media?.verifiedAt) warnings.push(`${identity}: metadados de mídia incompletos`);
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(item.media?.sourcePage ?? '')) warnings.push(`${identity}: fonte do arquivo não é uma página Commons`);
    if (!/^https:\/\//.test(item.media?.url ?? '')) warnings.push(`${identity}: URL de mídia inválida`);
    if (item.countryCode !== country?.alpha2) warnings.push(`${identity}: código do país diverge do catálogo (${country?.alpha2})`);
    if (localNames.has(normalizeName(item.name))) warnings.push(`${identity}: nome repetido na mídia do país`);
    localNames.add(normalizeName(item.name));
    if (mediaUrls.has(item.media?.url)) warnings.push(`${identity}: mídia duplicada com ${mediaUrls.get(item.media.url)}`);
    mediaUrls.set(item.media?.url, identity);
    if (!item.wikidataId || !item.coordinates || !item.city) warnings.push(`${identity}: identidade geográfica incompleta`);
  }
}

console.log(`Américas: ${americasWithMedia}/${americas} com mídia verificada; marcos revisados: ${reviewed}; identidades verificadas: ${verified}; mídias curadas: ${mediaUrls.size}; alertas: ${warnings.length}`);
for (const warning of warnings.slice(0, 30)) console.log(`AVISO ${warning}`);
if (warnings.length > 30) console.log(`... mais ${warnings.length - 30} alertas. Sem reescrita automática.`);
if (warnings.some(warning => /duplicad|mídia incompleta|metadados de mídia incompletos/.test(warning))) process.exitCode = 1;
