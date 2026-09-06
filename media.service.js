import { LANDMARK_MEDIA } from './countries.dataset.js';

function upgradeUnsplashUrl(url) {
  if (!url || !url.includes('images.unsplash.com')) return url;
  const parsed = new URL(url);
  parsed.searchParams.set('w', '960');
  parsed.searchParams.set('q', '82');
  parsed.searchParams.set('fit', 'crop');
  parsed.searchParams.set('auto', 'format');
  return parsed.toString();
}

function runtimeImageCheck(url, timeoutMs = 2800) {
  return new Promise(resolve => {
    const image = new Image();
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    image.onload = () => finish(image.naturalWidth >= 600 && image.naturalHeight >= 360);
    image.onerror = () => finish(false);
    image.referrerPolicy = 'no-referrer';
    image.decoding = 'async';
    image.src = url;
  });
}

/**
 * Runtime availability is not treated as editorial/subject verification.
 * Only the city is returned for the visual overlay.
 */
export async function getCountryMedia(countryKey, country, limit = 3) {
  const priority = LANDMARK_MEDIA[countryKey] ?? [];
  const fallback = priority.length ? [] : (country.photos ?? []).map(photo => ({
    url: photo.url,
    city: photo.city || country.capital || country.namePt,
    verifiedInSession: false
  }));

  const candidates = [...priority, ...fallback]
    .filter((item, index, array) => item?.url && array.findIndex(other => other.url === item.url) === index)
    .map(item => ({ ...item, url: upgradeUnsplashUrl(item.url) }));

  if (!candidates.length) return [];

  const sample = candidates.slice(0, Math.max(limit * 2, 4));
  const checked = await Promise.allSettled(sample.map(async item => ({
    ...item,
    available: await runtimeImageCheck(item.url)
  })));

  return checked
    .filter(result => result.status === 'fulfilled' && result.value.available)
    .map(result => ({ url: result.value.url, city: result.value.city }))
    .slice(0, limit);
}
