// Textos para ouvir (botão "Ler o que está aberto" e comando "ler"). Montados
// a partir dos dados, e não do texto da tela: sem botões, créditos de foto,
// "Wikipédia", siglas ou símbolos que soam estranhos em voz alta.

const CONTINENTS = { EU: 'na Europa', NA: 'na América do Norte', SA: 'na América do Sul', AF: 'na África', AS: 'na Ásia', OC: 'na Oceania' };

const clean = value => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\(([A-Z]{3})\)/g, '')       // "Euro (EUR)" → "Euro"
  .replace(/[·•|]/g, ',')
  .replace(/\s*[–—]\s*/g, ' a ')         // "Maio–junho" → "Maio a junho"
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:])/g, '$1')
  .trim();

const sentence = value => {
  const text = clean(value);
  return !text ? '' : /[.!?]$/.test(text) ? text : `${text}.`;
};

function listJoin(items) {
  const list = items.filter(Boolean);
  return list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} e ${list.at(-1)}`;
}

/** "12400232" → "12,4 milhões de habitantes"; "350000" → "350 mil habitantes". */
export function spokenPopulation(population) {
  const value = Number(population);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 1_000_000) {
    const millions = Math.round(value / 100_000) / 10;
    return `${String(millions).replace('.', ',')} ${millions < 2 ? 'milhão' : 'milhões'} de habitantes`;
  }
  if (value >= 1000) return `${Math.round(value / 1000)} mil habitantes`;
  return `${Math.round(value)} habitantes`;
}

/**
 * @param {object} country  Registro de COUNTRIES.
 * @param {object} [options]
 * @param {'overview'|'culture'|'history'} [options.tab]
 * @param {string} [options.summary]   Resumo (Wikipédia), só o texto.
 * @param {Array|string} [options.history]
 */
export function countrySpeech(country, { tab = 'overview', summary = '', history = null } = {}) {
  if (!country) return '';
  const name = country.namePt;
  if (tab === 'culture') {
    const foods = (Array.isArray(country.foods) ? country.foods : []).slice(0, 4)
      .map(food => (food.desc ? `${clean(food.name)}, ${clean(food.desc).replace(/\.$/, '')}` : clean(food.name)));
    const etiquette = (Array.isArray(country.etiquette) ? country.etiquette : []).slice(0, 3).map(item => sentence(item.t));
    return [
      `${name}: cultura.`,
      foods.length ? `Para provar: ${foods.join('; ')}.` : '',
      etiquette.length ? `Dicas de costume: ${etiquette.join(' ')}` : ''
    ].filter(Boolean).join(' ');
  }
  if (tab === 'history') {
    const items = Array.isArray(history) ? history.slice(0, 5).map(item => `${sentence(item.title)} ${sentence(item.text)}`) : [sentence(history || country.history)];
    return [`${name}: história.`, ...items].filter(Boolean).join(' ');
  }
  const policy = country.visaPolicyBR ?? {};
  const visa = policy.eligibility === 'domestic' ? 'Destino nacional: não precisa de passaporte nem visto.' : `Visto para brasileiros: ${sentence(clean(policy.detail || country.visaText).replace(/^passaporte brasileiro comum:s*/i, ''))}`;
  const facts = [
    country.capital ? `capital ${clean(country.capital)}` : '',
    country.currency ? `moeda ${clean(country.currency)}` : '',
    country.lang ? `idioma ${clean(country.lang)}` : ''
  ].filter(Boolean);
  return [
    `${name}, ${CONTINENTS[country.continent] ?? clean(country.region)}.`,
    sentence(summary),
    visa,
    country.bestTime ? `Melhor época: ${sentence(country.bestTime)}` : '',
    facts.length ? `${listJoin(facts).replace(/^./, letter => letter.toUpperCase())}.` : ''
  ].filter(Boolean).join(' ');
}

/** @param {object} city  Cidade do globo; `localTime` opcional ("dom., 13:42"). */
export function citySpeech(city, { countryName = '', localTime = '' } = {}) {
  if (!city) return '';
  const where = [city.region, countryName].filter(Boolean).join(', ');
  const time = String(localTime).split(',').pop().trim();
  return [
    `${city.name}${where ? `, ${where}` : ''}.`,
    city.rank === 0 ? 'Capital do país.' : city.rank === 1 ? 'Capital regional.' : '',
    spokenPopulation(city.population) ? `Cerca de ${spokenPopulation(city.population)}.` : '',
    /^\d{1,2}:\d{2}$/.test(time) ? `Agora são ${time.replace(':', ' e ')} lá.` : ''
  ].filter(Boolean).join(' ');
}

/** Etapa do planejamento: título, o que já foi escolhido e o valor estimado, se houver. */
export function plannerSpeech(root) {
  if (!root) return '';
  const text = selector => clean(root.querySelector(selector)?.textContent);
  const step = text('.wizard__step > .eyebrow');
  const title = text('#wizard-title, .wizard__title');
  const chosen = [...root.querySelectorAll('.wizard__step [aria-pressed="true"]')]
    .map(button => clean(button.querySelector('strong, span')?.textContent || button.textContent)).filter(Boolean).slice(0, 8);
  const fare = text('.planner-fare__value');
  const total = text('.trip-cost__total strong');
  return [
    step ? sentence(step) : '',
    title ? sentence(title) : 'Planejamento de viagem.',
    chosen.length ? `Escolhido: ${listJoin(chosen)}.` : '',
    fare ? `Passagem, em média: ${fare.replace(/R\$\s?/g, '').replace(' a ', ' a ')} reais por pessoa.` : '',
    total ? `Custo estimado da viagem: ${total.replace(/R\$\s?/g, '')} reais.` : ''
  ].filter(Boolean).join(' ');
}

/** Descobrir: quantos destinos e os primeiros da lista. */
export function discoverySpeech(root) {
  if (!root) return '';
  const head = clean(root.querySelector('.discovery-results__head strong')?.textContent);
  const cards = [...root.querySelectorAll('.discovery-card')].slice(0, 5).map(card => {
    const name = clean(card.querySelector('.discovery-card__body strong, .discovery-card__name')?.textContent);
    const place = clean(card.querySelector('.discovery-card__body small, .discovery-card__region')?.textContent);
    return place ? `${name}, ${place}` : name;
  }).filter(Boolean);
  return [head ? sentence(head) : 'Descobrir destinos.', cards.length ? `Os primeiros: ${cards.join('; ')}.` : ''].filter(Boolean).join(' ');
}
