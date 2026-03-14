import type { Hotel } from "./types";

/**
 * Curated hotel options for each 2026 FIFA World Cup host city in Canada.
 * 3–5 hotels per city spanning budget → luxury tiers.
 * When selected, the hotel coordinates become the route starting point
 * (replacing the default airport / city-center / train-station anchors).
 *
 * Distances are straight-line km to the stadium — walking/transit may differ.
 */

export const HOTELS: Hotel[] = [

  // ─── Vancouver (BC Place) ──────────────────────────────────────────────────

  {
    id: "vancouver-ywca",
    name: "YWCA Hotel Vancouver",
    cityId: "bc-place",
    coords: { lat: 49.2792, lng: -123.1199 },
    tier: "budget",
    priceRange: "$80–$160 / night",
    distanceToStadiumKm: 0.9,
    efficiency: "12 min walk · Best value near stadium",
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
  },
  {
    id: "vancouver-jw-marriott",
    name: "JW Marriott Parq Vancouver",
    cityId: "bc-place",
    coords: { lat: 49.2774, lng: -123.1082 },
    tier: "luxury",
    priceRange: "$400–$700 / night",
    distanceToStadiumKm: 0.1,
    efficiency: "2 min walk · Literally next door to BC Place",
  },

  // ─── Toronto (BMO Field) ───────────────────────────────────────────────────

  {
    id: "toronto-hi-hostel",
    name: "HI Toronto Hostel",
    cityId: "bmo-field",
    coords: { lat: 43.6510, lng: -79.3749 },
    tier: "budget",
    priceRange: "$40–$100 / night",
    distanceToStadiumKm: 3.1,
    efficiency: "Short streetcar ride · Cheapest in the city",
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
  },
  {
    id: "toronto-hotel-x",
    name: "Hotel X Toronto",
    cityId: "bmo-field",
    coords: { lat: 43.6327, lng: -79.4151 },
    tier: "luxury",
    priceRange: "$350–$600 / night",
    distanceToStadiumKm: 0.2,
    efficiency: "3 min walk · Closest hotel to BMO Field",
  },

  // ─── Edmonton (Commonwealth Stadium) ──────────────────────────────────────

  {
    id: "edmonton-hi-hostel",
    name: "HI Edmonton Hostel",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5160, lng: -113.5041 },
    tier: "budget",
    priceRange: "$30–$80 / night",
    distanceToStadiumKm: 5.4,
    efficiency: "Short LRT ride · Most affordable option",
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
  },
  {
    id: "edmonton-delta",
    name: "Delta Hotels Edmonton Centre Suites",
    cityId: "commonwealth-stadium",
    coords: { lat: 53.5444, lng: -113.4963 },
    tier: "mid",
    priceRange: "$200–$300 / night",
    distanceToStadiumKm: 1.8,
    efficiency: "20 min walk · Downtown core, great transit access",
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
  },
];

/** Get all hotels for a specific city (by stadium id) */
export function getHotelsForCity(cityId: string): Hotel[] {
  return HOTELS.filter((h) => h.cityId === cityId);
}
