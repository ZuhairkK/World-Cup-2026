"use client";

import type { Mode, RouteCache, RouteResult, TransitStep } from "@/data/types";
import type { ShuttleRoute } from "@/data/shuttles";
import routesData from "@/data/routes.json";

const routes = routesData as RouteCache;

const MODE_META: Record<Mode, { label: string; icon: string; color: string }> = {
  transit:  { label: "Transit",  icon: "🚌", color: "#3B82F6" },
  cycling:  { label: "Cycling",  icon: "🚲", color: "#00C864" },
  walking:  { label: "Walking",  icon: "🚶", color: "#A78BFA" },
  driving:  { label: "Driving",  icon: "🚗", color: "#E07B00" },
  shuttle:  { label: "Shuttle",  icon: "🚐", color: "#F5C842" },
};

// Modes in priority order — shuttle + transit first, walking last
// Walking is shown but flagged when distance > WALK_IMPRACTICAL_KM
const ROUTED_MODES: Mode[] = ["transit", "cycling", "driving", "walking"];

/** Beyond this distance, walking to the stadium is flagged as impractical */
const WALK_IMPRACTICAL_KM = 1.5;

/** Icon per transit step vehicle type */
const STEP_ICON: Record<TransitStep["mode"], string> = {
  walk:   "🚶",
  bus:    "🚌",
  subway: "🚇",
  tram:   "🚊",
  rail:   "🚆",
  ferry:  "⛴",
};

interface ModeCardsProps {
  stadiumId: string;
  anchorId: string;
  selectedMode: Mode;
  onModeSelect: (mode: Mode) => void;
  /** Live-fetched routes for a selected hotel (overrides static cache) */
  hotelRoutes?: Partial<Record<Mode, RouteResult | null>>;
  /** FIFA shuttle route for the current stadium (null = no shuttle) */
  shuttleRoute?: ShuttleRoute | null;
}

export default function ModeCards({
  stadiumId,
  anchorId,
  selectedMode,
  onModeSelect,
  hotelRoutes,
  shuttleRoute,
}: ModeCardsProps) {
  // Shuttle first, then transit/cycling/driving, walking last
  const allModes: Mode[] = ["shuttle", ...ROUTED_MODES];

  return (
    <div>
      {/* "TRAVEL TIME" label */}
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

      {/* 3 × 2 grid — transit/cycling/walking/driving + shuttle (spans 2 cols if last) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {allModes.map((mode, idx) => {
          const meta   = MODE_META[mode];
          const active = mode === selectedMode;

          // ── Resolve route data by mode type ─────────────────────────────────
          let result: RouteResult | null = null;
          if (mode === "shuttle") {
            // Shuttle uses its own data file, not routes.json
            if (shuttleRoute) {
              result = {
                stadiumId,
                anchorId: "shuttle",
                mode: "shuttle",
                durationMin: shuttleRoute.durationMin,
                distanceKm:  0,   // shuttle distance not meaningful to show
                geometry:    shuttleRoute.geometry,
              };
            }
          } else {
            const key = `${stadiumId}__${anchorId}__${mode}`;
            result = hotelRoutes ? (hotelRoutes[mode] ?? null) : ((routes[key] as RouteResult) ?? null);
          }

          // Transit steps from the result (populated for transit mode only)
          const transitSteps: TransitStep[] | undefined =
            mode === "transit" && result ? (result as RouteResult & { transitSteps?: TransitStep[] }).transitSteps : undefined;

          // Walking is flagged as impractical when distance > threshold
          const isWalkImpractical =
            mode === "walking" && result && result.distanceKm > WALK_IMPRACTICAL_KM;

          // Shuttle card spans 2 columns (first item, full width)
          const isShuttle    = mode === "shuttle";
          const colSpanStyle = isShuttle && idx === 0
            ? { gridColumn: "1 / -1" as const }
            : {};

          return (
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
                ...colSpanStyle,
              }}
            >
              {/* Top colour accent strip */}
              <div
                style={{
                  height: 4,
                  background: active ? meta.color : "rgba(255,255,255,0.07)",
                  transition: "background 0.2s ease",
                }}
              />
              <div style={{ padding: isShuttle ? "8px 12px" : "10px 6px 12px" }}>

                {isShuttle ? (
                  /* ── Shuttle card — horizontal layout since it spans full width ── */
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🚐</span>
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontFamily: "var(--street-font)",
                            fontSize: 9,
                            fontWeight: 900,
                            fontStyle: "italic",
                            textTransform: "uppercase",
                            letterSpacing: "0.16em",
                            color: active ? meta.color : "rgba(255,255,255,0.3)",
                          }}
                        >
                          FIFA Official Shuttle
                        </div>
                        {shuttleRoute && (
                          <div style={{ fontFamily: "var(--font-geist-sans)", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                            {shuttleRoute.operatingHours}
                          </div>
                        )}
                      </div>
                    </div>
                    {result ? (
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "var(--street-font)",
                            fontSize: 28,
                            fontWeight: 900,
                            fontStyle: "italic",
                            color: active ? "white" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {result.durationMin}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--street-font)",
                            fontSize: 9,
                            fontWeight: 700,
                            fontStyle: "italic",
                            textTransform: "uppercase",
                            color: active ? meta.color : "rgba(255,255,255,0.22)",
                            marginLeft: 3,
                          }}
                        >
                          MIN
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontFamily: "var(--font-geist-sans)", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        Schedule TBA
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Standard mode card — vertical layout ── */
                  <>
                    <div style={{ fontSize: 20, marginBottom: 4, lineHeight: 1 }}>{meta.icon}</div>
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

                        {/* Walking impractical warning — stadium not walkable from here */}
                        {isWalkImpractical && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: "3px 5px",
                              background: "rgba(239,68,68,0.15)",
                              border: "1px solid rgba(239,68,68,0.4)",
                              fontFamily: "var(--font-geist-sans)",
                              fontSize: 8,
                              color: "#f87171",
                              lineHeight: 1.3,
                            }}
                          >
                            ⚠ Not recommended — use transit or shuttle
                          </div>
                        )}

                        {/* Transit step breakdown — only for transit mode, active card */}
                        {mode === "transit" && active && transitSteps && transitSteps.length > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 6,
                              borderTop: "1px solid rgba(59,130,246,0.25)",
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 3,
                            }}
                          >
                            {transitSteps.map((step, i) => (
                              <span key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <span style={{ fontSize: 10 }}>{STEP_ICON[step.mode]}</span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-geist-mono)",
                                    fontSize: 8,
                                    color: "rgba(255,255,255,0.55)",
                                  }}
                                >
                                  {step.line
                                    ? `${step.line}${step.stops ? ` ×${step.stops}` : ""}`
                                    : `${step.durationMin}m`}
                                </span>
                                {i < transitSteps.length - 1 && (
                                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>›</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
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
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
