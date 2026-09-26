// Identidade visual e seleção editorial sem dependência do globo ou do DOM.
export function isVisaFreeForBrazil(country) {
  return country?.visaPolicyBR?.eligibility === 'visa-free';
}

export function flagFromAlpha2(alpha2) {
  const code = String(alpha2 ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🌍';
  return [...code].map(letter => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');
}

export function flagImageUrl(alpha2) {
  const code = String(alpha2 ?? '').toLowerCase();
  return /^[a-z]{2}$/.test(code) ? `https://flagcdn.com/w80/${code}.png` : null;
}

export function isDiscoveryEligible(country) {
  const entry = country?.entryRequirements;
  return Boolean(
    country?.dataLevel === 'curated'
    && country.borderStatus === 'open'
    && country.capital
    && country.bestTime
    && entry?.status === 'verified'
    && entry.officialSource
    && entry.visaPolicyBR
    && country.foods?.length >= 2
    && country.etiquette?.length >= 2
    && country.checklist?.some(group => group.items?.length)
    && country.landmarks?.some(landmark => landmark.status === 'verified' && landmark.media?.verified)
  );
}

export function discoveryCountryKeys(countries) {
  return Object.entries(countries)
    .filter(([, country]) => isDiscoveryEligible(country))
    .map(([key]) => key);
}

export function chooseDiscoveryKey(keys, previousKey, random = Math.random) {
  const pool = keys.filter(key => key !== previousKey);
  if (!pool.length) return keys[0] ?? null;
  const value = Number(random());
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * pool.length)));
  return pool[index];
}
