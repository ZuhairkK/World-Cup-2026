/**
 * app/api/hotel-route/route.ts
 *
 * Server-side proxy for hotel → stadium routing via Google Routes API v2.
 * Replaces the previous client-side Mapbox Directions call which used
 * `driving-traffic` as a fake transit proxy.
 *
 * POST body: { originLat, originLng, destLat, destLng, mode }
 * Response:  { durationMin, distanceKm, geometry, transitSteps? }
 *
 * Keeping the API key server-side prevents client exposure.
 */

import { NextResponse } from "next/server";
import type { Mode, TransitStep } from "@/data/types";

/** Maps our Mode union to Google Routes API travelMode string */
const GMAPS_MODE: Record<Exclude<Mode, "shuttle">, string> = {
  transit:  "TRANSIT",
  cycling:  "BICYCLE",
  walking:  "WALK",
  driving:  "DRIVE",
};

interface GMapsTransitDetails {
  transitLine?: { name?: string; vehicle?: { type?: string } };
  stopCount?: number;
}

interface GMapsStep {
  travelMode?: string;
  staticDuration?: string;
  transitDetails?: GMapsTransitDetails;
}

interface GMapsLeg { steps?: GMapsStep[] }

interface GMapsRoute {
  duration: string;
  distanceMeters: number;
  polyline?: { encodedPolyline: string };
  legs?: GMapsLeg[];
}

/** Decodes a Google encoded polyline into a GeoJSON LineString */
function decodePolyline(encoded: string): GeoJSON.LineString {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lng / 1e5, lat / 1e5]);
  }

  return { type: "LineString", coordinates: coords };
}

function parseVehicleType(type?: string): TransitStep["mode"] {
  switch ((type ?? "").toUpperCase()) {
    case "BUS": case "INTERCITY_BUS": case "TROLLEYBUS": return "bus";
    case "SUBWAY": case "METRO_RAIL": case "HEAVY_RAIL":  return "subway";
    case "TRAM": case "LIGHT_RAIL": case "MONORAIL":      return "tram";
    case "COMMUTER_TRAIN": case "HIGH_SPEED_TRAIN": case "RAIL": return "rail";
    case "FERRY": return "ferry";
    default: return "bus";
  }
}

function parseTransitSteps(legs: GMapsLeg[]): TransitStep[] {
  const steps: TransitStep[] = [];
  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const durMin = step.staticDuration ? Math.round(parseInt(step.staticDuration, 10) / 60) : 0;
      if (step.travelMode === "TRANSIT" && step.transitDetails) {
        steps.push({
          mode: parseVehicleType(step.transitDetails.transitLine?.vehicle?.type),
          line: step.transitDetails.transitLine?.name,
          stops: step.transitDetails.stopCount,
          durationMin: durMin,
        });
      } else if (step.travelMode === "WALK" && durMin >= 1) {
        const last = steps[steps.length - 1];
        if (last?.mode === "walk") last.durationMin += durMin;
        else steps.push({ mode: "walk", durationMin: durMin });
      }
    }
  }
  return steps;
}

export async function POST(req: Request) {
  const { originLat, originLng, destLat, destLng, mode } = await req.json() as {
    originLat: number;
    originLng: number;
    destLat:   number;
    destLng:   number;
    mode: Exclude<Mode, "shuttle">;
  };

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });
  }

  const transitFieldMask =
    mode === "transit"
      ? ",routes.legs.steps.travelMode,routes.legs.steps.staticDuration,routes.legs.steps.transitDetails"
      : "";

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline${transitFieldMask}`,
    },
    body: JSON.stringify({
      origin:      { location: { latLng: { latitude: originLat, longitude: originLng } } },
      destination: { location: { latLng: { latitude: destLat,   longitude: destLng   } } },
      travelMode:  GMAPS_MODE[mode],
      computeAlternativeRoutes: false,
      polylineQuality: "OVERVIEW",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json() as { routes?: GMapsRoute[] };
  const route = data.routes?.[0];
  if (!route) return NextResponse.json({ error: "No route found" }, { status: 404 });

  const durationMin = Math.round(parseInt(route.duration, 10) / 60);
  const distanceKm  = Math.round((route.distanceMeters / 1000) * 10) / 10;
  const geometry    = route.polyline?.encodedPolyline
    ? decodePolyline(route.polyline.encodedPolyline)
    : null;
  const transitSteps =
    mode === "transit" && route.legs ? parseTransitSteps(route.legs) : undefined;

  return NextResponse.json({ durationMin, distanceKm, geometry, transitSteps });
}
