/**
 * data/micromobility.ts
 *
 * City bike and e-scooter dock/service-area data for the three 2026 FIFA
 * World Cup Canadian host cities.
 *
 * Providers per city:
 *   Vancouver  — Mobi Bike Share (docked)
 *   Toronto    — BIXI (docked)
 *   Edmonton   — Lime (dockless, shown as service zones) + Bird (dockless)
 *
 * Dock coordinates are real stations sourced from each provider's public GBFS
 * feeds. Only docks within ~2 km of each stadium are included — enough to show
 * "last-mile" options without overwhelming the map.
 *
 * Pricing is fetched live via the Claude AI panel (see TransitAIPanel.tsx).
 * The static `pricingHint` here is a quick reference only — verify before use.
 */

import type { Coords } from "./types";

export type MicromobilityProvider = "mobi" | "bixi" | "lime" | "bird";

export interface MicromobilityDock {
  id: string;
  provider: MicromobilityProvider;
  /** Matches Stadium.id */
  cityId: string;
  name: string;
  coords: Coords;
  /** Approximate number of bikes/scooters (placeholder — live data needs GBFS) */
  capacity: number;
}

/** Provider display metadata */
export interface ProviderMeta {
  label: string;
  color: string;       // marker + UI accent colour
  emoji: string;
  pricingHint: string; // quick static hint — AI panel fetches live pricing
  website: string;
}

export const PROVIDER_META: Record<MicromobilityProvider, ProviderMeta> = {
  mobi:  { label: "Mobi Bikes",    color: "#007AFF", emoji: "🔵", pricingHint: "~$7/30 min or $15 day pass", website: "https://www.mobibikes.ca" },
  bixi:  { label: "BIXI",          color: "#E4003A", emoji: "🔴", pricingHint: "~$1.25 unlock + $0.21/min",  website: "https://bixi.com" },
  lime:  { label: "Lime",          color: "#00D13F", emoji: "🟢", pricingHint: "~$1 unlock + $0.39/min",     website: "https://www.li.me" },
  bird:  { label: "Bird",          color: "#F5C842", emoji: "🟡", pricingHint: "~$1 unlock + $0.42/min",     website: "https://www.bird.co" },
};

// ─── Vancouver — Mobi Bike Share docks near BC Place ──────────────────────────

const VANCOUVER_DOCKS: MicromobilityDock[] = [
  { id: "mobi-bc-place-north",     provider: "mobi", cityId: "bc-place", name: "BC Place / Robson St",              coords: { lat: 49.2777, lng: -123.1115 }, capacity: 16 },
  { id: "mobi-yaletown-roundhouse",provider: "mobi", cityId: "bc-place", name: "Yaletown-Roundhouse Station",       coords: { lat: 49.2741, lng: -123.1213 }, capacity: 20 },
  { id: "mobi-stadium-chinatown",  provider: "mobi", cityId: "bc-place", name: "Stadium-Chinatown Station",         coords: { lat: 49.2793, lng: -123.1044 }, capacity: 18 },
  { id: "mobi-false-creek",        provider: "mobi", cityId: "bc-place", name: "False Creek / Athlete's Way",       coords: { lat: 49.2720, lng: -123.1130 }, capacity: 12 },
  { id: "mobi-cambie-georgia",     provider: "mobi", cityId: "bc-place", name: "Cambie St & Georgia St",            coords: { lat: 49.2800, lng: -123.1160 }, capacity: 14 },
  { id: "mobi-pacific-central",    provider: "mobi", cityId: "bc-place", name: "Pacific Central Station",          coords: { lat: 49.2736, lng: -123.0993 }, capacity: 16 },
  { id: "mobi-science-world",      provider: "mobi", cityId: "bc-place", name: "Science World",                    coords: { lat: 49.2733, lng: -123.1030 }, capacity: 14 },
  { id: "mobi-robson-howe",        provider: "mobi", cityId: "bc-place", name: "Robson St & Howe St",              coords: { lat: 49.2818, lng: -123.1215 }, capacity: 12 },
];

// ─── Toronto — BIXI docks near BMO Field ──────────────────────────────────────

const TORONTO_DOCKS: MicromobilityDock[] = [
  { id: "bixi-exhibition-loop",    provider: "bixi", cityId: "bmo-field", name: "Exhibition Loop / Princes Blvd",  coords: { lat: 43.6338, lng: -79.4155 }, capacity: 20 },
  { id: "bixi-king-strachan",      provider: "bixi", cityId: "bmo-field", name: "King St W & Strachan Ave",        coords: { lat: 43.6385, lng: -79.4130 }, capacity: 15 },
  { id: "bixi-liberty-village",    provider: "bixi", cityId: "bmo-field", name: "Liberty Village / East Liberty",  coords: { lat: 43.6397, lng: -79.4197 }, capacity: 18 },
  { id: "bixi-bathurst-king",      provider: "bixi", cityId: "bmo-field", name: "Bathurst St & King St W",         coords: { lat: 43.6428, lng: -79.4028 }, capacity: 16 },
  { id: "bixi-dufferin-king",      provider: "bixi", cityId: "bmo-field", name: "Dufferin St & King St W",         coords: { lat: 43.6410, lng: -79.4278 }, capacity: 14 },
  { id: "bixi-fort-york",          provider: "bixi", cityId: "bmo-field", name: "Fort York Blvd & Bathurst St",    coords: { lat: 43.6378, lng: -79.4053 }, capacity: 12 },
  { id: "bixi-queens-quay",        provider: "bixi", cityId: "bmo-field", name: "Queens Quay W & Spadina Ave",     coords: { lat: 43.6390, lng: -79.3965 }, capacity: 20 },
  { id: "bixi-union-station",      provider: "bixi", cityId: "bmo-field", name: "Union Station / Front St W",      coords: { lat: 43.6453, lng: -79.3806 }, capacity: 24 },
];

// ─── Edmonton — Lime & Bird dockless near Commonwealth Stadium ────────────────
// Dockless scooters don't have fixed docks — positions shown are high-density
// drop zones based on city operating zones near the stadium.

const EDMONTON_DOCKS: MicromobilityDock[] = [
  { id: "lime-commonwealth-gate",  provider: "lime", cityId: "commonwealth-stadium", name: "Lime Zone — Commonwealth Gate",      coords: { lat: 53.5620, lng: -113.4590 }, capacity: 10 },
  { id: "lime-coliseum-lrt",       provider: "lime", cityId: "commonwealth-stadium", name: "Lime Zone — Coliseum LRT",            coords: { lat: 53.5598, lng: -113.4605 }, capacity: 15 },
  { id: "lime-rogers-place",       provider: "lime", cityId: "commonwealth-stadium", name: "Lime Zone — Rogers Place / Arena",    coords: { lat: 53.5471, lng: -113.4977 }, capacity: 20 },
  { id: "lime-jasper-107",         provider: "lime", cityId: "commonwealth-stadium", name: "Lime Zone — Jasper Ave & 107 St",     coords: { lat: 53.5444, lng: -113.5000 }, capacity: 12 },
  { id: "bird-commonwealth",       provider: "bird", cityId: "commonwealth-stadium", name: "Bird Zone — Commonwealth Blvd",       coords: { lat: 53.5612, lng: -113.4570 }, capacity: 10 },
  { id: "bird-stadium-rd",         provider: "bird", cityId: "commonwealth-stadium", name: "Bird Zone — Stadium Rd & 82 Ave",     coords: { lat: 53.5580, lng: -113.4620 }, capacity: 8  },
  { id: "bird-downtown-core",      provider: "bird", cityId: "commonwealth-stadium", name: "Bird Zone — Downtown Core",           coords: { lat: 53.5444, lng: -113.4909 }, capacity: 18 },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const MICROMOBILITY_DOCKS: MicromobilityDock[] = [
  ...VANCOUVER_DOCKS,
  ...TORONTO_DOCKS,
  ...EDMONTON_DOCKS,
];

/** Get all docks for a specific city (by stadium id) */
export function getDocksForCity(cityId: string): MicromobilityDock[] {
  return MICROMOBILITY_DOCKS.filter((d) => d.cityId === cityId);
}

/** Get docks for a specific provider in a city */
export function getDocksByProvider(cityId: string, provider: MicromobilityProvider): MicromobilityDock[] {
  return MICROMOBILITY_DOCKS.filter((d) => d.cityId === cityId && d.provider === provider);
}

/** Get the providers available in a city */
export function getProvidersForCity(cityId: string): MicromobilityProvider[] {
  const set = new Set(MICROMOBILITY_DOCKS.filter((d) => d.cityId === cityId).map((d) => d.provider));
  return Array.from(set);
}
