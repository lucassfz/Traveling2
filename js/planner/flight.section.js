// Seção "Voo e milhas" do planejador: sugere a linha de voo pela estimativa da
// aba Voos, os gastos no destino pelos perfis revisados da Descoberta e
// compara dinheiro × pontos com os valores do usuário.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel, formatProvenanceDate } from '../provenance.js';
import { estimateRoute, exchangeRateLabel } from '../drawer/flights.tab.js';
import { formatMiles } from '../pricing.engine.js';
import { tripDays, tripMonth, updateLine } from './trip.model.js';
import { compareCashAndMiles, flightSuggestion, localCostSuggestion } from './planner.estimates.js';
import { formatBRL, parseMoneyInput } from './planner.ui.js';

const CABINS = Object.freeze({ economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' });

function moneyValue(value) {
  return value === null || value === undefined ? '' : String(value).replace('.', ',');
}

/**
 * @param {object} deps
 * @param {object} deps.airportRepository
 * @param {(countryKey: string) => Promise<object|null>} deps.resolveDestinationAirport
 * @param {() => object|null} deps.getFx  Câmbio atual ({ rate, date, kind, label, source }).
 * @param {object} deps.countries
 */
export function createFlightSection({ airportRepository, resolveDestinationAirport, getFx, countries }) {
  let lastEstimate = null; // { tripId, estimate, origin, destination }

  function milesResult(trip) {
    const comparison = compareCashAndMiles(trip.miles);
    if (!comparison) return '<p class="planner-hint">Preencha o preço em dinheiro e os pontos pedidos para comparar.</p>';
    if (comparison.error) return `<p class="planner-error">${escapeHtml(comparison.error)}</p>`;
    const verdict = comparison.better === 'points'
      ? `Como o seu milheiro custa ${formatBRL(comparison.myCost, { cents: true })}, pagar com pontos rende mais nesta passagem.`
      : comparison.better === 'cash'
        ? `Como o seu milheiro custa ${formatBRL(comparison.myCost, { cents: true })}, pagar em dinheiro rende mais nesta passagem.`
        : comparison.better === 'equal' ? 'As duas formas de pagamento se equivalem nesta passagem.'
          : 'Informe quanto custa o seu milheiro para saber qual forma rende mais.';
    return `
      <p>Usar pontos equivale a <strong>${formatBRL(comparison.perThousand, { cents: true })} por 1.000 pontos</strong> (cerca de ${formatBRL(comparison.replaced)} pagos com pontos).</p>
      <p>${escapeHtml(verdict)}</p>
      ${provenanceLabel('calculated', { detail: 'preço, pontos, taxas e milheiro informados por você' })}`;
  }

  function awardsReference(trip) {
    if (!lastEstimate || lastEstimate.tripId !== trip.id) return '';
    const awards = Object.entries(lastEstimate.estimate.awards)
      .map(([program, range]) => `${escapeHtml(program)}: ${escapeHtml(formatMiles(range.low))}–${escapeHtml(formatMiles(range.high))}`).join(' · ');
    return `<p class="planner-hint">Referência por trecho e pessoa — ${awards}.</p>
      ${provenanceLabel('estimate', { detail: 'milhas por distância, mês e cabine; confirme no programa' })}`;
  }

  async function suggestFlight(trip, ui, status) {
    status.textContent = 'Calculando estimativa…';
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      resolveDestinationAirport(trip.countryKey)
    ]);
    if (!origin) { status.textContent = `Aeroporto de origem ${trip.origin} não encontrado.`; return; }
    if (!destination) { status.textContent = 'Este destino ainda não tem aeroporto para estimativa de voo.'; return; }
    if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) { status.textContent = 'Origem e destino são o mesmo aeroporto.'; return; }
    const month = tripMonth(trip) ?? new Date().getMonth();
    const fx = getFx();
    const estimate = estimateRoute({ origin, destination, cabin: trip.cabin, month, fx });
    const suggestion = flightSuggestion(estimate, { travelers: trip.travelers });
    if (!suggestion) { status.textContent = 'Câmbio indisponível agora: não dá para estimar em reais. Tente de novo em instantes.'; return; }
    lastEstimate = { tripId: trip.id, estimate, origin, destination };
    const codes = `${origin.iata || origin.icao} ⇄ ${destination.iata || destination.icao}`;
    const line = {
      category: 'flights',
      amountBRL: suggestion.amountBRL,
      status: 'estimate',
      note: `${codes} · ${CABINS[trip.cabin]} · ${trip.travelers} ${trip.travelers === 1 ? 'pessoa' : 'pessoas'}`,
      source: {
        kind: 'traveling-estimate',
        model: 'pricing.engine',
        detail: `ida e volta; faixa de ${formatBRL(suggestion.perLegLow)}–${formatBRL(suggestion.perLegHigh)} por trecho e pessoa; câmbio ${fx.label}${fx.date ? ` de ${formatProvenanceDate(fx.date)}` : ''}`,
        fx: `${fx.label} ${fx.date ?? ''}`.trim()
      }
    };
    // Uma sugestão de voo por viagem: atualiza a que já existe.
    const existing = trip.lines.find(item => item.source?.model === 'pricing.engine');
    if (existing) {
      ui.store.save(updateLine(trip, existing.id, line));
      ui.render();
    } else ui.addLine(line);
    const fresh = ui.element.querySelector('#planner-flight-status');
    if (fresh) fresh.textContent = `Voo estimado em ${formatBRL(suggestion.amountBRL)} (${codes}, ida e volta). Substitua pelo preço real quando cotar.`;
    ui.element.querySelector('#planner-awards').innerHTML = awardsReference(ui.trip);
  }

  async function suggestLocal(trip, ui, status) {
    status.textContent = 'Buscando faixa revisada…';
    const [{ discoveryCoverage }] = await Promise.all([import('../destination.discovery.js')]);
    const profiles = discoveryCoverage(countries).profiles.filter(profile => profile.countryKey === trip.countryKey);
    const suggestion = localCostSuggestion(profiles, { days: tripDays(trip), travelers: trip.travelers });
    if (!suggestion) { status.textContent = 'Ainda não há faixa revisada de gastos para este destino. Preencha os valores manualmente.'; return; }
    const line = {
      category: 'local',
      amountBRL: suggestion.amountBRL,
      status: 'estimate',
      note: `Hospedagem simples, refeições, transporte e passeios · ${suggestion.days} dias`,
      source: {
        kind: 'traveling-estimate',
        model: 'discovery.localWeekBRL',
        detail: `faixa de ${formatBRL(suggestion.low)}–${formatBRL(suggestion.high)} por pessoa por semana${suggestion.regions.length ? ` (${suggestion.regions.slice(0, 2).join('; ')})` : ''}${suggestion.reviewedOn ? `, revisada em ${formatProvenanceDate(suggestion.reviewedOn)}` : ''}`,
        reviewedOn: suggestion.reviewedOn
      }
    };
    const existing = trip.lines.find(item => item.source?.model === 'discovery.localWeekBRL');
    if (existing) {
      ui.store.save(updateLine(trip, existing.id, line));
      ui.render();
    } else ui.addLine(line);
    const fresh = ui.element.querySelector('#planner-flight-status');
    if (fresh) fresh.textContent = `Gastos no destino estimados em ${formatBRL(suggestion.amountBRL)} para ${suggestion.days} dias.`;
  }

  return {
    id: 'flight',
    render(trip) {
      const miles = trip.miles ?? {};
      return `
        <section class="planner-section" id="planner-flight" aria-labelledby="planner-flight-title">
          <div class="planner-section__head">
            <h3 class="planner-section__title" id="planner-flight-title">Voo e milhas</h3>
          </div>
          <div class="form-grid">
            <label class="form-field" for="planner-cabin"><span class="form-field__label">Cabine</span>
              <select class="form-field__control" id="planner-cabin" data-planner-field="cabin">
                ${Object.entries(CABINS).map(([id, label]) => `<option value="${id}" ${id === trip.cabin ? 'selected' : ''}>${label}</option>`).join('')}
              </select></label>
          </div>
          <div class="planner-line-actions">
            <button class="secondary-button" type="button" data-flight-action="suggest-flight">Sugerir voo (estimativa)</button>
            <button class="secondary-button" type="button" data-flight-action="suggest-local">Sugerir gastos no destino</button>
          </div>
          <p class="planner-hint" id="planner-flight-status" role="status" aria-live="polite">As sugestões entram no orçamento como estimativas. Troque pelo preço real quando cotar.</p>
          <div id="planner-awards">${awardsReference(trip)}</div>
          <div class="planner-subsection">
            <h4 class="planner-subsection__title">Dinheiro ou pontos?</h4>
            <div class="form-grid">
              <label class="form-field" for="planner-fare"><span class="form-field__label">Preço em dinheiro (R$)</span>
                <input class="form-field__control" id="planner-fare" type="text" inputmode="decimal" autocomplete="off" value="${escapeHtml(moneyValue(miles.fareBRL))}" data-miles-field="fareBRL"></label>
              <label class="form-field" for="planner-points"><span class="form-field__label">Pontos pedidos</span>
                <input class="form-field__control" id="planner-points" type="text" inputmode="numeric" autocomplete="off" value="${escapeHtml(miles.points ?? '')}" data-miles-field="points"></label>
              <label class="form-field" for="planner-taxes"><span class="form-field__label">Taxas no resgate (R$)</span>
                <input class="form-field__control" id="planner-taxes" type="text" inputmode="decimal" autocomplete="off" value="${escapeHtml(moneyValue(miles.taxesBRL))}" data-miles-field="taxesBRL"></label>
              <label class="form-field" for="planner-mycost"><span class="form-field__label">Seu custo por 1.000 pontos (R$)</span>
                <input class="form-field__control" id="planner-mycost" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 70" value="${escapeHtml(moneyValue(miles.myCostPer1000BRL))}" data-miles-field="myCostPer1000BRL"></label>
            </div>
            <div class="planner-miles-result" id="planner-miles-result" aria-live="polite">${milesResult(trip)}</div>
          </div>
          ${exchangeRateLabel(getFx())}
        </section>`;
    },
    bind(root, _trip, ui) {
      const section = root.querySelector('#planner-flight');
      if (!section) return;
      section.addEventListener('click', event => {
        const button = event.target.closest('[data-flight-action]');
        const trip = ui.trip;
        if (!button || !trip) return;
        const status = section.querySelector('#planner-flight-status');
        button.disabled = true;
        const task = button.dataset.flightAction === 'suggest-flight' ? suggestFlight(trip, ui, status) : suggestLocal(trip, ui, status);
        task.catch(() => { status.textContent = 'Não foi possível calcular agora. Verifique a conexão e tente de novo.'; })
          .finally(() => { button.disabled = false; });
      });
      section.addEventListener('change', event => {
        const field = event.target.dataset.milesField;
        const trip = ui.trip;
        if (!field || !trip) return;
        const raw = event.target.value.trim();
        const value = raw ? (field === 'points' ? Number(raw.replace(/\D/g, '')) || null : parseMoneyInput(raw)) : null;
        if (raw && value === null) {
          event.target.setCustomValidity('Digite um número, por exemplo 1.200,50');
          event.target.reportValidity();
          return;
        }
        event.target.setCustomValidity('');
        ui.update({ miles: { ...(trip.miles ?? {}), [field]: value } });
      });
    },
    refresh(root, trip) {
      const result = root.querySelector('#planner-miles-result');
      if (result) result.innerHTML = milesResult(trip);
    }
  };
}
