// ─── Core domain types ────────────────────────────────────────────────────────

/** Travel mode supported by the routing pipeline */
export type Mode = "transit" | "cycling" | "walking" | "driving" | "shuttle";

/** A lat/lng coordinate pair */
export interface Coords {
  lat: number;
  lng: number;
}

/** A fixed starting-point anchor within a host city */
export interface Anchor {
  id: string;           // e.g. "vancouver-airport"
  label: string;        // Display name shown in UI
  type: "airport" | "city-center" | "train-station" | "hotel";
  coords: Coords;
}

// ─── Hotel types ──────────────────────────────────────────────────────────────

export type HotelTier = "budget" | "mid" | "luxury";

/** A curated hotel option for a host city */
export interface Hotel {
  id: string;
  name: string;
  cityId: string;                 // matches Stadium.id
  coords: Coords;
  tier: HotelTier;
  priceRange: string;             // e.g. "$120–$200 / night"
  distanceToStadiumKm: number;   // straight-line km
  efficiency: string;             // human-readable insight, e.g. "5 min walk · Best value"
  /** 0–10 transit access score — used for sorting and display */
  transitScore: number;
  /** Specific transit info: nearest stop, line, transfers to stadium */
  transitNote: string;
}

// ─── Hidden Gem types ─────────────────────────────────────────────────────────

export type GemCategory = "food" | "jersey";

/** A local hidden gem — food spot or jersey vendor — near a host stadium */
export interface HiddenGem {
  id: string;
  cityId: string;       // matches Stadium.id
  name: string;
  category: GemCategory;
  coords: Coords;
  description: string;  // One-line description of the place
  tip: string;          // Local knowledge / insider tip
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

/**
 * A single step within a transit route — bus line, subway leg, or walk segment.
 * Only populated for mode="transit".
 */
export interface TransitStep {
  /** The vehicle type for this step */
  mode: "walk" | "bus" | "subway" | "tram" | "rail" | "ferry";
  /** Transit line name — e.g. "Canada Line", "504 King", "Capital Line" */
  line?: string;
  /** Number of stops on this transit leg */
  stops?: number;
  /** Duration of this individual step in minutes */
  durationMin: number;
}

/** A single leg of a pre-computed route */
export interface RouteResult {
  stadiumId: string;
  anchorId: string;
  mode: Mode;
  durationMin: number;      // Travel time in minutes
  distanceKm: number;       // Distance in kilometres
  /** GeoJSON LineString geometry for drawing the polyline on Mapbox */
  geometry: GeoJSON.LineString | null;
  /**
   * Step-by-step breakdown for transit mode.
   * e.g. [walk 4 min → Canada Line 12 stops → walk 2 min]
   * Populated by fetch-routes.ts when mode="transit".
   */
  transitSteps?: TransitStep[];
}

/**
 * The full pre-computed route cache.
 * Keyed as `${stadiumId}__${anchorId}__${mode}`.
 */
export type RouteCache = Record<string, RouteResult>;
