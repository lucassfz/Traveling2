// Painel "Acessibilidade" do Traveling: ajustes que valem só dentro do site.
//   - Comandos de voz (sem usar as mãos): "abrir Japão", "planejar viagem",
//     "aproximar", "girar para a direita", "fechar", "ler"...
//   - Ouvir: lê em voz alta o que está aberto (guia, cidade, planejamento).
//   - Texto maior, alto contraste e sem animações.
// Usa só recursos do navegador (Web Speech API); nada é instalado. As escolhas
// ficam no navegador de quem usa (localStorage).
export const A11Y_STORAGE_KEY = 'traveling.a11y';
export const TEXT_SIZES = ['normal', 'large', 'xlarge'];
export const TEXT_LABELS = { normal: 'Normal', large: 'Grande', xlarge: 'Muito grande' };

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

export function readSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) ?? 'null');
    return {
      text: TEXT_SIZES.includes(raw?.text) ? raw.text : 'normal',
      contrast: raw?.contrast === true,
      motion: raw?.motion === true,
      // Atalhos de uma tecla só (/ e ?): dá para desligar (WCAG 2.1.4).
      shortcuts: raw?.shortcuts !== false,
      voice: typeof raw?.voice === 'string' ? raw.voice.slice(0, 200) : ''
    };
  } catch {
    return { text: 'normal', contrast: false, motion: false, shortcuts: true, voice: '' };
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings)); } catch { /* armazenamento bloqueado */ }
}

/** Aplica os ajustes visuais no <html> (também usado antes da primeira pintura). */
export function applySettings(settings, root = document.documentElement) {
  if (settings.text === 'normal') delete root.dataset.text; else root.dataset.text = settings.text;
  if (settings.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
  if (settings.motion) root.dataset.motion = 'reduce'; else delete root.dataset.motion;
}
