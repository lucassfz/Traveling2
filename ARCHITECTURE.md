# Traveling — GIS / Miles Architecture

## Modules
- `js/app.js`: application state, UI orchestration, search, panels, flight form.
- `js/map.engine.js`: Three.js globe, progressive world build, raycasting and camera.
- `js/geospatial.js`: authoritative WGS84 spherical transforms, Haversine and PIP.
- `js/countries.dataset.js`: 193-country catalog + curated/regional enrichment.
- `js/miles.engine.js`: five-tab Miles & Airports interface, native expandable explanations, airport search, and verified-data rendering.
- `js/miles.data.js`: educational paths and structured catalogs for card profiles, lounge types, upgrades, and 11 airport guides.
- `js/airports.repository.js`: offline core airports + optional global CSV lazy-load.
- `js/pricing.engine.js`: distance/season/cabin award and cash estimations.
- `js/media.service.js`: lazy image availability checks; city-only overlays.

## Antipodal click fix
The previous picker evaluated land meshes before determining the front intersection of the ocean sphere. A ray through open water can continue through the sphere and intersect land on the far side. The new picker first finds the nearest ocean-sphere intersection and rejects every land hit farther than that front surface (plus a small tolerance). Only then can a mesh be selected. If there is no front-side land mesh hit, the front-surface XYZ point is converted back to latitude/longitude and must pass strict antimeridian-safe point-in-polygon.

## Authoritative geographic frame
East-positive longitude, +Y north:
`x = R cos(lat) cos(lng)`
`y = R sin(lat)`
`z = -R cos(lat) sin(lng)`

Inverse:
`lat = asin(y / R)`
`lng = atan2(-z, x)`

All country meshes, borders, markers, fly-to camera targets, and fallback PIP use these same functions.

## Loading behavior
The application UI no longer waits for the world atlas. The interface becomes interactive first, while the globe reports progressive status. Network fetches have timeouts. A classic-script boot guard hides the global loader after 8 seconds even if ES-module/CDN loading fails before `app.js` executes.

## Media verification
This environment had no web access. Existing project URLs are retained only as runtime-checked candidates and are not labeled externally verified. The data model separates landmark identity/city from media so a later online validation pass can safely mark individual assets as verified without changing UI logic.

## Miles & Airports data trust
The hub's five views are overview, cards, lounges, upgrades, and airports. Introductory guidance is available immediately; details use native `<details>` elements. Airport guides join the existing `AirportRepository` by IATA code, leaving geographic and route logic untouched.

Operational records use `status` (`verified`, `needs-review`, or `outdated`), `officialSource`, and `verifiedAt` (`YYYY-MM`). Product or airline-specific claims appear as current only when all three fields establish a verified official source. `CARD_OFFERS` and `AIRLINE_UPGRADE_EXAMPLES` intentionally remain empty until official verification. Each airport guide has slots for terminals, airlines, lounges, Fast Track, and connection notes; all initial operational details are pending verification. A future lounge entry can carry its own source, date, network, terminal, and status.
