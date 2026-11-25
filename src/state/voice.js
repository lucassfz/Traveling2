// Voz: reconhecimento de fala, leitura em voz alta e execução dos comandos.
// O que cada frase significa está em js/accessibility.js (puro, testado em Node).
import { useSyncExternalStore } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { VOICE_EXAMPLES, VOICE_MORE, normalize, parseVoiceCommand, rankVoices } from '../../js/accessibility.js';
import { citySpeech, countrySpeech, discoverySpeech, plannerSpeech } from '../../js/speech.text.js';
import { loadCities } from '../../js/geo/cities.js';
import { summaryFor } from '../../js/summaries.js';
import { historyCatalogIfLoaded } from '../../js/history.loader.js';
import { app } from './store.js';
import { COUNTRY_BY_ALPHA2, countryKeyOfCity, globe } from './services.js';
import { closeTopLayer, openDiscovery, planTrip, resetToGlobe, selectCity, selectCountry, setTab } from './actions.js';
import { announce } from './focus.js';

let state = { listening: false, heard: '', feedback: '' };
const listeners = new Set();
function set(patch) {
  state = { ...state, ...patch };
  app.set({ listening: state.listening });
  for (const listener of listeners) listener();
}
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };

// Procurado na hora de usar (o navegador pode expor o recurso depois do carregamento).
const recognitionApi = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
export const speechSupported = () => 'speechSynthesis' in globalThis;

export function useVoice() {
  return { ...useSyncExternalStore(subscribe, () => state), supported: Boolean(recognitionApi()) };
}

// ---------- Falar ----------

let lastSpoken = '';
export function speak(text) {
  if (!speechSupported() || !text) return;
  lastSpoken = text;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
  utterance.lang = 'pt-BR';
  const voices = rankVoices(speechSynthesis.getVoices());
  const voice = voices.find(item => item.voiceURI === app.get().a11y.voice) ?? voices[0];
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  speechSynthesis.speak(utterance);
}

// Resposta curta: aparece no painel, vai para o leitor de tela e, com o
// microfone ligado, também é falada (quem usa a voz pode não estar olhando).
function say(text, speakIt = state.listening) {
  set({ feedback: text });
  announce(text);
  if (speakIt) speak(text);
}

/** Texto para ouvir, montado dos dados (sem botões, créditos ou siglas). */
function readTarget() {
  const { city, countryOpen, countryKey, tab, hub, discoveryOpen } = app.get();
  if (city) {
    let localTime = '';
    try {
      localTime = new Intl.DateTimeFormat('pt-BR', { timeZone: city.timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date());
    } catch { /* fuso desconhecido */ }
    return citySpeech(city, { countryName: COUNTRIES[countryKeyOfCity(city)]?.namePt ?? '', localTime });
  }
  if (countryOpen && countryKey) {
    const country = COUNTRIES[countryKey];
    return countrySpeech(country, { tab, summary: summaryFor('countries', country.alpha2)?.text ?? '', history: historyCatalogIfLoaded()?.[countryKey] ?? country.history });
  }
  if (hub === 'planner') return plannerSpeech(document.getElementById('planner-content'));
  if (discoveryOpen) return discoverySpeech(document.getElementById('discovery-panel'));
  return `No centro do globo: ${globe.map?.centerLabel() ?? 'carregando'}. Para abrir um país, diga, por exemplo: abrir Japão.`;
}

// ---------- Achar lugares ----------

const COUNTRY_INDEX = Object.entries(COUNTRIES).map(([key, country]) => ({ key, names: [normalize(country.namePt), normalize(key)] }));
const CAPITALS = Object.entries(COUNTRIES).filter(([, country]) => country.capital).map(([key, country]) => ({ key, name: normalize(country.capital) }));

function findCountry(phrase) {
  const query = normalize(phrase);
  if (query.length < 3) return null;
  return COUNTRY_INDEX.find(item => item.names.includes(query))
    ?? COUNTRY_INDEX.find(item => item.names.some(name => name.startsWith(query) || query.startsWith(`${name} `) || query.endsWith(` ${name}`)))
    ?? COUNTRY_INDEX.find(item => item.names.some(name => name.length >= 4 && query.includes(name)))
    ?? null;
}

const exactCity = (cities, query) => cities.find(city => normalize(city.name) === query) ?? null;
const partialCity = (cities, query) => (query.length >= 4 ? cities.find(city => normalize(city.name).startsWith(query)) ?? null : null);
const citiesOf = key => loadCities(COUNTRIES[key].alpha2).catch(() => []);

// Ordem: país pelo nome; cidade com o nome exato no país aberto; capital de
// qualquer país ("Paris"); cidade do Brasil com o nome exato; por fim, nome
// parcial no país aberto.
async function findPlace(phrase) {
  const query = normalize(phrase);
  const country = findCountry(phrase);
  if (country) return { countryKey: country.key, city: null };
  if (query.length < 3) return null;
  const openKey = app.get().countryKey ?? COUNTRY_BY_ALPHA2.get(globe.map?.adminLayer?.focusCode);
  const openCities = openKey ? await citiesOf(openKey) : [];
  const exact = exactCity(openCities, query);
  if (exact) return { countryKey: openKey, city: exact };
  const capital = CAPITALS.find(item => item.name === query);
  if (capital) return { countryKey: capital.key, city: exactCity(await citiesOf(capital.key), query) };
  const brazilKey = COUNTRY_BY_ALPHA2.get('BR');
  const brazilian = brazilKey !== openKey ? exactCity(await citiesOf(brazilKey), query) : null;
  if (brazilian) return { countryKey: brazilKey, city: brazilian };
  const partial = partialCity(openCities, query);
  return partial ? { countryKey: openKey, city: partial } : null;
}

async function openPlace(phrase) {
  const place = await findPlace(phrase);
  if (!place) return null;
  if (app.get().countryKey !== place.countryKey) selectCountry(place.countryKey);
  if (place.city) selectCity(place.city, { fly: true });
  return place.city?.name ?? COUNTRIES[place.countryKey].namePt;
}

// "planejar viagem" (país aberto) ou "planejar viagem para o Brasil".
async function plan(phrase) {
  if (!phrase) {
    const { countryKey } = app.get();
    if (!countryKey) return false;
    planTrip(countryKey);
    return true;
  }
  const place = await findPlace(phrase);
  if (!place) return null;
  planTrip(place.countryKey, { city: place.city });
  return place.city?.name ?? COUNTRIES[place.countryKey].namePt;
}

// Etapas do planejamento. Na confirmação de uma viagem nova, "próximo" cria a viagem.
function step(direction) {
  if (app.get().hub !== 'planner') return false;
  const root = document.getElementById('planner-content');
  const button = root.querySelector(`[data-planner-action="${direction}"]`)
    ?? (direction === 'next' ? root.querySelector('[data-planner-action="draft-create"]') : null);
  if (!button) return 'edge';
  button.click();
  return true;
}

// ---------- Comandos ----------

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function runCommand({ action, value }) {
  switch (action) {
    case 'stop-listening': stopListening(); return say('Microfone desligado.', true);
    case 'stop-speaking': if (speechSupported()) speechSynthesis.cancel(); return set({ feedback: 'Leitura parada.' });
    case 'help': set({ feedback: 'Lendo os exemplos de comandos.' }); return speak(`Você pode dizer, por exemplo: ${VOICE_EXAMPLES.join('. ')}. E também: ${VOICE_MORE.join('. ')}.`);
    case 'read': {
      if (value) {
        if (!(await openPlace(value))) return say(`Não encontrei "${value}". Tente o nome de um país, como Portugal.`);
        await wait(900);
      }
      set({ feedback: 'Lendo.' });
      return speak(readTarget());
    }
    case 'home': resetToGlobe(); return say('Voltando ao globo inteiro.');
    case 'repeat': return lastSpoken ? speak(lastSpoken) : say('Ainda não li nada.');
    case 'step': {
      const moved = step(value);
      if (!moved) return say('Abra o planejamento de uma viagem antes. Diga, por exemplo: planejar viagem para o Brasil.');
      if (moved === 'edge') return say(value === 'prev' ? 'Esta já é a primeira etapa.' : 'Esta já é a última etapa.');
      await wait(400);
      return speak(readTarget());
    }
    case 'close': closeTopLayer(); return say('Fechado.');
    case 'zoom-in': globe.map?.zoomStep(1); return say('Aproximando.');
    case 'zoom-out': globe.map?.zoomStep(-1); return say('Afastando.');
    case 'rotate': globe.map?.nudge(value); return say({ right: 'Girando para a direita.', left: 'Girando para a esquerda.', up: 'Girando para cima.', down: 'Girando para baixo.' }[value]);
    case 'select': globe.map?.selectCenter(); return say('Abrindo o que está no centro.');
    case 'plan': {
      const result = await plan(value);
      if (result) return say(typeof result === 'string' ? `Planejando uma viagem para ${result}.` : 'Abrindo o planejamento.');
      return say(value ? `Não encontrei "${value}". Diga, por exemplo: planejar viagem para o Brasil.` : 'Para qual lugar? Diga, por exemplo: planejar viagem para o Brasil.');
    }
    case 'discover': openDiscovery(); return say('Abrindo Descobrir destinos.');
    case 'tab':
      if (!app.get().countryOpen) return say('Abra um país antes. Diga, por exemplo: abrir Japão.');
      setTab(value);
      return say({ overview: 'Visão geral.', culture: 'Cultura.', history: 'História.' }[value]);
    case 'open': {
      const name = await openPlace(value);
      return say(name ? `Abrindo ${name}.` : `Não entendi "${value}". Diga, por exemplo: abrir Japão, ou diga ajuda.`);
    }
    default: return undefined;
  }
}

// ---------- Ouvir ----------

let recognition = null;

export function startListening() {
  const Recognition = recognitionApi();
  if (!Recognition || state.listening) return;
  recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.onresult = event => {
    const result = event.results[event.results.length - 1];
    if (!result?.isFinal) return;
    // Enquanto o site fala, o que o microfone capta é a própria voz do site.
    // Exceção: "parar" (e "desligar microfone") valem mesmo durante a leitura.
    const heard = result[0].transcript.trim();
    const command = parseVoiceCommand(heard);
    if (speechSupported() && speechSynthesis.speaking && command.action !== 'stop-speaking' && command.action !== 'stop-listening') return;
    set({ heard });
    runCommand(command);
  };
  recognition.onerror = event => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      set({ listening: false });
      say('O navegador não deixou usar o microfone. Libere o microfone para este site e tente de novo.');
    }
  };
  // O navegador encerra a escuta de tempos em tempos; enquanto ligado, reinicia.
  recognition.onend = () => {
    if (!state.listening) return;
    try { recognition.start(); } catch { set({ listening: false }); }
  };
  try {
    recognition.start();
    set({ listening: true });
    say('Microfone ligado. Diga "ajuda" para ouvir os comandos.');
  } catch {
    say('Não foi possível ligar o microfone.');
  }
}

export function stopListening() {
  set({ listening: false });
  try { recognition?.stop(); } catch { /* já parado */ }
  recognition = null;
}
