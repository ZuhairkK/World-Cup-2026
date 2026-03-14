import type { HiddenGem } from "./types";

/**
 * Curated hidden gems for each 2026 FIFA World Cup host city.
 * These are local, off-the-beaten-path spots — not tourist traps.
 *
 * Categories:
 *  "jersey" — trusted local jersey vendors with retro & rare stock
 *  "food"   — local restaurants & food spots fan-friendly and affordable
 *
 * Add your own spots by following the same structure.
 * Each gem appears as a pin on the Hidden Gems map mode.
 */

export const HIDDEN_GEMS: HiddenGem[] = [

  // ─── Toronto (BMO Field) ───────────────────────────────────────────────────

  {
    id: "toronto-pro-league-dundas",
    cityId: "bmo-field",
    name: "Pro League Sports — Dundas & River",
    category: "jersey",
    coords: { lat: 43.6617, lng: -79.3534 },
    description: "Underground jersey shop with insane retro & rare stock",
    tip: "Ask about the back room — they keep the heat back there. Legit prices, no tourist markup.",
  },
  {
    id: "toronto-pro-league-kensington",
    cityId: "bmo-field",
    name: "Pro League Sports — Kensington Market",
    category: "jersey",
    coords: { lat: 43.6539, lng: -79.4012 },
    description: "Kensington location with retro national team jerseys",
    tip: "Great for vintage kits. Kensington has tons of other gems nearby — make a day of it.",
  },
  {
    id: "toronto-chinatown-jerseys",
    cityId: "bmo-field",
    name: "Spadina Chinatown Sports Row",
    category: "jersey",
    coords: { lat: 43.6546, lng: -79.3973 },
    description: "Cluster of small sports shops with competitive jersey prices",
    tip: "Haggle respectfully. Many shops carry national team kits at better prices than official stores.",
  },
  {
    id: "toronto-el-almacen",
    cityId: "bmo-field",
    name: "El Almacén",
    category: "food",
    coords: { lat: 43.6481, lng: -79.4231 },
    description: "Colombian restaurant with pre-match energy on game day",
    tip: "Get the bandeja paisa. Packed with South American fans on match days — pure atmosphere.",
  },
  {
    id: "toronto-roti-shops",
    cityId: "bmo-field",
    name: "Roti Shops — Dundas West",
    category: "food",
    coords: { lat: 43.6534, lng: -79.4441 },
    description: "Legendary Caribbean roti, goat curry, doubles",
    tip: "Under $15 and insanely filling. Perfect pre-match fuel. Bacchus Roti is the classic spot.",
  },

  // ─── Vancouver (BC Place) ──────────────────────────────────────────────────

  {
    id: "vancouver-kickz-gastown",
    cityId: "bc-place",
    name: "Kickz — Gastown",
    category: "jersey",
    coords: { lat: 49.2837, lng: -123.1077 },
    description: "Gastown sneaker & jersey boutique with European kits",
    tip: "Better selection than the mall stores. Retro Bundesliga and Serie A kits in stock most of the time.",
  },
  {
    id: "vancouver-bao-down",
    cityId: "bc-place",
    name: "Bao Down",
    category: "food",
    coords: { lat: 49.2821, lng: -123.1108 },
    description: "Asian fusion bao spot — casual, fast, incredible",
    tip: "The pork belly bao is legendary. Quick walk from BC Place, great for post-match.",
  },
  {
    id: "vancouver-davie-st-food",
    cityId: "bc-place",
    name: "Davie Street Food Strip",
    category: "food",
    coords: { lat: 49.2755, lng: -123.1321 },
    description: "The best late-night food strip in Vancouver",
    tip: "Noodle Box and Vij's Quick are local legends. Affordable and always open late.",
  },

  // ─── Edmonton (Commonwealth Stadium) ──────────────────────────────────────

  {
    id: "edmonton-whyte-ave-sports",
    cityId: "commonwealth-stadium",
    name: "Whyte Ave Sports Strip",
    category: "jersey",
    coords: { lat: 53.5203, lng: -113.5014 },
    description: "Cluster of local sports shops on legendary Whyte Ave",
    tip: "More personality than big box stores. Ask for national team kits — they usually have stock.",
  },
  {
    id: "edmonton-south-common-food",
    cityId: "commonwealth-stadium",
    name: "The Moth Café",
    category: "food",
    coords: { lat: 53.5198, lng: -113.4985 },
    description: "Local Whyte Ave brunch & coffee favourite",
    tip: "Massive portions, local crowd. Get there early on match days — it fills up fast.",
  },
  {
    id: "edmonton-99-street-pier",
    cityId: "commonwealth-stadium",
    name: "99 Street Brewery",
    category: "food",
    coords: { lat: 53.5469, lng: -113.4956 },
    description: "Local craft brewery near the stadium",
    tip: "Edmonton locals pre-game here. Huge patio, local craft beer, walkable to Commonwealth.",
  },
];

/** Get all hidden gems for a specific city */
export function getGemsForCity(cityId: string): HiddenGem[] {
  return HIDDEN_GEMS.filter((g) => g.cityId === cityId);
}
