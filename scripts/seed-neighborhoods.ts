/**
 * scripts/seed-neighborhoods.ts
 *
 * One-time seed script that computes real transit access scores for each
 * neighbourhood near the three 2026 FIFA World Cup Canadian host stadiums,
 * then upserts the results into Supabase.
 *
 * Data sources:
 *   transitDensity   — GTFS Static stops.txt (stop count per neighbourhood polygon)
 *   walkToTransit    — GTFS Static stops.txt (distance from centroid to nearest stop)
 *   shuttleAccess    — hand-crafted (FIFA shuttle pickup proximity)
 *   transfersToStadium — hand-crafted (transit network topology)
 *   transitSummary   — hand-crafted (human-readable description)
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← needs write access, do NOT expose client-side
 *   TRANSLINK_GTFS_URL          ← e.g. https://gtfs.translink.ca/v2/gtfs?apikey=KEY
 *   TTC_GTFS_URL                ← e.g. https://ckan0.cf.opendata.inter.prod-toronto.ca/...
 *   ETS_GTFS_URL                ← e.g. https://data.edmonton.ca/api/...
 *
 * Run with:
 *   npm run seed:neighborhoods
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as dotenv from "dotenv";
import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

// ─── Env validation ────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRANSLINK_URL     = process.env.TRANSLINK_GTFS_URL;
const TTC_URL           = process.env.TTC_GTFS_URL;
const ETS_URL           = process.env.ETS_GTFS_URL;

const missing = (
  [
    ["NEXT_PUBLIC_SUPABASE_URL",  SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY],
    ["TRANSLINK_GTFS_URL",        TRANSLINK_URL],
    ["TTC_GTFS_URL",              TTC_URL],
    ["ETS_GTFS_URL",              ETS_URL],
  ] as [string, string | undefined][]
).filter(([, v]) => !v).map(([k]) => k);

if (missing.length) {
  console.error(`❌  Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// ─── City configuration ────────────────────────────────────────────────────────

interface CityConfig {
  cityId: string;
  gtfsUrl: string;
  /** Path relative to project root */
  geojsonPath: string;
}

const CITIES: CityConfig[] = [
  {
    cityId:      "bc-place",
    gtfsUrl:     TRANSLINK_URL!,
    geojsonPath: "public/geodata/vancouver-neighborhoods.json",
  },
  {
    cityId:      "bmo-field",
    gtfsUrl:     TTC_URL!,
    geojsonPath: "public/geodata/toronto-neighborhoods.json",
  },
  {
    cityId:      "commonwealth-stadium",
    gtfsUrl:     ETS_URL!,
    geojsonPath: "public/geodata/edmonton-neighborhoods.json",
  },
];

// ─── Hand-crafted values (not derivable from GTFS) ────────────────────────────
//
// shuttleAccess:        proximity to FIFA shuttle pickup stops (0–10)
// transfersToStadium:   fewer transfers = higher score (0–10)
// transitSummary:       human-readable description for the overlay panel
//
// Keyed by `${cityId}__${neighborhoodId}`.

const HAND_CRAFTED: Record<
  string,
  { shuttleAccess: number; transfersToStadium: number; transitSummary: string }
> = {
  // ── Vancouver ──────────────────────────────────────────────────────────────
  "bc-place__downtown-core":   { shuttleAccess: 9, transfersToStadium: 10, transitSummary: "Stadium-Chinatown SkyTrain adjacent · Dense bus network · Shuttle hub nearby" },
  "bc-place__yaletown":        { shuttleAccess: 8, transfersToStadium: 9,  transitSummary: "Yaletown-Roundhouse Canada Line · 12 min walk or 1-stop SkyTrain to BC Place" },
  "bc-place__gastown":         { shuttleAccess: 9, transfersToStadium: 9,  transitSummary: "Stadium-Chinatown SkyTrain at border · Multiple East Hastings buses" },
  "bc-place__fairview":        { shuttleAccess: 6, transfersToStadium: 7,  transitSummary: "Broadway-City Hall Canada Line · 1 transfer, ~20 min to BC Place" },
  "bc-place__west-end":        { shuttleAccess: 5, transfersToStadium: 7,  transitSummary: "Burrard Station nearby · Bus 5/6 along Davie · 20 min to BC Place" },
  "bc-place__mount-pleasant":  { shuttleAccess: 7, transfersToStadium: 6,  transitSummary: "Main St–Science World station · Shuttle pickup nearby at Pacific Central" },
  "bc-place__strathcona":      { shuttleAccess: 8, transfersToStadium: 6,  transitSummary: "Close to Pacific Central shuttle hub · Bus 3/8 on Hastings/Main" },

  // ── Toronto ────────────────────────────────────────────────────────────────
  "bmo-field__downtown-core":        { shuttleAccess: 10, transfersToStadium: 10, transitSummary: "Union Station — FIFA shuttle hub · 509 Harbourfront direct to Exhibition/BMO" },
  "bmo-field__liberty-village":      { shuttleAccess: 9,  transfersToStadium: 9,  transitSummary: "King 504 streetcar direct to Exhibition · Closest neighbourhood to BMO Field" },
  "bmo-field__king-west":            { shuttleAccess: 9,  transfersToStadium: 9,  transitSummary: "504 King streetcar direct to BMO · 15 min, no transfers" },
  "bmo-field__harbourfront":         { shuttleAccess: 8,  transfersToStadium: 9,  transitSummary: "509 Harbourfront streetcar direct to Exhibition · GO Train at Union" },
  "bmo-field__queen-west":           { shuttleAccess: 5,  transfersToStadium: 7,  transitSummary: "501 Queen streetcar → transfer at Union for 509 to BMO · ~30 min" },
  "bmo-field__distillery-district":  { shuttleAccess: 7,  transfersToStadium: 7,  transitSummary: "504 King streetcar west to BMO · 20 min · Shuttle departs Union 20 min away" },
  "bmo-field__parkdale":             { shuttleAccess: 4,  transfersToStadium: 7,  transitSummary: "504 King streetcar east → Exhibition · 15 min, no transfers" },

  // ── Edmonton ───────────────────────────────────────────────────────────────
  "commonwealth-stadium__downtown":   { shuttleAccess: 10, transfersToStadium: 9, transitSummary: "Capital Line from Churchill St. — FIFA shuttle departs Rogers Place · 2 LRT stops" },
  "commonwealth-stadium__oliver":     { shuttleAccess: 8,  transfersToStadium: 7, transitSummary: "Jasper Ave buses → Central LRT · 1 transfer, ~25 min to Commonwealth" },
  "commonwealth-stadium__mccauley":   { shuttleAccess: 7,  transfersToStadium: 8, transitSummary: "Near Coliseum LRT station · Short Capital Line ride · Shuttle zone nearby" },
  "commonwealth-stadium__strathcona": { shuttleAccess: 4,  transfersToStadium: 5, transitSummary: "Bus to downtown LRT · 2 transfers, 35+ min · Better for pre/post-match food" },
  "commonwealth-stadium__university": { shuttleAccess: 3,  transfersToStadium: 5, transitSummary: "LRT at University Station → 2 transfers to Commonwealth · ~40 min" },
  "commonwealth-stadium__glenora":    { shuttleAccess: 4,  transfersToStadium: 4, transitSummary: "Bus-dependent area · 2+ transfers · Consider rideshare on match day" },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GtfsStop {
  lat: number;
  lng: number;
}

interface NeighborhoodRow {
  id:                   string;
  name:                 string;
  city_id:              string;
  transit_density:      number;
  shuttle_access:       number;
  transfers_to_stadium: number;
  walk_to_transit:      number;
  overall:              number;
  transit_summary:      string;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Returns a GTFS zip buffer from either a local file path or a remote URL.
 * If the value starts with "file://", or is an absolute path to an existing
 * file, it reads from disk instead of making a network request.
 */
function getGtfsZip(urlOrPath: string): Promise<Buffer> {
  // Strip optional file:// prefix
  const local = urlOrPath.startsWith("file://")
    ? urlOrPath.slice(7)
    : urlOrPath;

  // If the path exists on disk, read it directly
  if (fs.existsSync(local)) {
    return Promise.resolve(fs.readFileSync(local));
  }

  // Otherwise treat it as a remote URL
  return download(urlOrPath);
}

/**
 * Downloads a URL (http or https) and returns the raw buffer.
 * Follows redirects automatically via Node's built-in http/https.
 */
function download(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;

    const req = mod.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(download(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });

    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy(new Error(`Timeout downloading ${url}`));
    });
  });
}

/**
 * Parses a GTFS stops.txt CSV buffer into an array of {lat, lng} objects.
 * Handles varying column orders via the header row.
 */
function parseStopsTxt(buffer: Buffer): GtfsStop[] {
  const text  = buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const latIdx  = headers.indexOf("stop_lat");
  const lngIdx  = headers.indexOf("stop_lon");

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error("stops.txt missing stop_lat or stop_lon columns");
  }

  const stops: GtfsStop[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const lat  = parseFloat(cols[latIdx]);
    const lng  = parseFloat(cols[lngIdx]);
    if (!isNaN(lat) && !isNaN(lng)) {
      stops.push({ lat, lng });
    }
  }

  return stops;
}

/**
 * Ray-casting point-in-polygon test.
 * `point` is [lng, lat]; `ring` is an array of [lng, lat] coordinate pairs.
 */
function pointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Returns the geographic centroid of a polygon ring as [lng, lat].
 */
function centroid(ring: [number, number][]): [number, number] {
  const n   = ring.length;
  let sumX  = 0;
  let sumY  = 0;
  for (const [x, y] of ring) { sumX += x; sumY += y; }
  return [sumX / n, sumY / n];
}

/**
 * Haversine distance in metres between two lat/lng points.
 */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalises a value to 0–10 using a linear scale.
 * Values at or above `max` → 10; at 0 → 0.
 */
function normalise(value: number, max: number): number {
  return Math.min(10, Math.round((value / max) * 100) / 10);
}

/**
 * Converts a walk distance in metres to a 0–10 score.
 * 0 m → 10,  400 m → 0 (linear).
 */
function walkScore(distM: number): number {
  return Math.max(0, Math.round(Math.max(0, (400 - distM) / 40) * 10) / 10);
}

// ─── Core processing ───────────────────────────────────────────────────────────

/**
 * Given a GTFS zip buffer and a GeoJSON FeatureCollection, computes
 * transit_density and walk_to_transit scores for each neighbourhood.
 */
async function computeGtfsScores(
  gtfsZip: Buffer,
  geojson: GeoJSON.FeatureCollection
): Promise<Map<string, { transitDensity: number; walkToTransit: number }>> {
  // Extract and parse stops.txt from the zip
  const zip      = new AdmZip(gtfsZip);
  const entry    = zip.getEntry("stops.txt");
  if (!entry) throw new Error("stops.txt not found in GTFS zip");
  const stops    = parseStopsTxt(entry.getData());

  console.log(`    Parsed ${stops.length} stops from GTFS feed`);

  // For each neighbourhood polygon: count stops inside + find nearest stop distance
  const results = new Map<string, { transitDensity: number; walkToTransit: number }>();
  const stopCounts: number[] = [];

  // First pass: collect raw stop counts so we can normalise by the actual max
  const rawData: Array<{ id: string; count: number; nearestM: number }> = [];

  for (const feature of geojson.features) {
    const id   = feature.id as string;
    const ring = (feature.geometry as GeoJSON.Polygon).coordinates[0] as [number, number][];
    const [cx, cy] = centroid(ring);

    let count    = 0;
    let nearestM = Infinity;

    for (const stop of stops) {
      // Point-in-polygon: GTFS uses (lat, lng), GeoJSON ring uses [lng, lat]
      if (pointInPolygon([stop.lng, stop.lat], ring)) {
        count++;
      }
      const dist = haversineM(cy, cx, stop.lat, stop.lng);
      if (dist < nearestM) nearestM = dist;
    }

    stopCounts.push(count);
    rawData.push({ id, count, nearestM: nearestM === Infinity ? 400 : nearestM });
  }

  // Normalise transitDensity relative to the highest count in this city,
  // using a minimum ceiling of 30 stops so score isn't artificially inflated
  // in areas with few total stops.
  const maxCount = Math.max(...stopCounts, 30);

  for (const { id, count, nearestM } of rawData) {
    results.set(id, {
      transitDensity: normalise(count, maxCount) * 10 / 10, // already 0–10
      walkToTransit:  walkScore(nearestM),
    });
    console.log(`    ${id}: ${count} stops (density ${(normalise(count, maxCount) * 10 / 10).toFixed(1)}) · nearest ${Math.round(nearestM)}m (walk ${walkScore(nearestM).toFixed(1)})`);
  }

  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌍  Seeding neighbourhood transit scores from GTFS…\n");

  const rows: NeighborhoodRow[] = [];

  for (const city of CITIES) {
    console.log(`\n📍  ${city.cityId}`);

    // Load neighbourhood GeoJSON
    const geojsonPath = path.join(__dirname, "..", city.geojsonPath);
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8")) as GeoJSON.FeatureCollection;

    // Load GTFS zip — from disk if a local path is given, otherwise download
    const isLocal = fs.existsSync(city.gtfsUrl.replace(/^file:\/\//, ""));
    console.log(`    ${isLocal ? "Reading" : "Downloading"} GTFS from ${city.gtfsUrl.slice(0, 60)}…`);
    const gtfsZip = await getGtfsZip(city.gtfsUrl);
    console.log(`    Downloaded ${(gtfsZip.length / 1024).toFixed(0)} KB`);

    // Compute GTFS-derived scores
    const gtfsScores = await computeGtfsScores(gtfsZip, geojson);

    // Build final rows
    for (const feature of geojson.features) {
      const id    = feature.id as string;
      const name  = (feature.properties as Record<string, string>).name;
      const key   = `${city.cityId}__${id}`;
      const hand  = HAND_CRAFTED[key];
      const gtfs  = gtfsScores.get(id);

      if (!hand) {
        console.warn(`    ⚠️  No hand-crafted data for ${key} — skipping`);
        continue;
      }
      if (!gtfs) {
        console.warn(`    ⚠️  No GTFS scores for ${id} — skipping`);
        continue;
      }

      const overall = Math.round(
        ((gtfs.transitDensity + hand.shuttleAccess + hand.transfersToStadium + gtfs.walkToTransit) / 4) * 100
      ) / 100;

      rows.push({
        id,
        name,
        city_id:              city.cityId,
        transit_density:      Math.round(gtfs.transitDensity * 100) / 100,
        shuttle_access:       hand.shuttleAccess,
        transfers_to_stadium: hand.transfersToStadium,
        walk_to_transit:      Math.round(gtfs.walkToTransit * 100) / 100,
        overall,
        transit_summary:      hand.transitSummary,
      });
    }
  }

  console.log(`\n⬆️   Upserting ${rows.length} rows to Supabase…`);

  const { error } = await supabase
    .from("neighborhood_scores")
    .upsert(rows, { onConflict: "id,city_id" });

  if (error) {
    console.error("❌  Supabase upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`✅  Done — ${rows.length} neighbourhood scores written to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
