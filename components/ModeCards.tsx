"use client";

import type { Mode, RouteCache } from "@/data/types";
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
}

export default function ModeCards({
  stadiumId,
  anchorId,
  selectedMode,
  onModeSelect,
}: ModeCardsProps) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 10,
          fontWeight: 700,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 10,
        }}
      >
        Travel Time
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        {MODES.map((mode) => {
          const key    = `${stadiumId}__${anchorId}__${mode}`;
          const result = routes[key];
          const meta   = MODE_META[mode];
          const active = mode === selectedMode;

          return (
            <button
              key={mode}
              onClick={() => onModeSelect(mode)}
              style={{
                flex: 1,
                padding: "0",
                background: active ? `${meta.color}18` : "rgba(255,255,255,0.03)",
                border: active
                  ? `2px solid ${meta.color}`
                  : "2px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                cursor: "pointer",
                transition: "all 0.2s ease",
                overflow: "hidden",
                textAlign: "center",
                boxShadow: active ? `0 0 16px ${meta.color}30` : "none",
              }}
            >
              {/* Color accent strip */}
              <div
                style={{
                  height: 3,
                  background: active ? meta.color : "transparent",
                  transition: "background 0.2s ease",
                }}
              />
              <div style={{ padding: "10px 4px 12px" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{meta.icon}</div>
                <div
                  style={{
                    fontFamily: "var(--street-font)",
                    fontSize: 9,
                    fontWeight: 700,
                    fontStyle: "italic",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
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
                        fontSize: 26,
                        fontWeight: 900,
                        fontStyle: "italic",
                        lineHeight: 1,
                        color: active ? "white" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {result.durationMin}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9,
                        color: active ? meta.color : "rgba(255,255,255,0.2)",
                        marginTop: 2,
                      }}
                    >
                      min
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9,
                        color: "rgba(255,255,255,0.2)",
                        marginTop: 2,
                      }}
                    >
                      {result.distanceKm} km
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    N/A
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
