// Cálculos do planejador que usam dados do Traveling. Funções puras, testadas
// em scripts/validate-planner.js. Nenhuma inventa valor: sem dado de origem,
// devolvem null e a interface pede que o usuário preencha.
import { evaluateRedemption } from '../miles.tools.js';

const roundTo = (value, step) => Math.round(value / step) * step;

/**
 * Linha de voo sugerida a partir de uma estimativa de trecho (pricing.engine):
 * média da faixa × 2 trechos (ida e volta) × viajantes.
 * @returns {{ amountBRL: number, perLegLow: number, perLegHigh: number } | null}
 */
export function flightSuggestion(estimate, { travelers = 1 } = {}) {
  const brl = estimate?.cash?.brl;
  if (!brl || !Number.isFinite(brl.low) || !Number.isFinite(brl.high)) return null;
  const perLegMid = (brl.low + brl.high) / 2;
  return {
    amountBRL: roundTo(perLegMid * 2 * Math.max(1, travelers), 10),
    perLegLow: brl.low,
    perLegHigh: brl.high
  };
}

/**
 * Gastos no destino a partir dos perfis revisados da Descoberta
 * (localWeekBRL: 1 pessoa, 7 dias, hospedagem simples, refeições, transporte
 * local e passeios básicos). Com vários perfis no país, usa a faixa entre o
 * menor e o maior valor. Sem datas, considera 7 dias.
 * @returns {{ amountBRL: number, low: number, high: number, days: number, regions: string[], reviewedOn: string | null } | null}
 */
export function localCostSuggestion(profiles, { days = null, travelers = 1 } = {}) {
  const usable = (profiles ?? []).filter(profile => Array.isArray(profile?.localWeekBRL)
    && profile.localWeekBRL.length === 2 && profile.localWeekBRL.every(value => Number.isFinite(value) && value > 0));
  if (!usable.length) return null;
  const low = Math.min(...usable.map(profile => profile.localWeekBRL[0]));
  const high = Math.max(...usable.map(profile => profile.localWeekBRL[1]));
  const tripDays = Number.isInteger(days) && days > 0 ? days : 7;
  const reviewed = usable.map(profile => profile.reviewedOn).filter(Boolean).sort();
  return {
    amountBRL: roundTo(((low + high) / 2) * (tripDays / 7) * Math.max(1, travelers), 10),
    low,
    high,
    days: tripDays,
    regions: [...new Set(usable.map(profile => profile.region).filter(Boolean))],
    reviewedOn: reviewed[0] ?? null
  };
}

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
