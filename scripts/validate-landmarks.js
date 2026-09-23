import { COUNTRIES } from '../js/countries.dataset.js';
import { LANDMARK_MEDIA } from '../js/landmarks.media.js';

const warnings = [];
const mediaUrls = new Map();
const wikidataIds = new Map();
let reviewed = 0;
let verified = 0;

for (const [countryKey, country] of Object.entries(COUNTRIES)) {
  const names = new Set();
  const coordinates = new Map();
  for (const landmark of country.landmarks ?? []) {
    reviewed++;
    const identity = `${countryKey}: ${landmark.name || '(sem nome)'}`;
    const nameKey = landmark.name?.trim().toLocaleLowerCase('pt-BR');
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
    }
    if (landmark.imageUrl) warnings.push(`${identity}: URL legada de imagem ainda presente no dado de produção`);
  }
}

for (const [countryKey, landmarks] of Object.entries(LANDMARK_MEDIA)) {
  for (const item of landmarks) {
    const identity = `${countryKey}: ${item.name}`;
    if (!item.media?.verified || !item.media?.sourcePage || !item.media?.author || !item.media?.license || !item.media?.verifiedAt) warnings.push(`${identity}: metadados de mídia incompletos`);
    if (mediaUrls.has(item.media?.url)) warnings.push(`${identity}: mídia duplicada com ${mediaUrls.get(item.media.url)}`);
    mediaUrls.set(item.media?.url, identity);
    if (!item.wikidataId || !item.coordinates || !item.city) warnings.push(`${identity}: identidade geográfica incompleta`);
  }
}

console.log(`Marcos revisados: ${reviewed}; identidades verificadas: ${verified}; mídias curadas: ${mediaUrls.size}; alertas: ${warnings.length}`);
for (const warning of warnings.slice(0, 30)) console.log(`AVISO ${warning}`);
if (warnings.length > 30) console.log(`... mais ${warnings.length - 30} alertas. Sem reescrita automática.`);
if (warnings.some(warning => /duplicad|mídia incompleta|metadados de mídia incompletos/.test(warning))) process.exitCode = 1;
