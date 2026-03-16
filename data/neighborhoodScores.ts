/**
 * data/neighborhoodScores.ts
 *
 * Transit access scores for neighborhoods near each 2026 FIFA World Cup
 * Canadian host stadium. Scores inform the heatmap overlay in NeighborhoodOverlay.
 *
 * Each factor is rated 0–10 (10 = best):
 *   transitDensity    — concentration of bus/subway/LRT stops within ~500m
 *   shuttleAccess     — walk time to nearest FIFA shuttle pickup stop (10 = <5 min)
 *   transfersToStadium— fewer transfers = higher score (0 transfers = 10)
 *   walkToTransit     — time to nearest stop (10 = <2 min, 0 = >15 min)
 *
 * `overall` is the equal-weighted average — updated by NeighborhoodOverlay
 * when the user adjusts filter weights.
 */

export interface NeighborhoodScore {
  /** Must match GeoJSON feature id */
  id: string;
  name: string;
  /** Matches Stadium.id */
  cityId: string;
  transitDensity: number;
  shuttleAccess: number;
  transfersToStadium: number;
  walkToTransit: number;
  /** Pre-computed equal-weight average */
  overall: number;
  /** One-liner shown in the overlay panel */
  transitSummary: string;
}

// ─── Vancouver — BC Place ──────────────────────────────────────────────────────
// Stadium-Chinatown SkyTrain is directly adjacent to BC Place.
// Canada Line (Yaletown-Roundhouse) is 10 min walk south.

const VANCOUVER_SCORES: NeighborhoodScore[] = [
  {
    id: "downtown-core",
    name: "Downtown Core",
    cityId: "bc-place",
    transitDensity: 10,
    shuttleAccess: 9,
    transfersToStadium: 10,  // Stadium-Chinatown SkyTrain: 0 transfers
    walkToTransit: 10,
    overall: 9.75,
    transitSummary: "Stadium-Chinatown SkyTrain adjacent · Dense bus network · Shuttle hub nearby",
  },
  {
    id: "yaletown",
    name: "Yaletown",
    cityId: "bc-place",
    transitDensity: 9,
    shuttleAccess: 8,
    transfersToStadium: 9,   // Yaletown-Roundhouse → walk to BC Place
    walkToTransit: 9,
    overall: 8.75,
    transitSummary: "Yaletown-Roundhouse Canada Line · 12 min walk or 1-stop SkyTrain to BC Place",
  },
  {
    id: "gastown",
    name: "Gastown / Chinatown",
    cityId: "bc-place",
    transitDensity: 8,
    shuttleAccess: 9,
    transfersToStadium: 9,   // Stadium-Chinatown station is at the edge of this area
    walkToTransit: 8,
    overall: 8.5,
    transitSummary: "Stadium-Chinatown SkyTrain at border · Multiple East Hastings buses",
  },
  {
    id: "fairview",
    name: "Fairview",
    cityId: "bc-place",
    transitDensity: 8,
    shuttleAccess: 6,
    transfersToStadium: 7,   // Broadway-City Hall → Canada Line → 1 stop
    walkToTransit: 7,
    overall: 7.0,
    transitSummary: "Broadway-City Hall Canada Line · 1 transfer, ~20 min to BC Place",
  },
  {
    id: "west-end",
    name: "West End",
    cityId: "bc-place",
    transitDensity: 7,
    shuttleAccess: 5,
    transfersToStadium: 7,   // Burrard SkyTrain → walk east along Georgia
    walkToTransit: 8,
    overall: 6.75,
    transitSummary: "Burrard Station nearby · Bus 5/6 along Davie · 20 min to BC Place",
  },
  {
    id: "mount-pleasant",
    name: "Mount Pleasant",
    cityId: "bc-place",
    transitDensity: 6,
    shuttleAccess: 7,
    transfersToStadium: 6,   // Broadway-City Hall, 1 transfer
    walkToTransit: 6,
    overall: 6.25,
    transitSummary: "Main St–Science World station · Shuttle pickup nearby at Pacific Central",
  },
  {
    id: "strathcona",
    name: "Strathcona",
    cityId: "bc-place",
    transitDensity: 5,
    shuttleAccess: 8,
    transfersToStadium: 6,
    walkToTransit: 5,
    overall: 6.0,
    transitSummary: "Close to Pacific Central shuttle hub · Bus 3/8 on Hastings/Main",
  },
];

// ─── Toronto — BMO Field ───────────────────────────────────────────────────────
// BMO Field is at Exhibition Place — served by 509/511 streetcars from Union.
// Liberty Village is the closest walkable neighbourhood.

const TORONTO_SCORES: NeighborhoodScore[] = [
  {
    id: "downtown-core",
    name: "Downtown Core",
    cityId: "bmo-field",
    transitDensity: 10,
    shuttleAccess: 10,
    transfersToStadium: 10,  // 509/511 streetcar direct from Union
    walkToTransit: 10,
    overall: 10.0,
    transitSummary: "Union Station — FIFA shuttle hub · 509 Harbourfront direct to Exhibition/BMO",
  },
  {
    id: "liberty-village",
    name: "Liberty Village",
    cityId: "bmo-field",
    transitDensity: 8,
    shuttleAccess: 9,
    transfersToStadium: 9,   // King 504 streetcar → Exhibition
    walkToTransit: 8,
    overall: 8.5,
    transitSummary: "King 504 streetcar direct to Exhibition · Closest neighbourhood to BMO Field",
  },
  {
    id: "king-west",
    name: "King West / Entertainment District",
    cityId: "bmo-field",
    transitDensity: 9,
    shuttleAccess: 9,
    transfersToStadium: 9,   // 504 King streetcar direct
    walkToTransit: 9,
    overall: 9.0,
    transitSummary: "504 King streetcar direct to BMO · 15 min, no transfers",
  },
  {
    id: "harbourfront",
    name: "Harbourfront / CityPlace",
    cityId: "bmo-field",
    transitDensity: 8,
    shuttleAccess: 8,
    transfersToStadium: 9,   // 509 Harbourfront streetcar direct
    walkToTransit: 8,
    overall: 8.25,
    transitSummary: "509 Harbourfront streetcar direct to Exhibition · GO Train at Union",
  },
  {
    id: "queen-west",
    name: "Queen West / Ossington",
    cityId: "bmo-field",
    transitDensity: 7,
    shuttleAccess: 5,
    transfersToStadium: 7,   // 501 Queen → transfer to 509 at Union
    walkToTransit: 7,
    overall: 6.5,
    transitSummary: "501 Queen streetcar → transfer at Union for 509 to BMO · ~30 min",
  },
  {
    id: "distillery-district",
    name: "Distillery District / St. Lawrence",
    cityId: "bmo-field",
    transitDensity: 7,
    shuttleAccess: 7,
    transfersToStadium: 7,   // 504 King streetcar west to Exhibition
    walkToTransit: 6,
    overall: 6.75,
    transitSummary: "504 King streetcar west to BMO · 20 min · Shuttle departs Union 20 min away",
  },
  {
    id: "parkdale",
    name: "Parkdale",
    cityId: "bmo-field",
    transitDensity: 7,
    shuttleAccess: 4,
    transfersToStadium: 7,   // 504 King east to Exhibition
    walkToTransit: 7,
    overall: 6.25,
    transitSummary: "504 King streetcar east → Exhibition · 15 min, no transfers",
  },
];

// ─── Edmonton — Commonwealth Stadium ──────────────────────────────────────────
// Capital Line LRT runs to Coliseum station (1 stop from Commonwealth).
// Downtown has the best LRT access via Churchill/Bay/Central stations.

const EDMONTON_SCORES: NeighborhoodScore[] = [
  {
    id: "downtown",
    name: "Downtown Edmonton",
    cityId: "commonwealth-stadium",
    transitDensity: 9,
    shuttleAccess: 10,
    transfersToStadium: 9,   // Capital Line from Churchill/Bay → Coliseum (2 stops)
    walkToTransit: 9,
    overall: 9.25,
    transitSummary: "Capital Line from Churchill St. — FIFA shuttle departs Rogers Place · 2 LRT stops",
  },
  {
    id: "oliver",
    name: "Oliver",
    cityId: "commonwealth-stadium",
    transitDensity: 7,
    shuttleAccess: 8,
    transfersToStadium: 7,   // Bus to LRT, then Capital Line
    walkToTransit: 7,
    overall: 7.25,
    transitSummary: "Jasper Ave buses → Central LRT · 1 transfer, ~25 min to Commonwealth",
  },
  {
    id: "mccauley",
    name: "McCauley / Boyle Street",
    cityId: "commonwealth-stadium",
    transitDensity: 7,
    shuttleAccess: 7,
    transfersToStadium: 8,   // Close to Coliseum, short LRT ride
    walkToTransit: 7,
    overall: 7.25,
    transitSummary: "Near Coliseum LRT station · Short Capital Line ride · Shuttle zone nearby",
  },
  {
    id: "strathcona",
    name: "Strathcona / Whyte Ave",
    cityId: "commonwealth-stadium",
    transitDensity: 6,
    shuttleAccess: 4,
    transfersToStadium: 5,   // Bus → Downtown → Capital Line north
    walkToTransit: 6,
    overall: 5.25,
    transitSummary: "Bus to downtown LRT · 2 transfers, 35+ min · Better for pre/post-match food",
  },
  {
    id: "university",
    name: "University / Garneau",
    cityId: "commonwealth-stadium",
    transitDensity: 6,
    shuttleAccess: 3,
    transfersToStadium: 5,   // LRT at University → Health Sciences → transfer
    walkToTransit: 7,
    overall: 5.25,
    transitSummary: "LRT at University Station → 2 transfers to Commonwealth · ~40 min",
  },
  {
    id: "glenora",
    name: "Glenora / Westmount",
    cityId: "commonwealth-stadium",
    transitDensity: 4,
    shuttleAccess: 4,
    transfersToStadium: 4,
    walkToTransit: 4,
    overall: 4.0,
    transitSummary: "Bus-dependent area · 2+ transfers · Consider rideshare on match day",
  },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const NEIGHBORHOOD_SCORES: NeighborhoodScore[] = [
  ...VANCOUVER_SCORES,
  ...TORONTO_SCORES,
  ...EDMONTON_SCORES,
];

export function getScoresForCity(cityId: string): NeighborhoodScore[] {
  return NEIGHBORHOOD_SCORES.filter((n) => n.cityId === cityId);
}

export function getScoreById(id: string): NeighborhoodScore | undefined {
  return NEIGHBORHOOD_SCORES.find((n) => n.id === id);
}

/**
 * Recalculate overall score given user-adjusted factor weights (0–1 each).
 * Weights are normalised internally so they don't need to sum to 1.
 */
export function computeOverall(
  score: NeighborhoodScore,
  weights: { transitDensity: number; shuttleAccess: number; transfersToStadium: number; walkToTransit: number }
): number {
  const total = weights.transitDensity + weights.shuttleAccess + weights.transfersToStadium + weights.walkToTransit;
  if (total === 0) return score.overall;
  return (
    score.transitDensity    * weights.transitDensity    +
    score.shuttleAccess     * weights.shuttleAccess     +
    score.transfersToStadium * weights.transfersToStadium +
    score.walkToTransit     * weights.walkToTransit
  ) / total;
}
