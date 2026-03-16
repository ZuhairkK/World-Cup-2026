/**
 * fetch-routes.ts
 *
 * Build-time script that pre-computes all 36 route combinations:
 *   3 stadiums × 3 anchors × 4 modes (transit, cycling, walking, driving)
 *
 * Writes the result to data/routes.json as a flat RouteCache object
 * keyed by `${stadiumId}__${anchorId}__${mode}`.
 *
 * Run with:
 *   npm run fetch-routes
 *
 * Requires GOOGLE_MAPS_API_KEY in .env.local
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local for the API key
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { STADIUMS } from "../data/stadiums";
import type { Mode, RouteCache, RouteResult, TransitStep } from "../data/types";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("❌  GOOGLE_MAPS_API_KEY is not set in .env.local");
  process.exit(1);
}

// Exclude "shuttle" — those routes come from data/shuttles.ts, not the API
const MODES: Mode[] = ["transit", "cycling", "walking", "driving"];

/** Maps routed modes to Google Maps travelMode string (shuttle is excluded) */
const GMAPS_MODE: Record<Exclude<Mode, "shuttle">, string> = {
  transit:  "TRANSIT",
  cycling:  "BICYCLE",
  walking:  "WALK",
  driving:  "DRIVE",
};

/** Google Routes API v2 transit step detail */
interface GMapsTransitDetails {
  transitLine?: {
    name?: string;
    vehicle?: { type?: string };
  };
  stopCount?: number;
}

/** A single step in a Google Routes API leg */
interface GMapsStep {
  travelMode?: string;           // "WALK" | "TRANSIT" | "BICYCLE"
  staticDuration?: string;       // e.g. "240s"
  transitDetails?: GMapsTransitDetails;
}

interface GMapsLeg {
  steps?: GMapsStep[];
}

interface GMapsRoute {
  duration: string;              // e.g. "1605s"
  distanceMeters: number;
  polyline?: { encodedPolyline: string };
  legs?: GMapsLeg[];
}

interface GMapsResponse {
  routes?: GMapsRoute[];
}

/**
 * Maps a Google transit vehicle type string to our TransitStep mode.
 * Covers common GTFS vehicle types returned by the Routes API.
 */
function parseVehicleType(type?: string): TransitStep["mode"] {
  switch ((type ?? "").toUpperCase()) {
    case "BUS":
    case "INTERCITY_BUS":
    case "TROLLEYBUS":
      return "bus";
    case "SUBWAY":
    case "METRO_RAIL":
    case "HEAVY_RAIL":
      return "subway";
    case "TRAM":
    case "LIGHT_RAIL":
    case "MONORAIL":
    case "FUNICULAR":
      return "tram";
    case "COMMUTER_TRAIN":
    case "HIGH_SPEED_TRAIN":
    case "LONG_DISTANCE_TRAIN":
    case "RAIL":
      return "rail";
    case "FERRY":
      return "ferry";
    default:
      return "bus";
  }
}

/**
 * Parses Google Routes API legs into our compact TransitStep array.
 * Walks are collapsed if under 1 minute; consecutive walks are merged.
 */
function parseTransitSteps(legs: GMapsLeg[]): TransitStep[] {
  const steps: TransitStep[] = [];

  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const durMin = step.staticDuration
        ? Math.round(parseInt(step.staticDuration, 10) / 60)
        : 0;

      if (step.travelMode === "TRANSIT" && step.transitDetails) {
        steps.push({
          mode: parseVehicleType(step.transitDetails.transitLine?.vehicle?.type),
          line: step.transitDetails.transitLine?.name,
          stops: step.transitDetails.stopCount,
          durationMin: durMin,
        });
      } else if (step.travelMode === "WALK" && durMin >= 1) {
        // Merge consecutive walk steps
        const last = steps[steps.length - 1];
        if (last?.mode === "walk") {
          last.durationMin += durMin;
        } else {
          steps.push({ mode: "walk", durationMin: durMin });
        }
      }
    }
  }

  return steps;
}

/**
 * Decodes a Google Maps encoded polyline into a GeoJSON LineString.
 * Implements the standard polyline decoding algorithm.
 */
function decodePolyline(encoded: string): GeoJSON.LineString {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lng / 1e5, lat / 1e5]); // GeoJSON is [lng, lat]
  }

  return { type: "LineString", coordinates: coords };
}

/**
 * Calls the Google Maps Routes API (v2) for a single origin→stadium+mode combo.
 * Returns null on failure so we can gracefully skip problematic combinations.
 */
async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: Exclude<Mode, "shuttle">
): Promise<{
  durationMin: number;
  distanceKm: number;
  geometry: GeoJSON.LineString | null;
  transitSteps?: TransitStep[];
} | null> {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const body = {
    origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
    destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
    travelMode: GMAPS_MODE[mode],
    computeAlternativeRoutes: false,
    routeModifiers: { avoidTolls: false },
    polylineQuality: "OVERVIEW",
  };

  // Request transit leg details only for transit mode
  const transitFieldMask =
    mode === "transit"
      ? ",routes.legs.steps.travelMode,routes.legs.steps.staticDuration,routes.legs.steps.transitDetails"
      : "";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline${transitFieldMask}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.warn(`  ⚠️  HTTP ${res.status} for mode=${mode}: ${errBody}`);
    return null;
  }

  const data: GMapsResponse = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    console.warn(`  ⚠️  No routes in response for mode=${mode}: ${JSON.stringify(data)}`);
    return null;
  }

  const durationMin = Math.round(parseInt(route.duration, 10) / 60);
  const distanceKm = Math.round((route.distanceMeters / 1000) * 10) / 10;
  const geometry = route.polyline?.encodedPolyline
    ? decodePolyline(route.polyline.encodedPolyline)
    : null;

  const transitSteps =
    mode === "transit" && route.legs
      ? parseTransitSteps(route.legs)
      : undefined;

  return { durationMin, distanceKm, geometry, transitSteps };
}

async function main() {
  console.log("🌍  Fetching pre-computed routes for all Canadian 2026 venues…\n");

  const cache: RouteCache = {};
  let total = 0;
  let errors = 0;

  for (const stadium of STADIUMS) {
    for (const anchor of stadium.anchors) {
      for (const mode of MODES) {
        const key = `${stadium.id}__${anchor.id}__${mode}`;
        process.stdout.write(`  ${stadium.city} | ${anchor.label} | ${mode}… `);

        const result = await fetchRoute(
          anchor.coords.lat,
          anchor.coords.lng,
          stadium.coords.lat,
          stadium.coords.lng,
          mode as Exclude<Mode, "shuttle">
        );

        if (result) {
          const entry: RouteResult = {
            stadiumId: stadium.id,
            anchorId: anchor.id,
            mode,
            durationMin: result.durationMin,
            distanceKm: result.distanceKm,
            geometry: result.geometry,
            ...(result.transitSteps ? { transitSteps: result.transitSteps } : {}),
          };
          cache[key] = entry;
          console.log(`✅  ${result.durationMin} min, ${result.distanceKm} km`);
          total++;
        } else {
          console.log("❌  skipped");
          errors++;
        }

        // Small delay to stay within API rate limits
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  const outPath = path.join(__dirname, "../data/routes.json");
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2));

  console.log(`\n✅  Done. ${total} routes fetched, ${errors} skipped.`);
  console.log(`📄  Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
