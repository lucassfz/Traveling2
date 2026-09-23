import { LANDMARK_MEDIA } from './landmarks.media.js';

// Mídia estática e verificada por assunto. Carregar uma imagem não comprova
// que ela retrata o marco; por isso não há fallback para fotos genéricas.
export async function getCountryMedia(countryKey, _country, limit = 3) {
  return (LANDMARK_MEDIA[countryKey] || [])
    .filter(item => item.media?.verified && item.media?.sourcePage && item.wikidataId)
    .slice(0, limit)
    .map(item => ({
      url: item.media.url,
      name: item.name,
      city: item.city,
      sourcePage: item.media.sourcePage,
      author: item.media.author,
      license: item.media.license
    }));
}
