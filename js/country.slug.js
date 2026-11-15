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
