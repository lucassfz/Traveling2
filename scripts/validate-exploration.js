import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { checklistGroups, checklistProgress } from '../js/checklist.engine.js';
import { chooseDiscoveryKey, discoveryCountryKeys, flagFromAlpha2, flagImageUrl, isDiscoveryEligible } from '../js/country.exploration.js';

for (const country of Object.values(COUNTRIES)) {
  assert.equal(country.flag, flagFromAlpha2(country.alpha2), `${country.key}: bandeira diferente do código ISO`);
}
assert.equal(flagFromAlpha2(null), '🌍');
assert.equal(flagImageUrl('BR'), 'https://flagcdn.com/w80/br.png');
assert.equal(flagImageUrl('B!'), null);

const eligible = discoveryCountryKeys(COUNTRIES);
assert.ok(eligible.length > 1, 'Descoberta precisa de mais de um destino curado');
assert.ok(eligible.every(key => isDiscoveryEligible(COUNTRIES[key])));
assert.ok(eligible.includes('Portugal') && eligible.includes('Mexico'));
assert.ok(!eligible.includes('Haiti') && !eligible.includes('Bahamas'), 'Entradas needs-review não devem ser descobertas');
assert.notEqual(chooseDiscoveryKey(eligible, eligible[0], () => 0), eligible[0]);

const mexicoGroups = checklistGroups('Mexico', COUNTRIES.Mexico, 0);
assert.equal(mexicoGroups[0].items[0].key, 'Mexico:0:0', 'Estado já salvo deve conservar sua chave');

const sample = {
  checklist: [{ group: 'Documentos', items: [{ label: 'Passaporte' }] }],
  travelProfile: {
    connectivityTips: [{ id: 'offline-map', label: 'Salvar mapa offline' }],
    seasonalTips: [{ id: 'inverno', months: [6, 7, 8], items: [{ id: 'camadas', label: 'Levar roupas em camadas' }] }]
  }
};
const january = checklistGroups('sample', sample, 0);
const july = checklistGroups('sample', sample, 6);
assert.equal(january.length, 2, 'Categoria sazonal vazia não deve aparecer');
assert.equal(july.length, 3, 'Dica sazonal deve aparecer no mês curado');
assert.deepEqual(checklistProgress(july, { 'sample:0:0': true }), { done: 1, total: 3 });

console.log(`Exploração: ${eligible.length} destinos elegíveis; bandeiras, fallback e checklist sazonal válidos.`);
