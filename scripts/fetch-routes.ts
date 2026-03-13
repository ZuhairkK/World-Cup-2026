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
import type { Mode, RouteCache, RouteResult } from "../data/types";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("❌  GOOGLE_MAPS_API_KEY is not set in .env.local");
  process.exit(1);
}

const MODES: Mode[] = ["transit", "cycling", "walking", "driving"];

/** Maps our Mode type to Google Maps travelMode string */
const GMAPS_MODE: Record<Mode, string> = {
  transit:  "TRANSIT",
  cycling:  "BICYCLE",
  walking:  "WALK",
  driving:  "DRIVE",
};

interface GMapsRoute {
  duration: string; // e.g. "1605s"
  distanceMeters: number;
  polyline?: { encodedPolyline: string };
}

interface GMapsResponse {
  routes?: GMapsRoute[];
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
  mode: Mode
): Promise<{ durationMin: number; distanceKm: number; geometry: GeoJSON.LineString | null } | null> {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const body = {
    origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
    destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
    travelMode: GMAPS_MODE[mode],
    computeAlternativeRoutes: false,
    routeModifiers: { avoidTolls: false },
    polylineQuality: "OVERVIEW",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask":
        "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
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

  return { durationMin, distanceKm, geometry };
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
          mode
        );

        if (result) {
          const entry: RouteResult = {
            stadiumId: stadium.id,
            anchorId: anchor.id,
            mode,
            durationMin: result.durationMin,
            distanceKm: result.distanceKm,
            geometry: result.geometry,
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
