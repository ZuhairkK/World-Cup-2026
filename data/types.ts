// ─── Core domain types ────────────────────────────────────────────────────────

/** Travel mode supported by the routing pipeline */
export type Mode = "transit" | "cycling" | "walking" | "driving";

/** A lat/lng coordinate pair */
export interface Coords {
  lat: number;
  lng: number;
}

/** A fixed starting-point anchor within a host city */
export interface Anchor {
  id: string;           // e.g. "vancouver-airport"
  label: string;        // Display name shown in UI
  type: "airport" | "city-center" | "train-station";
  coords: Coords;
}

/** A 2026 FIFA World Cup stadium */
export interface Stadium {
  id: string;           // e.g. "bc-place"
  name: string;         // Stadium name
  city: string;         // Host city name
  country: "Canada";
  coords: Coords;       // Stadium lat/lng (globe marker + map center)
  anchors: Anchor[];    // Fixed starting points for this city
  /** Placeholder colour used as thumbnail bg until a real image is added */
  thumbnailColor?: string;
}

// ─── Pre-computed route types ─────────────────────────────────────────────────

/** A single leg of a pre-computed route */
export interface RouteResult {
  stadiumId: string;
  anchorId: string;
  mode: Mode;
  durationMin: number;      // Travel time in minutes
  distanceKm: number;       // Distance in kilometres
  /** GeoJSON LineString geometry for drawing the polyline on Mapbox */
  geometry: GeoJSON.LineString | null;
}

/**
 * The full pre-computed route cache.
 * Keyed as `${stadiumId}__${anchorId}__${mode}`.
 */
export type RouteCache = Record<string, RouteResult>;
