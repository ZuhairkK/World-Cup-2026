"use client";

import type { Anchor } from "@/data/types";

const ANCHOR_ICONS: Record<Anchor["type"], string> = {
  "airport":       "✈",
  "city-center":   "⬡",
  "train-station": "⊟",
};

const ANCHOR_LABELS: Record<Anchor["type"], string> = {
  "airport":       "Airport",
  "city-center":   "City Ctr",
  "train-station": "Train",
};

interface AnchorCarouselProps {
  anchors: Anchor[];
  selectedIndex: number;
  onSelect: (anchor: Anchor, index: number) => void;
}

export default function AnchorCarousel({
  anchors,
  selectedIndex,
  onSelect,
}: AnchorCarouselProps) {
  return (
    <div>
      {/* Label */}
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
        Starting From
      </p>

      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        {anchors.map((anchor, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={anchor.id}
              onClick={() => onSelect(anchor, i)}
              style={{
                flex: 1,
                padding: "10px 6px 10px",
                background: active ? "rgba(212, 160, 23, 0.12)" : "rgba(255,255,255,0.03)",
                border: active
                  ? "2px solid var(--accent-gold)"
                  : "2px solid rgba(255,255,255,0.1)",
                borderRadius: 0,
                borderTop: active ? "2px solid var(--accent-gold)" : "2px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  marginBottom: 4,
                  color: active ? "var(--accent-gold)" : "rgba(255,255,255,0.4)",
                }}
              >
                {ANCHOR_ICONS[anchor.type]}
              </div>
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 10,
                  fontWeight: 700,
                  fontStyle: active ? "italic" : "normal",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: active ? "white" : "rgba(255,255,255,0.35)",
                }}
              >
                {ANCHOR_LABELS[anchor.type]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
