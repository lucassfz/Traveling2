// O checklist existente continua sendo a base. Dados futuros podem acrescentar
// dicas por categoria e mês sem alterar o esquema do catálogo global.
const PROFILE_GROUPS = Object.freeze([
  ['moneyTips', 'Dinheiro', 'money'],
  ['healthTips', 'Saúde', 'health'],
  ['connectivityTips', 'Conectividade', 'connectivity'],
  ['transportTips', 'Transporte', 'transport'],
  ['packingTips', 'Bagagem e clima', 'packing']
]);

const normalizeTip = tip => typeof tip === 'string' ? { label: tip } : tip;
const stableTipId = tip => String(tip.id || tip.label).normalize('NFKC').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, '-');

export function hasSeasonalChecklist(country) {
  return Boolean(country?.travelProfile?.seasonalTips?.length);
}

export function checklistGroups(countryKey, country, monthIndex = 0) {
  const groups = (country.checklist ?? []).map((group, groupIndex) => ({
    group: group.group,
    items: (group.items ?? []).map((item, itemIndex) => ({
      ...item,
      key: item.id ? `${countryKey}:item:${item.id}` : `${countryKey}:${groupIndex}:${itemIndex}`
    })).filter(item => item.label)
  })).filter(group => group.items.length);
  const profile = country.travelProfile ?? {};
  const seen = new Set(groups.flatMap(group => group.items.map(item => item.label.toLocaleLowerCase('pt-BR'))));

  const addTips = (label, prefix, tips) => {
    const items = (tips ?? []).map(normalizeTip).filter(tip => tip?.label)
      .filter(tip => {
        const key = tip.label.toLocaleLowerCase('pt-BR');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(tip => ({ ...tip, icon: tip.icon || '•', key: `${countryKey}:profile:${prefix}:${stableTipId(tip)}` }));
    if (items.length) groups.push({ group: label, items });
  };

  for (const [field, label, prefix] of PROFILE_GROUPS) addTips(label, prefix, profile[field]);
  const month = Number(monthIndex) + 1;
  for (const season of profile.seasonalTips ?? []) {
    if (!season.months?.includes(month)) continue;
    addTips(season.group || 'Bagagem e clima', `season:${season.id || season.months.join('-')}`, season.items);
  }
  return groups;
}

export function checklistProgress(groups, completed) {
  const keys = groups.flatMap(group => group.items.map(item => item.key));
  return { total: keys.length, done: keys.filter(key => Boolean(completed[key])).length };
}
