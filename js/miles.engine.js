const CATEGORIES = Object.freeze([
  { key: 'all', label: 'Todos' },
  { key: 'card-strategy', label: 'Card Strategy' },
  { key: 'lounges', label: 'Lounges' },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'redemption', label: 'Redemption Sweet Spots' }
]);

const KNOWLEDGE_CARDS = Object.freeze([
  {
    id: 'transferable-vs-cobranded', category: 'card-strategy', icon: '↔',
    title: 'Transferível vs. co-branded', preview: 'Flexibilidade costuma valer mais do que acumular tudo em um único programa.',
    detail: [
      'Pontos transferíveis preservam opções até você encontrar disponibilidade-prêmio.',
      'Cartões co-branded podem fazer sentido quando benefícios específicos da companhia têm uso recorrente.',
      'Compare taxa anual, earn rate, validade e parceiros antes de concentrar gastos.'
    ]
  },
  {
    id: 'category-multipliers', category: 'card-strategy', icon: '×',
    title: 'Multiplicadores por categoria', preview: 'Direcione gastos para a categoria que realmente bonifica aquele cartão.',
    detail: [
      'Mapeie alimentação, viagem, combustível, assinaturas e compras internacionais separadamente.',
      'O maior multiplicador nominal não compensa uma anuidade alta se seu volume na categoria for baixo.',
      'Evite criar gasto extra apenas para gerar pontos.'
    ]
  },
  {
    id: 'transfer-bonus', category: 'card-strategy', icon: '%',
    title: 'Bônus de transferência', preview: 'Bônus só é vantagem quando existe um uso definido depois da transferência.',
    detail: [
      'Campanhas podem elevar significativamente o saldo recebido, mas percentuais e regras variam por emissor e programa.',
      'Confirme validade, elegibilidade e prazo de crédito antes de transferir.',
      'Não transfira pontos especulativamente se o programa de destino tiver expiração ou desvalorização frequente.'
    ]
  },
  {
    id: 'cpp', category: 'card-strategy', icon: '¢',
    title: 'CPP / valor por ponto', preview: 'Meça o valor do resgate em vez de olhar só para a quantidade de milhas.',
    detail: [
      'CPP = (preço em dinheiro evitado − taxas do resgate) ÷ pontos usados.',
      'Compare sempre com a tarifa que você realmente compraria, não com a tarifa cheia mais cara disponível.',
      'Um CPP alto não justifica uma viagem que você não faria em dinheiro.'
    ]
  },
  {
    id: 'priority-pass', category: 'lounges', icon: 'P',
    title: 'Priority Pass', preview: 'A marca da rede não define sozinha quantas visitas ou convidados você possui.',
    detail: [
      'Planos emitidos por cartões podem ter regras diferentes de uma assinatura comprada diretamente.',
      'Número de visitas, política de convidados e cobrança adicional dependem do emissor/plano.',
      'Cheque o lounge e seu terminal antes de passar pela segurança ou imigração.'
    ]
  },
  {
    id: 'dragonpass-loungekey', category: 'lounges', icon: 'D',
    title: 'DragonPass & LoungeKey', preview: 'Acesso é uma combinação de rede + benefício contratado pelo seu cartão.',
    detail: [
      'Ter um cartão compatível não significa automaticamente visitas ilimitadas.',
      'Alguns emissores exigem cadastro prévio ou cobrança por visita/convidado.',
      'Use o aplicativo/site do benefício e do aeroporto para confirmar operação no dia.'
    ]
  },
  {
    id: 'centurion-airline', category: 'lounges', icon: '◈',
    title: 'Centurion & lounges de companhia', preview: 'Regras de cartão, status, cabine e itinerário podem ser totalmente diferentes.',
    detail: [
      'Centurion Lounges seguem regras do produto e do mercado emissor do cartão.',
      'Lounges de companhia/aliança normalmente consideram cabine, status e voo elegível do mesmo dia.',
      'Convidados nunca devem ser presumidos: valide a regra específica antes da viagem.'
    ]
  },
  {
    id: 'layover-lounge', category: 'lounges', icon: '⌛',
    title: 'Layover com lounge', preview: 'O lounge certo reduz atrito; o lounge errado pode aumentar risco de perder a conexão.',
    detail: [
      'Priorize lounges no mesmo terminal/área segura do próximo embarque.',
      'Considere imigração, nova inspeção de segurança e tempo de caminhada até o portão.',
      'Saia do lounge com margem; horário de fechamento de portão pode anteceder a partida.'
    ]
  },
  {
    id: 'opup', category: 'upgrades', icon: '↑',
    title: 'Operational Upgrade (OpUp)', preview: 'É uma correção operacional, não um benefício garantido nem uma estratégia comprável.',
    detail: [
      'Pode ocorrer quando há desequilíbrio de cabine, oversale ou necessidade operacional.',
      'Status, tarifa e regras internas podem influenciar prioridade, mas não criam direito ao upgrade.',
      'Nunca compre uma tarifa esperando OpUp como parte do valor da viagem.'
    ]
  },
  {
    id: 'upgrade-eligibility', category: 'upgrades', icon: 'Y',
    title: 'Fare class importa', preview: 'Y/B/M e tarifas descontadas podem ter elegibilidade de upgrade diferente.',
    detail: [
      'A letra da classe tarifária é diferente da cabine comercial mostrada no site.',
      'Alguns instrumentos de upgrade exigem classes específicas; tarifas muito descontadas podem ser excluídas.',
      'Leia a tabela do programa antes de escolher uma tarifa apenas pelo preço.'
    ]
  },
  {
    id: 'bid-upgrade', category: 'upgrades', icon: '⇧',
    title: 'Bid / cash upgrade', preview: 'Compare o lance com a diferença real de tarifa e com o que você valoriza na cabine.',
    detail: [
      'Convites e valores mínimos dependem da companhia, rota, tarifa e inventário.',
      'Considere bagagem, lounge, assento e crédito de milhas: nem todo upgrade pós-compra herda todos os benefícios.',
      'Defina um teto antes de ofertar para evitar pagar mais que uma tarifa superior vendida diretamente.'
    ]
  },
  {
    id: 'mileage-upgrade', category: 'upgrades', icon: 'M',
    title: 'Mileage Upgrade Award', preview: 'Milhas para upgrade exigem dois inventários: tarifa elegível e espaço de upgrade.',
    detail: [
      'Disponibilidade de assento à venda não significa disponibilidade para upgrade com milhas.',
      'Copay, taxas e regras de lista de espera podem existir.',
      'Compare com emitir a cabine premium diretamente com pontos; às vezes é mais eficiente.'
    ]
  },
  {
    id: 'award-release', category: 'redemption', icon: 'T',
    title: 'T-365 vs. T-14', preview: 'Procure no início do calendário e novamente perto da partida — sem tratar nenhuma janela como regra universal.',
    detail: [
      'Companhias e programas liberam calendário em horizontes diferentes; ~T-365 é apenas uma referência comum.',
      'Algumas empresas liberam assentos adicionais nas últimas semanas quando a cabine não vendeu como previsto.',
      'T-14 é uma janela de busca útil, não uma promessa de disponibilidade.'
    ]
  },
  {
    id: 'mct', category: 'redemption', icon: 'MCT',
    title: 'Minimum Connection Time', preview: 'MCT é o mínimo operacional publicado; não é necessariamente o tempo confortável para você.',
    detail: [
      'O valor varia por aeroporto, combinação doméstico/internacional, terminais e companhia.',
      'Bilhetes separados podem exigir retirada de bagagem e novo check-in, aumentando muito o risco.',
      'Para conexões críticas, prefira margem acima do mínimo e um único bilhete quando possível.'
    ]
  },
  {
    id: 'partner-awards', category: 'redemption', icon: 'A',
    title: 'Star Alliance / oneworld / SkyTeam', preview: 'O parceiro que opera o voo e o programa usado para emitir enxergam inventários diferentes.',
    detail: [
      'Nem todo assento-prêmio do programa da companhia operadora aparece para parceiros.',
      'Pesquise segmento por segmento para descobrir onde a disponibilidade desaparece.',
      'Compare tabelas, taxas e regras de alteração do programa emissor antes de transferir pontos.'
    ]
  },
  {
    id: 'positioning', category: 'redemption', icon: '◎',
    title: 'Positioning flight', preview: 'Sair de outro hub pode abrir disponibilidade, mas transforme a economia em custo total da viagem.',
    detail: [
      'Some voo de posicionamento, hotel, bagagem, transporte e margem contra atraso.',
      'Em bilhetes separados, a companhia do longo curso normalmente não protege uma conexão perdida causada pelo primeiro bilhete.',
      'Quando a economia permanece relevante após esses custos, o posicionamento pode ser racional.'
    ]
  }
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class MilesEngine {
  constructor({ filtersElement, gridElement }) {
    this.filtersElement = filtersElement;
    this.gridElement = gridElement;
    this.activeCategory = 'all';
    this.expanded = new Set();
    this.onFilterClick = event => {
      const button = event.target.closest('[data-miles-category]');
      if (!button) return;
      this.activeCategory = button.dataset.milesCategory;
      this.render();
    };
    this.onGridClick = event => {
      const button = event.target.closest('[data-miles-card]');
      if (!button) return;
      const id = button.dataset.milesCard;
      if (this.expanded.has(id)) this.expanded.delete(id);
      else this.expanded.add(id);
      this.render();
      this.gridElement.querySelector(`[data-miles-card="${CSS.escape(id)}"]`)?.focus();
    };
  }

  mount() {
    this.filtersElement.addEventListener('click', this.onFilterClick);
    this.gridElement.addEventListener('click', this.onGridClick);
    this.render();
  }

  render() {
    this.filtersElement.innerHTML = CATEGORIES.map(category => `
      <button class="miles-filter ${this.activeCategory === category.key ? 'miles-filter--active' : ''}"
        type="button" data-miles-category="${category.key}" aria-pressed="${this.activeCategory === category.key}">
        ${escapeHtml(category.label)}
      </button>
    `).join('');

    const visible = KNOWLEDGE_CARDS.filter(card => this.activeCategory === 'all' || card.category === this.activeCategory);
    this.gridElement.innerHTML = visible.map(card => {
      const expanded = this.expanded.has(card.id);
      return `
        <article class="knowledge-card ${expanded ? 'knowledge-card--expanded' : ''}">
          <button class="knowledge-card__toggle" type="button" data-miles-card="${escapeHtml(card.id)}" aria-expanded="${expanded}">
            <span class="knowledge-card__meta"><span class="knowledge-card__icon">${escapeHtml(card.icon)}</span><span class="knowledge-card__tag">${escapeHtml(CATEGORIES.find(item => item.key === card.category)?.label || '')}</span></span>
            <span class="knowledge-card__title">${escapeHtml(card.title)}</span>
            <span class="knowledge-card__preview">${escapeHtml(card.preview)}</span>
            <span class="knowledge-card__action">${expanded ? 'Fechar' : 'Abrir análise'} <span aria-hidden="true">${expanded ? '−' : '+'}</span></span>
          </button>
          <div class="knowledge-card__drawer" ${expanded ? '' : 'hidden'}>
            <ul>${card.detail.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        </article>
      `;
    }).join('');
  }

  destroy() {
    this.filtersElement.removeEventListener('click', this.onFilterClick);
    this.gridElement.removeEventListener('click', this.onGridClick);
  }
}

export { CATEGORIES, KNOWLEDGE_CARDS };
