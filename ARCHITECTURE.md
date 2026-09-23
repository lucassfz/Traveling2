# Traveling — GIS / Miles Architecture

## Modules
- `js/app.js`: application state, UI orchestration, search, panels, flight form.
- `js/map.engine.js`: Three.js globe, progressive world build, raycasting and camera.
- `js/geospatial.js`: authoritative WGS84 spherical transforms, Haversine and PIP.
- `js/countries.dataset.js`: 193-country catalog + curated/regional enrichment.
- `js/country.exploration.js`: ISO flag identity and editorial eligibility for discovery, independent of WebGL.
- `js/checklist.engine.js`: compatible checklist groups, optional destination/season tips and real progress counts.
- `js/europe.dataset.js`: 20 priority European country enrichments and dated Brazilian entry guidance.
- `js/landmarks.media.js`: static, attributed Wikimedia media linked to landmark identities.
- `js/miles.engine.js`: five-tab Miles & Airports interface, native expandable explanations, airport search, and verified-data rendering.
- `js/miles.data.js`: educational paths and structured catalogs for card profiles, lounge types, upgrades, and 11 airport guides.
- `js/airports.repository.js`: offline core airports + optional global CSV lazy-load.
- `js/pricing.engine.js`: distance/season/cabin award and cash estimations.
- `js/media.service.js`: serves only curated landmark media; never substitutes a generic photo.
- `scripts/validate-content.js` and `scripts/validate-landmarks.js`: read-only catalog audits.
- `scripts/validate-exploration.js`: read-only checks for discovery, flags and seasonal checklist compatibility.

## Country exploration at scale
`countries.dataset.js` remains the registry/aggregation layer. Future Africa, Oceania and Asia enrichments should follow the existing regional-module shape and join there, without changing `app.js` or `map.engine.js`. There is one reusable country drawer: selecting a country replaces its content; closing it removes its media. No country-specific drawer trees or landmark images are created at startup. `Descobrir destino` computes eligible keys once from curated entry, culture, checklist and verified-media fields, then uses the existing `selectCountry` and globe fly-to path. Haiti and Bahamas, whose entry records need review, are not eligible.

The selected flag image URL is derived from its ISO alpha-2 code and requested only for the opened country ([Flagcdn](https://flagcdn.com/)); a visible ISO fallback remains if it fails. The country name is the accessible heading. The primary landmark is requested on selection; secondary images receive their URL only near the drawer viewport through one replaceable `IntersectionObserver`. The existing media service remains the sole source of verified landmark files. Camera flights snap to the target when `prefers-reduced-motion` is enabled, without adding work to the WebGL frame loop.

The existing `checklist` groups and saved positional keys remain valid. A regional enrichment may optionally add `travelProfile` fields `moneyTips`, `healthTips`, `connectivityTips`, `transportTips`, `packingTips`, and `seasonalTips`. Tips are strings or `{ id, label, icon }`; seasonal entries use `{ id, months: [1..12], group, items }`. Only populated categories appear. The trip-month selector in Flights and the Checklist month selector share one value when seasonal tips exist. Progress counts the current visible item's saved completion state; no live weather API or generic climate assumption is used.

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
The former Unsplash candidates were removed from production country data. Landmark identity (name, city, Wikidata ID, coordinates) is separate from static Wikimedia Commons media (file URL, attribution, license, source page, verification month). The media service does not fetch an API at runtime and does not show an unrelated fallback. If no entry has curated media, the drawer displays “Imagem ainda não verificada”. Legacy landmark identities without a complete review remain in the catalog as `needs-review`, without photos; they are not presented as verified imagery. The validator reports those separately from duplicate or incomplete-media errors.

## Miles & Airports data trust
The hub's five views are overview, cards, lounges, upgrades, and airports. Introductory guidance is available immediately; details use native `<details>` elements. Airport guides join the existing `AirportRepository` by IATA code, leaving geographic and route logic untouched.

Operational records use `status` (`verified`, `needs-review`, or `outdated`), `officialSource`, and `verifiedAt` (`YYYY-MM`). Product or airline-specific claims appear as current only when all three fields establish a verified official source. The catalogs now contain 8 card products, 5 lounge ecosystems, 6 airline upgrade examples, and 11 airport guides with 14 named lounge examples. Fields not established by official pages are omitted or explicitly listed in `uncertainFields`. Access remains conditional on the particular card, flight, terminal, visitor and issuer rules. The 3D globe and geographic picking modules are unchanged.

## Europe entry data
The regional dataset uses the existing country-enrichment schema. Common Schengen, UK and Ireland entry records are kept separate, with official source links and verification dates. EES and ETIAS are displayed as dated guidance, not permanent guarantees; travelers must confirm the current rule before booking or boarding. See `DATA_SOURCES.md` for provenance and remaining coverage gaps.
