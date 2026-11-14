// Formatação de dinheiro do Planner (sem DOM; usada também nos testes em Node).

export function formatBRL(value, { cents = false } = {}) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(value ?? 0);
}

// Valor em qualquer moeda ISO 4217, no formato brasileiro ("€ 1.200,50").
export function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value ?? 0);
  } catch {
    return `${currency} ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value ?? 0)}`;
  }
}

// Cotação "R$ por 1 unidade" com casas suficientes para moedas fracas (JPY, CLP).
export function formatRate(rate) {
  return rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: rate < 0.1 ? 6 : 4 });
}
