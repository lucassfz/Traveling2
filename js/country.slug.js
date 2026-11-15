// Endereço da página de cada país (paises/<slug>/), usado pelo gerador das
// páginas e pelo botão Compartilhar. "Antígua e Barbuda" → "antigua-e-barbuda".
export function countrySlug(namePt) {
  return String(namePt ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const COUNTRY_PAGES_DIR = 'paises';

/** Caminho relativo à raiz do site: "paises/portugal/". */
export function countryPagePath(country) {
  const slug = countrySlug(country?.namePt);
  return slug ? `${COUNTRY_PAGES_DIR}/${slug}/` : '';
}

export const CITY_PAGES_DIR = 'cidades';
const sameName = (a, b) => countrySlug(a) !== '' && countrySlug(a) === countrySlug(b);

/** Pontos turísticos da própria capital (com foto): só capitais com eles ganham página. */
export function capitalLandmarks(country) {
  return (country?.landmarks ?? []).filter(item => sameName(item.city, country.capital) && /^https:\/\//.test(item.media?.url ?? ''));
}

/** "cidades/lisboa-portugal/" quando a capital tem página; senão ''. */
export function capitalPagePath(country) {
  if (!country?.capital || !capitalLandmarks(country).length) return '';
  return `${CITY_PAGES_DIR}/${countrySlug(`${country.capital} ${country.namePt}`)}/`;
}
