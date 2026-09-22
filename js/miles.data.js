export const MILES_TABS = Object.freeze([
  { key: 'overview', label: 'Visão geral' },
  { key: 'cards', label: 'Cartões' },
  { key: 'lounges', label: 'Salas VIP' },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'airports', label: 'Aeroportos' }
]);

export const LEARNING_PATHS = Object.freeze([
  {
    id: 'earn', title: 'Acumular',
    summary: 'Como cartões, compras e transferências viram pontos e milhas.',
    lessons: [
      'Pontos nascem em bancos, cartões ou compras; milhas ficam em programas de fidelidade de companhias aéreas. O nome varia conforme o programa.',
      'Pontos transferíveis podem ser enviados a diferentes parceiros. Manter opções abertas ajuda a esperar por um resgate que faça sentido.',
      'A taxa de acúmulo diz quantos pontos você recebe por valor gasto. Compare também anuidade, categorias que pontuam e validade dos pontos.',
      'Um cartão de companhia aérea pode oferecer vantagens nessa empresa, mas concentra seu saldo e sua escolha de viagens.',
      'Bônus de transferência aumenta o saldo enviado sob regras e prazos específicos. Transferir sem viagem definida traz risco de expiração, mudança de tabela e falta de assentos.'
    ]
  },
  {
    id: 'redeem', title: 'Usar melhor',
    summary: 'Como avaliar um resgate, bônus de transferência e valor por ponto.',
    lessons: [
      'Resgate é a emissão de uma viagem com pontos ou milhas. Compare com a passagem em dinheiro que você realmente compraria.',
      'Valor por ponto (CPP) = (preço em dinheiro evitado − taxas do resgate) ÷ pontos usados. Use a mesma moeda nas duas parcelas.',
      'Taxas, impostos e eventuais cobranças do programa podem mudar a comparação. Veja o custo total antes de transferir.',
      'Assentos para resgate são limitados e podem não existir em certas datas ou voos; um assento à venda não garante um assento por milhas.'
    ]
  },
  {
    id: 'travel', title: 'Viajar melhor',
    summary: 'Salas VIP, upgrades, Fast Track e benefícios nos aeroportos.',
    lessons: [
      'Uma sala VIP depende do seu benefício, da rede aceita e do terminal do seu voo. Confira visitas e convidados antes de ir.',
      'Upgrade pode ser pago, oferecido no check-in, solicitado com milhas ou ligado a status. Regras e disponibilidade variam por companhia.',
      'Fast Track e outros serviços de aeroporto dependem de local, companhia e benefício contratado. Confirme a regra para seu itinerário.'
    ]
  }
]);

export const CARD_PROFILES = Object.freeze([
  { id: 'lounges', label: 'Para salas VIP', guidance: 'Compare rede aceita, visitas incluídas, convidados, terminais e condições de uso.' },
  { id: 'earn', label: 'Para acumular pontos', guidance: 'Compare taxa de acúmulo, parceiros de transferência, validade e custo anual.' },
  { id: 'airline', label: 'Para companhias aéreas', guidance: 'Avalie se você realmente voa com a companhia e usará os benefícios específicos.' },
  { id: 'travel', label: 'Para benefícios de viagem', guidance: 'Considere seguro, bagagem, serviços de aeroporto e condições de elegibilidade.' }
]);

// Registros de produtos só devem ser adicionados após conferência na fonte oficial.
// Campos: id, name, issuer, profile, earning { value, unit, notes },
// loyaltyProgram, loungeAccess { networks, visits, conditions }, annualFee,
// travelBenefits, idealFor, officialSource, verifiedAt, status.
export const CARD_OFFERS = Object.freeze([]);

export const LOUNGE_TYPES = Object.freeze([
  { id: 'priority-pass', name: 'Priority Pass', explanation: 'Programa de acesso a salas parceiras. Visitas incluídas e convidados dependem do plano ou cartão que fornece o benefício.' },
  { id: 'loungekey', name: 'Mastercard Airport Experiences / LoungeKey', explanation: 'A plataforma e a rede indicam locais participantes; o emissor define elegibilidade, cobrança e quantidade de acessos.' },
  { id: 'visa', name: 'Visa Airport Companion', explanation: 'Benefícios e salas disponíveis dependem do cartão, do emissor e das condições exibidas para sua viagem.' },
  { id: 'airline', name: 'Salas de companhias aéreas', explanation: 'O acesso pode depender de cabine, status, companhia e voo elegível no dia.' },
  { id: 'independent', name: 'Salas independentes', explanation: 'Podem vender entrada direta ou participar de redes. Verifique preços, horários e regras de acesso.' }
]);

export const UPGRADE_METHODS = Object.freeze([
  { id: 'advance', title: 'Upgrade pago antes do voo', summary: 'A companhia pode oferecer uma cabine superior após a compra.', detail: 'Compare o preço total com uma passagem já vendida nessa cabine e confirme quais benefícios entram na nova tarifa.' },
  { id: 'checkin', title: 'Oferta no check-in', summary: 'Uma oferta pode aparecer perto da partida.', detail: 'Preço e disponibilidade dependem do voo. Confirme bagagem, sala VIP e regras da tarifa antes de aceitar.' },
  { id: 'miles', title: 'Upgrade com milhas ou pontos', summary: 'Alguns programas permitem usar saldo para mudar de cabine.', detail: 'A tarifa comprada pode precisar ser elegível e o assento para upgrade é separado do assento à venda. Compare com um resgate direto na cabine desejada.' },
  { id: 'status', title: 'Upgrade por status ou benefício', summary: 'Algumas condições de programa podem dar acesso a solicitações ou prioridade.', detail: 'A elegibilidade, a ordem de prioridade e a confirmação dependem das regras da companhia. Não conte com o upgrade como parte garantida da viagem.' }
]);

// Campos: airline, method, eligibleRouteCabin, timing, milesRequired,
// restrictions, officialSource, verifiedAt, status.
export const AIRLINE_UPGRADE_EXAMPLES = Object.freeze([]);

const AIRPORT_CODES = ['GRU', 'GIG', 'BSB', 'JFK', 'MIA', 'LHR', 'CDG', 'MAD', 'LIS', 'FCO', 'DXB'];

// IATA é ligado aos dados básicos do AirportRepository. Detalhes operacionais
// ficam vazios até conferência: terminais, companhias, salas, conexões e benefícios.
// Uma sala futura fica associada ao aeroporto pela lista lounges e pode ter
// id, name, terminal, networks, officialSource, verifiedAt e status.
export const AIRPORT_GUIDES = Object.freeze(AIRPORT_CODES.map(iata => Object.freeze({
  iata,
  terminals: [],
  airlines: [],
  lounges: [],
  fastTrack: null,
  connectionNotes: null,
  officialSource: null,
  verifiedAt: null,
  status: 'needs-review'
})));
