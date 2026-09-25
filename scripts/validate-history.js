import { COUNTRIES } from '../js/countries.dataset.js';
import { HISTORY_ENRICHMENT } from '../js/history.americas-europe.dataset.js';
import { AFRICA_HISTORY } from '../js/history.africa.dataset.js';
import { ASIA_HISTORY } from '../js/history.asia.dataset.js';
import { OCEANIA_HISTORY } from '../js/history.oceania.dataset.js';

const datasets = [HISTORY_ENRICHMENT, AFRICA_HISTORY, ASIA_HISTORY, OCEANIA_HISTORY];
const targetCodes = ['NA', 'SA', 'EU', 'AF', 'AS', 'OC'];
const target = Object.entries(COUNTRIES).filter(([, country]) => targetCodes.includes(country.continent));
const issues = [];
if (target.length !== Object.keys(COUNTRIES).length) issues.push('Há destinos em continentes não cobertos pelo validador de História');
const usedText = new Map();
const wordCounts = [];
let blocks = 0;
const allHistory = {};

for (const dataset of datasets) {
  for (const [key, history] of Object.entries(dataset)) {
    if (Object.hasOwn(allHistory, key)) issues.push(`${key}: história definida em mais de uma camada`);
    allHistory[key] = history;
  }
}

const normalized = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();

for (const [key, country] of target) {
  const history = allHistory[key];
  if (!Array.isArray(history) || history.length < 3 || history.length > 5) {
    issues.push(`${key}: História ausente ou fora do intervalo de 3 a 5 blocos`);
    continue;
  }
  if (country.history !== history) issues.push(`${key}: camada histórica não resolvida pelo catálogo`);

  const titles = new Set();
  let words = 0;
  for (const [index, item] of history.entries()) {
    blocks++;
    const location = `${key} / bloco ${index + 1}`;
    const itemTitle = typeof item?.title === 'string' ? item.title : '';
    const itemText = typeof item?.text === 'string' ? item.text : '';
    if (typeof item?.icon !== 'string' || !/\p{Extended_Pictographic}/u.test(item.icon)) issues.push(`${location}: emoji ausente`);
    if (!itemTitle.trim() || itemTitle.length > 50) issues.push(`${location}: título ausente ou longo`);
    if (!itemText.trim()) issues.push(`${location}: texto vazio`);
    if (/<[^>]+>|\b(?:undefined|placeholder|lorem ipsum)\b|ainda em curadoria/i.test(`${itemTitle} ${itemText}`)) issues.push(`${location}: marcador ou HTML indevido`);

    const title = normalized(itemTitle);
    if (titles.has(title)) issues.push(`${location}: título repetido no mesmo país`);
    titles.add(title);

    const text = normalized(itemText);
    if (usedText.has(text)) issues.push(`${location}: texto duplicado de ${usedText.get(text)}`);
    usedText.set(text, location);
    words += itemText.trim() ? itemText.trim().split(/\s+/u).length : 0;
  }
  wordCounts.push(words);
  if (words < 80 || words > 160) issues.push(`${key}: ${words} palavras; esperado aproximadamente 80–160`);
}

for (const key of Object.keys(allHistory)) {
  if (!target.some(([catalogKey]) => catalogKey === key)) issues.push(`${key}: entrada fora do escopo validado`);
}

const americas = target.filter(([, country]) => ['NA', 'SA'].includes(country.continent)).length;
const europe = target.filter(([, country]) => country.continent === 'EU').length;
const africa = target.filter(([, country]) => country.continent === 'AF').length;
const asia = target.filter(([, country]) => country.continent === 'AS').length;
const oceania = target.filter(([, country]) => country.continent === 'OC').length;
console.log(`História: Américas ${americas}/${americas}; Europa ${europe}/${europe}; África ${africa}/${africa}; Ásia ${asia}/${asia}; Oceania ${oceania}/${oceania}; mundo ${target.length}/${Object.keys(COUNTRIES).length}; ${blocks} blocos; ${Math.min(...wordCounts)}–${Math.max(...wordCounts)} palavras por destino; problemas: ${issues.length}`);
for (const issue of issues) console.error(`ERRO ${issue}`);
if (issues.length) process.exitCode = 1;
