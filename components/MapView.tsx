"use client";

/**
 * MapView.tsx
 *
 * The Mapbox GL map view — rendered after the crossfade from the R3F globe.
 *
 * Responsibilities:
 * - Initialize a dark-themed Mapbox GL map centered on the selected stadium.
 * - Show a gold pin at the stadium location.
 * - Draw a GeoJSON polyline for the currently selected anchor + mode route.
 * - Draw the FIFA shuttle route in a distinct FIFA-gold dashed style.
 * - Show micromobility dock markers (Mobi, BIXI, Lime, Bird), toggleable.
 * - Render the neighbourhood transit-access heatmap fill layer.
 * - Expose `flyTo(coords, zoom)` via an imperative ref.
 *
 * SSR safety: loaded via next/dynamic with ssr:false.
 */

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { RouteResult } from "@/data/types";
import type { ShuttleRoute } from "@/data/shuttles";
import type { MicromobilityDock, MicromobilityProvider } from "@/data/micromobility";
import { PROVIDER_META } from "@/data/micromobility";

// ─── Imperative API exposed to parent ─────────────────────────────────────────
export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

// ─── Source / Layer IDs ────────────────────────────────────────────────────────
const ROUTE_SOURCE_ID       = "active-route";
const ROUTE_LAYER_ID        = "active-route-line";
const STADIUM_SOURCE_ID     = "stadium-pin";
const STADIUM_LAYER_ID      = "stadium-pin-circle";
const SHUTTLE_SOURCE_ID     = "shuttle-route";
const SHUTTLE_LINE_ID       = "shuttle-route-line";
const SHUTTLE_STOPS_ID      = "shuttle-stops";
const SHUTTLE_STOPS_LAYER   = "shuttle-stops-circle";
const NEIGHBORHOOD_SOURCE   = "neighborhood-heatmap";
const NEIGHBORHOOD_FILL     = "neighborhood-fill";
const NEIGHBORHOOD_OUTLINE  = "neighborhood-outline";

const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

/** Color per micromobility provider — kept in sync with PROVIDER_META */
const PROVIDER_COLORS: Record<MicromobilityProvider, string> = {
  mobi: "#007AFF",
  bixi: "#E4003A",
  lime: "#00D13F",
  bird: "#F5C842",
};

interface MapViewProps {
  stadiumLat: number;
  stadiumLng: number;
  stadiumName: string;
  activeRoute: RouteResult | null;
  /** FIFA shuttle route for the current stadium — drawn as a separate layer */
  shuttleRoute?: ShuttleRoute | null;
  /** Micromobility docks to show as markers (filtered to current city) */
  micromobilityDocks?: MicromobilityDock[];
  /** Which providers are currently toggled on */
  activeProviders?: Set<MicromobilityProvider>;
  /** Neighbourhood heatmap GeoJSON — null clears the layer */
  neighborhoodHeatmap?: GeoJSON.FeatureCollection | null;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    stadiumLat,
    stadiumLng,
    stadiumName,
    activeRoute,
    shuttleRoute,
    micromobilityDocks = [],
    activeProviders = new Set(),
    neighborhoodHeatmap,
  },
  ref
) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<mapboxgl.Map | null>(null);
  const markersRef     = useRef<mapboxgl.Marker[]>([]);
  const mapReadyRef    = useRef(false);

  // ── Helper: safely mutate map after style load ──────────────────────────────
  const whenReady = useCallback((fn: (map: mapboxgl.Map) => void) => {
    const map = mapRef.current;
    if (!map) return;
    if (mapReadyRef.current) { fn(map); return; }
    map.once("load", () => fn(map));
  }, []);

  // ── Initialize map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [stadiumLng, stadiumLat],
      zoom: 13,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      mapReadyRef.current = true;

      // ── Satellite desaturation ────────────────────────────────────────────
      map.setPaintProperty("satellite", "raster-saturation", -0.6);
      map.setPaintProperty("satellite", "raster-brightness-max", 0.45);
      map.setPaintProperty("satellite", "raster-contrast", 0.15);

      // ── Stadium pin ───────────────────────────────────────────────────────
      map.addSource(STADIUM_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [stadiumLng, stadiumLat] },
          properties: { name: stadiumName },
        },
      });
      map.addLayer({
        id: STADIUM_LAYER_ID,
        type: "circle",
        source: STADIUM_SOURCE_ID,
        paint: {
          "circle-radius": 10,
          "circle-color": "#D4A017",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#F5C842",
          "circle-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "stadium-label",
        type: "symbol",
        source: STADIUM_SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#F5C842",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });

      // ── Active route (gold polyline) ──────────────────────────────────────
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#F5C842", "line-width": 4, "line-opacity": 0.9 },
      });

      // ── FIFA shuttle route (dashed blue/white) ────────────────────────────
      map.addSource(SHUTTLE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: SHUTTLE_LINE_ID,
        type: "line",
        source: SHUTTLE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#00B4D8",
          "line-width": 5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 1.5],
        },
      });

      // ── Shuttle stops ─────────────────────────────────────────────────────
      map.addSource(SHUTTLE_STOPS_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: SHUTTLE_STOPS_LAYER,
        type: "circle",
        source: SHUTTLE_STOPS_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": "#00B4D8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "white",
          "circle-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "shuttle-stops-label",
        type: "symbol",
        source: SHUTTLE_STOPS_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 1.6],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#00B4D8",
          "text-halo-color": "#000",
          "text-halo-width": 1.5,
        },
      });

      // ── Neighbourhood heatmap (fill layer) ───────────────────────────────
      map.addSource(NEIGHBORHOOD_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer(
        {
          id: NEIGHBORHOOD_FILL,
          type: "fill",
          source: NEIGHBORHOOD_SOURCE,
          paint: {
            "fill-color": [
              "interpolate", ["linear"],
              ["coalesce", ["get", "overall"], 5],
              0,  "rgba(239,68,68,0.45)",
              5,  "rgba(249,115,22,0.45)",
              7,  "rgba(234,179,8,0.45)",
              10, "rgba(34,197,94,0.5)",
            ],
            "fill-opacity": 0.6,
          },
        },
        STADIUM_LAYER_ID  // insert below stadium pin so pin stays visible
      );
      map.addLayer(
        {
          id: NEIGHBORHOOD_OUTLINE,
          type: "line",
          source: NEIGHBORHOOD_SOURCE,
          paint: { "line-color": "rgba(255,255,255,0.15)", "line-width": 1 },
        },
        STADIUM_LAYER_ID
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update active route polyline ─────────────────────────────────────────────
  useEffect(() => {
    whenReady((map) => {
      const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;

      if (activeRoute?.geometry) {
        source.setData({ type: "Feature", geometry: activeRoute.geometry, properties: {} });
        const coords = activeRoute.geometry.coordinates as [number, number][];
        if (coords.length > 1) {
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1200 });
        }
      } else {
        source.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
      }
    });
  }, [activeRoute, whenReady]);

  // ── Update shuttle route + stops ─────────────────────────────────────────────
  useEffect(() => {
    whenReady((map) => {
      const routeSrc = map.getSource(SHUTTLE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      const stopsSrc = map.getSource(SHUTTLE_STOPS_ID)  as mapboxgl.GeoJSONSource | undefined;
      if (!routeSrc || !stopsSrc) return;

      if (shuttleRoute) {
        routeSrc.setData({ type: "Feature", geometry: shuttleRoute.geometry, properties: {} });
        stopsSrc.setData({
          type: "FeatureCollection",
          features: shuttleRoute.stops.map((s) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.coords.lng, s.coords.lat] },
            properties: { name: s.name },
          })),
        });
      } else {
        routeSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
        stopsSrc.setData({ type: "FeatureCollection", features: [] });
      }
    });
  }, [shuttleRoute, whenReady]);

  // ── Update micromobility markers ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add a marker per visible dock
    micromobilityDocks
      .filter((d) => activeProviders.has(d.provider))
      .forEach((dock) => {
        const color = PROVIDER_COLORS[dock.provider];
        const meta  = PROVIDER_META[dock.provider];

        const el = document.createElement("div");
        el.style.cssText = `
          width: 22px; height: 22px; border-radius: 50%;
          background: ${color}; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        `;
        el.textContent = meta.emoji;
        el.title = `${meta.label} — ${dock.name}`;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([dock.coords.lng, dock.coords.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
              `<div style="font-family:sans-serif;font-size:12px;line-height:1.5">
                <strong>${meta.label}</strong><br>
                ${dock.name}<br>
                <span style="color:#666">${meta.pricingHint}</span>
              </div>`
            )
          )
          .addTo(map);

        markersRef.current.push(marker);
      });
  }, [micromobilityDocks, activeProviders]);

  // ── Update neighbourhood heatmap ─────────────────────────────────────────────
  useEffect(() => {
    whenReady((map) => {
      const source = map.getSource(NEIGHBORHOOD_SOURCE) as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(
        neighborhoodHeatmap ?? { type: "FeatureCollection", features: [] }
      );
    });
  }, [neighborhoodHeatmap, whenReady]);

  // ── Imperative flyTo ─────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lng: number, zoom = 13) {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom,
        pitch: 45,
        bearing: -10,
        duration: 1800,
        essential: true,
      });
    },
  }));

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

export default MapView;
