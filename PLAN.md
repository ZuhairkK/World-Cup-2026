# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Reframed the app's core purpose around two flows: (1) best connection to the FIFA shuttle, (2) best transit/micromobility route to the stadium. Walking is suppressed as a primary option — these venues are not walkable. Real transit routing, shuttle-first UX, micromobility provider map, neighborhood heatmap, transit-ranked hotels, Claude AI advisor, and an Apple-style ticket confirmation to prevent fans going to the wrong stadium.

## Critical Decisions

- **Transit routing**: Keep Mapbox GL for the visual map; use Google Routes API `TRANSIT` mode for real bus/subway/LRT directions — replaces the old `driving-traffic` fake proxy.
- **Shuttle first**: `shuttle` mode card is always the first option; default mode on stadium select is shuttle (not transit or walking).
- **Walking suppressed**: Walking mode shows a red "⚠ Not recommended — use transit or shuttle" flag when distance > 1.5 km.
- **FIFA shuttle**: Placeholder data in `data/shuttles.ts`; rendered as cyan dashed Mapbox layer; shuttle stops labeled on map.
- **Neighborhood heatmap**: Simplified neighborhood GeoJSON in `public/geodata/`; scored in `data/neighborhoodScores.ts`; rendered as Mapbox fill layer; side overlay with adjustable factor weights.
- **Claude API**: Web search tool at runtime for live micromobility pricing and time-of-day route suggestions; lives in `app/api/transit-ai/route.ts`.
- **Micromobility**: Mobi Bikes (Vancouver), BIXI (Toronto), Lime/Bird (Edmonton) — dock locations as toggleable Mapbox markers.
- **Hotels**: Re-ranked by `transitScore`; `transitNote` replaces generic `efficiency` in UI.
- **Ticket confirmation**: Apple-style white sheet fires on stadium selection (before map transition); QR placeholder; wrong-stadium cross-check; non-blocking for hidden gems.

---

## Tasks

- [x] 🟩 **Step 1: Fix Real Transit Routing**
  - [x] 🟩 Update route fetching logic to call Google Routes API with `TRANSIT` travelMode
  - [x] 🟩 Update `data/types.ts` — add `TransitStep`, `transitSteps` to `RouteResult`, add `"shuttle"` to `Mode`
  - [x] 🟩 Update `scripts/fetch-routes.ts` — fetch transit step details, exclude shuttle
  - [x] 🟩 Create `app/api/hotel-route/route.ts` — server-side Google Routes proxy for live hotel routing
  - [x] 🟩 Update `ModeCards.tsx` — transit step breakdown inline, walking impractical flag, shuttle-first ordering

- [x] 🟩 **Step 2: FIFA Shuttle Data + Map Layer**
  - [x] 🟩 Create `data/shuttles.ts` — placeholder shuttle stops and route polylines for all 3 cities
  - [x] 🟩 `"shuttle"` added to `Mode` union in `data/types.ts`
  - [x] 🟩 Shuttle rendered as cyan dashed line + stop circles in `MapView.tsx`
  - [x] 🟩 Shuttle mode card in `ModeCards.tsx` — full-width, shows operating hours

- [x] 🟩 **Step 3: Micromobility Providers on Map**
  - [x] 🟩 Create `data/micromobility.ts` — dock locations for Mobi, BIXI, Lime, Bird
  - [x] 🟩 Toggleable HTML marker layer in `MapView.tsx` with Mapbox Popup on click
  - [x] 🟩 Provider toggle buttons in `page.tsx` (bottom-left of map)

- [x] 🟩 **Step 4: Claude API — AI Pricing + Routing Assistant**
  - [x] 🟩 Create `app/api/transit-ai/route.ts` — Claude claude-sonnet-4-6 + `web_search_20250305` tool, SSE stream
  - [x] 🟩 3 quick-action presets: compare prices, best time to travel, shuttle pickup locations
  - [x] 🟩 Build `components/TransitAIPanel.tsx` — collapsible accordion inside HUD panel

- [x] 🟩 **Step 5: Neighborhood Heatmap Overlay**
  - [x] 🟩 Create `public/geodata/vancouver-neighborhoods.json`, `toronto-neighborhoods.json`, `edmonton-neighborhoods.json`
  - [x] 🟩 Create `data/neighborhoodScores.ts` — 4-factor scoring + `computeOverall()` with custom weights
  - [x] 🟩 Mapbox `fill` + `line` layers in `MapView.tsx` with score-based colour interpolation
  - [x] 🟩 Build `components/NeighborhoodOverlay.tsx` — toggle button, weight sliders, legend, ranked list

- [x] 🟩 **Step 6: Hotel Re-ranking by Transit Access**
  - [x] 🟩 Add `transitScore: number` and `transitNote: string` to `Hotel` type
  - [x] 🟩 All 12 hotels updated with transit scores and actionable transit notes
  - [x] 🟩 `getHotelsForCity()` now sorts by `transitScore` descending
  - [x] 🟩 `AnchorCarousel.tsx` shows transit score badge + `transitNote` on each hotel card

- [x] 🟩 **Step 7: Ticket Confirmation Anti-Confusion System**
  - [x] 🟩 Create `data/matches.ts` — 16 placeholder matches across all 3 stadiums with IDs, dates, kickoffs
  - [x] 🟩 Build `components/TicketConfirmationSheet.tsx` — Apple-style white sheet, QR placeholder, wrong-stadium error
  - [x] 🟩 Wire into `page.tsx` — fires on globe stadium click, confirmed match badge shown in HUD header

---

# Neighborhood Heatmap — GTFS + Supabase Plan

**Overall Progress:** `100%`

## TLDR
Replace hand-crafted static neighborhood transit scores with real data computed from official GTFS Static feeds (TransLink, TTC, ETS), stored in Supabase. `NeighborhoodOverlay` fetches scores from Supabase at runtime instead of importing from a local `.ts` file. All other static data files remain unchanged.

## Critical Decisions
- **GTFS Static only** — not Realtime. Stop density and walk distances are what we need, not live vehicle positions.
- **GTFS drives `transitDensity` + `walkToTransit` only** — `shuttleAccess` and `transfersToStadium` stay hand-crafted (FIFA shuttle data and transfer counts aren't in GTFS).
- **Client-side Supabase JS client** — scores are public read-only; no API route needed. Anon key + RLS public SELECT policy is the correct pattern.
- **One-time seed script** — not a live sync. GTFS feeds are stable enough for the World Cup window.
- **Only neighborhood scores move to Supabase** — hotels, matches, stadiums, etc. stay as static `.ts` files.

## Tasks

- [x] 🟩 **Step 1: Supabase Project Setup**
  - [x] 🟩 Install `@supabase/supabase-js`
  - [x] 🟩 Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
  - [x] 🟩 Create `lib/supabase.ts` — single exported Supabase client instance

- [x] 🟩 **Step 2: Database Schema**
  - [x] 🟩 Create `neighborhood_scores` table in Supabase with columns: `id`, `name`, `city_id`, `transit_density`, `shuttle_access`, `transfers_to_stadium`, `walk_to_transit`, `overall`, `transit_summary`
  - [x] 🟩 Enable RLS on the table with a public `SELECT` policy (anon role)

- [x] 🟩 **Step 3: GTFS Seed Script**
  - [x] 🟩 Install seed-only deps: `adm-zip` (point-in-polygon + CSV parsing implemented natively)
  - [x] 🟩 Write `scripts/seed-neighborhoods.ts`:
    - Download GTFS Static zip from TransLink, TTC, and ETS
    - Parse `stops.txt` for each feed
    - Load the three neighborhood GeoJSON files from `/public/geodata/`
    - Per neighborhood: count stops within polygon → normalise to 0–10 → `transit_density`
    - Per neighborhood centroid: distance to nearest stop → normalise to 0–10 → `walk_to_transit`
    - Merge with hand-crafted `shuttle_access` + `transfers_to_stadium` values (ported from `neighborhoodScores.ts`)
    - Upsert all rows into Supabase `neighborhood_scores`
  - [x] 🟩 Add `"seed:neighborhoods": "npx ts-node ..."` to `package.json`

- [x] 🟩 **Step 4: Update `NeighborhoodOverlay`**
  - [x] 🟩 Replace `getScoresForCity` import with a Supabase query (`.from("neighborhood_scores").select("*").eq("city_id", cityId)`)
  - [x] 🟩 Run query inside the existing `useEffect` that watches `cityId`
  - [x] 🟩 Remove the now-unused import from `neighborhoodScores.ts`

- [x] 🟩 **Step 5: Cleanup**
  - [x] 🟩 Delete `data/neighborhoodScores.ts`
  - [x] 🟩 Verify heatmap renders correctly for all three cities (tsc --noEmit: 0 errors)

---

# Globe Flag Overlay Plan

**Overall Progress:** `100%`

## TLDR
Paint participating nation flags directly onto the globe surface at their geographic locations using canvas texture compositing. Canadian flag appears under the Edmonton/Vancouver/Toronto host-city labels. Other featured nations (Brazil, Germany, South Africa, USA, etc.) get their flags painted in their regions for visual richness.

## Critical Decisions
- **Canvas compositing over DecalGeometry** — composite flag PNGs onto the earth texture via an offscreen `<canvas>` at load time; much simpler than Three.js DecalGeometry and produces the same "painted on" result
- **UV coordinate mapping** — convert each country's centroid lat/lng to UV space on the equirectangular texture to position flags correctly
- **Flag size** — flags drawn at a fixed tile size (e.g. ~8–10% of texture width) so they're visible but don't dominate
- **City labels unchanged** — `<Html>` labels in `StadiumMarker` already sit at the correct lat/lng; no position changes needed, they'll naturally float above the flag region

## Tasks

- [x] 🟩 **Step 1: Add flag assets to `public/flags/`**
  - [x] 🟩 Download free SVG/PNG flags for: Canada, Brazil, Germany, South Africa, USA, Mexico, Morocco, Argentina, Spain, France
  - [x] 🟩 Save as `public/flags/ca.png`, `br.png`, `de.png`, `za.png`, `us.png`, etc.

- [x] 🟩 **Step 2: Define country centroids**
  - [x] 🟩 Add a `FEATURED_COUNTRIES` array in `components/Globe.tsx` — each entry has `{ code, lat, lng }` for the ~10 featured nations
  - [x] 🟩 Canada centroid (60°N, 96°W) sits visually near Edmonton/Vancouver/Toronto cluster

- [x] 🟩 **Step 3: Build canvas texture compositor**
  - [x] 🟩 In `EarthSphere`, load base texture + all flags in parallel via `Promise.all`
  - [x] 🟩 For each country in `FEATURED_COUNTRIES`, convert lat/lng → UV → canvas pixel coords
  - [x] 🟩 Draw each flag centred at those pixel coords with white border + 0.88 opacity blend
  - [x] 🟩 Export composited canvas as `THREE.CanvasTexture` with `colorSpace = THREE.SRGBColorSpace`

- [x] 🟩 **Step 4: Wire composited texture + nations panel**
  - [x] 🟩 `EarthSphere` shows blue fallback while compositing, swaps to composited texture on ready
  - [x] 🟩 City labels (Edmonton, Vancouver, Toronto) sit above Canadian flag via existing `<Html>` positions
  - [x] 🟩 `NationsPoster` collapsible left panel added — shows `flags-sheet.jpg` with gold toggle tab
