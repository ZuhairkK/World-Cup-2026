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
 * - Expose `flyToCity(coords, zoom)` via an imperative ref so carousels can
 *   trigger smooth map transitions on city/anchor change.
 *
 * SSR safety: this component must be loaded via next/dynamic with ssr:false
 * because mapbox-gl accesses window/document at import time.
 */

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { RouteResult } from "@/data/types";

// ─── Imperative API exposed to parent ─────────────────────────────────────────
export interface MapViewHandle {
  /** Smoothly fly the camera to new coordinates */
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROUTE_SOURCE_ID  = "active-route";
const ROUTE_LAYER_ID   = "active-route-line";
const STADIUM_SOURCE_ID = "stadium-pin";
const STADIUM_LAYER_ID  = "stadium-pin-circle";

/** Mapbox style — dark satellite that matches the FIFA Street WT aesthetic */
const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

interface MapViewProps {
  stadiumLat: number;
  stadiumLng: number;
  stadiumName: string;
  /** The currently active route to draw as a polyline (null = no route drawn) */
  activeRoute: RouteResult | null;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { stadiumLat, stadiumLng, stadiumName, activeRoute },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);

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
      // ── Desaturate the satellite raster for a dark, moody look ─────────────
      map.setPaintProperty("satellite", "raster-saturation", -0.6);
      map.setPaintProperty("satellite", "raster-brightness-max", 0.45);
      map.setPaintProperty("satellite", "raster-contrast", 0.15);

      // ── Stadium marker source + layer ────────────────────────────────────────
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

      // ── Stadium label ────────────────────────────────────────────────────────
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

      // ── Route source + layer (empty until a route is selected) ───────────────
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });

      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#F5C842",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize once only

  // ── Update route polyline when activeRoute changes ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    if (activeRoute?.geometry) {
      source.setData({
        type: "Feature",
        geometry: activeRoute.geometry,
        properties: {},
      });

      // Fit the map bounds to show the full route
      const coords = activeRoute.geometry.coordinates as [number, number][];
      if (coords.length > 1) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1200 });
      }
    } else {
      // Clear the route
      source.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
        properties: {},
      });
    }
  }, [activeRoute]);

  // ── Imperative flyTo API ─────────────────────────────────────────────────────
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

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
});

export default MapView;
