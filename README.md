# Traveling — GIS & Miles Overhaul

Run with VS Code Live Server or any local HTTP server. Do not open `index.html` directly with `file://` because the app uses ES modules.

The build is designed to avoid infinite loading: the UI is released immediately after app bootstrap, world-atlas loading has a timeout, and a non-module boot guard dismisses the loader if CDN/module loading fails.

Canonical requested modules:
- `js/map.engine.js`
- `js/miles.engine.js`
- `js/countries.dataset.js`

The Miles & Airports hub uses dated official-source records for cards, lounge ecosystems, airport lounges and airline upgrades. The Europe enrichment covers all 45 destinations classified as Europe; the shared entry rules live in `js/europe.entry.js`. Entry requirements can change and must be reconfirmed before travel. Landmark photos are static, attributed Wikimedia Commons selections. Destinations without verified photos show a neutral missing-image state rather than a generic fallback. See `DATA_SOURCES.md` for provenance and limitations.

Read-only data audits (14 scripts, none of them rewrites data):

```sh
# Offline
node scripts/validate-africa.js
node scripts/validate-americas-seasonal.js
node scripts/validate-asia-oceania.js
node scripts/validate-content.js
node scripts/validate-discovery.js        # ~15 s; add --airports to also resolve gateways online
node scripts/validate-entry-presentation.js
node scripts/validate-europe.js
node scripts/validate-exploration.js
node scripts/validate-history.js
node scripts/validate-landmarks.js
node scripts/validate-miles.js

# Need network (fetch the pinned CDN files / airport CSV)
node scripts/validate-flight-route.js
node scripts/validate-map-geography.js
node scripts/validate-flight-visualization.js
```

The landmark audit lists legacy `needs-review` identities as warnings; it does not rewrite records. The optional research helper (`node scripts/research-landmarks.js 3`) reads up to three built-in candidate queries from Wikidata/Commons and prints them without changing production data. API rate limits and ambiguous search results mean its output is not a verified media record.

External dependencies still use CDN: Three.js, OrbitControls, TopoJSON, world-atlas, Google Fonts, the selected country's Flagcdn image (with ISO fallback), and optional airport/FX data. The app degrades to search/panels/miles if the 3D map cannot initialize.

Versions are pinned so a remote update cannot silently change geometry or data shape: `three@0.160.1` (import map in `index.html`), `world-atlas@2.0.2` and `topojson-client@3.1.0` (`js/map.engine.js` and `scripts/validate-map-geography.js`), and the global airport CSV at commit `0ebaf2a` of `datasets/airport-codes` (`js/airports.repository.js`). When bumping one of them, run the validators and check the CSV header still has `iata_code`, `gps_code`, `ident` and `coordinates`. If the airport CSV fails to load, retries wait 60 s instead of re-downloading on every keystroke.
