/**
 * Landmark inventory for the South American country drawer.
 *
 * Landmark names and localities are preliminary editorial records. Unverified
 * image candidates were removed; media is curated in landmarks.media.js.
 */
export const SOUTH_AMERICA_DATA = Object.freeze({
  Brazil: {
    id: 'BR', name: 'Brasil', continent: 'América do Sul',
    landmarks: [
      { name: 'Cristo Redentor', city: 'Rio de Janeiro' },
      { name: 'Cataratas do Iguaçu', city: 'Foz do Iguaçu' }
    ]
  },
  Argentina: {
    id: 'AR', name: 'Argentina', continent: 'América do Sul',
    landmarks: [
      { name: 'Obelisco de Buenos Aires', city: 'Buenos Aires' },
      { name: 'Glaciar Perito Moreno', city: 'El Calafate' }
    ]
  },
  Chile: {
    id: 'CL', name: 'Chile', continent: 'América do Sul',
    landmarks: [
      { name: 'Torres del Paine', city: 'Torres del Paine' },
      { name: 'Valle de la Luna', city: 'San Pedro de Atacama' }
    ]
  },
  Peru: {
    id: 'PE', name: 'Peru', continent: 'América do Sul',
    landmarks: [
      { name: 'Machu Picchu', city: 'Machu Picchu Pueblo' },
      { name: 'Centro Histórico de Lima', city: 'Lima' }
    ]
  },
  Colombia: {
    id: 'CO', name: 'Colômbia', continent: 'América do Sul',
    landmarks: [
      { name: 'Cidade Murada de Cartagena', city: 'Cartagena de Indias' },
      { name: 'Parque Nacional Natural Tayrona', city: 'Santa Marta' }
    ]
  },
  Bolivia: {
    id: 'BO', name: 'Bolívia', continent: 'América do Sul',
    landmarks: [
      { name: 'Salar de Uyuni', city: 'Uyuni' },
      { name: 'Sítio Arqueológico de Tiwanaku', city: 'Tiwanaku' },
      { name: 'Basílica de Nossa Senhora de Copacabana', city: 'Copacabana, La Paz', disambiguation: 'Copacabana, Bolívia, no Lago Titicaca; não é a praia do Rio de Janeiro.' }
    ]
  },
  Uruguay: {
    id: 'UY', name: 'Uruguai', continent: 'América do Sul',
    landmarks: [
      { name: 'Ciudad Vieja', city: 'Montevidéu' },
      { name: 'Casapueblo', city: 'Punta Ballena' }
    ]
  },
  Paraguay: {
    id: 'PY', name: 'Paraguai', continent: 'América do Sul',
    landmarks: [
      { name: 'Missão Jesuítica de La Santísima Trinidad de Paraná', city: 'Trinidad' },
      { name: 'Saltos del Monday', city: 'Presidente Franco' }
    ]
  },
  Ecuador: {
    id: 'EC', name: 'Equador', continent: 'América do Sul',
    landmarks: [
      { name: 'Ilhas Galápagos', city: 'Puerto Ayora' },
      { name: 'Mitad del Mundo', city: 'San Antonio de Pichincha' }
    ]
  },
  Venezuela: {
    id: 'VE', name: 'Venezuela', continent: 'América do Sul',
    landmarks: [
      { name: 'Salto Ángel', city: 'Parque Nacional Canaima' },
      { name: 'Médanos de Coro', city: 'Santa Ana de Coro' }
    ]
  },
  Guyana: {
    id: 'GY', name: 'Guiana', continent: 'América do Sul',
    landmarks: [
      { name: 'Cataratas Kaieteur', city: 'Parque Nacional Kaieteur, Potaro-Siparuni' },
      { name: 'Catedral de São Jorge', city: 'Georgetown' }
    ]
  },
  Suriname: {
    id: 'SR', name: 'Suriname', continent: 'América do Sul',
    landmarks: [
      { name: 'Centro Histórico de Paramaribo', city: 'Paramaribo' },
      { name: 'Parque Natural Brownsberg', city: 'Brokopondo' }
    ]
  },
  'Fr. Guiana': {
    id: 'GF', name: 'Guiana Francesa', continent: 'América do Sul',
    landmarks: [
      { name: 'Îles du Salut', city: 'Kourou' },
      { name: 'Place des Palmistes', city: 'Caiena' }
    ]
  }
});

export const SOUTH_AMERICA_ENRICHMENT = Object.freeze(Object.fromEntries(
  Object.entries(SOUTH_AMERICA_DATA).map(([key, data]) => [key, {
    region: data.continent,
    landmarks: data.landmarks.map(landmark => ({ ...landmark, country: data.name })),
    photos: [],
    dataLevel: 'curated'
  }])
));
