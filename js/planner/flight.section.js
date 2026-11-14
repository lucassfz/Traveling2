// Etapas "Voo" e parte de "Orçamento" do Planner: sugere a passagem pela
// estimativa da aba Voos, compara automaticamente dinheiro × milhas nos
// programas brasileiros e sugere os gastos no destino pelos perfis revisados da
// Descoberta.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { estimateRoute, exchangeRateLabel } from '../drawer/flights.tab.js';
import { formatMiles } from '../pricing.engine.js';
import { LODGING_LEVELS, isEstimateLine, tripMonth, updateLine } from './trip.model.js';
import { AWARD_PROGRAMS, MILHEIRO_REFERENCE_DATE, awardComparison, flightLine, flightSuggestion, localCostSuggestion, localLine } from './planner.estimates.js';
import { rateFor } from './currency.js';
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
 * @param {() => object|null} deps.getFx     Câmbio do dólar ({ rate, date, kind, label, source }).
 * @param {() => object} [deps.getRates]     Tabela de currency.rateTable().
 * @param {object} deps.countries
 * @returns {object[]} Seções do passo a passo: { id, step, render, bind, refresh }.
 */
export function createFlightSections({ airportRepository, resolveDestinationAirport, getFx, getRates = () => ({}), countries }) {
  // Rota por viagem/origem/destino/cabine/mês: { key, status, origin, destination, estimate, message }.
  let route = null;

  const usdRate = () => rateFor('USD', getRates()) ?? (getFx()?.rate > 0 ? getFx() : null);
  const routeKey = trip => [trip.id, trip.origin, trip.countryKey, trip.cabin, tripMonth(trip) ?? new Date().getMonth()].join('|');
  const routeCodes = value => `${value.origin.iata || value.origin.icao} ⇄ ${value.destination.iata || value.destination.icao}`;

  // Resolve aeroportos e calcula a estimativa da rota, sem pedir nada ao usuário.
  async function loadRoute(trip) {
    const key = routeKey(trip);
    if (route?.key === key && route.status !== 'error') return route;
    route = { key, status: 'loading' };
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      resolveDestinationAirport(trip.countryKey)
    ]);
    if (route.key !== key) return route;
    if (!origin) route = { key, status: 'error', message: `Aeroporto de origem ${trip.origin} não encontrado. Corrija na etapa Datas.` };
    else if (!destination) route = { key, status: 'error', message: 'Este destino ainda não tem aeroporto para estimativa de voo. Adicione o preço manualmente.' };
    else if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) route = { key, status: 'error', message: 'Origem e destino são o mesmo aeroporto.' };
    else {
      const month = tripMonth(trip) ?? new Date().getMonth();
      route = { key, status: 'ready', origin, destination, estimate: estimateRoute({ origin, destination, cabin: trip.cabin, month, fx: usdRate() }) };
    }
    return route;
  }

  // Preço em dinheiro que o usuário encontrou (passagens marcadas como cotação ou pagas).
  function quotedCash(trip) {
    const lines = trip.lines.filter(line => line.category === 'flights' && !isEstimateLine(line) && line.amountBRL > 0);
    return lines.length ? lines.reduce((sum, line) => sum + line.amountBRL, 0) : null;
  }

  function awardsBlock(trip) {
    if (!route || route.key !== routeKey(trip) || route.status === 'loading') {
      return '<p class="planner-hint">Calculando a comparação com milhas…</p>';
    }
    if (route.status === 'error') return `<p class="planner-hint">${escapeHtml(route.message)}</p>`;
    const usd = usdRate();
    const comparison = awardComparison({
      estimate: route.estimate,
      travelers: trip.travelers,
      brlPerUsd: usd?.rate ?? null,
      domestic: Boolean(route.origin.country) && route.origin.country === route.destination.country,
      cabin: trip.cabin,
      cashBRL: quotedCash(trip),
      myCostPer1000BRL: trip.miles?.myCostPer1000BRL ?? null
    });
    if (!comparison) return '<p class="planner-hint">Câmbio indisponível agora: não dá para comparar em reais. Tente de novo em instantes.</p>';
    const { best, cashBRL } = comparison;
    const who = `${trip.travelers === 1 ? '1 pessoa' : `${trip.travelers} pessoas`}, ida e volta`;
    const verdict = comparison.recommendation === 'miles'
      ? `Melhor opção: <strong>${escapeHtml(best.name)}</strong>. Você economiza cerca de <strong>${formatBRL(best.savingBRL)}</strong> em relação a pagar em dinheiro.`
      : `Pagar em <strong>dinheiro</strong> sai mais barato. O melhor resgate (${escapeHtml(best.name)}) custaria cerca de <strong>${formatBRL(-best.savingBRL)} a mais</strong>.`;
    const rows = comparison.options.map(option => {
      const isBest = option.id === best.id && comparison.recommendation === 'miles';
      const balance = option.savingBRL >= 0
        ? `<span class="planner-award__gain">economia de ${formatBRL(option.savingBRL)}</span>`
        : `<span class="planner-award__loss">${formatBRL(-option.savingBRL)} a mais</span>`;
      return `
        <li class="planner-award ${isBest ? 'planner-award--best' : ''}">
          <div class="planner-award__head">
            <strong>${escapeHtml(option.name)}</strong>
            ${isBest ? '<span class="planner-award__badge">Melhor opção</span>' : ''}
            <small>${escapeHtml(option.airlines)}</small>
          </div>
          <dl class="planner-award__facts">
            <div><dt>Milhas</dt><dd>${escapeHtml(formatMiles(option.miles))}</dd></div>
            <div><dt>Taxas</dt><dd>${formatBRL(option.feesBRL)}</dd></div>
            <div><dt>Custo efetivo</dt><dd>${formatBRL(option.effectiveBRL)}</dd></div>
            <div><dt>× dinheiro</dt><dd>${balance}</dd></div>
          </dl>
          <small class="planner-award__note">Faixa de ${escapeHtml(formatMiles(option.milesLow))} a ${escapeHtml(formatMiles(option.milesHigh))}. Milhas a ${formatBRL(option.milheiroBRL, { cents: true })} por 1.000 (${option.milheiroSource === 'user' ? 'seu custo' : 'referência'}); cada 1.000 milhas rendem ${formatBRL(option.valuePer1000BRL, { cents: true })} neste resgate.</small>
        </li>`;
    }).join('');
    const references = AWARD_PROGRAMS.map(program => `${program.name} ${formatBRL(program.milheiroBRL)}`).join(' · ');
    return `
      <p class="planner-award-headline">
        <span><strong>${formatBRL(cashBRL)}</strong> em dinheiro</span>
        <span class="planner-award-headline__vs">vs.</span>
        <span><strong>${escapeHtml(formatMiles(best.miles))}</strong> ${escapeHtml(best.name)} + <strong>${formatBRL(best.feesBRL)}</strong> em taxas</span>
      </p>
      <p class="planner-hint">${routeCodes(route)} · ${escapeHtml(CABINS[trip.cabin])} · ${escapeHtml(who)}. ${comparison.cashSource === 'quote' ? 'Preço em dinheiro: o que você registrou abaixo.' : 'Preço em dinheiro: estimativa do Traveling.'}</p>
      <p class="planner-award-verdict">${verdict}</p>
      <ul class="planner-awards">${rows}</ul>
      ${provenanceLabel('estimate', { detail: 'milhas, taxas e preço estimados por distância, mês e cabine. Disponibilidade de assentos e preços ao vivo não são consultados: confirme no programa antes de transferir pontos' })}
      ${provenanceLabel(trip.miles?.myCostPer1000BRL ? 'calculated' : 'estimate', {
        label: trip.miles?.myCostPer1000BRL ? 'Custo do milheiro informado por você' : 'Milheiro de referência Traveling',
        date: trip.miles?.myCostPer1000BRL ? null : MILHEIRO_REFERENCE_DATE,
        detail: trip.miles?.myCostPer1000BRL ? `${formatBRL(trip.miles.myCostPer1000BRL, { cents: true })} por 1.000 milhas em todos os programas` : `${references} por 1.000 milhas; valor de compra ou venda no mercado, não cotação`
      })}`;
  }

  function fillAwards(root, trip) {
    const slot = root.querySelector('#planner-awards');
    if (slot) slot.innerHTML = awardsBlock(trip);
  }

  // Comparação automática: calcula a rota ao abrir a etapa e quando cabine ou datas mudam.
  function updateAwards(root, trip, ui) {
    const key = routeKey(trip);
    if (route?.key === key && route.status !== 'loading') return fillAwards(root, trip);
    fillAwards(root, trip);
    loadRoute(trip)
      .catch(() => { route = { key, status: 'error', message: 'Não foi possível calcular agora. Verifique a conexão e tente de novo.' }; })
      .finally(() => {
        const current = ui.trip;
        if (current && routeKey(current) === key && root.isConnected) fillAwards(root, current);
      });
  }

  async function suggestFlight(trip, ui, setStatus) {
    setStatus('Calculando estimativa…');
    const value = await loadRoute(trip);
    if (value.status === 'error') return setStatus(value.message);
    const usd = usdRate();
    const suggestion = flightSuggestion(value.estimate, { travelers: trip.travelers, brlPerUsd: usd?.rate ?? null });
    if (!suggestion || !usd) return setStatus('Câmbio indisponível agora: não dá para estimar em reais. Tente de novo em instantes.');
    const line = flightLine({ ...suggestion.basis, route: routeCodes(value), cabin: trip.cabin }, trip, usd);
    saveSuggestion(ui, 'pricing.engine', line);
    setStatus(`Passagem estimada em ${formatBRL(line.amountBRL)} (${routeCodes(value)}, ida e volta). Quando cotar, adicione o preço real e marque como Cotação.`);
  }

  async function suggestLocal(trip, ui, setStatus) {
    setStatus('Buscando faixa revisada…');
    const { discoveryCoverage } = await import('../destination.discovery.js');
    const countryProfiles = discoveryCoverage(countries).profiles.filter(profile => profile.countryKey === trip.countryKey);
    // Viagem vinda da Descoberta: usa a região escolhida lá.
    const chosen = countryProfiles.find(profile => profile.id === trip.profileId);
    const suggestion = localCostSuggestion(chosen ? [chosen] : countryProfiles, { trip });
    if (!suggestion) return setStatus('Ainda não há faixa revisada de gastos para este destino. Adicione os valores abaixo.');
    const line = localLine(suggestion.basis, trip);
    saveSuggestion(ui, 'discovery.localWeekBRL', line);
    setStatus(`Gastos no destino estimados em ${formatBRL(line.amountBRL)} para ${suggestion.days} ${suggestion.days === 1 ? 'dia' : 'dias'} (faixa ${formatBRL(suggestion.low)}–${formatBRL(suggestion.high)}). O valor acompanha datas, viajantes e hospedagem.`);
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
      const ownCost = trip.miles?.myCostPer1000BRL;
      return `
        <div class="planner-card">
          <div class="planner-row">
            <label class="form-field planner-row__grow" for="planner-cabin"><span class="form-field__label">Cabine</span>
              <select class="form-field__control" id="planner-cabin" data-planner-field="cabin">
                ${Object.entries(CABINS).map(([id, label]) => `<option value="${id}" ${id === trip.cabin ? 'selected' : ''}>${label}</option>`).join('')}
              </select></label>
            <button class="primary-button" type="button" id="planner-suggest-flight">Estimar passagem</button>
          </div>
          <p class="planner-hint" data-planner-status role="status" aria-live="polite">${escapeHtml(ui.flash || `Ida e volta saindo de ${trip.origin}, para ${trip.travelers} ${trip.travelers === 1 ? 'pessoa' : 'pessoas'}. A estimativa entra no orçamento e acompanha viajantes e câmbio.`)}</p>
        </div>
        ${ui.linesBlock(trip, { categories: ['flights'], title: 'Passagens no orçamento', empty: 'Nenhuma passagem ainda. Estime acima ou adicione o preço que você encontrou.', addLabel: 'Adicionar passagem', addCategory: 'flights' })}
        <div class="planner-card">
          <h4 class="planner-block-title">Dinheiro ou milhas?</h4>
          <div id="planner-awards" aria-live="polite">${awardsBlock(trip)}</div>
          <details class="planner-details" ${ownCost ? 'open' : ''}>
            <summary>Usar o seu custo do milheiro (opcional)</summary>
            <label class="form-field" for="planner-mycost"><span class="form-field__label">Quanto você paga por 1.000 milhas (R$)</span>
              <input class="form-field__control" id="planner-mycost" type="text" inputmode="decimal" autocomplete="off" placeholder="Deixe vazio para usar a referência" value="${escapeHtml(moneyValue(ownCost))}" data-miles-field="myCostPer1000BRL"></label>
          </details>
        </div>
        ${exchangeRateLabel(usdRate())}`;
    },
    bind(root, trip, ui) {
      bindSuggestion(root, ui, '#planner-suggest-flight', suggestFlight);
      updateAwards(root, trip, ui);
      root.querySelector('.planner-details')?.addEventListener('change', event => {
        const field = event.target.dataset.milesField;
        const current = ui.trip;
        if (!field || !current) return;
        const raw = event.target.value.trim();
        const value = raw ? parseMoneyInput(raw) : null;
        if (raw && !(value > 0)) {
          event.target.setCustomValidity('Digite um valor em reais, por exemplo 18,50');
          event.target.reportValidity();
          return;
        }
        event.target.setCustomValidity('');
        ui.update({ miles: { ...(current.miles ?? {}), [field]: value } });
      });
    },
    refresh(root, trip, ui) {
      updateAwards(root, trip, ui);
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
              <p class="planner-hint" data-planner-status role="status" aria-live="polite">${escapeHtml(ui.flash || 'Hospedagem, refeições, transporte e passeios pela faixa revisada do destino, para as datas e os viajantes desta viagem.')}</p>
            </div>
            <label class="form-field" for="planner-lodging"><span class="form-field__label">Hospedagem</span>
              <select class="form-field__control" id="planner-lodging" data-planner-field="lodging">
                ${Object.entries(LODGING_LEVELS).map(([id, label]) => `<option value="${id}" ${id === trip.lodging ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}
              </select></label>
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
