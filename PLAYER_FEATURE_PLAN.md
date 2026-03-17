# Feature Implementation Plan — Player Drop Navigation

**Overall Progress:** `100%`

## TLDR
A Tekken-style player showcase panel sits on the map view. The user shuffles between Messi, Ronaldo, and Neymar with left/right arrows. The selected player is dragged in one motion onto the map: first drop = origin, second drop = destination. A mode selector appears after both pins are placed. The HUD ModeCards connect to the player route — same UI, live-fetched route between the two dropped points.

## Critical Decisions

- **Model loading**: `useGLTF` from `@react-three/drei` reads from `public/models/{player}.glb`. File must exist before the canvas renders — wrap in `<Suspense>`.
- **Map exposure**: `MapView` gets a new `onMapReady(map: mapboxgl.Map) => void` prop. Parent stores the raw map instance in a ref so `PlayerShowcase` can call `map.project()` / `map.unproject()` directly. Avoids over-engineering `MapViewHandle`.
- **Player pins on map**: CSS `position: absolute` divs containing a mini R3F `<Canvas>`. Position recalculated on every `map.on('move')` event via `map.project(lngLat)`. Transform `translate(-50%, -100%)` anchors the bottom-center of the pin to the exact coordinate.
- **Drag from showcase**: `pointerdown` on selected player starts drag. A ghost div (`position: fixed`, `pointer-events: none`) follows the cursor. `pointerup` anywhere on the map calls `map.unproject([clientX, clientY])` for the coordinate.
- **Two-drop state machine**: `dropPhase: "idle" | "awaiting-origin" | "awaiting-dest" | "ready"`. First drop → origin pin placed, phase → `awaiting-dest`. Second drop → dest pin placed, phase → `ready`, route fetch starts.
- **HUD connection**: Player route reuses the existing hotel-route API (`/api/hotel-route`). Results populate `hotelRoutes` state in `page.tsx`. `ModeCards` already handles `hotelRoutes` — no ModeCards changes needed.
- **Player route map layer**: New GeoJSON source `player-route` added to `MapView` (cyan/teal color, distinct from gold active-route). Updated via new `MapViewHandle.setPlayerRoute(geojson | null)` method.
- **Showcase layout**: Fixed panel, left side of map, vertically centered. Three player slots always visible. Center = selected (full brightness). Left/right = dimmed. Left/right arrow buttons shift the selected index.

## Tasks

- [x] 🟩 **Step 1: MapView — expose map instance + player route layer**
  - [x] 🟩 Add `onMapReady?: (map: mapboxgl.Map) => void` prop to `MapViewProps`; call it inside `map.on("load", ...)`
  - [x] 🟩 Add `player-route` GeoJSON source and line layer (color `#00E5FF`, width 4, dashed) on map load
  - [x] 🟩 Add `setPlayerRoute(geojson: GeoJSON.Geometry | null): void` to `MapViewHandle` — updates the player-route source

- [x] 🟩 **Step 2: page.tsx — player state + route wiring**
  - [x] 🟩 Add state: `selectedPlayer`, `mapInstance` ref, `dropPhase`, `playerOrigin`, `playerDest`, `playerHotelRoutes`
  - [x] 🟩 Pass `onMapReady` to `MapView` — stores the raw map in `mapInstance` ref
  - [x] 🟩 `handlePlayerDrop(lngLat)`: advances `dropPhase`; on `ready`, fetches all modes via `/api/hotel-route` and stores in `playerHotelRoutes`
  - [x] 🟩 When `playerHotelRoutes` populates, call `mapRef.current.setPlayerRoute(geometry)` for the selected mode
  - [x] 🟩 Pass `playerHotelRoutes` and `playerOrigin`/`playerDest` down to HUD so ModeCards reflects the player route when active
  - [x] 🟩 Render `<PlayerShowcase>` and `<PlayerPin>` components inside the map view div

- [x] 🟩 **Step 3: `components/PlayerShowcase.tsx` — Tekken panel + drag**
  - [x] 🟩 Three player slots with left/right arrow navigation; `selectedIndex` state
  - [x] 🟩 Each slot: R3F Canvas with GLB via `useGLTF` + Suspense + ErrorBoundary; dimmed when not selected
  - [x] 🟩 `pointerdown` on selected player starts drag via `setPointerCapture`
  - [x] 🟩 Ghost div follows cursor; disappears on `pointerup`
  - [x] 🟩 `pointerup` over map: calls `map.unproject()` → fires `onDrop(lngLat)`
  - [x] 🟩 Panel: frosted glass, left edge, vertically centered, `zIndex: 12`
  - [x] 🟩 Drop phase indicator label below panel

- [x] 🟩 **Step 4: `components/PlayerPin.tsx` — pinned 3D figure on map**
  - [x] 🟩 Props: `playerId`, `lngLat`, `map`, `label: "ORIGIN" | "DESTINATION"`
  - [x] 🟩 `useEffect`: listens to `move/zoom/rotate/pitch` — recomputes pixel position via `map.project()`
  - [x] 🟩 `position: absolute`, `transform: translate(-50%, -100%)` anchors bottom-center to coordinate
  - [x] 🟩 Mini R3F Canvas (80 × 110 px) with GLB + fallback capsule figure
  - [x] 🟩 Coloured triangle pointer at bottom; label badge above

- [x] 🟩 **Step 5: page.tsx — HUD integration**
  - [x] 🟩 ModeCards receives `playerHotelRoutes` when `dropPhase === "ready"`
  - [x] 🟩 "🎮 Player Route Active" indicator in HUD header
  - [x] 🟩 "Clear ✕" button resets all player state and clears route layer
  - [x] 🟩 `useEffect` syncs player route layer to selected mode on every mode change

- [x] 🟩 **Step 6: Assets + fallback**
  - [x] 🟩 `public/models/.gitkeep` created
  - [x] 🟩 `data/players.ts` — shared PLAYERS registry and PlayerId type
  - [x] 🟩 Fallback capsule+sphere figure renders in accent colour until GLB files are placed
  - [x] 🟩 `useGLTF.preload()` called at module level for all 3 players
