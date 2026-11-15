// Painel "Acessibilidade" do Traveling: ajustes que valem só dentro do site.
//   - Comandos de voz (sem usar as mãos): "abrir Japão", "planejar viagem",
//     "aproximar", "girar para a direita", "fechar", "ler"...
//   - Ouvir: lê em voz alta o que está aberto (guia, cidade, planejamento).
//   - Texto maior, alto contraste e sem animações.
// Usa só recursos do navegador (Web Speech API); nada é instalado. As escolhas
// ficam no navegador de quem usa (localStorage).
import { reducedMotion } from './core/motion.js';

const STORAGE_KEY = 'traveling.a11y';
const TEXT_SIZES = ['normal', 'large', 'xlarge'];
const TEXT_LABELS = { normal: 'Normal', large: 'Grande', xlarge: 'Muito grande' };

export const VOICE_HELP = [
  '"abrir Japão" (ou só "Japão")',
  '"planejar viagem"',
  '"aproximar" e "afastar"',
  '"girar para a direita", "esquerda", "cima" ou "baixo"',
  '"escolher" (o que está no centro)',
  '"cultura", "história" ou "visão geral"',
  '"descobrir destino"',
  '"ler" e "parar"',
  '"fechar" e "início"',
  '"desligar microfone"'
];

export const normalize = text => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Transforma uma frase falada num comando. Pura, testável em Node.
 * @returns {{ action: string, value?: string }}
 */
export function parseVoiceCommand(phrase) {
  const text = normalize(phrase);
  if (!text) return { action: 'none' };
  if (/\b(desligar?|desliga|parar?|pare)\b.*\b(microfone|comandos?|voz|ouvir)\b/.test(text)) return { action: 'stop-listening' };
  if (/^(parar?|pare|silencio|chega|cala)\b/.test(text)) return { action: 'stop-speaking' };
  if (/\b(ajuda|comandos|o que (eu )?posso)\b/.test(text)) return { action: 'help' };
  if (/^(ler|leia|ouvir|le|leitura)\b/.test(text)) return { action: 'read' };
  if (/\b(inicio|globo inteiro|mapa inteiro|pagina inicial)\b/.test(text)) return { action: 'home' };
  if (/^(fechar|feche|fecha|voltar|volte|sair)\b/.test(text)) return { action: 'close' };
  if (/\b(aproxim\w*|mais perto|zoom)\b/.test(text)) return { action: 'zoom-in' };
  if (/\b(afast\w*|mais longe|diminuir)\b/.test(text)) return { action: 'zoom-out' };
  const direction = /\b(direita|leste)\b/.test(text) ? 'right' : /\b(esquerda|oeste)\b/.test(text) ? 'left'
    : /\b(cima|norte)\b/.test(text) ? 'up' : /\b(baixo|sul)\b/.test(text) ? 'down' : null;
  if (direction && /\b(gir\w*|mov\w*|vir\w*|pra|para|ir|vai)\b/.test(text)) return { action: 'rotate', value: direction };
  if (/^(escolher|escolha|selecionar|selecione|abrir isso|esse|este|confirmar)\b/.test(text)) return { action: 'select' };
  if (/\b(planejar|planeje|planejamento|criar viagem)\b/.test(text)) return { action: 'plan' };
  if (/\b(descobrir|para onde ir|sugest\w*)\b/.test(text)) return { action: 'discover' };
  if (/\bvisao geral\b/.test(text)) return { action: 'tab', value: 'overview' };
  if (/\bcultura\b/.test(text)) return { action: 'tab', value: 'culture' };
  if (/\bhistoria\b/.test(text)) return { action: 'tab', value: 'history' };
  const open = /^(abrir|abra|abre|ir para|ir pra|va para|mostrar|mostre|mostra|ver|quero ver|pais)\s+(o |a |os |as )?(.+)$/.exec(text);
  return { action: 'open', value: open ? open[3] : text };
}

function readSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return {
      text: TEXT_SIZES.includes(raw?.text) ? raw.text : 'normal',
      contrast: raw?.contrast === true,
      motion: raw?.motion === true
    };
  } catch {
    return { text: 'normal', contrast: false, motion: false };
  }
}

function saveSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* armazenamento bloqueado */ }
}

/** Aplica os ajustes visuais no <html> (também usado antes da primeira pintura). */
export function applySettings(settings, root = document.documentElement) {
  if (settings.text === 'normal') delete root.dataset.text; else root.dataset.text = settings.text;
  if (settings.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
  if (settings.motion) root.dataset.motion = 'reduce'; else delete root.dataset.motion;
}

/**
 * @param {object} deps
 * @param {HTMLElement} deps.button  Botão do cabeçalho.
 * @param {HTMLElement} deps.panel   Contêiner do painel.
 * @param {object} deps.commands     Ações do app (ver app.js).
 * @param {(text: string) => void} deps.announce  Região viva para leitores de tela.
 */
export function createAccessibility({ button, panel, commands, announce = () => {} }) {
  const settings = readSettings();
  applySettings(settings);
  // Procurado na hora de usar (o navegador pode expor o recurso depois do carregamento).
  const recognitionApi = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
  const canSpeak = 'speechSynthesis' in globalThis;
  let recognition = null;
  let listening = false;
  let lastHeard = '';
  let feedback = '';

  function speak(text) {
    if (!canSpeak || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance.lang = 'pt-BR';
    const voice = speechSynthesis.getVoices().find(item => /^pt[-_]BR/i.test(item.lang)) ?? speechSynthesis.getVoices().find(item => /^pt/i.test(item.lang));
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  function say(text) {
    feedback = text;
    announce(text);
    render();
  }

  function run(command) {
    const { action, value } = command;
    switch (action) {
      case 'stop-listening': stopListening(); return say('Microfone desligado.');
      case 'stop-speaking': if (canSpeak) speechSynthesis.cancel(); return say('Leitura parada.');
      case 'help': speak(`Você pode dizer: ${VOICE_HELP.join('; ')}.`); return say('Lendo a lista de comandos.');
      case 'read': { const text = commands.readTarget(); speak(text); return say('Lendo o que está aberto.'); }
      case 'home': commands.home(); return say('Voltando ao globo inteiro.');
      case 'close': commands.close(); return say('Fechado.');
      case 'zoom-in': commands.zoom(1); return say('Aproximando.');
      case 'zoom-out': commands.zoom(-1); return say('Afastando.');
      case 'rotate': commands.rotate(value); return say({ right: 'Girando para a direita.', left: 'Girando para a esquerda.', up: 'Girando para cima.', down: 'Girando para baixo.' }[value]);
      case 'select': commands.select(); return say('Escolhendo o centro.');
      case 'plan': return say(commands.plan() ? 'Abrindo o planejamento.' : 'Abra um país antes de planejar.');
      case 'discover': commands.discover(); return say('Abrindo Descobrir.');
      case 'tab': return say(commands.tab(value) ? 'Aba aberta.' : 'Abra um país antes.');
      case 'open': {
        const name = commands.openCountry(value);
        return say(name ? `Abrindo ${name}.` : `Não entendi "${value}". Diga "ajuda" para ouvir os comandos.`);
      }
      default: return undefined;
    }
  }

  function startListening() {
    const Recognition = recognitionApi();
    if (!Recognition || listening) return;
    recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = event => {
      const result = event.results[event.results.length - 1];
      if (!result?.isFinal) return;
      lastHeard = result[0].transcript.trim();
      run(parseVoiceCommand(lastHeard));
    };
    recognition.onerror = event => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        listening = false;
        say('O navegador não deixou usar o microfone. Libere o microfone para este site e tente de novo.');
      }
    };
    // O navegador encerra a escuta de tempos em tempos; enquanto ligado, reinicia.
    recognition.onend = () => {
      if (listening) {
        try { recognition.start(); } catch { listening = false; render(); }
      }
    };
    try {
      recognition.start();
      listening = true;
      say('Microfone ligado. Diga "ajuda" para ouvir os comandos.');
    } catch {
      say('Não foi possível ligar o microfone.');
    }
  }

  function stopListening() {
    listening = false;
    try { recognition?.stop(); } catch { /* já parado */ }
    recognition = null;
    render();
  }

  function update(changes) {
    Object.assign(settings, changes);
    saveSettings(settings);
    applySettings(settings);
    render();
  }

  function render() {
    const pressed = value => `aria-pressed="${value}"`;
    panel.innerHTML = `
      <div class="a11y-panel__head">
        <h2 id="a11y-title" tabindex="-1">Acessibilidade</h2>
        <button class="icon-button" type="button" data-a11y="close" aria-label="Fechar acessibilidade">✕</button>
      </div>
      <section class="a11y-panel__group" aria-labelledby="a11y-voice">
        <h3 id="a11y-voice">Comandos de voz</h3>
        ${recognitionApi() ? `
          <button class="a11y-toggle${listening ? ' a11y-toggle--on' : ''}" type="button" data-a11y="voice" ${pressed(listening)}>
            <span>🎙️ ${listening ? 'Microfone ligado' : 'Ligar microfone'}</span><small>${listening ? 'Toque para desligar' : 'Use o site falando'}</small>
          </button>
          ${lastHeard ? `<p class="a11y-panel__heard">Ouvi: "${escapeText(lastHeard)}"</p>` : ''}
          <details class="a11y-panel__help"><summary>O que posso dizer?</summary><ul>${VOICE_HELP.map(item => `<li>${escapeText(item)}</li>`).join('')}</ul></details>`
          : '<p class="a11y-panel__note">Este navegador não oferece reconhecimento de voz. Funciona no Chrome, no Edge e no Safari.</p>'}
      </section>
      <section class="a11y-panel__group" aria-labelledby="a11y-listen">
        <h3 id="a11y-listen">Ouvir</h3>
        ${canSpeak ? `<div class="a11y-row">
          <button class="secondary-button" type="button" data-a11y="read">🔊 Ler o que está aberto</button>
          <button class="secondary-button" type="button" data-a11y="stop">Parar</button>
        </div>` : '<p class="a11y-panel__note">Este navegador não lê textos em voz alta.</p>'}
      </section>
      <section class="a11y-panel__group" aria-labelledby="a11y-view">
        <h3 id="a11y-view">Visual</h3>
        <div class="a11y-row" role="group" aria-label="Tamanho do texto">
          ${TEXT_SIZES.map(size => `<button class="a11y-chip" type="button" data-a11y-text="${size}" ${pressed(settings.text === size)}>${TEXT_LABELS[size]}</button>`).join('')}
        </div>
        <button class="a11y-toggle a11y-theme" type="button" data-a11y="theme"><span>${document.documentElement.dataset.theme === 'light' ? '🌙 Modo escuro' : '☀️ Modo claro'}</span></button>
        <button class="a11y-toggle${settings.contrast ? ' a11y-toggle--on' : ''}" type="button" data-a11y="contrast" ${pressed(settings.contrast)}><span>◐ Alto contraste</span></button>
        <button class="a11y-toggle${settings.motion || reducedMotion.matches ? ' a11y-toggle--on' : ''}" type="button" data-a11y="motion" ${pressed(settings.motion)}><span>⏸ Sem animações</span>${!settings.motion && reducedMotion.matches ? '<small>Já ativo pelo sistema</small>' : ''}</button>
      </section>
      <p class="a11y-panel__status" role="status">${escapeText(feedback)}</p>
      <p class="a11y-panel__note">Teclado: setas giram o globo, + e − aproximam, Enter escolhe. Os comandos de voz usam o reconhecimento do próprio navegador, que pode enviar o áudio ao serviço dele (Google ou Apple) enquanto o microfone estiver ligado. <a href="privacidade.html" target="_blank" rel="noopener">Privacidade</a></p>`;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.classList.toggle('header-action--live', listening);
  }

  function setOpen(open, { restoreFocus = false } = {}) {
    panel.hidden = !open;
    render();
    if (open) panel.querySelector('#a11y-title')?.focus({ preventScroll: true });
    else if (restoreFocus) button.focus({ preventScroll: true });
  }

  button.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', event => {
    const target = event.target.closest('[data-a11y], [data-a11y-text]');
    if (!target) return;
    const action = target.dataset.a11y;
    if (target.dataset.a11yText) update({ text: target.dataset.a11yText });
    else if (action === 'close') setOpen(false, { restoreFocus: true });
    else if (action === 'contrast') update({ contrast: !settings.contrast });
    else if (action === 'theme') { document.getElementById('theme-button')?.click(); render(); }
    else if (action === 'motion') update({ motion: !settings.motion });
    else if (action === 'voice') (listening ? stopListening() : startListening());
    else if (action === 'read') run({ action: 'read' });
    else if (action === 'stop') run({ action: 'stop-speaking' });
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false, { restoreFocus: true });
    }
  });
  render();
  return { setOpen, speak, run, get isOpen() { return !panel.hidden; } };
}

function escapeText(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
