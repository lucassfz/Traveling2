# Traveling — GIS & Miles Overhaul

Run with VS Code Live Server or any local HTTP server. Do not open `index.html` directly with `file://` because the app uses ES modules.

The build is designed to avoid infinite loading: the UI is released immediately after app bootstrap, world-atlas loading has a timeout, and a non-module boot guard dismisses the loader if CDN/module loading fails.

Canonical requested modules:
- `js/map.engine.js`
- `js/miles.engine.js`
- `js/countries.dataset.js`

External dependencies still use CDN: Three.js, OrbitControls, TopoJSON, world-atlas, Google Fonts, and optional airport/FX data. The app degrades to search/panels/miles if the 3D map cannot initialize.
