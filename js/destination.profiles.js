import { COUNTRIES } from './countries.dataset.js';
import { ACCESS_GATEWAYS, COST_PROFILES, EXPERIENCES, EXPANSION_SEEDS, PROFILE_COMPLEMENTS, REFINED_NOTES, SEASON_REFINEMENTS } from './destination.expansion.js';

// Editorial regional refinements of bestTime/travelProfile, NOT nationwide weather.
// Monthly strings run Jan–Dec: H=calor, M=ameno, C=frio; season 0=exclude,
// Original compact rows use 0=poor, 1=usable, 2=favorable; the factory normalizes
// to the shared 0=poor, 1=acceptable, 2=good, 3=ideal scale. See DISCOVERY.md.
export const DISCOVERY_REVIEWED_ON = '2026-09-26';
export const TRIP_REFERENCE = '1 pessoa · 7 dias/7 noites · ida e volta econômica de GRU · hospedagem simples em quarto privativo, refeições, transporte local e passeios básicos. Sem compras, luxo ou grandes expedições. Faixas editoriais, não cotações; confirme passagens, seguro e documentação.';
export const INTERESTS = Object.freeze({
  praia: '🌊 Praia', cultura: '🏛️ Cultura', natureza: '🌿 Natureza',
  cidade: '🌆 Cidade', aventura: '🏔️ Aventura', gastronomia: '🍜 Gastronomia'
});
export const CLIMATES = Object.freeze({ calor: '☀️ Calor', ameno: '🌤️ Ameno', frio: '❄️ Frio', any: '🎲 Tanto faz' });
export const DISCOVERY_MONTHS = Object.freeze(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
export const BUDGETS = Object.freeze([
  { id: '5000', label: 'Até R$ 5.000', ceiling: 5000 },
  { id: '8000', label: 'R$ 5.000–8.000', ceiling: 8000 },
  { id: '12000', label: 'R$ 8.000–12.000', ceiling: 12000 },
  { id: '18000', label: 'R$ 12.000–18.000', ceiling: 18000 },
  { id: 'above', label: 'Acima de R$ 18.000', ceiling: Infinity },
  { id: 'any', label: 'Orçamento não é prioridade', ceiling: Infinity }
]);

function profile(id, countryKey, region, airport, interests, climate, season, airfare, local, note, options = {}) {
  return Object.freeze({
    id, countryKey, region, airport, interests: Object.freeze(interests),
    monthlyClimate: Object.freeze([...climate].map(value => ({ H: 'calor', M: 'ameno', C: 'frio' })[value])),
    seasonSuitability: Object.freeze([...season].map(value => options.fourSeasons ? Number(value) : [0, 2, 3][Number(value)])),
    airfareBRL: Object.freeze(airfare), localWeekBRL: Object.freeze(local),
    estimatedTripRangeBRL: Object.freeze({ min: airfare[0] + local[0], max: airfare[1] + local[1] }),
    note, peakMonths: Object.freeze(options.peakMonths || [1, 7, 12]),
    seasonBasis: options.seasonBasis || 'Refinamento regional de bestTime e travelProfile.seasonalTips do catálogo.',
    sources: Object.freeze(options.sources || []), confidence: 'editorial-conservative',
    reviewedOn: DISCOVERY_REVIEWED_ON,
    airportCountry: ACCESS_GATEWAYS[`${countryKey}:${airport}`] || ACCESS_GATEWAYS[countryKey] || COUNTRIES[countryKey]?.alpha2,
    interestMonths: options.interestMonths || null
  });
}

// Strength 3 = defining experience; 2 = meaningful complementary experience.
// Costs include the actual regional gateway, connections/transfers and local week;
// cheap daily living never cancels an expensive long-haul flight.
const ORIGINAL_PROFILES = [
  profile('br-salvador', 'Brazil', 'Salvador e litoral próximo', 'SSA', { praia: 3, cultura: 3, gastronomia: 2 },
    'HHHHHHHHHHHH', '222100112222', [1000, 2500], [3000, 5000],
    'Praias e patrimônio de Salvador; chuvas mais fortes limitam abril–julho. Carnaval e Réveillon podem ultrapassar a faixa.', { peakMonths: [1, 2, 12] }),
  profile('ar-buenos-aires', 'Argentina', 'Buenos Aires', 'EZE', { cidade: 3, cultura: 3, gastronomia: 3 },
    'HHMMMMMMMMMH', '112221112221', [1500, 3000], [3500, 6500], 'Bairros, museus e gastronomia; inverno urbano fresco, não um roteiro de neve.'),
  profile('ar-bariloche', 'Argentina', 'Bariloche: lagos e montanhas no inverno', 'BRC', { natureza: 3, aventura: 3 },
    'MMMMCCCCCCMM', '000001220000', [3000, 5500], [6500, 10000],
    'Passeios de inverno e montanha; neve e abertura de pistas não são garantidas. Esqui intensivo é orçamento adicional.', { peakMonths: [7, 8], seasonBasis: 'Janela de inverno de Bariloche explicitada em bestTime; não usar a curva de verão da Patagônia.' }),
  profile('cl-andes', 'Chile', 'Andes próximos a Santiago: inverno', 'SCL', { natureza: 3, aventura: 3 },
    'MMMCCCCCCMMM', '000001221000', [2000, 4000], [6000, 10000],
    'Base em Santiago com passeios à cordilheira; abertura de pistas varia. Junho é transição, não promessa de neve.', { peakMonths: [7, 8], sources: ['https://chile.travel/en/destinations/ski-resorts/'], seasonBasis: 'Perfil de inverno andino, não a temporada de trilhas da Patagônia presente na curva nacional.' }),
  profile('pe-cusco', 'Peru', 'Cusco e Vale Sagrado', 'CUZ', { cultura: 3, natureza: 3, aventura: 2 },
    'MMMMMMMMMMMM', '000122222100', [2500, 4500], [4000, 6500],
    'Dias amenos em altitude, noites frias; não é um perfil de neve. Inclui deslocamentos e visitas básicas, não a Trilha Inca.', { seasonBasis: 'Estação seca maio–setembro em bestTime e checklist andino; a curva months nacional não representa Cusco.' }),
  profile('co-cartagena', 'Colombia', 'Cartagena e ilhas próximas', 'CTG', { praia: 3, cultura: 3, gastronomia: 2 },
    'HHHHHHHHHHHH', '222100000001', [2500, 4500], [3500, 6000], 'Calor caribenho e centro histórico; travessias dependem do mar, sem extrapolar o clima de Bogotá.'),
  profile('us-new-york', 'United States of America', 'Nova York', 'JFK', { cidade: 3, cultura: 3, gastronomia: 3 },
    'CCCMMHHHMMCC', '111222112211', [4500, 7500], [8000, 12500],
    'Inverno frio para museus e vida urbana, não praia. Visto e taxas devem ser conferidos no guia.', { seasonBasis: 'Primavera/outono ideais no catálogo; inverno urbano permitido com ressalva, sem prometer conforto ao ar livre.' }),
  profile('mx-city', 'Mexico', 'Cidade do México', 'MEX', { cultura: 3, gastronomia: 3, cidade: 3 },
    'MMMMMMMMMMMM', '222221111222', [4000, 6500], [4000, 6500], 'Perfil urbano de altitude; não representa praias caribenhas. Confira documentação de entrada.'),
  profile('jm-north', 'Jamaica', 'Montego Bay e costa norte', 'MBJ', { praia: 3, natureza: 2, cultura: 2 },
    'HHHHHHHHHHHH', '222210000001', [5000, 8000], [5000, 8000],
    'Hospedagem simples, não resort all-inclusive. Evitamos a principal janela de tempestades neste perfil de praia.', { sources: ['https://www.visitjamaica.com/travel-alerts/'] }),
  profile('pt-lisbon', 'Portugal', 'Lisboa e Sintra', 'LIS', { cultura: 3, cidade: 3, gastronomia: 3 },
    'MMMMMHHHHMMM', '111222112211', [4000, 6500], [4500, 7000], 'Passeios urbanos e patrimônio; não é um perfil de praia do Algarve.'),
  profile('es-madrid', 'Spain', 'Madri e Toledo', 'MAD', { cultura: 3, cidade: 3, gastronomia: 3 },
    'CCMMMHHHHMMC', '112221112211', [4000, 6500], [5000, 8000], 'Verão quente no interior; inverno frio para roteiro urbano, não litoral.'),
  profile('fr-paris', 'France', 'Paris', 'CDG', { cultura: 3, cidade: 3, gastronomia: 3 },
    'CCCMMMMMMMCC', '111222112211', [4500, 7500], [6500, 10500], 'Museus e bairros; inverno frio, com dias curtos. Não representa a Riviera.'),
  profile('it-rome', 'Italy', 'Roma', 'FCO', { cultura: 3, cidade: 3, gastronomia: 3 },
    'MMMMMHHHHMMM', '112221112211', [4500, 7000], [5500, 9000], 'Patrimônio e cozinha romana; julho–agosto são quentes e concorridos, não um perfil alpino.'),
  profile('de-frankfurt', 'Germany', 'Frankfurt e vale do Reno', 'FRA', { cultura: 3, cidade: 3, gastronomia: 2 },
    'CCCMMMMMMCCC', '111222222111', [4500, 7000], [5000, 8500], 'Cidades e patrimônio; inverno frio com passeios externos mais curtos.'),
  profile('ma-marrakech', 'Morocco', 'Marrakech', 'RAK', { cultura: 3, gastronomia: 3, cidade: 2 },
    'MMMMHHHHHMMM', '112221001221', [4500, 7500], [3500, 6000],
    'Medina e mercados; não usa a neve do Atlas para justificar clima frio em Marrakech.', { sources: ['https://www.visitmorocco.com/en/travel-info/climate-and-seasons', 'https://visitmarrakech.com/planification/meteo-marrakech/'] }),
  profile('za-cape', 'South Africa', 'Cidade do Cabo e península', 'CPT', { natureza: 3, gastronomia: 3, cidade: 2, aventura: 2 },
    'HHHMMMMMMMHH', '222210001222', [3500, 6000], [4500, 7500], 'Trilhas e passeios costeiros; inverno chuvoso é excluído, sem confundir com safári no nordeste.'),
  profile('mu-west', 'Mauritius', 'Costa oeste de Maurício', 'MRU', { praia: 3, natureza: 3 },
    'HHHHHMMMMHHH', '000122222221', [7000, 10500], [5500, 8500], 'Praia e passeios naturais; verão sujeito a ciclones, sem resort de luxo.'),
  profile('ae-dubai', 'United Arab Emirates', 'Dubai', 'DXB', { cidade: 3, cultura: 2, gastronomia: 2, praia: 2 },
    'HHHHHHHHHHHH', '222100000122', [6000, 9000], [5000, 8500],
    'Inverno quente para cidade e praia; verão extremo é excluído dos passeios externos.', { sources: ['https://www.visitdubai.com/plan-your-trip/weather-in-dubai'] }),
  profile('mv-male-atolls', 'Maldives', 'Ilhas locais do atol de Malé', 'MLE', { praia: 3, natureza: 3 },
    'HHHHHHHHHHHH', '222100000001', [7500, 11000], [5000, 8000],
    'Pousada em ilha local e transporte marítimo, não bangalô de luxo. Monção excluída; dezembro ainda é transição.', { peakMonths: [1, 2, 12], sources: ['https://meteorology.gov.mv/climate'], seasonBasis: 'Fonte meteorológica: seca jan–mar; abr/dez transição. Mais conservador que bestTime para atividades marítimas.' }),
  profile('in-delhi-agra', 'India', 'Délhi e Agra', 'DEL', { cultura: 3, gastronomia: 3, cidade: 2 },
    'MMHHHHHHHHMM', '222100000122', [6500, 9500], [3000, 5000], 'Patrimônio do norte; calor extremo e monção excluídos. Inverno pode ter neblina e poluição, não é roteiro himalaio.'),
  profile('np-valleys', 'Nepal', 'Vale de Katmandu e trilhas baixas', 'KTM', { natureza: 3, aventura: 3, cultura: 3 },
    'MMMMHHHHHMMM', '002210000220', [7500, 11000], [3500, 6000], 'Caminhadas em baixa altitude, não Everest nem expedição. Monção excluída e guias/licenças devem entrar no planejamento.'),
  profile('jp-tokyo', 'Japan', 'Tóquio e arredores', 'NRT', { cultura: 3, cidade: 3, gastronomia: 3 },
    'CCMMMHHHHMMC', '112221001221', [6500, 10000], [5000, 8000],
    'Outono e primavera amenos; inverno urbano frio, não extrapolado para Okinawa.', { peakMonths: [3, 4, 11], sources: ['https://www.japan.travel/en/weather/kanto/tokyo/', 'https://www.japan.travel/en/guide/japan-on-a-budget/'], seasonBasis: 'Curva do catálogo refinada para Tóquio: inverno urbano viável com ressalva, verão úmido excluído.' }),
  profile('kr-seoul', 'South Korea', 'Seul', 'ICN', { cultura: 3, cidade: 3, gastronomia: 3 },
    'CCCMMHHHMMCC', '111221002211', [7000, 10500], [4500, 7500], 'Inverno frio com dias curtos; verão de monção excluído. Autorização eletrônica não é tratada como isenção de visto.'),
  profile('th-phuket', 'Thailand', 'Phuket: costa do Andamão', 'HKT', { praia: 3, natureza: 3, gastronomia: 2 },
    'HHHHHHHHHHHH', '222100000012', [6500, 9500], [3500, 6000], 'Fim da monção em novembro ainda pode trazer chuva e mar agitado; passeios marítimos dependem das condições.'),
  profile('id-bali', 'Indonesia', 'Bali', 'DPS', { praia: 3, natureza: 3, cultura: 3, gastronomia: 2 },
    'HHHHHHHHHHHH', '000122222100', [7500, 11000], [3500, 6000], 'Praias e templos de Bali; monção excluída, sem generalizar a sazonalidade para todo o arquipélago.'),
  profile('au-sydney', 'Australia', 'Sydney e Blue Mountains', 'SYD', { cidade: 3, natureza: 3, cultura: 2, gastronomia: 2 },
    'HHHMMMMMMMHH', '112221112221', [8000, 12000], [6500, 10000],
    'Inverno ameno em Sydney, não neve nos Alpes Australianos. Trilhas dependem de alertas locais.', { sources: ['https://www.australia.com/en-gb/facts-and-planning/weather-in-australia/sydney-weather.html', 'https://www.australia.com/en-gb/facts-and-planning/about-australia/australia-on-budget.html'] }),
  profile('nz-queenstown', 'New Zealand', 'Queenstown: lagos e montanhas', 'ZQN', { natureza: 3, aventura: 3 },
    'MMMMCCCCMMMM', '222111221122', [8500, 13000], [6500, 11000],
    'Verão para trilhas; inverno para paisagens e atividades de neve guiadas, não trilhas alpinas de verão. Esqui intensivo à parte.', { peakMonths: [1, 7, 8, 12], sources: ['https://www.queenstownnz.co.nz/stories/post/winter-in-queenstown/'], seasonBasis: 'Alternância verão/trilhas e inverno/neve já citada no catálogo; recorte alpino explícito.' })
];

// Only the compact regional facts are added. Never copy visa, History, media or
// whole country records here. Season null means reuse the catalog's month curve,
// mapping "not preferred" to acceptable for the named cultural/city itinerary.
const BEACH_MONTHS = {
  Uruguay: [12, 1, 2, 3], Croatia: [5, 6, 7, 8, 9], Cyprus: [4, 5, 6, 7, 8, 9, 10, 11],
  Greece: [5, 6, 7, 8, 9, 10], Malta: [5, 6, 7, 8, 9, 10], Montenegro: [5, 6, 7, 8, 9]
};
const expanded = EXPANSION_SEEDS.map(([key, region, gateway, experience, climate, season, cost, note]) => {
  const country = COUNTRIES[key];
  if (!country) throw new Error(`Unknown discovery country: ${key}`);
  const airport = gateway || country.airport;
  const [airfare, local] = COST_PROFILES[cost];
  return profile(`regional-${country.alpha2}-${airport}`, key, region, airport, EXPERIENCES[experience], climate,
    season || country.months.map(value => [1, 2, 3][value]).join(''), airfare, local, note, {
      fourSeasons: true,
      seasonBasis: season ? 'Janela regional explícita, refinando bestTime e checklist do catálogo.' : `Derivada de months + bestTime para roteiro cultural/regional; inverno não ideal continua aceitável. ${country.bestTime}`,
      interestMonths: BEACH_MONTHS[key] ? { praia: BEACH_MONTHS[key] } : null
    });
});

export const DESTINATION_PROFILES = Object.freeze([
  ...ORIGINAL_PROFILES.map(original => Object.freeze({
    ...original,
    note: REFINED_NOTES[original.id] || original.note,
    seasonBasis: SEASON_REFINEMENTS[original.id] ? 'Refinamento regional: distingue época ideal, boa, aceitável com ressalvas e ruim. Consulta bestTime, checklist sazonal e as fontes registradas.' : original.seasonBasis,
    interests: Object.freeze({ ...original.interests, ...PROFILE_COMPLEMENTS[original.id] }),
    seasonSuitability: SEASON_REFINEMENTS[original.id]
      ? Object.freeze([...SEASON_REFINEMENTS[original.id]].map(Number)) : original.seasonSuitability
  })),
  ...expanded
]);
