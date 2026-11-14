const STATUS = Object.freeze({
  'visa-free': { title: 'Sem visto', tone: 'success' },
  authorization: { title: 'Autorização eletrônica (ETA)', tone: 'warning' },
  evisa: { title: 'Visto eletrônico (eVisa)', tone: 'warning' },
  'visa-on-arrival': { title: 'Visto na chegada', tone: 'warning' },
  'visa-required': { title: 'Visto antes da viagem', tone: 'warning' },
  domestic: { title: 'Viagem nacional', tone: 'success' },
  unknown: { title: 'Regra a confirmar', tone: 'warning' }
});

const clean = value => String(value ?? '').trim();
const usefulSystemNote = value => value && !/^não se aplica\b/i.test(value.status || '');
const ARRIVAL_FORMS = ['EASE', 'DViajero', 'e-ticket', 'C5', 'IMUGA', 'SG Arrival Card', 'Thailand Digital Arrival Card'];

export function entryPresentation(country) {
  const entry = country.entryRequirements;
  const eligibility = country.visaPolicyBR?.eligibility || 'unknown';
  const status = country.borderStatus === 'closed'
    ? { ...(STATUS[eligibility] || STATUS.unknown), tone: 'danger' }
    : !entry && eligibility !== 'domestic'
      ? { ...(STATUS[eligibility] || STATUS.unknown), tone: 'warning' }
      : STATUS[eligibility] || STATUS.unknown;
  const statusDetail = entry?.visaPolicyBR || (eligibility === 'domestic'
    ? 'Brasileiros não precisam de visto para viajar dentro do país.'
    : eligibility === 'visa-free'
      ? 'Turismo sem visto para brasileiros, segundo as informações gerais disponíveis.'
      : 'O tipo de autorização para brasileiros está a confirmar.');
  const preparation = entry ? [
    ['Documento', entry.passportValidity],
    ['Comprovantes', entry.documents],
    ['Saúde', entry.health]
  ].filter(([, value]) => clean(value)) : eligibility === 'domestic'
    ? [['Documento', country.passport || 'Leve documento de identificação aceito pela companhia e pela rota.']]
    : [];
  const notes = [];
  if (country.conflict?.text) notes.push(country.conflict.text);
  else if (['warn', 'closed'].includes(country.borderStatus) && clean(country.borderNote) && clean(country.borderNote) !== clean(entry?.visaPolicyBR)) notes.push(country.borderNote);
  const declaration = clean(country.entryDeclaration);
  const documents = clean(entry?.documents);
  const formAlreadyListed = ARRIVAL_FORMS.some(name => declaration.toLowerCase().includes(name.toLowerCase()) && documents.toLowerCase().includes(name.toLowerCase()));
  if (declaration && !formAlreadyListed && !documents.includes(declaration)) notes.push(declaration);
  if (usefulSystemNote(entry?.ees)) notes.push(`EES: ${entry.ees.notes}`);
  if (usefulSystemNote(entry?.etias)) notes.push(`ETIAS: ${entry.etias.notes}`);
  if (entry?.status === 'needs-review') notes.push('Há detalhes desta regra que precisam de confirmação oficial antes da viagem.');

  return {
    status: { ...status, detail: statusDetail },
    stay: clean(entry?.maxStay) || (eligibility === 'domestic' ? 'Não se aplica a viagens nacionais.' : 'Prazo a confirmar na fonte oficial.'),
    preparation,
    notes: [...new Set(notes.map(clean).filter(Boolean))],
    verifiedAt: entry?.verifiedAt,
    sources: [
      ['Fonte oficial de entrada', entry?.officialSource],
      ['EES', usefulSystemNote(entry?.ees) && entry.ees.officialSource],
      ['ETIAS', usefulSystemNote(entry?.etias) && entry.etias.officialSource],
      ['Saúde', country.healthSource]
    ].filter(([, url]) => typeof url === 'string' && /^https:\/\//i.test(url))
  };
}
