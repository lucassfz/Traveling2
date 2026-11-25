// Auditoria offline das etiquetas de procedência (js/provenance.js).
import assert from 'node:assert/strict';
import { PROVENANCE_KINDS, formatProvenanceDate, provenanceParts, safeHttpsUrl } from '../js/provenance.js';

// Cada tipo tem o texto padrão; o HTML é do <Provenance> (React, que escapa tudo).
for (const [kind, label] of Object.entries(PROVENANCE_KINDS)) {
  assert.deepEqual(provenanceParts(kind), { kind, label, parts: [] });
}
assert.throws(() => provenanceParts('rumor'), /desconhecido/);

// Datas.
assert.match(formatProvenanceDate('2026-09'), /set.*2026/);
assert.equal(formatProvenanceDate('2026-08-21'), '21/08/2026');
assert.equal(formatProvenanceDate('2026-13'), '2026-13');
assert.equal(formatProvenanceDate('ontem'), 'ontem');

// Fonte: só https.
assert.equal(safeHttpsUrl('http://example.com'), null);
assert.equal(safeHttpsUrl('javascript:alert(1)'), null);
assert.equal(safeHttpsUrl('https://www.bcb.gov.br/'), 'https://www.bcb.gov.br/');
const unsafe = provenanceParts('estimate', { detail: 'x', source: 'javascript:alert(1)', date: '<2026>' });
assert.deepEqual(unsafe.parts, [{ text: '<2026>' }, { text: 'x' }], 'ignora URL insegura e mantém o texto como texto');
const linked = provenanceParts('verified', { date: '2026-09', dateLabel: 'em', source: 'https://example.com/a?b=1&c=2', sourceText: 'Fonte oficial' });
assert.match(linked.parts[0].text, /^em set.*2026$/);
assert.deepEqual(linked.parts[1], { text: 'Fonte oficial', href: 'https://example.com/a?b=1&c=2' });

console.log(`Procedência: ${Object.keys(PROVENANCE_KINDS).length} tipos e fontes verificados.`);
