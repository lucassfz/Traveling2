// Painel de acessibilidade: frases faladas → comandos, textos para ouvir e
// escolha da voz mais natural.
import assert from 'node:assert/strict';
import { parseVoiceCommand, normalize, rankVoices } from '../js/accessibility.js';
import { countrySpeech, citySpeech, spokenPopulation } from '../js/speech.text.js';
import { COUNTRIES } from '../js/countries.dataset.js';

const cases = [
  ['Abrir Japão', { action: 'open', value: 'japao' }],
  ['Japão', { action: 'open', value: 'japao' }],
  ['quero ir para o Japão', { action: 'open', value: 'japao' }],
  ['ir para os Estados Unidos', { action: 'open', value: 'estados unidos' }],
  ['me mostra a Itália', { action: 'open', value: 'italia' }],
  ['ir para a África do Sul', { action: 'open', value: 'africa do sul' }],
  ['abrir a cidade de São Paulo', { action: 'open', value: 'sao paulo' }],
  ['abrir guia de Portugal', { action: 'open', value: 'portugal' }],
  ['planejar viagem para o Brasil', { action: 'plan', value: 'brasil' }],
  ['quero planejar uma viagem pra Itália', { action: 'plan', value: 'italia' }],
  ['planejar viagem', { action: 'plan' }],
  ['ler sobre Portugal', { action: 'read', value: 'portugal' }],
  ['ler', { action: 'read' }],
  ['ler isso', { action: 'read' }],
  ['aproximar', { action: 'zoom-in' }],
  ['afastar', { action: 'zoom-out' }],
  ['girar para a direita', { action: 'rotate', value: 'right' }],
  ['gire pra esquerda', { action: 'rotate', value: 'left' }],
  ['vai pro sul', { action: 'rotate', value: 'down' }],
  ['escolher', { action: 'select' }],
  ['cultura', { action: 'tab', value: 'culture' }],
  ['abrir a história', { action: 'tab', value: 'history' }],
  ['descobrir destino', { action: 'discover' }],
  ['parar', { action: 'stop-speaking' }],
  ['desligar microfone', { action: 'stop-listening' }],
  ['fechar', { action: 'close' }],
  ['voltar ao globo', { action: 'home' }],
  ['ajuda', { action: 'help' }],
  ['próximo', { action: 'step', value: 'next' }],
  ['continuar', { action: 'step', value: 'next' }],
  ['anterior', { action: 'step', value: 'prev' }],
  ['voltar etapa', { action: 'step', value: 'prev' }],
  ['repetir', { action: 'repeat' }],
  ['', { action: 'none' }]
];
for (const [phrase, expected] of cases) assert.deepEqual(parseVoiceCommand(phrase), expected, `"${phrase}"`);
assert.equal(normalize('  São   Tomé & Príncipe '), 'sao tome principe');

// Vozes: as naturais primeiro; só português.
const voices = [
  { name: 'Microsoft Maria - Portuguese (Brazil)', lang: 'pt-BR', voiceURI: 'maria' },
  { name: 'Google português do Brasil', lang: 'pt-BR', voiceURI: 'google' },
  { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR', voiceURI: 'francisca' },
  { name: 'Joana', lang: 'pt-PT', voiceURI: 'joana' },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha' }
];
assert.deepEqual(rankVoices(voices).map(voice => voice.voiceURI), ['francisca', 'google', 'maria', 'joana']);

// Textos para ouvir: sem créditos, siglas de moeda ou marcação.
const portugal = countrySpeech(COUNTRIES.Portugal, { summary: 'Portugal é um país da Europa.' });
assert.ok(portugal.startsWith('Portugal, na Europa.'));
assert.ok(portugal.includes('Visto para brasileiros:') && !/Wikip|\(EUR\)|<|Fonte/.test(portugal), portugal);
assert.ok(countrySpeech(COUNTRIES.Japan, { tab: 'culture' }).startsWith('Japão: cultura.'));
assert.equal(spokenPopulation(12400232), '12,4 milhões de habitantes');
assert.equal(spokenPopulation(1500000), '1,5 milhão de habitantes');
assert.equal(spokenPopulation(350400), '350 mil habitantes');
assert.equal(citySpeech({ name: 'São Paulo', region: 'São Paulo', population: 12400232, rank: 1 }, { countryName: 'Brasil', localTime: 'dom., 13:42' }),
  'São Paulo, São Paulo, Brasil. Capital regional. Cerca de 12,4 milhões de habitantes. Agora são 13 e 42 lá.');
console.log(`Acessibilidade: ${cases.length} frases de voz, ordem das vozes e textos para ouvir verificados.`);
