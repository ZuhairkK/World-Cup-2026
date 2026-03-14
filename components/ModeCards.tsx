"use client";

import type { Mode, RouteCache, RouteResult } from "@/data/types";
import routesData from "@/data/routes.json";

const routes = routesData as RouteCache;

const MODE_META: Record<Mode, { label: string; icon: string; color: string }> = {
  transit:  { label: "Transit",  icon: "🚌", color: "#3B82F6" },
  cycling:  { label: "Cycling",  icon: "🚲", color: "#00C864" },
  walking:  { label: "Walking",  icon: "🚶", color: "#A78BFA" },
  driving:  { label: "Driving",  icon: "🚗", color: "#E07B00" },
};

const MODES: Mode[] = ["transit", "cycling", "walking", "driving"];

interface ModeCardsProps {
  stadiumId: string;
  anchorId: string;
  selectedMode: Mode;
  onModeSelect: (mode: Mode) => void;
  /** When a hotel is selected, pass live-fetched routes to override the static cache */
  hotelRoutes?: Partial<Record<Mode, RouteResult | null>>;
}

export default function ModeCards({
  stadiumId,
  anchorId,
  selectedMode,
  onModeSelect,
  hotelRoutes,
}: ModeCardsProps) {
  return (
    <div>
      {/* "TRAVEL TIME" label — reference match */}
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 9,
          fontWeight: 900,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.38em",
          color: "rgba(255,255,255,0.55)",
          marginBottom: 8,
        }}
      >
        Travel Time
      </p>
      {/* 2 × 2 grid — reference: TRANSIT/CYCLING top row, WALKING/DRIVING bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {MODES.map((mode) => {
          const key    = `${stadiumId}__${anchorId}__${mode}`;
          const result = hotelRoutes ? hotelRoutes[mode] ?? null : routes[key];
          const meta   = MODE_META[mode];
          const active = mode === selectedMode;

          return (
            // ── Mode card — reference: top colour strip, icon, large number, MIN label ──
            <button
              key={mode}
              onClick={() => onModeSelect(mode)}
              style={{
                padding: 0,
                background: active ? `${meta.color}18` : "rgba(255,255,255,0.03)",
                border: active
                  ? `2px solid ${meta.color}`
                  : "2px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                cursor: "pointer",
                transition: "all 0.2s ease",
                overflow: "hidden",
                textAlign: "center",
                boxShadow: active ? `0 0 18px ${meta.color}35` : "none",
              }}
            >
              {/* Top colour accent strip — prominent when active */}
              <div
                style={{
                  height: 4,
                  background: active ? meta.color : "rgba(255,255,255,0.07)",
                  transition: "background 0.2s ease",
                }}
              />
              <div style={{ padding: "10px 6px 12px" }}>
                {/* Mode icon */}
                <div style={{ fontSize: 20, marginBottom: 4, lineHeight: 1 }}>
                  {meta.icon}
                </div>
                {/* Mode label */}
                <div
                  style={{
                    fontFamily: "var(--street-font)",
                    fontSize: 9,
                    fontWeight: 900,
                    fontStyle: "italic",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: active ? meta.color : "rgba(255,255,255,0.3)",
                    marginBottom: 6,
                  }}
                >
                  {meta.label}
                </div>
                {result ? (
                  <>
                    {/* Large bold time number — dominant element per reference */}
                    <div
                      style={{
                        fontFamily: "var(--street-font)",
                        fontSize: 32,
                        fontWeight: 900,
                        fontStyle: "italic",
                        lineHeight: 0.95,
                        color: active ? "white" : "rgba(255,255,255,0.55)",
                        textShadow: active ? `0 0 20px ${meta.color}55` : "none",
                      }}
                    >
                      {result.durationMin}
                    </div>
                    {/* MIN label */}
                    <div
                      style={{
                        fontFamily: "var(--street-font)",
                        fontSize: 9,
                        fontWeight: 700,
                        fontStyle: "italic",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: active ? meta.color : "rgba(255,255,255,0.22)",
                        marginTop: 3,
                      }}
                    >
                      MIN
                    </div>
                    {/* Distance — subtle secondary info */}
                    <div
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9,
                        color: "rgba(255,255,255,0.18)",
                        marginTop: 2,
                      }}
                    >
                      {result.distanceKm} km
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: "var(--street-font)",
                      fontSize: 22,
                      fontWeight: 900,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    —
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
