import type { Hotel } from "./types";

/**
 * Curated hotel options for each 2026 FIFA World Cup host city in Canada.
 * Hotels are ranked by `transitScore` (descending) within each city —
 * reflecting how easy it is to reach the stadium without walking.
 *
 * transitScore (0–10): proximity to subway/LRT/bus stops, direct lines to
 * stadium, and walk time to the nearest FIFA shuttle pickup stop.
 *
 * transitNote: actionable one-liner — nearest stop, line name, transfer count.
 */

export const HOTELS: Hotel[] = [

  // ─── Vancouver (BC Place) — sorted by transitScore desc ─────────────────────
  // BC Place is served by Stadium-Chinatown SkyTrain (Expo/Millennium Line).
  // Canada Line (Yaletown-Roundhouse) is 12 min walk SW of the stadium.

  {
    id: "vancouver-jw-marriott",
    name: "JW Marriott Parq Vancouver",
    cityId: "bc-place",
    coords: { lat: 49.2774, lng: -123.1082 },
    tier: "luxury",
    priceRange: "$400–$700 / night",
    distanceToStadiumKm: 0.1,
    efficiency: "2 min walk · Literally next door to BC Place",
    transitScore: 10,
    transitNote: "Stadium-Chinatown SkyTrain at front door · 0 transfers · Shuttle stop 3 min walk",
  },
  {
    id: "vancouver-sandman",
    name: "Sandman Hotel Downtown",
    cityId: "bc-place",
    coords: { lat: 49.2819, lng: -123.1184 },
    tier: "mid",
    priceRange: "$130–$220 / night",
    distanceToStadiumKm: 0.7,
    efficiency: "9 min walk · Solid mid-range, steps from stadium",
    transitScore: 9,
    transitNote: "1 min walk to Stadium-Chinatown SkyTrain · Multiple Expo/Millennium Line trains",
  },
  {
    id: "vancouver-ywca",
    name: "YWCA Hotel Vancouver",
    cityId: "bc-place",
    coords: { lat: 49.2792, lng: -123.1199 },
    tier: "budget",
    priceRange: "$80–$160 / night",
    distanceToStadiumKm: 0.9,
    efficiency: "12 min walk · Best value near stadium",
    transitScore: 8,
    transitNote: "3 min walk to Yaletown-Roundhouse Canada Line · Shuttle hub at Pacific Central",
  },
  {
    id: "vancouver-burrard",
    name: "The Burrard Hotel",
    cityId: "bc-place",
    coords: { lat: 49.2775, lng: -123.1293 },
    tier: "mid",
    priceRange: "$200–$300 / night",
    distanceToStadiumKm: 1.4,
    efficiency: "18 min walk · Boutique feel, central location",
    transitScore: 7,
    transitNote: "2 min to Burrard Station · Bus 15/17 or Canada Line to Yaletown-Roundhouse",
  },

  // ─── Toronto (BMO Field) — sorted by transitScore desc ──────────────────────
  // BMO Field is at Exhibition Place — served by 509/511 streetcars from Union.
  // Union Station is the FIFA shuttle hub for Toronto.

  {
    id: "toronto-hotel-x",
    name: "Hotel X Toronto",
    cityId: "bmo-field",
    coords: { lat: 43.6327, lng: -79.4151 },
    tier: "luxury",
    priceRange: "$350–$600 / night",
    distanceToStadiumKm: 0.2,
    efficiency: "3 min walk · Closest hotel to BMO Field",
    transitScore: 10,
    transitNote: "On-site Exhibition Loop streetcar stop · 509/511 direct · Shuttle drop-off adjacent",
  },
  {
    id: "toronto-novotel",
    name: "Novotel Toronto Centre",
    cityId: "bmo-field",
    coords: { lat: 43.6471, lng: -79.3731 },
    tier: "mid",
    priceRange: "$200–$300 / night",
    distanceToStadiumKm: 2.8,
    efficiency: "7 min streetcar + walk · Great downtown access",
    transitScore: 9,
    transitNote: "3 min walk to Union Station — FIFA shuttle hub · 509 Harbourfront direct to BMO",
  },
  {
    id: "toronto-gladstone",
    name: "Gladstone House",
    cityId: "bmo-field",
    coords: { lat: 43.6429, lng: -79.4276 },
    tier: "mid",
    priceRange: "$180–$280 / night",
    distanceToStadiumKm: 1.2,
    efficiency: "15 min walk · Arty Queen West vibe",
    transitScore: 8,
    transitNote: "504 King streetcar eastbound → Exhibition in 12 min, 0 transfers",
  },
  {
    id: "toronto-hi-hostel",
    name: "HI Toronto Hostel",
    cityId: "bmo-field",
    coords: { lat: 43.6510, lng: -79.3749 },
    tier: "budget",
    priceRange: "$40–$100 / night",
    distanceToStadiumKm: 3.1,
    efficiency: "Short streetcar ride · Cheapest in the city",
    transitScore: 7,
    transitNote: "Dundas subway → transfer to 504 King streetcar → BMO · ~25 min, 1 transfer",
  },

  // ─── Edmonton (Commonwealth Stadium) — sorted by transitScore desc ───────────
  // Capital Line LRT runs directly to Coliseum Station (adjacent to Commonwealth).
  // Rogers Place / Arena District is the FIFA shuttle hub.

  {
    id: "edmonton-delta",
    name: "Delta Hotels Edmonton Centre Suites",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5444, lng: -113.4963 },
    tier: "mid",
    priceRange: "$200–$300 / night",
    distanceToStadiumKm: 1.8,
    efficiency: "20 min walk · Downtown core, great transit access",
    transitScore: 9,
    transitNote: "5 min walk to Churchill Station · Capital Line direct to Coliseum · Shuttle departs Rogers Place",
  },
  {
    id: "edmonton-sutton-place",
    name: "The Sutton Place Hotel Edmonton",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5430, lng: -113.4964 },
    tier: "luxury",
    priceRange: "$350–$500 / night",
    distanceToStadiumKm: 1.9,
    efficiency: "22 min walk or 5 min cab · Top end, downtown",
    transitScore: 9,
    transitNote: "4 min walk to Churchill Station · Capital Line north to Coliseum · 0 transfers",
  },
  {
    id: "edmonton-metterra",
    name: "Metterra Hotel on Whyte",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5207, lng: -113.5028 },
    tier: "mid",
    priceRange: "$150–$250 / night",
    distanceToStadiumKm: 5.1,
    efficiency: "On Whyte Ave · Best nightlife & local spots nearby",
    transitScore: 5,
    transitNote: "Bus to downtown LRT → Capital Line to Coliseum · 2 transfers, ~40 min",
  },
  {
    id: "edmonton-hi-hostel",
    name: "HI Edmonton Hostel",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5160, lng: -113.5041 },
    tier: "budget",
    priceRange: "$30–$80 / night",
    distanceToStadiumKm: 5.4,
    efficiency: "Short LRT ride · Most affordable option",
    transitScore: 5,
    transitNote: "Jasper Ave buses → Central LRT → Coliseum · 2 transfers, 35–45 min on match day",
  },
];

/** Get all hotels for a specific city (by stadium id), sorted by transitScore desc */
export function getHotelsForCity(cityId: string): Hotel[] {
  return HOTELS
    .filter((h) => h.cityId === cityId)
    .sort((a, b) => b.transitScore - a.transitScore);
}
