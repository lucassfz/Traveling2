// Cálculos do planejador que usam dados do Traveling. Funções puras, testadas
// em scripts/validate-planner.js. Nenhuma inventa valor: sem dado de origem,
// devolvem null e a interface pede que o usuário preencha.
//
// Moeda: tudo o que entra no orçamento é real (BRL). Cada número é convertido
// uma única vez, a partir do seu valor de origem (dólar da estimativa de voo,
// moeda digitada num gasto). Os perfis da Descoberta já estão em reais e não
// passam por câmbio.
import { evaluateRedemption } from '../miles.tools.js';
import { formatProvenanceDate } from '../provenance.js';
import { LODGING_LEVELS, normalizeLine, tripDays, tripNights } from './trip.model.js';
import { convertToBRL, rateFor } from './currency.js';
import { formatBRL } from './money.js';

const roundTo = (value, step) => Math.round(value / step) * step;
const people = count => `${count} ${count === 1 ? 'pessoa' : 'pessoas'}`;
const CABIN_LABELS = { economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' };

// ---------- Gastos no destino ----------

// Os perfis revisados (localWeekBRL) descrevem 1 pessoa, 7 dias/7 noites,
// quarto privativo simples, refeições, transporte local e passeios básicos
// (TRIP_REFERENCE em destination.profiles.js). Para escalar esse valor sem
// multiplicar a hospedagem por pessoa, ele é dividido em partes editoriais:
export const LOCAL_SHARES = Object.freeze({ lodging: 0.45, food: 0.30, transport: 0.10, activities: 0.15 });
// Hospedagem: preço por quarto (2 pessoas por quarto) ou por cama (albergue),
// relativo ao quarto simples da referência.
export const LODGING_FACTORS = Object.freeze({
  hostel: { factor: 0.4, per: 'bed' },
  simple: { factor: 1, per: 'room' },
  comfort: { factor: 1.8, per: 'room' },
  superior: { factor: 3, per: 'room' }
});
export const PEOPLE_PER_ROOM = 2;
// Estadia longa: depois de 4 semanas, aluguel mensal, mercado em vez de
// restaurante, passe de transporte e menos passeios pagos por dia.
export const LONG_STAY = Object.freeze({ afterDays: 28, lodging: 0.6, food: 0.6, transport: 0.5, activities: 0.3 });

// Dias "equivalentes": os primeiros 28 contam inteiros, os seguintes pelo fator.
function taperedUnits(count, factor) {
  return Math.min(count, LONG_STAY.afterDays) + Math.max(0, count - LONG_STAY.afterDays) * factor;
}

/**
 * Custo no destino a partir do valor semanal por pessoa da referência.
 * @returns {{ lodging: number, food: number, transport: number, activities: number, total: number, rooms: number }}
 */
export function localCostBreakdown(weekPerPersonBRL, { days, nights, travelers = 1, lodging = 'simple' }) {
  const perDay = weekPerPersonBRL / 7;
  const level = LODGING_FACTORS[lodging] ?? LODGING_FACTORS.simple;
  const count = Math.max(1, travelers);
  const rooms = level.per === 'bed' ? count : Math.ceil(count / PEOPLE_PER_ROOM);
  const lodgingCost = perDay * LOCAL_SHARES.lodging * level.factor * rooms * taperedUnits(nights, LONG_STAY.lodging);
  const daily = key => perDay * LOCAL_SHARES[key] * count * taperedUnits(days, LONG_STAY[key]);
  const parts = { lodging: lodgingCost, food: daily('food'), transport: daily('transport'), activities: daily('activities') };
  return { ...parts, total: Object.values(parts).reduce((sum, value) => sum + value, 0), rooms };
}

// Sem datas, usa a própria referência: 7 dias e 7 noites.
function stayLength(trip) {
  const days = tripDays(trip);
  return days === null ? { days: 7, nights: 7 } : { days, nights: tripNights(trip) };
}

/**
 * Gastos no destino a partir dos perfis revisados da Descoberta. Com vários
 * perfis no país, usa a média dos pontos médios e mostra a faixa do menor ao
 * maior valor.
 * @param {object[]} profiles
 * @param {object} [options] { days, nights, travelers, lodging } — ou passe `trip`.
 * @returns {{ amountBRL: number, low: number, high: number, weekLow: number, weekHigh: number, days: number, nights: number, regions: string[], reviewedOn: string | null, basis: object } | null}
 */
export function localCostSuggestion(profiles, { trip = null, days = null, nights = null, travelers = 1, lodging = 'simple' } = {}) {
  const usable = (profiles ?? []).filter(profile => Array.isArray(profile?.localWeekBRL)
    && profile.localWeekBRL.length === 2 && profile.localWeekBRL.every(value => Number.isFinite(value) && value > 0));
  if (!usable.length) return null;
  const weekLow = Math.min(...usable.map(profile => profile.localWeekBRL[0]));
  const weekHigh = Math.max(...usable.map(profile => profile.localWeekBRL[1]));
  const weekMid = usable.reduce((sum, profile) => sum + (profile.localWeekBRL[0] + profile.localWeekBRL[1]) / 2, 0) / usable.length;
  const reviewed = usable.map(profile => profile.reviewedOn).filter(Boolean).sort();
  const regions = [...new Set(usable.map(profile => profile.region).filter(Boolean))];
  const basis = { weekMid, weekLow, weekHigh, ...(regions.length ? { regions: regions.slice(0, 2).join('; ') } : {}), ...(reviewed[0] ? { reviewedOn: reviewed[0] } : {}) };
  const stay = trip ? stayLength(trip) : Number.isInteger(days) && days > 0 ? { days, nights: Number.isInteger(nights) ? nights : days - 1 } : { days: 7, nights: 7 };
  const options = { ...stay, travelers: trip?.travelers ?? travelers, lodging: trip?.lodging ?? lodging };
  return {
    amountBRL: roundTo(localCostBreakdown(weekMid, options).total, 10),
    low: roundTo(localCostBreakdown(weekLow, options).total, 10),
    high: roundTo(localCostBreakdown(weekHigh, options).total, 10),
    weekLow,
    weekHigh,
    days: stay.days,
    nights: stay.nights,
    regions,
    reviewedOn: reviewed[0] ?? null,
    basis
  };
}

/** Linha "Gastos no destino" do orçamento, calculada a partir da base guardada. */
export function localLine(basis, trip) {
  const { days, nights } = stayLength(trip);
  const options = { days, nights, travelers: trip.travelers, lodging: trip.lodging };
  const amountBRL = roundTo(localCostBreakdown(basis.weekMid, options).total, 10);
  const low = roundTo(localCostBreakdown(basis.weekLow ?? basis.weekMid, options).total, 10);
  const high = roundTo(localCostBreakdown(basis.weekHigh ?? basis.weekMid, options).total, 10);
  const long = days > LONG_STAY.afterDays ? '; após 4 semanas, valores de estadia longa' : '';
  return {
    category: 'local',
    amountBRL,
    status: 'estimate',
    note: `${LODGING_LEVELS[trip.lodging] ?? LODGING_LEVELS.simple}, refeições, transporte e passeios · ${days} ${days === 1 ? 'dia' : 'dias'} · ${people(trip.travelers)}`,
    source: {
      kind: 'traveling-estimate',
      model: 'discovery.localWeekBRL',
      detail: `faixa ${formatBRL(low)}–${formatBRL(high)} para a viagem; base ${formatBRL(basis.weekLow ?? basis.weekMid)}–${formatBRL(basis.weekHigh ?? basis.weekMid)} por pessoa/semana${basis.regions ? ` (${basis.regions})` : ''}${long}${basis.reviewedOn ? `, revisada em ${formatProvenanceDate(basis.reviewedOn)}` : ''}`,
      ...(basis.reviewedOn ? { reviewedOn: basis.reviewedOn } : {}),
      basis
    }
  };
}

// ---------- Voo ----------

/**
 * Passagem sugerida a partir de uma estimativa de trecho (pricing.engine):
 * média da faixa × 2 trechos (ida e volta) × viajantes. A conversão para reais
 * é feita uma vez, a partir do valor em dólar.
 * @returns {{ amountBRL: number, perLegLow: number, perLegHigh: number, basis: object } | null}
 */
export function flightSuggestion(estimate, { travelers = 1, brlPerUsd = null } = {}) {
  const usd = estimate?.cash?.usd;
  const brl = estimate?.cash?.brl;
  const rate = Number.isFinite(brlPerUsd) && brlPerUsd > 0 ? brlPerUsd : null;
  if (usd && Number.isFinite(usd.low) && Number.isFinite(usd.high) && rate) {
    return {
      amountBRL: roundTo(((usd.low + usd.high) / 2) * rate * 2 * Math.max(1, travelers), 10),
      perLegLow: roundTo(usd.low * rate, 10),
      perLegHigh: roundTo(usd.high * rate, 10),
      basis: { usdLow: usd.low, usdHigh: usd.high }
    };
  }
  // Estimativa já em reais (sem a parte em dólar): usa como está.
  if (!brl || !Number.isFinite(brl.low) || !Number.isFinite(brl.high)) return null;
  return {
    amountBRL: roundTo(((brl.low + brl.high) / 2) * 2 * Math.max(1, travelers), 10),
    perLegLow: brl.low,
    perLegHigh: brl.high,
    basis: { brlLow: brl.low, brlHigh: brl.high }
  };
}

/**
 * Linha de passagens a partir da base guardada.
 * @param {object} basis { usdLow, usdHigh } ou { brlLow, brlHigh }, mais route e cabin.
 * @param {object} usd   Cotação do dólar ({ rate, date, label }) — usada só com base em dólar.
 */
export function flightLine(basis, trip, usd) {
  const fromUsd = Number.isFinite(basis.usdLow) && Number.isFinite(basis.usdHigh);
  if (fromUsd && !(usd?.rate > 0)) return null;
  const perLeg = fromUsd
    ? { low: basis.usdLow * usd.rate, high: basis.usdHigh * usd.rate }
    : { low: basis.brlLow, high: basis.brlHigh };
  if (!Number.isFinite(perLeg.low) || !Number.isFinite(perLeg.high)) return null;
  const cabin = CABIN_LABELS[basis.cabin] ?? CABIN_LABELS[trip.cabin];
  const fxText = fromUsd ? `${usd.label}${usd.date ? ` ${usd.date}` : ''}` : null;
  return {
    category: 'flights',
    amountBRL: roundTo(((perLeg.low + perLeg.high) / 2) * 2 * Math.max(1, trip.travelers), 10),
    status: 'estimate',
    note: `${basis.route ? `${basis.route} · ` : ''}${cabin} · ${people(trip.travelers)}`,
    source: {
      kind: 'traveling-estimate',
      model: 'pricing.engine',
      detail: `ida e volta; faixa de ${formatBRL(roundTo(perLeg.low, 10))}–${formatBRL(roundTo(perLeg.high, 10))} por trecho e pessoa${fromUsd ? `; câmbio ${usd.label}${usd.date ? ` de ${formatProvenanceDate(usd.date)}` : ''}` : ''}`,
      ...(fxText ? { fx: fxText } : {}),
      basis
    }
  };
}

// ---------- Recalcular o orçamento ----------

// Linhas salvas antes da base existir: recupera os números da descrição que o
// próprio Traveling gravou. Sem eles, a linha fica como está.
const BRL_PAIR = /R\$\s*([\d.]+)–R\$\s*([\d.]+)/u;
const brlNumber = value => Number(value.replaceAll('.', ''));
function legacyBasis(line) {
  const detail = line.source?.detail ?? '';
  const pair = BRL_PAIR.exec(detail);
  if (!pair) return null;
  const [low, high] = [brlNumber(pair[1]), brlNumber(pair[2])];
  if (!(low > 0 && high >= low)) return null;
  if (line.source.model === 'discovery.localWeekBRL' && detail.includes('por pessoa por semana')) {
    return { weekMid: (low + high) / 2, weekLow: low, weekHigh: high, ...(line.source.reviewedOn ? { reviewedOn: line.source.reviewedOn } : {}) };
  }
  if (line.source.model === 'pricing.engine' && detail.includes('por trecho e pessoa')) {
    const route = /^([A-Z0-9]{3,4} ⇄ [A-Z0-9]{3,4})/.exec(line.note ?? '')?.[1];
    return { brlLow: low, brlHigh: high, ...(route ? { route } : {}) };
  }
  return null;
}

// Comparação independente da ordem das chaves (o armazenamento normaliza a
// ordem; sem isso, todo recálculo pareceria mudança e salvaria em laço).
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
function sameLine(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

/**
 * Recalcula o que o Planner deriva: estimativas do Traveling (datas, viajantes,
 * hospedagem, câmbio) e gastos digitados em outra moeda (câmbio). Gastos em
 * reais digitados pelo usuário nunca mudam.
 * @param {object} trip
 * @param {object} rates Tabela de currency.rateTable().
 * @returns {object[] | null} Linhas novas, ou null quando nada mudou.
 */
export function repriceLines(trip, rates) {
  let changed = false;
  const lines = (trip?.lines ?? []).map(line => {
    let next = line;
    if (line.source?.kind === 'traveling-estimate') {
      const basis = line.source.basis ?? legacyBasis(line);
      const built = !basis ? null
        : line.source.model === 'discovery.localWeekBRL' && Number.isFinite(basis.weekMid) ? localLine(basis, trip)
          : line.source.model === 'pricing.engine' ? flightLine(basis, trip, rateFor('USD', rates))
            : null;
      if (built) next = { ...line, amountBRL: built.amountBRL, note: built.note, source: built.source };
    } else if (line.currency && Number.isFinite(line.amount)) {
      const converted = convertToBRL(line.amount, line.currency, rates);
      if (converted) next = { ...line, amountBRL: converted.amountBRL, fx: { rate: converted.rate, date: converted.date } };
    }
    // Mesma normalização do armazenamento (espaços, limites de texto), para que
    // um recálculo sem efeito real nunca pareça diferente do que está salvo.
    if (next !== line) next = normalizeLine(next) ?? line;
    if (!sameLine(next, line)) changed = true;
    return next;
  });
  return changed ? lines : null;
}

// ---------- Milhas ----------

/**
 * Dinheiro × milhas com os valores do usuário. `myCostPer1000BRL` é quanto ele
 * paga (ou deixa de ganhar) por 1.000 pontos; sem esse valor, só informa o
 * valor obtido por milheiro.
 */
export function compareCashAndMiles(miles) {
  if (!miles?.fareBRL || !miles?.points) return null;
  const result = evaluateRedemption({ cashFare: miles.fareBRL, points: miles.points, fees: miles.taxesBRL ?? 0 });
  if (result.error) return { error: result.error };
  const myCost = Number.isFinite(miles.myCostPer1000BRL) && miles.myCostPer1000BRL > 0 ? miles.myCostPer1000BRL : null;
  return {
    perThousand: result.perThousand,
    replaced: result.replaced,
    myCost,
    better: myCost === null ? null : result.perThousand > myCost ? 'points' : result.perThousand < myCost ? 'cash' : 'equal'
  };
}

// Programas comparados automaticamente, na ordem de prioridade. `engineKey` é a
// chave em pricing.engine (tabela de milhas por distância, mês e cabine).
// `milheiroBRL` é uma referência editorial do Traveling para o custo de 1.000
// milhas (compra em promoção ou valor de venda no mercado). Não é cotação: o
// usuário pode trocar pelo seu custo.
export const AWARD_PROGRAMS = Object.freeze([
  { id: 'latam', name: 'LATAM Pass', engineKey: 'LATAM Pass', airlines: 'LATAM e companhias parceiras', milheiroBRL: 28 },
  { id: 'smiles', name: 'Smiles', engineKey: 'Smiles', airlines: 'GOL e companhias parceiras', milheiroBRL: 18 },
  { id: 'azul', name: 'Azul Fidelidade', engineKey: 'Azul', airlines: 'Azul e companhias parceiras', milheiroBRL: 16 }
]);
export const MILHEIRO_REFERENCE_DATE = '2026-11';

// Taxas de embarque e impostos de um resgate, em dólar por trecho e pessoa.
// Faixa editorial: voos internacionais de parceiras podem cobrar mais
// (sobretaxa de combustível), que nenhuma fonte pública permite prever.
export function awardFeesUsdPerLeg({ distanceKm, domestic = false, cabin = 'economy' }) {
  const base = domestic ? 10 : distanceKm < 4_500 ? 45 : distanceKm < 9_000 ? 85 : 110;
  return base * (cabin === 'business' ? 1.3 : cabin === 'premium' ? 1.15 : 1);
}

/**
 * Compara pagar em dinheiro com resgatar em cada programa, ida e volta para
 * todos os viajantes, sem pedir números ao usuário.
 * @param {object} options
 * @param {object} options.estimate        Resultado de estimateFlightPricing (por trecho e pessoa).
 * @param {number} options.travelers
 * @param {number} options.brlPerUsd        Cotação do dólar (para preço e taxas).
 * @param {boolean} [options.domestic]      Origem e destino no mesmo país.
 * @param {string}  [options.cabin]
 * @param {number|null} [options.cashBRL]   Preço em dinheiro que o usuário cotou (total); sem ele, a estimativa.
 * @param {number|null} [options.myCostPer1000BRL] Custo do milheiro do usuário, para todos os programas.
 */
export function awardComparison({ estimate, travelers = 1, brlPerUsd, domestic = false, cabin = 'economy', cashBRL = null, myCostPer1000BRL = null }) {
  const rate = Number.isFinite(brlPerUsd) && brlPerUsd > 0 ? brlPerUsd : null;
  if (!estimate?.awards || !rate) return null;
  const legs = 2 * Math.max(1, travelers);
  const usd = estimate.cash?.usd;
  const estimatedCash = usd ? roundTo(((usd.low + usd.high) / 2) * rate * legs, 10) : null;
  const quoted = Number.isFinite(cashBRL) && cashBRL > 0 ? cashBRL : null;
  const cash = quoted ?? estimatedCash;
  if (!cash) return null;
  const feesBRL = roundTo(awardFeesUsdPerLeg({ distanceKm: estimate.distanceKm, domestic, cabin }) * rate * legs, 10);
  const ownCost = Number.isFinite(myCostPer1000BRL) && myCostPer1000BRL > 0 ? myCostPer1000BRL : null;
  const options = AWARD_PROGRAMS.filter(program => estimate.awards[program.engineKey]).map(program => {
    const range = estimate.awards[program.engineKey];
    const miles = roundTo(((range.low + range.high) / 2) * legs, 500);
    const milheiro = ownCost ?? program.milheiroBRL;
    const milesCostBRL = roundTo(miles / 1000 * milheiro, 10);
    const effectiveBRL = milesCostBRL + feesBRL;
    return {
      id: program.id,
      name: program.name,
      airlines: program.airlines,
      miles,
      milesLow: roundTo(range.low * legs, 500),
      milesHigh: roundTo(range.high * legs, 500),
      feesBRL,
      milheiroBRL: milheiro,
      milheiroSource: ownCost ? 'user' : 'reference',
      milesCostBRL,
      effectiveBRL,
      savingBRL: cash - effectiveBRL,
      // Quanto cada 1.000 milhas "rendem" neste resgate.
      valuePer1000BRL: Math.round((cash - feesBRL) / miles * 1000 * 100) / 100
    };
  }).sort((a, b) => a.effectiveBRL - b.effectiveBRL);
  if (!options.length) return null;
  const best = options[0];
  return {
    cashBRL: cash,
    cashSource: quoted ? 'quote' : 'estimate',
    legs,
    options,
    best,
    recommendation: best.savingBRL > 0 ? 'miles' : 'cash'
  };
}
