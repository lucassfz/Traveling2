// Etapas "Voo" e parte de "Orçamento" do Planner: sugere a passagem pela
// estimativa da aba Voos, compara dinheiro × pontos com os valores do usuário e
// sugere os gastos no destino pelos perfis revisados da Descoberta.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel, formatProvenanceDate } from '../provenance.js';
import { estimateRoute, exchangeRateLabel } from '../drawer/flights.tab.js';
import { formatMiles } from '../pricing.engine.js';
import { tripDays, tripMonth, updateLine } from './trip.model.js';
import { compareCashAndMiles, flightSuggestion, localCostSuggestion } from './planner.estimates.js';
import { formatBRL, parseMoneyInput } from './planner.ui.js';

export const CABINS = Object.freeze({ economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' });

function moneyValue(value) {
  return value === null || value === undefined ? '' : String(value).replace('.', ',');
}

// Grava a sugestão (uma por modelo) e redesenha a etapa atual.
function saveSuggestion(ui, model, line) {
  const trip = ui.trip;
  const existing = trip.lines.find(item => item.source?.model === model);
  if (existing) ui.store.save(updateLine(trip, existing.id, line));
  else ui.addLine(line);
  ui.render();
}

/**
 * @param {object} deps
 * @param {object} deps.airportRepository
 * @param {(countryKey: string) => Promise<object|null>} deps.resolveDestinationAirport
 * @param {() => object|null} deps.getFx  Câmbio atual ({ rate, date, kind, label, source }).
 * @param {object} deps.countries
 * @returns {object[]} Seções do passo a passo: { id, step, render, bind, refresh }.
 */
export function createFlightSections({ airportRepository, resolveDestinationAirport, getFx, countries }) {
  let lastEstimate = null; // { tripId, estimate }

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
    return `<p class="planner-hint">Em milhas, por trecho e pessoa — ${awards}.</p>
      ${provenanceLabel('estimate', { detail: 'milhas por distância, mês e cabine; confirme no programa' })}`;
  }

  async function suggestFlight(trip, ui, setStatus) {
    setStatus('Calculando estimativa…');
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      resolveDestinationAirport(trip.countryKey)
    ]);
    if (!origin) return setStatus(`Aeroporto de origem ${trip.origin} não encontrado. Corrija na etapa Datas.`);
    if (!destination) return setStatus('Este destino ainda não tem aeroporto para estimativa de voo. Adicione o preço manualmente.');
    if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) return setStatus('Origem e destino são o mesmo aeroporto.');
    const month = tripMonth(trip) ?? new Date().getMonth();
    const fx = getFx();
    const estimate = estimateRoute({ origin, destination, cabin: trip.cabin, month, fx });
    const suggestion = flightSuggestion(estimate, { travelers: trip.travelers });
    if (!suggestion) return setStatus('Câmbio indisponível agora: não dá para estimar em reais. Tente de novo em instantes.');
    lastEstimate = { tripId: trip.id, estimate };
    const codes = `${origin.iata || origin.icao} ⇄ ${destination.iata || destination.icao}`;
    saveSuggestion(ui, 'pricing.engine', {
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
    });
    setStatus(`Passagem estimada em ${formatBRL(suggestion.amountBRL)} (${codes}, ida e volta). Quando cotar, troque pelo preço real e marque como Cotação.`);
  }

  async function suggestLocal(trip, ui, setStatus) {
    setStatus('Buscando faixa revisada…');
    const { discoveryCoverage } = await import('../destination.discovery.js');
    const countryProfiles = discoveryCoverage(countries).profiles.filter(profile => profile.countryKey === trip.countryKey);
    // Viagem vinda da Descoberta: usa a região escolhida lá.
    const chosen = countryProfiles.find(profile => profile.id === trip.profileId);
    const suggestion = localCostSuggestion(chosen ? [chosen] : countryProfiles, { days: tripDays(trip), travelers: trip.travelers });
    if (!suggestion) return setStatus('Ainda não há faixa revisada de gastos para este destino. Adicione os valores abaixo.');
    saveSuggestion(ui, 'discovery.localWeekBRL', {
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
    });
    setStatus(`Gastos no destino estimados em ${formatBRL(suggestion.amountBRL)} para ${suggestion.days} dias. Ajuste ou detalhe por categoria.`);
  }

  // Liga um botão de sugestão: desabilita durante o cálculo e mostra o status
  // (que sobrevive ao redesenho da etapa).
  function bindSuggestion(root, ui, selector, task) {
    root.querySelector(selector)?.addEventListener('click', event => {
      const trip = ui.trip;
      if (!trip) return;
      const button = event.currentTarget;
      const setStatus = message => {
        ui.flash = message;
        const status = ui.element.querySelector('[data-planner-status]');
        if (status) status.textContent = message;
      };
      button.disabled = true;
      task(trip, ui, setStatus)
        .catch(() => setStatus('Não foi possível calcular agora. Verifique a conexão e tente de novo.'))
        .finally(() => { if (button.isConnected) button.disabled = false; });
    });
  }

  const flight = {
    id: 'flight',
    step: 3,
    render(trip, ui) {
      const miles = trip.miles ?? {};
      return `
        <div class="planner-card">
          <div class="planner-row">
            <label class="form-field planner-row__grow" for="planner-cabin"><span class="form-field__label">Cabine</span>
              <select class="form-field__control" id="planner-cabin" data-planner-field="cabin">
                ${Object.entries(CABINS).map(([id, label]) => `<option value="${id}" ${id === trip.cabin ? 'selected' : ''}>${label}</option>`).join('')}
              </select></label>
            <button class="primary-button" type="button" id="planner-suggest-flight">Estimar passagem</button>
          </div>
          <p class="planner-hint" data-planner-status role="status" aria-live="polite">${escapeHtml(ui.flash || `Ida e volta saindo de ${trip.origin}, para ${trip.travelers} ${trip.travelers === 1 ? 'pessoa' : 'pessoas'}. A estimativa entra no orçamento e pode ser trocada pelo preço real.`)}</p>
          <div id="planner-awards">${awardsReference(trip)}</div>
        </div>
        ${ui.linesBlock(trip, { categories: ['flights'], title: 'Passagens no orçamento', empty: 'Nenhuma passagem ainda. Estime acima ou adicione o preço que você encontrou.', addLabel: 'Adicionar passagem', addCategory: 'flights' })}
        <details class="planner-details" ${miles.fareBRL || miles.points ? 'open' : ''}>
          <summary>Vale a pena pagar com milhas?</summary>
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
        </details>
        ${exchangeRateLabel(getFx())}`;
    },
    bind(root, _trip, ui) {
      bindSuggestion(root, ui, '#planner-suggest-flight', suggestFlight);
      root.querySelector('.planner-details')?.addEventListener('change', event => {
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

  const local = {
    id: 'local',
    step: 4,
    render(trip, ui) {
      return `
        <div class="planner-card planner-card--quiet">
          <div class="planner-row">
            <div class="planner-row__grow">
              <strong class="planner-card__title">Gastos no destino</strong>
              <p class="planner-hint" data-planner-status role="status" aria-live="polite">${escapeHtml(ui.flash || 'Hospedagem simples, refeições, transporte e passeios pela faixa revisada do destino.')}</p>
            </div>
            <button class="secondary-button" type="button" id="planner-suggest-local">Sugerir valor</button>
          </div>
        </div>`;
    },
    bind(root, _trip, ui) {
      bindSuggestion(root, ui, '#planner-suggest-local', suggestLocal);
    }
  };

  return [flight, local];
}
