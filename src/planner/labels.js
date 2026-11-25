// Textos das viagens (nome, quando, quem, resumo). Puro, sem DOM.
import { COUNTRIES } from '../../js/countries.dataset.js';
import { LOCAL_TRANSPORT, LODGING_LEVELS, ORIGIN_AIRPORTS, PAY_OPTIONS, TRAVEL_GROUPS, TRAVEL_STYLES, TRIP_DURATIONS, tripDays, tripMonth } from '../../js/planner/trip.model.js';
import { CABINS } from '../../js/planner/route.estimator.js';

export const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2027-04-02" → "2 abr 2027".
function shortDate(iso, { year = true } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}${year ? ` ${y}` : ''}`;
}

export function whenLabel(trip) {
  if (trip.startDate && trip.endDate) {
    const sameYear = trip.startDate.slice(0, 4) === trip.endDate.slice(0, 4);
    return `${shortDate(trip.startDate, { year: !sameYear })} – ${shortDate(trip.endDate)}`;
  }
  const month = tripMonth(trip);
  const duration = TRIP_DURATIONS.find(item => item.days === trip.duration)?.label;
  if (month === null && !duration) return 'Quando: a definir';
  return [month === null ? null : `Em ${MONTH_NAMES[month]}`, duration?.toLowerCase()].filter(Boolean).join(' · ');
}

export const people = count => `${count} ${count === 1 ? 'viajante' : 'viajantes'}`;

export const countryName = trip => COUNTRIES[trip.countryKey]?.namePt || trip.countryKey;

export const tripName = trip => `${trip.city ? `${trip.city.name}, ` : ''}${countryName(trip)}`;

export function tripMeta(trip) {
  const days = tripDays(trip);
  return [trip.city?.name, whenLabel(trip), days && trip.startDate ? `${days} dias` : null, people(trip.travelers)].filter(Boolean).join(' · ');
}

export function tripFacts(trip) {
  const country = COUNTRIES[trip.countryKey];
  const origin = ORIGIN_AIRPORTS.find(([code]) => code === trip.origin)?.[1] ?? trip.origin;
  return [
    ['Cidade', trip.city ? [trip.city.name, trip.city.region].filter(Boolean).join(' · ') : 'A definir'],
    ['Quando', whenLabel(trip)],
    ['Quem', `${trip.group ? `${TRAVEL_GROUPS[trip.group]} · ` : ''}${people(trip.travelers)}`],
    ['Voo', `${origin} → ${trip.city?.name || country?.capital || country?.namePt || ''} · ${CABINS[trip.cabin]}`],
    ['Pagamento', trip.payWith ? PAY_OPTIONS[trip.payWith] : '—'],
    ['Estilo', trip.style ? TRAVEL_STYLES[trip.style] : '—'],
    ['Hospedagem', LODGING_LEVELS[trip.lodging]],
    ['Locomoção', trip.transport ? LOCAL_TRANSPORT[trip.transport] : '—']
  ];
}
