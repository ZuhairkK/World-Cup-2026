"use client";

/**
 * NeighborhoodOverlay.tsx
 *
 * A collapsible side overlay that renders a transit-access heatmap on the
 * Mapbox map. Users adjust factor weights to filter which neighbourhoods
 * rank highest for stadium access.
 *
 * The overlay communicates with MapView via callbacks:
 *   onSetHeatmap(geojson) — sends scored GeoJSON to MapView for the fill layer
 *   onClearHeatmap()      — removes the fill layer
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Local score type (mirrors the Supabase neighborhood_scores table) ─────────
interface NeighborhoodScore {
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

/**
 * Recalculates the overall score given user-adjusted factor weights (0–3 each).
 * Weights are normalised internally so they don't need to sum to any fixed value.
 */
function computeOverall(score: NeighborhoodScore, weights: Weights): number {
  const total =
    weights.transitDensity + weights.shuttleAccess +
    weights.transfersToStadium + weights.walkToTransit;
  if (total === 0) return score.overall;
  return (
    score.transit_density      * weights.transitDensity     +
    score.shuttle_access       * weights.shuttleAccess      +
    score.transfers_to_stadium * weights.transfersToStadium +
    score.walk_to_transit      * weights.walkToTransit
  ) / total;
}

interface Weights {
  transitDensity:     number;
  shuttleAccess:      number;
  transfersToStadium: number;
  walkToTransit:      number;
}

const DEFAULT_WEIGHTS: Weights = {
  transitDensity:     1,
  shuttleAccess:      1,
  transfersToStadium: 1,
  walkToTransit:      1,
};

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  transitDensity:     "Transit density",
  shuttleAccess:      "Shuttle access",
  transfersToStadium: "Direct to stadium",
  walkToTransit:      "Walk to transit",
};

interface NeighborhoodOverlayProps {
  cityId: string;
  /** Called when scored GeoJSON is ready — parent passes to MapView */
  onHeatmapData: (geojson: GeoJSON.FeatureCollection | null) => void;
}

/** Maps an overall score (0–10) to a CSS rgba colour for the legend */
function scoreToColor(score: number, alpha = 0.55): string {
  if (score >= 9)  return `rgba(34,197,94,${alpha})`;   // green
  if (score >= 7)  return `rgba(234,179,8,${alpha})`;   // yellow
  if (score >= 5)  return `rgba(249,115,22,${alpha})`;  // orange
  return               `rgba(239,68,68,${alpha})`;      // red
}

export default function NeighborhoodOverlay({ cityId, onHeatmapData }: NeighborhoodOverlayProps) {
  const [isOpen, setIsOpen]     = useState(false);
  const [weights, setWeights]   = useState<Weights>(DEFAULT_WEIGHTS);
  const [scores, setScores]     = useState<NeighborhoodScore[]>([]);

  // Fetch scores from Supabase whenever the city changes
  useEffect(() => {
    supabase
      .from("neighborhood_scores")
      .select("*")
      .eq("city_id", cityId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch neighborhood scores:", error.message);
          return;
        }
        setScores((data as NeighborhoodScore[]) ?? []);
      });
  }, [cityId]);

  // Rebuild GeoJSON whenever scores or weights change and overlay is open
  const rebuildHeatmap = useCallback(async () => {
    if (!isOpen) {
      onHeatmapData(null);
      return;
    }

    // Map GeoJSON file name from cityId
    const geoFile: Record<string, string> = {
      "bc-place":               "/geodata/vancouver-neighborhoods.json",
      "bmo-field":              "/geodata/toronto-neighborhoods.json",
      "commonwealth-stadium":   "/geodata/edmonton-neighborhoods.json",
    };

    const file = geoFile[cityId];
    if (!file) return;

    try {
      const res  = await fetch(file);
      const base = await res.json() as GeoJSON.FeatureCollection;

      // Merge scores into GeoJSON properties
      const scored: GeoJSON.FeatureCollection = {
        ...base,
        features: base.features.map((feature) => {
          const scoreEntry = scores.find((s) => s.id === feature.id);
          const overall    = scoreEntry ? computeOverall(scoreEntry, weights) : 5;
          return {
            ...feature,
            properties: {
              ...feature.properties,
              overall,
              transitSummary: scoreEntry?.transit_summary ?? "",
            },
          };
        }),
      };

      onHeatmapData(scored);
    } catch {
      onHeatmapData(null);
    }
  }, [isOpen, cityId, scores, weights, onHeatmapData]);

  useEffect(() => { rebuildHeatmap(); }, [rebuildHeatmap]);

  const setWeight = (key: keyof Weights, val: number) =>
    setWeights((prev) => ({ ...prev, [key]: val }));

  // Ranked list for the panel
  const ranked = [...scores]
    .map((s) => ({ ...s, computed: computeOverall(s, weights) }))
    .sort((a, b) => b.computed - a.computed);

  return (
    <div
      style={{
        position: "absolute",
        top: 110,
        left: 20,
        zIndex: 10,
        width: isOpen ? 240 : "auto",
        background: "rgba(5,5,9,0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.6)",
        transition: "width 0.2s ease",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 14 }}>🗺</span>
        {isOpen && (
          <span
            style={{
              fontFamily: "var(--street-font)",
              fontSize: 9,
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--accent-gold)",
            }}
          >
            Where to Stay
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 8,
            color: "rgba(255,255,255,0.3)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease",
          }}
        >
          ▲
        </span>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Filter weight sliders */}
          <p
            style={{
              fontFamily: "var(--street-font)",
              fontSize: 8,
              fontWeight: 700,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.3)",
              margin: "10px 0 8px",
            }}
          >
            Priority Filters
          </p>

          {(Object.keys(DEFAULT_WEIGHTS) as Array<keyof Weights>).map((key) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                  {WEIGHT_LABELS[key]}
                </span>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, color: "var(--accent-gold)" }}>
                  {weights[key]}×
                </span>
              </div>
              <input
                type="range"
                min={0} max={3} step={1}
                value={weights[key]}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-gold)" }}
              />
            </div>
          ))}

          {/* Colour legend */}
          <div style={{ display: "flex", gap: 6, margin: "10px 0 8px", alignItems: "center" }}>
            {[
              { color: scoreToColor(9.5), label: "Best" },
              { color: scoreToColor(7),   label: "Good" },
              { color: scoreToColor(5),   label: "OK" },
              { color: scoreToColor(3),   label: "Poor" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 10, height: 10, background: item.color, border: "1px solid rgba(255,255,255,0.2)" }} />
                <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 8, color: "rgba(255,255,255,0.4)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Ranked neighbourhood list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ranked.map((n, i) => (
              <div
                key={n.id}
                style={{
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `3px solid ${scoreToColor(n.computed, 0.9)}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span
                    style={{
                      fontFamily: "var(--street-font)",
                      fontSize: 10,
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: "white",
                    }}
                  >
                    {i + 1}. {n.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      color: scoreToColor(n.computed, 1),
                    }}
                  >
                    {n.computed.toFixed(1)}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 8, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
                  {n.transit_summary}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
