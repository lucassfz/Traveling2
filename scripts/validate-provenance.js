// Auditoria offline das etiquetas de procedência (js/provenance.js).
import assert from 'node:assert/strict';
import { PROVENANCE_KINDS, formatProvenanceDate, provenanceLabel, safeHttpsUrl } from '../js/provenance.js';

// Cada tipo gera a classe e o texto padrão.
for (const [kind, label] of Object.entries(PROVENANCE_KINDS)) {
  const html = provenanceLabel(kind);
  assert.ok(html.startsWith(`<p class="provenance provenance--${kind}">`), `${kind}: classe`);
  assert.ok(html.includes(`<span class="provenance__kind">${label}</span>`), `${kind}: rótulo`);
}
assert.throws(() => provenanceLabel('rumor'), /desconhecido/);

// Datas.
assert.match(formatProvenanceDate('2026-09'), /set.*2026/);
assert.equal(formatProvenanceDate('2026-08-21'), '21/08/2026');
assert.equal(formatProvenanceDate('2026-13'), '2026-13');
assert.equal(formatProvenanceDate('ontem'), 'ontem');

// Fonte: só https; texto e atributos sempre escapados.
assert.equal(safeHttpsUrl('http://example.com'), null);
assert.equal(safeHttpsUrl('javascript:alert(1)'), null);
assert.equal(safeHttpsUrl('https://www.bcb.gov.br/'), 'https://www.bcb.gov.br/');
const unsafe = provenanceLabel('estimate', {
  label: '<b>x</b>', detail: '"><img src=x onerror=1>', source: 'javascript:alert(1)', date: '<2026>'
});
assert.ok(!unsafe.includes('<b>') && !unsafe.includes('<img') && !unsafe.includes('href'), 'escapa texto e ignora URL insegura');
const linked = provenanceLabel('verified', { date: '2026-09', source: 'https://example.com/a?b=1&c=2', sourceText: 'Fonte oficial', tag: 'span', className: 'miles-trust' });
assert.ok(linked.startsWith('<span class="provenance provenance--verified miles-trust">'));
assert.ok(linked.includes('href="https://example.com/a?b=1&amp;c=2"'));
assert.ok(linked.includes('rel="noopener noreferrer"'));
assert.ok(linked.endsWith('</span>'));

console.log(`Procedência: ${Object.keys(PROVENANCE_KINDS).length} tipos e escape verificados.`);
