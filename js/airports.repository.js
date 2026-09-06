import { haversineKm } from './geospatial.js';

const AIRPORT_DATA_URL = 'https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv';

const CORE_AIRPORTS = Object.freeze([
  ['GRU','SBGR','São Paulo/Guarulhos','São Paulo','BR',-23.4356,-46.4731],
  ['GIG','SBGL','Rio de Janeiro/Galeão','Rio de Janeiro','BR',-22.8090,-43.2506],
  ['BSB','SBBR','Brasília','Brasília','BR',-15.8697,-47.9208],
  ['SSA','SBSV','Salvador','Salvador','BR',-12.9086,-38.3225],
  ['REC','SBRF','Recife','Recife','BR',-8.1265,-34.9236],
  ['FOR','SBFZ','Fortaleza','Fortaleza','BR',-3.7763,-38.5326],
  ['POA','SBPA','Porto Alegre','Porto Alegre','BR',-29.9944,-51.1714],
  ['EZE','SAEZ','Ministro Pistarini','Buenos Aires','AR',-34.8222,-58.5358],
  ['AEP','SABE','Aeroparque Jorge Newbery','Buenos Aires','AR',-34.5592,-58.4156],
  ['SCL','SCEL','Arturo Merino Benítez','Santiago','CL',-33.3930,-70.7858],
  ['LIM','SPJC','Jorge Chávez','Lima','PE',-12.0219,-77.1143],
  ['BOG','SKBO','El Dorado','Bogotá','CO',4.7016,-74.1469],
  ['MVD','SUMU','Carrasco','Montevidéu','UY',-34.8384,-56.0308],
  ['ASU','SGAS','Silvio Pettirossi','Assunção','PY',-25.2399,-57.5191],
  ['LPB','SLLP','El Alto','La Paz','BO',-16.5133,-68.1923],
  ['UIO','SEQM','Mariscal Sucre','Quito','EC',-0.1292,-78.3575],
  ['CCS','SVMI','Simón Bolívar','Caracas','VE',10.6012,-66.9912],
  ['JFK','KJFK','John F. Kennedy','Nova York','US',40.6413,-73.7781],
  ['MIA','KMIA','Miami International','Miami','US',25.7959,-80.2870],
  ['LAX','KLAX','Los Angeles International','Los Angeles','US',33.9416,-118.4085],
  ['ORD','KORD','O’Hare International','Chicago','US',41.9742,-87.9073],
  ['ATL','KATL','Hartsfield-Jackson Atlanta','Atlanta','US',33.6407,-84.4277],
  ['YYZ','CYYZ','Toronto Pearson','Toronto','CA',43.6777,-79.6248],
  ['YVR','CYVR','Vancouver International','Vancouver','CA',49.1951,-123.1779],
  ['MEX','MMMX','Benito Juárez','Cidade do México','MX',19.4361,-99.0719],
  ['CDG','LFPG','Charles de Gaulle','Paris','FR',49.0097,2.5479],
  ['ORY','LFPO','Paris Orly','Paris','FR',48.7262,2.3652],
  ['LHR','EGLL','Heathrow','Londres','GB',51.4700,-0.4543],
  ['LGW','EGKK','Gatwick','Londres','GB',51.1537,-0.1821],
  ['FRA','EDDF','Frankfurt','Frankfurt','DE',50.0379,8.5622],
  ['MAD','LEMD','Adolfo Suárez Madrid-Barajas','Madri','ES',40.4983,-3.5676],
  ['LIS','LPPT','Humberto Delgado','Lisboa','PT',38.7742,-9.1342],
  ['FCO','LIRF','Leonardo da Vinci–Fiumicino','Roma','IT',41.8003,12.2389],
  ['AMS','EHAM','Amsterdam Schiphol','Amsterdã','NL',52.3105,4.7683],
  ['ZRH','LSZH','Zurich','Zurique','CH',47.4581,8.5555],
  ['ATH','LGAV','Athens International','Atenas','GR',37.9364,23.9445],
  ['IST','LTFM','Istanbul','Istambul','TR',41.2753,28.7519],
  ['DXB','OMDB','Dubai International','Dubai','AE',25.2532,55.3657],
  ['DOH','OTHH','Hamad International','Doha','QA',25.2731,51.6081],
  ['CAI','HECA','Cairo International','Cairo','EG',30.1219,31.4056],
  ['CMN','GMMN','Mohammed V','Casablanca','MA',33.3675,-7.58997],
  ['JNB','FAOR','O. R. Tambo','Johannesburgo','ZA',-26.1337,28.2420],
  ['NBO','HKJK','Jomo Kenyatta','Nairóbi','KE',-1.3192,36.9278],
  ['HND','RJTT','Tokyo Haneda','Tóquio','JP',35.5494,139.7798],
  ['NRT','RJAA','Narita International','Tóquio','JP',35.7720,140.3929],
  ['ICN','RKSI','Incheon International','Seul','KR',37.4602,126.4407],
  ['PEK','ZBAA','Beijing Capital','Pequim','CN',40.0799,116.6031],
  ['PVG','ZSPD','Shanghai Pudong','Xangai','CN',31.1443,121.8083],
  ['HKG','VHHH','Hong Kong International','Hong Kong','HK',22.3080,113.9185],
  ['SIN','WSSS','Singapore Changi','Singapura','SG',1.3644,103.9915],
  ['BKK','VTBS','Suvarnabhumi','Bangkok','TH',13.6900,100.7501],
  ['DEL','VIDP','Indira Gandhi','Nova Délhi','IN',28.5562,77.1000],
  ['BOM','VABB','Chhatrapati Shivaji Maharaj','Mumbai','IN',19.0896,72.8656],
  ['SYD','YSSY','Sydney Kingsford Smith','Sydney','AU',-33.9399,151.1753],
  ['MEL','YMML','Melbourne','Melbourne','AU',-37.6690,144.8410],
  ['AKL','NZAA','Auckland','Auckland','NZ',-37.0082,174.7850],
  ['BZE','MZBZ','Philip S. W. Goldson International','Belize City','BZ',17.5391,-88.3082],
  ['SJO','MROC','Juan Santamaría International','San José','CR',9.9939,-84.2088],
  ['SAL','MSLP','El Salvador International','San Salvador','SV',13.4409,-89.0557],
  ['GUA','MGGT','La Aurora International','Cidade da Guatemala','GT',14.5833,-90.5275],
  ['SAP','MHLM','Ramón Villeda Morales International','San Pedro Sula','HN',15.4526,-87.9236],
  ['MGA','MNMG','Augusto C. Sandino International','Manágua','NI',12.1415,-86.1682],
  ['PTY','MPTO','Tocumen International','Cidade do Panamá','PA',9.0714,-79.3835]
].map(([iata, icao, name, city, country, lat, lng]) => ({ iata, icao, name, city, country, lat, lng })));

function normalizeCode(value) {
  return String(value ?? '').trim().toUpperCase();
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}

function parseAirportCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const airports = [];

  for (let row = 1; row < lines.length; row += 1) {
    const cells = parseCsvLine(lines[row]);
    const iata = normalizeCode(cells[index.iata_code]);
    const icao = normalizeCode(cells[index.gps_code] || cells[index.ident]);
    if (!iata && !icao) continue;
    const coordinates = String(cells[index.coordinates] ?? '').split(',').map(Number);
    if (coordinates.length !== 2 || coordinates.some(value => !Number.isFinite(value))) continue;
    const [lng, lat] = coordinates;
    airports.push({
      iata,
      icao,
      name: cells[index.name] || iata || icao,
      city: cells[index.municipality] || cells[index.name] || iata || icao,
      country: cells[index.iso_country] || '',
      lat,
      lng
    });
  }
  return airports;
}


async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class AirportRepository {
  #all = null;
  #loadPromise = null;
  #lookup = new Map();

  constructor() {
    for (const airport of CORE_AIRPORTS) this.#indexAirport(airport);
  }

  #indexAirport(airport) {
    if (airport.iata) this.#lookup.set(normalizeCode(airport.iata), airport);
    if (airport.icao) this.#lookup.set(normalizeCode(airport.icao), airport);
  }

  get coreAirports() {
    return CORE_AIRPORTS;
  }

  async loadAll() {
    if (this.#all) return this.#all;
    if (this.#loadPromise) return this.#loadPromise;
    this.#loadPromise = (async () => {
      const response = await fetchWithTimeout(AIRPORT_DATA_URL, { mode: 'cors', cache: 'force-cache' }, 7000);
      if (!response.ok) throw new Error(`Falha ao carregar base global de aeroportos (${response.status}).`);
      const parsed = parseAirportCsv(await response.text());
      this.#all = parsed;
      for (const airport of parsed) this.#indexAirport(airport);
      return parsed;
    })();
    try {
      return await this.#loadPromise;
    } finally {
      this.#loadPromise = null;
    }
  }

  async resolve(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    if (this.#lookup.has(normalized)) return this.#lookup.get(normalized);
    try {
      await this.loadAll();
    } catch {
      return null;
    }
    return this.#lookup.get(normalized) ?? null;
  }

  search(query, limit = 8) {
    const normalized = String(query ?? '').trim().toLowerCase();
    if (!normalized) return [];
    const pool = this.#all ?? CORE_AIRPORTS;
    return pool
      .map(airport => {
        const fields = [airport.iata, airport.icao, airport.name, airport.city, airport.country]
          .filter(Boolean)
          .map(value => String(value).toLowerCase());
        let score = 0;
        for (const field of fields) {
          if (field === normalized) score = Math.max(score, 100);
          else if (field.startsWith(normalized)) score = Math.max(score, 70);
          else if (field.includes(normalized)) score = Math.max(score, 40);
        }
        return { airport, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.airport);
  }

  async findNearest(lat, lng) {
    let pool = this.#all;
    if (!pool) {
      try { pool = await this.loadAll(); } catch { pool = CORE_AIRPORTS; }
    }
    let nearest = null;
    let nearestDistance = Infinity;
    for (const airport of pool) {
      if (!airport.iata) continue;
      const distance = haversineKm(lat, lng, airport.lat, airport.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = airport;
      }
    }
    return nearest ? { ...nearest, distanceToTargetKm: nearestDistance } : null;
  }
}
