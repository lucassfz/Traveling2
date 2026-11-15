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

// Exemplos que aparecem no painel e na "ajuda" falada.
export const VOICE_EXAMPLES = [
  'Planejar viagem para o Brasil',
  'Abrir Japão',
  'Ler sobre Portugal',
  'Descobrir destino'
];
export const VOICE_MORE = [
  'No planejamento: próximo, ou anterior',
  'Repetir, para ouvir de novo',
  'Aproximar, ou afastar',
  'Girar para a direita, esquerda, cima ou baixo',
  'Escolher, para abrir o que está no centro',
  'Cultura, história ou visão geral',
  'Ler, e parar',
  'Fechar, ou voltar ao globo',
  'Desligar microfone'
];

export const normalize = text => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Tira preposições, artigos e palavras de ligação do começo: "para o Japão" → "japao".
const stripLead = value => String(value ?? '').trim()
  .replace(/^(?:(?:uma|um|a|o|os|as|e|para|pra|pro|no|na|nos|nas|em|ao|aos|sobre|de|do|da|dos|das|cidade|pais|guia|viagem|roteiro)\s+)+/, '')
  .replace(/^(?:uma|um|a|o|os|as|para|pra|no|na|em|ao|sobre|de|do|da)$/, '')
  .trim();

const PLAN = /^(?:(?:eu )?quero |vamos |me ajuda a |ajuda a |ajude a )?(?:planejar|planeje|planeja|planejamento|criar|crie|montar|monte|organizar)(?: (?:uma |a |minha )?(?:viagem|roteiro))?(.*)$/;
const READ = /^(?:ler|leia|le|ouvir|leitura|me fala|fale|fala)\b(.*)$/;
const OPEN = /^(?:abrir|abra|abre|ir|vai|va|vamos|me leva|leva|levar|mostrar|mostre|mostra|me mostra|ver|quero ver|quero ir|quero conhecer|conhecer|visitar|buscar|busca|procurar|pesquisar)\b(.*)$/;
const ROTATE = /^(?:gir\w*|mov\w*|vir\w*|vai|ir|anda\w*|rod\w*)?\s*(?:o globo\s*)?(?:para|pra|pro)?\s*(?:a |o )?(direita|esquerda|cima|baixo|norte|sul|leste|oeste)$/;
const DIRECTIONS = { direita: 'right', leste: 'right', esquerda: 'left', oeste: 'left', cima: 'up', norte: 'up', baixo: 'down', sul: 'down' };

/**
 * Transforma uma frase falada num comando. Pura, testável em Node.
 * Exemplos: "planejar viagem para o Brasil" → { action: 'plan', value: 'brasil' };
 * "quero ir para o Japão" → { action: 'open', value: 'japao' }.
 * @returns {{ action: string, value?: string }}
 */
export function parseVoiceCommand(phrase) {
  const text = normalize(phrase);
  if (!text) return { action: 'none' };
  if (/\b(desligar?|desliga|parar?|pare)\b.*\b(microfone|comandos?|voz|ouvir)\b/.test(text)) return { action: 'stop-listening' };
  if (/^(parar?|pare|silencio|chega|cala)\b/.test(text)) return { action: 'stop-speaking' };
  if (/\b(ajuda|comandos|o que (eu )?posso)\b/.test(text)) return { action: 'help' };
  if (/^(repetir|repete|repita|de novo|outra vez)\b/.test(text)) return { action: 'repeat' };
  if (/^(proxim[oa]|continuar|continua|avancar|avanca|seguinte|proxima etapa)\b/.test(text)) return { action: 'step', value: 'next' };
  if (/^(anterior|etapa anterior|voltar etapa|volta etapa|voltar uma etapa)\b/.test(text)) return { action: 'step', value: 'prev' };
  const plan = PLAN.exec(text);
  if (plan) return stripLead(plan[1]) ? { action: 'plan', value: stripLead(plan[1]) } : { action: 'plan' };
  const read = READ.exec(text);
  if (read) return stripLead(read[1]) && !/^(isso|isto|aqui|tela|o que esta aberto|pagina)$/.test(stripLead(read[1])) ? { action: 'read', value: stripLead(read[1]) } : { action: 'read' };
  if (/\b(inicio|globo inteiro|mapa inteiro|pagina inicial|voltar ao globo|mundo inteiro)\b/.test(text)) return { action: 'home' };
  if (/^(fechar|feche|fecha|voltar|volte|sair)\b/.test(text)) return { action: 'close' };
  if (/\b(aproxim\w*|mais perto|zoom)\b/.test(text)) return { action: 'zoom-in' };
  if (/\b(afast\w*|mais longe|diminuir)\b/.test(text)) return { action: 'zoom-out' };
  const rotate = ROTATE.exec(text);
  if (rotate) return { action: 'rotate', value: DIRECTIONS[rotate[1]] };
  if (/^(escolher|escolha|selecionar|selecione|abrir isso|esse|este|confirmar)\b/.test(text)) return { action: 'select' };
  if (/\b(descobrir|para onde ir|sugest\w*|nao sei para onde)\b/.test(text)) return { action: 'discover' };
  if (/^(?:(?:abrir|ver|mostrar) (?:a )?)?visao geral$/.test(text)) return { action: 'tab', value: 'overview' };
  if (/^(?:(?:abrir|ver|mostrar) (?:a )?)?cultura$/.test(text)) return { action: 'tab', value: 'culture' };
  if (/^(?:(?:abrir|ver|mostrar) (?:a )?)?historia$/.test(text)) return { action: 'tab', value: 'history' };
  const open = OPEN.exec(text);
  if (open && stripLead(open[1])) return { action: 'open', value: stripLead(open[1]) };
  return { action: 'open', value: stripLead(text) || text };
}

/**
 * Vozes em português, das mais naturais para as mais robóticas. As "Natural",
 * "Neural" e "Online" (Edge/Windows), as do Google e as "Aprimorada"/"Premium"
 * (Apple) soam bem mais humanas que as vozes básicas do sistema.
 */
export function rankVoices(voices) {
  const score = voice => {
    const name = `${voice.name} ${voice.voiceURI ?? ''}`;
    let value = /^pt[-_]BR/i.test(voice.lang) ? 10 : 0;
    if (/natural|neural|online/i.test(name)) value += 8;
    if (/premium|enhanced|aprimorad|melhorad/i.test(name)) value += 6;
    if (/google/i.test(name)) value += 4;
    if (/francisca|thalita|antonio|luciana|felipe|fernanda|camila|vit[oó]ria|leila|daniel/i.test(name)) value += 2;
    if (/compact|eloquence|espeak/i.test(name)) value -= 6;
    return value;
  };
  return (voices ?? []).filter(voice => /^pt/i.test(voice.lang)).sort((a, b) => score(b) - score(a));
}

function readSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return {
      text: TEXT_SIZES.includes(raw?.text) ? raw.text : 'normal',
      contrast: raw?.contrast === true,
      motion: raw?.motion === true,
      voice: typeof raw?.voice === 'string' ? raw.voice.slice(0, 200) : ''
    };
  } catch {
    return { text: 'normal', contrast: false, motion: false, voice: '' };
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

  // Voz escolhida no painel, senão a mais natural do aparelho.
  const voices = () => rankVoices(canSpeak ? speechSynthesis.getVoices() : []);
  const currentVoice = () => voices().find(voice => voice.voiceURI === settings.voice) ?? voices()[0] ?? null;
  if (canSpeak) speechSynthesis.addEventListener?.('voiceschanged', () => { if (!panel.hidden) render(); });

  let lastSpoken = '';
  function speak(text) {
    if (!canSpeak || !text) return;
    lastSpoken = text;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance.lang = 'pt-BR';
    const voice = currentVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  // Resposta curta: aparece no painel, vai para o leitor de tela e, com o
  // microfone ligado, também é falada (quem usa a voz pode não estar olhando).
  function say(text, { speakIt = listening } = {}) {
    feedback = text;
    announce(text);
    if (speakIt) speak(text);
    render();
  }

  async function run(command) {
    const { action, value } = command;
    switch (action) {
      case 'stop-listening': stopListening(); return say('Microfone desligado.', { speakIt: true });
      case 'stop-speaking': if (canSpeak) speechSynthesis.cancel(); feedback = 'Leitura parada.'; return render();
      case 'help': feedback = 'Lendo os exemplos de comandos.'; render(); return speak(`Você pode dizer, por exemplo: ${VOICE_EXAMPLES.join('. ')}. E também: ${VOICE_MORE.join('. ')}.`);
      case 'read': {
        if (value) {
          const name = await commands.openPlace(value);
          if (!name) return say(`Não encontrei "${value}". Tente o nome de um país, como Portugal.`);
          await new Promise(resolve => setTimeout(resolve, 900));
        }
        feedback = 'Lendo.';
        render();
        return speak(commands.readTarget());
      }
      case 'home': commands.home(); return say('Voltando ao globo inteiro.');
      case 'repeat': return lastSpoken ? speak(lastSpoken) : say('Ainda não li nada.');
      case 'step': {
        const moved = commands.step(value);
        if (!moved) return say('Abra o planejamento de uma viagem antes. Diga, por exemplo: planejar viagem para o Brasil.');
        if (moved === 'edge') return say(value === 'prev' ? 'Esta já é a primeira etapa.' : 'Esta já é a última etapa.');
        await new Promise(resolve => setTimeout(resolve, 400));
        return speak(commands.readTarget());
      }
      case 'close': commands.close(); return say('Fechado.');
      case 'zoom-in': commands.zoom(1); return say('Aproximando.');
      case 'zoom-out': commands.zoom(-1); return say('Afastando.');
      case 'rotate': commands.rotate(value); return say({ right: 'Girando para a direita.', left: 'Girando para a esquerda.', up: 'Girando para cima.', down: 'Girando para baixo.' }[value]);
      case 'select': commands.select(); return say('Abrindo o que está no centro.');
      case 'plan': {
        const result = await commands.plan(value);
        if (result) return say(typeof result === 'string' ? `Planejando uma viagem para ${result}.` : 'Abrindo o planejamento.');
        return say(value ? `Não encontrei "${value}". Diga, por exemplo: planejar viagem para o Brasil.` : 'Para qual lugar? Diga, por exemplo: planejar viagem para o Brasil.');
      }
      case 'discover': commands.discover(); return say('Abrindo Descobrir destinos.');
      case 'tab': return say(commands.tab(value) ? ({ overview: 'Visão geral.', culture: 'Cultura.', history: 'História.' }[value]) : 'Abra um país antes. Diga, por exemplo: abrir Japão.');
      case 'open': {
        const name = await commands.openPlace(value);
        return say(name ? `Abrindo ${name}.` : `Não entendi "${value}". Diga, por exemplo: abrir Japão, ou diga ajuda.`);
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
      // Enquanto o site fala, o que o microfone capta é a própria voz do site.
      // Exceção: "parar" (e "desligar microfone") valem mesmo durante a leitura.
      const heard = result[0].transcript.trim();
      const command = parseVoiceCommand(heard);
      if (canSpeak && speechSynthesis.speaking && command.action !== 'stop-speaking' && command.action !== 'stop-listening') return;
      lastHeard = heard;
      run(command);
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
          <div class="a11y-panel__examples">
            <span>Experimente dizer:</span>
            <ul>${VOICE_EXAMPLES.map(item => `<li>“${escapeText(item)}”</li>`).join('')}</ul>
          </div>
          <details class="a11y-panel__help"><summary>Mais comandos</summary><ul>${VOICE_MORE.map(item => `<li>${escapeText(item)}</li>`).join('')}</ul></details>`
          : '<p class="a11y-panel__note">Este navegador não oferece reconhecimento de voz. Funciona no Chrome, no Edge e no Safari.</p>'}
      </section>
      <section class="a11y-panel__group" aria-labelledby="a11y-listen">
        <h3 id="a11y-listen">Ouvir</h3>
        ${canSpeak ? `<div class="a11y-row">
          <button class="secondary-button" type="button" data-a11y="read">🔊 Ler o que está aberto</button>
          <button class="secondary-button" type="button" data-a11y="stop">Parar</button>
        </div>
        ${voices().length ? `<label class="a11y-voice">
          <span>Voz</span>
          <select data-a11y-voice>${voices().map(voice => `<option value="${escapeText(voice.voiceURI)}" ${voice === currentVoice() ? 'selected' : ''}>${escapeText(voice.name.replace(/^Microsoft |^Google /, ''))}</option>`).join('')}</select>
          <button class="secondary-button" type="button" data-a11y="test-voice">Testar</button>
        </label>
        <p class="a11y-panel__note">As vozes vêm do seu aparelho. As mais naturais: no Edge, as "Natural" (como Francisca); no iPhone, baixe a "Luciana (Aprimorada)" em Ajustes › Acessibilidade › Conteúdo Falado › Vozes.</p>` : ''}` : '<p class="a11y-panel__note">Este navegador não lê textos em voz alta.</p>'}
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
    else if (action === 'test-voice') speak('Olá! Eu leio para você os guias de viagem do Traveling.');
  });
  panel.addEventListener('change', event => {
    const select = event.target.closest('[data-a11y-voice]');
    if (!select) return;
    update({ voice: select.value });
    speak('Olá! Esta é a voz escolhida.');
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
