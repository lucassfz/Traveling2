// Comandos de voz do painel de acessibilidade: frases faladas → comandos.
import assert from 'node:assert/strict';
import { parseVoiceCommand, normalize } from '../js/accessibility.js';

const cases = [
  ['Abrir Japão', { action: 'open', value: 'japao' }],
  ['Japão', { action: 'open', value: 'japao' }],
  ['ir para os Estados Unidos', { action: 'open', value: 'estados unidos' }],
  ['mostrar a Itália', { action: 'open', value: 'italia' }],
  ['planejar viagem', { action: 'plan' }],
  ['aproximar', { action: 'zoom-in' }],
  ['mais perto', { action: 'zoom-in' }],
  ['afastar', { action: 'zoom-out' }],
  ['girar para a direita', { action: 'rotate', value: 'right' }],
  ['gire pra esquerda', { action: 'rotate', value: 'left' }],
  ['mover para o norte', { action: 'rotate', value: 'up' }],
  ['vai para baixo', { action: 'rotate', value: 'down' }],
  ['escolher', { action: 'select' }],
  ['cultura', { action: 'tab', value: 'culture' }],
  ['História', { action: 'tab', value: 'history' }],
  ['visão geral', { action: 'tab', value: 'overview' }],
  ['descobrir destino', { action: 'discover' }],
  ['ler', { action: 'read' }],
  ['parar', { action: 'stop-speaking' }],
  ['desligar microfone', { action: 'stop-listening' }],
  ['fechar', { action: 'close' }],
  ['início', { action: 'home' }],
  ['ajuda', { action: 'help' }],
  ['', { action: 'none' }]
];
for (const [phrase, expected] of cases) assert.deepEqual(parseVoiceCommand(phrase), expected, `"${phrase}"`);
assert.equal(normalize('  São   Tomé & Príncipe '), 'sao tome principe');
console.log(`Acessibilidade: ${cases.length} frases de comando de voz verificadas.`);
