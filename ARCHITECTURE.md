# Traveling — GIS / Miles Architecture

## Modules
- `js/app.js`: application state, UI orchestration, search, panels, flight form.
- `js/map.engine.js`: Three.js globe, progressive world build, raycasting and camera.
- `js/geospatial.js`: authoritative WGS84 spherical transforms, Haversine and PIP.
- `js/countries.dataset.js`: 193-country catalog + curated/regional enrichment.
- `js/miles.engine.js`: filterable/expandable knowledge engine.
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
