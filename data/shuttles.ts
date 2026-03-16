/**
 * data/shuttles.ts
 *
 * FIFA World Cup 2026 official shuttle service data.
 * Routes are PLACEHOLDERS pending the official FIFA transport plan release.
 *
 * Each shuttle runs from one or more fan-zone pickup stops to the stadium.
 * Operating hours are estimated based on standard major-event shuttle patterns:
 * doors open 3–4h before kickoff, last return shuttle ~2h after final whistle.
 *
 * Update geometries + stop coords once FIFA releases the official transport guide.
 */

import type { Coords } from "./types";

export interface ShuttleStop {
  id: string;
  name: string;
  coords: Coords;
}

export interface ShuttleRoute {
  id: string;
  stadiumId: string;
  /** Display name shown in the mode card and map tooltip */
  name: string;
  /** Ordered list of stops from origin fan zone → stadium */
  stops: ShuttleStop[];
  /** Estimated ride time from first pickup stop to stadium drop-off (minutes) */
  durationMin: number;
  /** Placeholder GeoJSON LineString for the shuttle path on the map */
  geometry: GeoJSON.LineString;
  /** When the shuttle runs relative to kickoff */
  operatingHours: string;
  /** Extra context shown in the map tooltip */
  note: string;
}

// ─── Vancouver — BC Place ──────────────────────────────────────────────────────
//
// Fan zone hub: Pacific Central Station (intercity rail / bus hub)
// Drop-off: BC Place South Gate (Terry Fox Way)
//
const VANCOUVER_SHUTTLE: ShuttleRoute = {
  id: "shuttle-bc-place",
  stadiumId: "bc-place",
  name: "Fan Zone Express — Pacific Central → BC Place",
  stops: [
    {
      id: "van-pacific-central",
      name: "Pacific Central Station (Fan Zone Hub)",
      coords: { lat: 49.2736, lng: -123.0993 },
    },
    {
      id: "van-science-world",
      name: "Science World / False Creek",
      coords: { lat: 49.2733, lng: -123.1030 },
    },
    {
      id: "van-bc-place-south",
      name: "BC Place — South Gate Drop-off",
      coords: { lat: 49.2761, lng: -123.1118 },
    },
  ],
  durationMin: 12,
  operatingHours: "3h pre / 2h post kickoff",
  note: "Placeholder route — official FIFA shuttle map TBA. Runs every 10 min on match days.",
  geometry: {
    type: "LineString",
    coordinates: [
      [-123.0993, 49.2736], // Pacific Central
      [-123.1009, 49.2733], // along Terminal Ave
      [-123.1030, 49.2733], // Science World
      [-123.1060, 49.2745],
      [-123.1090, 49.2755],
      [-123.1118, 49.2761], // BC Place South Gate
    ],
  },
};

// ─── Toronto — BMO Field ───────────────────────────────────────────────────────
//
// Fan zone hub: Exhibition Loop (end of the 509/511 streetcar lines, beside BMO)
// Secondary pickup: Union Station (intercity hub)
// Drop-off: BMO Field Main Entrance (Princes' Blvd)
//
const TORONTO_SHUTTLE: ShuttleRoute = {
  id: "shuttle-bmo-field",
  stadiumId: "bmo-field",
  name: "Fan Zone Express — Union Station → BMO Field",
  stops: [
    {
      id: "tor-union-station",
      name: "Union Station (Bay St Entrance)",
      coords: { lat: 43.6453, lng: -79.3806 },
    },
    {
      id: "tor-exhibition-loop",
      name: "Exhibition Loop Fan Zone",
      coords: { lat: 43.6333, lng: -79.4143 },
    },
    {
      id: "tor-bmo-main",
      name: "BMO Field — Main Entrance",
      coords: { lat: 43.6333, lng: -79.4186 },
    },
  ],
  durationMin: 18,
  operatingHours: "3h pre / 2h post kickoff",
  note: "Placeholder route — official FIFA shuttle map TBA. Supplements existing 509/511 streetcar service.",
  geometry: {
    type: "LineString",
    coordinates: [
      [-79.3806, 43.6453], // Union Station
      [-79.3870, 43.6427], // along Front St W
      [-79.3950, 43.6390],
      [-79.4060, 43.6360],
      [-79.4143, 43.6333], // Exhibition Loop
      [-79.4186, 43.6333], // BMO Field main entrance
    ],
  },
};

// ─── Edmonton — Commonwealth Stadium ──────────────────────────────────────────
//
// Fan zone hub: Coliseum LRT Station (Capital Line, 3 stops from Commonwealth)
// Secondary: Rogers Place / Arena District (downtown anchor)
// Drop-off: Commonwealth Stadium North Gate
//
const EDMONTON_SHUTTLE: ShuttleRoute = {
  id: "shuttle-commonwealth",
  stadiumId: "commonwealth-stadium",
  name: "Fan Zone Express — Rogers Place → Commonwealth Stadium",
  stops: [
    {
      id: "edm-rogers-place",
      name: "Rogers Place / Arena District Fan Zone",
      coords: { lat: 53.5471, lng: -113.4977 },
    },
    {
      id: "edm-coliseum-lrt",
      name: "Coliseum LRT Station",
      coords: { lat: 53.5598, lng: -113.4605 },
    },
    {
      id: "edm-commonwealth-north",
      name: "Commonwealth Stadium — North Gate",
      coords: { lat: 53.5634, lng: -113.4559 },
    },
  ],
  durationMin: 22,
  operatingHours: "3h pre / 2h post kickoff",
  note: "Placeholder route — official FIFA shuttle map TBA. Supplements Capital Line LRT service.",
  geometry: {
    type: "LineString",
    coordinates: [
      [-113.4977, 53.5471], // Rogers Place
      [-113.4920, 53.5500],
      [-113.4870, 53.5530],
      [-113.4720, 53.5560],
      [-113.4605, 53.5598], // Coliseum LRT
      [-113.4570, 53.5615],
      [-113.4559, 53.5634], // Commonwealth North Gate
    ],
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const SHUTTLES: ShuttleRoute[] = [
  VANCOUVER_SHUTTLE,
  TORONTO_SHUTTLE,
  EDMONTON_SHUTTLE,
];

/** Get the shuttle route for a specific stadium */
export function getShuttleForStadium(stadiumId: string): ShuttleRoute | null {
  return SHUTTLES.find((s) => s.stadiumId === stadiumId) ?? null;
}
