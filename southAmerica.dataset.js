/**
 * Landmark inventory for the South American country drawer.
 *
 * Landmark names and localities are editorially reviewed. Image assets are
 * high-resolution Unsplash CDN URLs, kept separately from the factual place
 * label so the UI never infers a location from the image alone.
 */
export const SOUTH_AMERICA_DATA = Object.freeze({
  Brazil: {
    id: 'BR', name: 'Brasil', continent: 'América do Sul',
    landmarks: [
      { name: 'Cristo Redentor', city: 'Rio de Janeiro', imageUrl: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Cataratas do Iguaçu', city: 'Foz do Iguaçu', imageUrl: 'https://images.unsplash.com/photo-1583850383186-218228185c7d?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Argentina: {
    id: 'AR', name: 'Argentina', continent: 'América do Sul',
    landmarks: [
      { name: 'Obelisco de Buenos Aires', city: 'Buenos Aires', imageUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Glaciar Perito Moreno', city: 'El Calafate', imageUrl: 'https://images.unsplash.com/photo-1531590878845-12627191e687?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Chile: {
    id: 'CL', name: 'Chile', continent: 'América do Sul',
    landmarks: [
      { name: 'Torres del Paine', city: 'Torres del Paine', imageUrl: 'https://images.unsplash.com/photo-1531590878845-12627191e687?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Valle de la Luna', city: 'San Pedro de Atacama', imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Peru: {
    id: 'PE', name: 'Peru', continent: 'América do Sul',
    landmarks: [
      { name: 'Machu Picchu', city: 'Machu Picchu Pueblo', imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Centro Histórico de Lima', city: 'Lima', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Colombia: {
    id: 'CO', name: 'Colômbia', continent: 'América do Sul',
    landmarks: [
      { name: 'Cidade Murada de Cartagena', city: 'Cartagena de Indias', imageUrl: 'https://images.unsplash.com/photo-1558618047-3c5dc9c7c5f1?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Parque Nacional Natural Tayrona', city: 'Santa Marta', imageUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Bolivia: {
    id: 'BO', name: 'Bolívia', continent: 'América do Sul',
    landmarks: [
      { name: 'Salar de Uyuni', city: 'Uyuni', imageUrl: 'https://images.unsplash.com/photo-1583244532610-2c49e76c87ca?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Sítio Arqueológico de Tiwanaku', city: 'Tiwanaku', imageUrl: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Basílica de Nossa Senhora de Copacabana', city: 'Copacabana, La Paz', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85', disambiguation: 'Copacabana, Bolívia, no Lago Titicaca; não é a praia do Rio de Janeiro.' }
    ]
  },
  Uruguay: {
    id: 'UY', name: 'Uruguai', continent: 'América do Sul',
    landmarks: [
      { name: 'Ciudad Vieja', city: 'Montevidéu', imageUrl: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Casapueblo', city: 'Punta Ballena', imageUrl: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Paraguay: {
    id: 'PY', name: 'Paraguai', continent: 'América do Sul',
    landmarks: [
      { name: 'Missão Jesuítica de La Santísima Trinidad de Paraná', city: 'Trinidad', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Saltos del Monday', city: 'Presidente Franco', imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Ecuador: {
    id: 'EC', name: 'Equador', continent: 'América do Sul',
    landmarks: [
      { name: 'Ilhas Galápagos', city: 'Puerto Ayora', imageUrl: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Mitad del Mundo', city: 'San Antonio de Pichincha', imageUrl: 'https://images.unsplash.com/photo-1547222526-3e2ab0c3e1e1?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Venezuela: {
    id: 'VE', name: 'Venezuela', continent: 'América do Sul',
    landmarks: [
      { name: 'Salto Ángel', city: 'Parque Nacional Canaima', imageUrl: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Médanos de Coro', city: 'Santa Ana de Coro', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Guyana: {
    id: 'GY', name: 'Guiana', continent: 'América do Sul',
    landmarks: [
      { name: 'Cataratas Kaieteur', city: 'Parque Nacional Kaieteur, Potaro-Siparuni', imageUrl: 'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Catedral de São Jorge', city: 'Georgetown', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  Suriname: {
    id: 'SR', name: 'Suriname', continent: 'América do Sul',
    landmarks: [
      { name: 'Centro Histórico de Paramaribo', city: 'Paramaribo', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Parque Natural Brownsberg', city: 'Brokopondo', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=85' }
    ]
  },
  'Fr. Guiana': {
    id: 'GF', name: 'Guiana Francesa', continent: 'América do Sul',
    landmarks: [
      { name: 'Îles du Salut', city: 'Kourou', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85' },
      { name: 'Place des Palmistes', city: 'Caiena', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85' }
    ]
  }
});

export const SOUTH_AMERICA_ENRICHMENT = Object.freeze(Object.fromEntries(
  Object.entries(SOUTH_AMERICA_DATA).map(([key, data]) => [key, {
    region: data.continent,
    landmarks: data.landmarks.map(landmark => ({ ...landmark, country: data.name })),
    photos: data.landmarks.slice(0, 3).map(landmark => ({ url: landmark.imageUrl, city: landmark.city })),
    dataLevel: 'curated'
  }])
));
