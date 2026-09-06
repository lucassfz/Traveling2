import { haversineKm } from './geospatial.js';

const CABIN_FACTORS = Object.freeze({
  economy: { cash: 1, award: 1, label: 'Econômica' },
  premium: { cash: 1.65, award: 1.55, label: 'Premium Economy' },
  business: { cash: 3.1, award: 2.45, label: 'Executiva' }
});

const PROGRAM_FACTORS = Object.freeze({
  'LATAM Pass': 1,
  Smiles: 1.08,
  Azul: 1.05
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function seasonalMultiplier(monthIndex) {
  const month = Number(monthIndex);
  if ([11, 0, 6, 7].includes(month)) return 1.22;
  if ([2, 3, 9, 10].includes(month)) return 0.9;
  return 1;
}

function cashBaseUsd(distanceKm) {
  if (distanceKm < 500) return 48 + distanceKm * 0.15;
  if (distanceKm < 1500) return 72 + distanceKm * 0.095;
  if (distanceKm < 4500) return 120 + distanceKm * 0.07;
  if (distanceKm < 9000) return 230 + distanceKm * 0.055;
  return 340 + distanceKm * 0.045;
}

function awardBaseMiles(distanceKm) {
  if (distanceKm < 500) return 5_000;
  if (distanceKm < 1_000) return 7_500;
  if (distanceKm < 2_000) return 11_000;
  if (distanceKm < 4_000) return 18_000;
  if (distanceKm < 6_500) return 26_000;
  if (distanceKm < 9_000) return 34_000;
  if (distanceKm < 12_000) return 42_000;
  if (distanceKm < 16_000) return 52_000;
  return 65_000;
}

export function estimateFlightPricing({
  origin,
  destination,
  cabin = 'economy',
  month = new Date().getMonth(),
  brlPerUsd = 5
}) {
  if (!origin || !destination) throw new Error('Origem e destino são obrigatórios.');
  const cabinConfig = CABIN_FACTORS[cabin] ?? CABIN_FACTORS.economy;
  const distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const season = seasonalMultiplier(month);

  const baseCash = cashBaseUsd(distanceKm) * season * cabinConfig.cash;
  const usdLow = roundTo(clamp(baseCash * 0.78, 45, 12_000), 5);
  const usdHigh = roundTo(clamp(baseCash * 1.38, usdLow + 20, 20_000), 5);
  const exchange = Number.isFinite(Number(brlPerUsd)) && Number(brlPerUsd) > 0 ? Number(brlPerUsd) : 5;

  const baseAward = awardBaseMiles(distanceKm) * season * cabinConfig.award;
  const awards = Object.fromEntries(Object.entries(PROGRAM_FACTORS).map(([program, factor]) => {
    const midpoint = baseAward * factor;
    return [program, {
      low: roundTo(midpoint * 0.85, 500),
      high: roundTo(midpoint * 1.45, 500)
    }];
  }));

  const benchmarkMiles = awards['LATAM Pass'];
  const averageCashBrl = ((usdLow + usdHigh) / 2) * exchange;
  const averageMiles = (benchmarkMiles.low + benchmarkMiles.high) / 2;
  const centsPerMileBrl = averageMiles > 0 ? averageCashBrl / averageMiles : 0;

  return {
    distanceKm,
    cabin: cabinConfig.label,
    seasonMultiplier: season,
    cash: {
      usd: { low: usdLow, high: usdHigh },
      brl: {
        low: roundTo(usdLow * exchange, 10),
        high: roundTo(usdHigh * exchange, 10)
      }
    },
    awards,
    benchmarkValueBrlPerMile: centsPerMileBrl,
    disclaimer: 'Estimativa algorítmica, não cotação. Tarifas e resgates variam por disponibilidade, taxas, antecedência e companhia.'
  };
}

export function formatDistance(distanceKm) {
  return `${Math.round(distanceKm).toLocaleString('pt-BR')} km`;
}

export function formatMoney(value, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'BRL' ? 0 : 0
  }).format(value);
}

export function formatMiles(value) {
  return `${Math.round(value).toLocaleString('pt-BR')} mi`;
}
