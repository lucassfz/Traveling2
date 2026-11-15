// Regras de visto para brasileiros que precisam de nova conferência: data de
// verificação com mais de MAX_DAYS dias. Imprime um relatório em Markdown e,
// com --strict, sai com código 1 quando há regras vencidas (usado pela
// automação mensal para abrir um aviso no GitHub).
//   node scripts/check-visa-age.js [--strict] [--today=2027-05-01]
import { COUNTRIES } from '../js/countries.dataset.js';

export const MAX_DAYS = 180;
const DAY = 24 * 60 * 60 * 1000;

/** @returns {{ stale: object[], undated: object[] }} */
export function visaAgeReport(countries, today = new Date()) {
  const stale = [];
  const undated = [];
  for (const country of countries) {
    const policy = country.visaPolicyBR ?? {};
    if (policy.eligibility === 'domestic') continue;
    const verified = /^\d{4}-\d{2}-\d{2}$/.test(policy.verifiedOn ?? '') ? new Date(`${policy.verifiedOn}T00:00:00Z`) : null;
    if (!verified) { undated.push({ name: country.namePt, eligibility: policy.eligibility ?? 'unknown' }); continue; }
    const days = Math.floor((today - verified) / DAY);
    if (days > MAX_DAYS) stale.push({ name: country.namePt, verifiedOn: policy.verifiedOn, days, source: policy.source ?? null });
  }
  stale.sort((a, b) => b.days - a.days);
  return { stale, undated };
}

export function reportMarkdown({ stale, undated }) {
  const lines = [`## Regras de visto para reconferir (mais de ${MAX_DAYS} dias)`, ''];
  if (!stale.length) lines.push('Nenhuma: todas as regras datadas foram conferidas recentemente.');
  for (const item of stale) lines.push(`- [ ] **${item.name}**: conferida em ${item.verifiedOn} (${item.days} dias)${item.source ? ` · [fonte oficial](${item.source})` : ''}`);
  lines.push('', `<details><summary>Sem data de conferência (${undated.length})</summary>`, '', undated.map(item => `${item.name} (${item.eligibility})`).join(', ') || '—', '', '</details>');
  return lines.join('\n');
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const todayArg = process.argv.find(arg => arg.startsWith('--today='))?.slice(8);
  const report = visaAgeReport(Object.values(COUNTRIES), todayArg ? new Date(`${todayArg}T00:00:00Z`) : new Date());
  console.log(reportMarkdown(report));
  if (process.argv.includes('--strict') && report.stale.length) process.exitCode = 1;
}
