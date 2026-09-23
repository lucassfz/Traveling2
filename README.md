# Traveling — GIS & Miles Overhaul

Run with VS Code Live Server or any local HTTP server. Do not open `index.html` directly with `file://` because the app uses ES modules.

The build is designed to avoid infinite loading: the UI is released immediately after app bootstrap, world-atlas loading has a timeout, and a non-module boot guard dismisses the loader if CDN/module loading fails.

Canonical requested modules:
- `js/map.engine.js`
- `js/miles.engine.js`
- `js/countries.dataset.js`

The Miles & Airports hub uses dated official-source records for cards, lounge ecosystems, airport lounges and airline upgrades. The Europe enrichment covers 20 priority destinations; entry requirements can change and must be reconfirmed before travel. Landmark photos are static, attributed Wikimedia Commons selections. Destinations without verified photos show a neutral missing-image state rather than a generic fallback. See `DATA_SOURCES.md` for provenance and limitations.

Read-only data audits:

```sh
node scripts/validate-content.js
node scripts/validate-landmarks.js
```

The landmark audit lists legacy `needs-review` identities as warnings; it does not rewrite records. The optional research helper (`node scripts/research-landmarks.js 3`) reads up to three built-in candidate queries from Wikidata/Commons and prints them without changing production data. API rate limits and ambiguous search results mean its output is not a verified media record.

External dependencies still use CDN: Three.js, OrbitControls, TopoJSON, world-atlas, Google Fonts, and optional airport/FX data. The app degrades to search/panels/miles if the 3D map cannot initialize.
