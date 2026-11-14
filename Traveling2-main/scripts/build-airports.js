// Regenerates data/airports.json from the pinned datasets/airport-codes CSV.
// Run only when updating the airport catalog: `node scripts/build-airports.js`.
// The app never downloads the CSV (≈8.8 MB); it loads the committed JSON (≈0.7 MB).
//
// Kept rows: every airport with an IATA code (all types), in CSV order, so IATA
// lookups and nearest-airport fallbacks match the former runtime CSV parser.
// ICAO-only airfields are dropped: commercial routes need an IATA airport.
import { writeFile } from 'node:fs/promises';

const COMMIT = '0ebaf2a8ab955eb542f84b7b5960ecf563f64edc';
const SOURCE = 'https://github.com/datasets/airport-codes';
const CSV_URL = `https://raw.githubusercontent.com/datasets/airport-codes/${COMMIT}/data/airport-codes.csv`;
const OUTPUT = new URL('../data/airports.json', import.meta.url);
const REQUIRED_HEADERS = ['iata_code', 'gps_code', 'ident', 'name', 'municipality', 'iso_country', 'coordinates'];

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

function buildRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const missing = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`CSV header changed; missing: ${missing.join(', ')}`);
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const rows = [];
  for (let row = 1; row < lines.length; row += 1) {
    const cells = parseCsvLine(lines[row]);
    const iata = normalizeCode(cells[index.iata_code]);
    if (!iata) continue;
    const icao = normalizeCode(cells[index.gps_code] || cells[index.ident]);
    const coordinates = String(cells[index.coordinates] ?? '').split(',').map(Number);
    if (coordinates.length !== 2 || coordinates.some(value => !Number.isFinite(value))) continue;
    // The airport-codes CSV stores coordinates as "latitude, longitude".
    const [lat, lng] = coordinates;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    rows.push([
      iata,
      icao,
      cells[index.name] || iata || icao,
      cells[index.municipality] || cells[index.name] || iata || icao,
      cells[index.iso_country] || '',
      lat,
      lng
    ]);
  }
  return rows;
}

const response = await fetch(CSV_URL);
if (!response.ok) throw new Error(`Download failed (${response.status})`);
const rows = buildRows(await response.text());
const header = JSON.stringify({
  source: SOURCE,
  commit: COMMIT,
  generator: 'scripts/build-airports.js',
  fields: ['iata', 'icao', 'name', 'city', 'country', 'lat', 'lng']
}).slice(0, -1);
// One airport per line keeps future diffs reviewable.
await writeFile(OUTPUT, `${header},"airports":[\n${rows.map(row => JSON.stringify(row)).join(',\n')}]}\n`);
console.log(`data/airports.json: ${rows.length} airports`);
