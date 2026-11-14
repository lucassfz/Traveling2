// Calculations and matching stay local. The UI provides only source-backed card facts.
export function parseBrazilianNumber(value, { whole = false } = {}) {
  if (typeof value === 'number') return Number.isFinite(value) && (!whole || Number.isInteger(value)) ? value : null;
  const raw = String(value ?? '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (!raw || !/^[\d.,]+$/.test(raw)) return null;
  if (whole) return /^\d{1,3}(?:\.\d{3})+$|^\d+$/.test(raw) ? Number(raw.replaceAll('.', '')) : null;
  let canonical;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)) canonical = raw.replaceAll('.', '').replace(',', '.');
  else if (/^\d+(?:,\d{1,2})?$/.test(raw)) canonical = raw.replace(',', '.');
  else if (/^\d+\.\d{1,2}$/.test(raw)) canonical = raw;
  else return null;
  const number = Number(canonical);
  return Number.isFinite(number) ? number : null;
}

export function evaluateRedemption({ cashFare, points, fees }) {
  const fare = parseBrazilianNumber(cashFare);
  const used = parseBrazilianNumber(points, { whole: true });
  const taxes = String(fees ?? '').trim() === '' ? 0 : parseBrazilianNumber(fees);
  if (fare === null || used === null || taxes === null) return { error: 'Preencha preço, pontos e taxas com números válidos.' };
  if (fare <= 0 || used <= 0) return { error: 'O preço da passagem e os pontos devem ser maiores que zero.' };
  if (taxes < 0 || taxes > fare) return { error: 'As taxas não podem superar o preço da passagem.' };
  if (fare > 100000000 || used > 1000000000 || taxes > 100000000) return { error: 'Confira os valores: um deles está acima do limite desta comparação.' };
  const replaced = fare - taxes;
  return { fare, used, taxes, replaced, perThousand: replaced / used * 1000 };
}

export function verifiedRecord(item) {
  const date = /^(\d{4})-(\d{2})$/.exec(item?.verifiedAt ?? '');
  if (item?.status !== 'verified' || !date || Number(date[2]) < 1 || Number(date[2]) > 12) return false;
  try { return new URL(item.officialSource).protocol === 'https:'; } catch { return false; }
}

export function annualFeeAmount(card) {
  const fee = card.annualFee || '';
  if (/^Sem anuidade\b/i.test(fee)) return 0;
  const installment = fee.match(/12\s*[×x]\s*R\$\s*([\d.,]+)/i);
  if (installment) return parseBrazilianNumber(installment[1]) * 12;
  const monthly = fee.match(/R\$\s*([\d.,]+)\s*\/\s*m[eê]s/i);
  if (monthly) return parseBrazilianNumber(monthly[1]) * 12;
  const yearly = fee.match(/R\$\s*([\d.,]+)\s*\/\s*ano/i);
  return yearly ? parseBrazilianNumber(yearly[1]) : null;
}

export function cardMatches(cards, preferences) {
  const values = new Set(preferences.values || []);
  const scored = cards.filter(verifiedRecord).filter(card => !/\bPrivate\b/i.test(card.issuer || '')).map(card => {
    const fee = annualFeeAmount(card);
    const unlimited = /(?:LoungeKey|Visa Airport Companion):?[^;]*acessos (?:gratuitos )?ilimitad/i.test(card.loungeAccess || '');
    const lounge = Boolean(card.loungeAccess);
    const flexible = /transfer[ií]veis|Esfera|Itaú Pontos/i.test(card.loyaltyProgram || '');
    const international = /exterior|internacion/i.test(card.earning || '');
    const airport = /bagagem|upgrade|salas/i.test(card.travelBenefits || '');
    let score = 0;
    const reasons = [];
    if (values.has('points') && card.earning) { score += 4; reasons.push(`Acúmulo informado: ${card.earning}`); }
    if (values.has('points') && flexible) { score += 2; reasons.push(`Programa informado: ${card.loyaltyProgram}`); }
    if ((values.has('lounges') || preferences.lounge === 'important') && lounge) {
      score += unlimited ? 7 : 4;
      reasons.push(`Acesso descrito: ${card.loungeAccess}`);
    } else if (preferences.lounge === 'useful' && lounge) { score += unlimited ? 3 : 2; reasons.push(`Acesso descrito: ${card.loungeAccess}`); }
    if (values.has('airports') && airport) { score += 3; reasons.push(`Viagem: ${card.travelBenefits}`); }
    if ((values.has('international') || preferences.abroad === 'often') && international) {
      score += 2; reasons.push(`No exterior: ${card.earning}`);
    }
    if (preferences.trips === '6+' && lounge) score += unlimited ? 3 : 1;
    if (preferences.fee === 'avoid' && fee !== null) score += fee === 0 ? 8 : fee <= 1200 ? 4 : fee <= 1800 ? 2 : 0;
    else if (preferences.fee === 'conditional' && card.feeWaiver) score += 1;
    if (fee !== null && preferences.fee === 'avoid') reasons.push(`Anuidade informada: ${card.annualFee}`);
    const warnings = [card.annualFee ? `Anuidade: ${card.annualFee}${card.feeWaiver ? `. Isenção: ${card.feeWaiver}` : ''}` : null].filter(Boolean);
    return { card, score, reasons: [...new Set(reasons)].slice(0, 3), warnings };
  }).sort((a, b) => b.score - a.score || a.card.name.localeCompare(b.card.name, 'pt-BR'));
  return { matches: scored, similar: scored.length > 1 && scored[0].score - scored[1].score <= 2 };
}

export function loungeNetworks(guides) {
  const names = new Set(guides.flatMap(guide => verifiedRecord(guide) ? (guide.lounges || []).filter(verifiedRecord).flatMap(lounge => lounge.networks || []) : []));
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function findVerifiedLounges(guides, airportCode, network = 'all') {
  const guide = guides.find(item => item.iata === airportCode);
  if (!verifiedRecord(guide)) return [];
  return (guide.lounges || []).filter(verifiedRecord).filter(lounge => network === 'all' ||
    (network === 'card' ? !(lounge.networks || []).length : (lounge.networks || []).includes(network)));
}

export function filterLoungesByTerminal(lounges, terminal = 'all') {
  if (terminal === 'all') return lounges;
  return lounges.filter(lounge => String(lounge.terminal ?? '').toUpperCase().startsWith(terminal.toUpperCase()));
}

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function rankAirportMatches(airports, query) {
  const term = normalizeSearch(query);
  if (!term) return [];
  return airports.map(airport => {
    const code = normalizeSearch(airport.iata);
    const icao = normalizeSearch(airport.icao);
    const city = normalizeSearch(airport.city);
    const name = normalizeSearch(airport.name);
    const score = code === term ? 100 : icao === term ? 95
      : city === term ? 90 : city.startsWith(term) ? 82
        : name === term ? 78 : name.startsWith(term) ? 70
          : city.includes(term) ? 60 : name.includes(term) ? 50
            : code.startsWith(term) || (term.length < 3 && icao.startsWith(term)) ? 45
              : normalizeSearch(airport.country) === term ? 20 : 0;
    return { airport, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.airport.iata).localeCompare(String(b.airport.iata)))
    .map(item => item.airport);
}
