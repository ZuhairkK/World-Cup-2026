# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
A desktop web app for foreign travelers attending the 2026 FIFA World Cup in Canada. Users explore a 3D globe (R3F), click a Canadian stadium, and transition into a Mapbox GL routing view showing pre-computed transit/bike/walk/drive times from key city anchors — presented in a FIFA-style two-tier card carousel with gold/amber dark theme.

## Critical Decisions
- **Pre-computed routes over on-demand**: 36 static JSON route objects (3 stadiums × 3 anchors × 4 modes) fetched once at build time via Google Maps Directions API — eliminates per-user API costs
- **Zoom-then-swap transition**: R3F camera zooms into clicked stadium, crossfades to Mapbox GL; globe icon reverses the animation — one crossfade system used bidirectionally
- **Two-tier carousel**: Top tier switches cities (big card flip + map flies), nested tier switches anchors (snappy swap + route overlay update)
- **Canada only**: Vancouver (BC Place), Toronto (BMO Field), Edmonton (Commonwealth Stadium)
- **Desktop only**: No mobile responsive work in this phase
- **Google Maps for transit, Mapbox for rendering**: Mapbox Directions has no transit support; Google Maps covers all 4 modes at build time

---

## Tasks

- [x] 🟩 **Step 1: Project Setup**
  - [x] 🟩 Initialize Next.js 15 App Router project
  - [x] 🟩 Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `mapbox-gl`, `@types/mapbox-gl`
  - [x] 🟩 Add `.env.local` with `MAPBOX_TOKEN` and `GOOGLE_MAPS_API_KEY`
  - [x] 🟩 Set up base global styles (dark background, gold/amber CSS variables)

- [x] 🟩 **Step 2: Stadium & Anchor Data**
  - [x] 🟩 Create `data/stadiums.ts` — 3 stadiums with name, city, coordinates, and 3 anchors each (airport, city center, train station) with lat/lng
  - [x] 🟩 Define TypeScript types: `Stadium`, `Anchor`, `Mode`, `Route`

- [x] 🟩 **Step 3: Route Pre-computation Script**
  - [x] 🟩 Write `scripts/fetch-routes.ts` — iterates all 36 combinations, calls Google Maps Directions API for each mode
  - [x] 🟩 Outputs `data/routes.json` — keyed by `stadiumId__anchorId__mode`
  - [x] 🟩 Add `npm run fetch-routes` script to `package.json`

- [x] 🟩 **Step 4: R3F Globe (Landing)**
  - [x] 🟩 Create `components/Globe.tsx` — Earth sphere with texture, orbital camera controls
  - [x] 🟩 Place 3 stadium markers on globe at correct lat/lng coordinates
  - [x] 🟩 Hover state on markers (gold highlight)
  - [x] 🟩 Click handler — triggers zoom-in camera animation toward clicked stadium, then calls `onStadiumSelect(stadium)`

- [x] 🟩 **Step 5: Crossfade Transition System**
  - [x] 🟩 Create `components/TransitionOverlay.tsx` — full-screen div that fades in/out to mask the canvas swap
  - [x] 🟩 Forward: R3F zooms → overlay fades in → R3F unmounts, Mapbox mounts → overlay fades out
  - [x] 🟩 Reverse: overlay fades in → Mapbox unmounts, R3F mounts → R3F camera pulls back to orbital → overlay fades out

- [x] 🟩 **Step 6: Mapbox GL Map View**
  - [x] 🟩 Create `components/MapView.tsx` — dynamic import (`ssr: false`), initializes Mapbox GL map centered on selected stadium
  - [x] 🟩 Dark map style matching app theme
  - [x] 🟩 Stadium marker pin on map
  - [x] 🟩 Route overlay — draws GeoJSON polyline for currently selected anchor + mode
  - [x] 🟩 Expose `flyToCity(coords)` for top-tier carousel transitions

- [x] 🟩 **Step 7: Two-Tier FIFA Carousel**
  - [x] 🟩 Create `components/CityCarousel.tsx` — top-tier shuffle between Vancouver / Toronto / Edmonton with big animated card flip; triggers `flyToCity` on map
  - [x] 🟩 Create `components/AnchorCarousel.tsx` — nested snappy card swap between Airport / City Center / Train Station; updates route overlay
  - [x] 🟩 Create `components/ModeCards.tsx` — displays transit / bike / walk / drive times for current anchor selection (reads from `routes.json`)
  - [x] 🟩 Gold/amber card borders, sports-broadcast typography

- [x] 🟩 **Step 8: Globe Back Button**
  - [x] 🟩 Render a small globe icon in the corner of the map view
  - [x] 🟩 On click, triggers reverse crossfade transition back to R3F globe

- [x] 🟩 **Step 9: Page Assembly**
  - [x] 🟩 `app/page.tsx` — manages global state: `activeView` (`globe` | `map`), `selectedStadium`
  - [x] 🟩 Conditionally renders Globe or MapView based on `activeView`
  - [x] 🟩 Passes transition callbacks down to both views
