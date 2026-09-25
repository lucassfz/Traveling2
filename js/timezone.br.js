// Overview uses the catalog's curated UTC labels as its source. Brasília has
// stayed at UTC−3 since Brazil ended daylight saving time in 2019.
const BRASILIA_OFFSET_MINUTES = -180;
const REGIONAL_SLASH_ZONES = new Set(['Micronesia', 'Mongolia']);
// Only a small reference-city map is needed where a country has several zones.
// Intl supplies the current time-zone rules (including daylight saving time).
const REGIONAL_REFERENCES = Object.freeze({
  Australia: ['Camberra', 'Australia/Sydney'],
  Canada: ['Ottawa', 'America/Toronto'],
  Chile: ['Santiago', 'America/Santiago'],
  Indonesia: ['Jacarta', 'Asia/Jakarta'],
  Mexico: ['Cidade do México', 'America/Mexico_City'],
  Portugal: ['Lisboa', 'Europe/Lisbon'],
  Russia: ['Moscou', 'Europe/Moscow'],
  Spain: ['Madri', 'Europe/Madrid'],
  'United States of America': ['Washington, D.C.', 'America/New_York']
});

function offsetMinutes(value) {
  if (!value) return 0;
  const normalized = value.replace('−', '-');
  const match = /^([+-])(\d{1,2})(?::(\d{2}))?$/.exec(normalized);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  if (hours > 14 || minutes >= 60) return null;
  return (match[1] === '-' ? -1 : 1) * (hours * 60 + minutes);
}

function utcOffsets(label) {
  const offsets = [];
  for (const match of label.matchAll(/UTC\s*([+−-]\d{1,2}(?::\d{2})?)?(?:\s*\/\s*([+−-]?\d{1,2}(?::\d{2})?))?/g)) {
    const first = offsetMinutes(match[1]);
    if (first === null) return [];
    offsets.push(first);
    if (match[2]) {
      const second = offsetMinutes(/^[+−-]/.test(match[2]) ? match[2] : `${match[1]?.[0] || '+'}${match[2]}`);
      if (second === null) return [];
      offsets.push(second);
    }
  }
  return [...new Set(offsets)];
}

function duration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder ? String(remainder).padStart(2, '0') : ''}`;
}

function durationRange(first, last) {
  const low = duration(first);
  const high = duration(last);
  return first === last ? low : `${low.endsWith('h') && high.endsWith('h') ? low.slice(0, -1) : low}–${high}`;
}

function relativeDifference(offsets) {
  if (!offsets.length || offsets.length > 2) return null;
  const differences = offsets.map(offset => offset - BRASILIA_OFFSET_MINUTES).sort((a, b) => a - b);
  const low = differences[0];
  const high = differences.at(-1);
  if (low === 0 && high === 0) return 'mesmo horário de Brasília';
  if (low >= 0) return `${durationRange(low, high)} à frente de Brasília${low === high ? '' : ', conforme a época do ano'}`;
  if (high <= 0) return `${durationRange(Math.abs(high), Math.abs(low))} atrás de Brasília${low === high ? '' : ', conforme a época do ano'}`;
  return 'diferença variável em relação a Brasília';
}

function referenceOffsets(timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' });
    const year = new Date().getUTCFullYear();
    return [0, 6].map(month => {
      const label = formatter.formatToParts(new Date(Date.UTC(year, month, 15, 12)))
        .find(part => part.type === 'timeZoneName')?.value;
      return label?.startsWith('GMT') ? offsetMinutes(label.slice(3)) : null;
    }).filter(Number.isFinite);
  } catch {
    return [];
  }
}

export function brasiliaTimezoneNote(country) {
  const label = country?.timezoneLabel || '';
  if (!label) return 'Confirme o horário local para a data da viagem.';
  if (country.key === 'Brazil') return 'Brasília (UTC−3) é a referência; varia por região.';
  if (REGIONAL_SLASH_ZONES.has(country.key) || /\ba UTC|;| · |no oeste|por região|Chatham|Bougainville/i.test(label)) {
    const reference = REGIONAL_REFERENCES[country.key];
    if (reference) {
      const difference = relativeDifference(referenceOffsets(reference[1]));
      if (difference) return `Varia por região; ${reference[0]}: ${difference}.`;
    }
    return 'Varia por região em relação a Brasília (UTC−3).';
  }
  // A dated temporary rule is not a reliable year-round difference.
  if (/\bdesde\b/i.test(label)) return 'A diferença pode mudar; confirme a data da viagem.';

  const difference = relativeDifference(utcOffsets(label));
  return difference ? `${difference[0].toUpperCase()}${difference.slice(1)}.` : 'Confirme o horário local para a data da viagem.';
}
