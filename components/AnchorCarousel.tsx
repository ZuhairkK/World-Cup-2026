"use client";

import { useState } from "react";
import type { Anchor, Hotel, HotelTier } from "@/data/types";

// ─── Icon/label maps ───────────────────────────────────────────────────────────

const ANCHOR_ICONS: Record<Anchor["type"], string> = {
  "airport":       "✈",
  "city-center":   "⬡",
  "train-station": "⊟",
  "hotel":         "🏨",
};

const ANCHOR_LABELS: Record<Anchor["type"], string> = {
  "airport":       "Airport",
  "city-center":   "City Ctr",
  "train-station": "Train",
  "hotel":         "My Hotel",
};

const TIER_COLORS: Record<HotelTier, string> = {
  budget:  "#4ade80",   // green
  mid:     "var(--accent-gold)",
  luxury:  "#c084fc",   // purple
};

const TIER_LABELS: Record<HotelTier, string> = {
  budget:  "BUDGET",
  mid:     "MID",
  luxury:  "LUXURY",
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AnchorCarouselProps {
  anchors: Anchor[];
  selectedIndex: number;
  onSelect: (anchor: Anchor, index: number) => void;
  // Hotel-specific props
  hotels: Hotel[];
  isHotelMode: boolean;
  selectedHotel: Hotel | null;
  onHotelSelect: (hotel: Hotel) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AnchorCarousel({
  anchors,
  selectedIndex,
  onSelect,
  hotels,
  isHotelMode,
  selectedHotel,
  onHotelSelect,
}: AnchorCarouselProps) {
  // Controls whether the hotel picker sub-panel is open
  const [showHotelPanel, setShowHotelPanel] = useState(false);

  const handleAnchorClick = (anchor: Anchor, i: number) => {
    setShowHotelPanel(false);
    onSelect(anchor, i);
  };

  const handleHotelTabClick = () => {
    setShowHotelPanel((prev) => !prev);
  };

  const handleHotelPick = (hotel: Hotel) => {
    onHotelSelect(hotel);
    setShowHotelPanel(false);
  };

  const hotelTabActive = isHotelMode || showHotelPanel;

  return (
    <div>
      {/* ── Section label — "STARTING FROM" reference match ─────────────────── */}
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
        Starting From
      </p>

      {/* ── Tab buttons (3 anchors + hotel tab) ─────────────────────────────── */}
      <div style={{ display: "flex", gap: 4 }}>

        {/* Regular anchor tabs — reference: bold icon + small label, gold on active */}
        {anchors.map((anchor, i) => {
          const active = !isHotelMode && i === selectedIndex;
          return (
            <button
              key={anchor.id}
              onClick={() => handleAnchorClick(anchor, i)}
              style={{
                flex: 1,
                padding: "10px 4px 8px",
                background: active ? "rgba(245,200,66,0.14)" : "rgba(255,255,255,0.04)",
                border: active
                  ? "2px solid #F5C842"
                  : "2px solid rgba(255,255,255,0.1)",
                borderRadius: 0,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
                borderTop: active ? "3px solid #F5C842" : "3px solid transparent",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 3, lineHeight: 1, color: active ? "#F5C842" : "rgba(255,255,255,0.4)" }}>
                {ANCHOR_ICONS[anchor.type]}
              </div>
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 9,
                  fontWeight: 900,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: active ? "white" : "rgba(255,255,255,0.3)",
                }}
              >
                {ANCHOR_LABELS[anchor.type]}
              </div>
            </button>
          );
        })}

        {/* Hotel tab */}
        <button
          onClick={handleHotelTabClick}
          style={{
            flex: 1,
            padding: "10px 4px 8px",
            background: hotelTabActive ? "rgba(245,200,66,0.14)" : "rgba(255,255,255,0.04)",
            border: hotelTabActive
              ? "2px solid #F5C842"
              : "2px solid rgba(255,255,255,0.1)",
            borderRadius: 0,
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.15s ease",
            position: "relative",
            borderTop: hotelTabActive ? "3px solid #F5C842" : "3px solid transparent",
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 3, lineHeight: 1, color: hotelTabActive ? "#F5C842" : "rgba(255,255,255,0.4)" }}>
            🏨
          </div>
          <div
            style={{
              fontFamily: "var(--street-font)",
              fontSize: 9,
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: hotelTabActive ? "white" : "rgba(255,255,255,0.3)",
            }}
          >
            Hotel
          </div>
          {/* Chevron indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 3,
              right: 5,
              fontSize: 8,
              color: "#F5C842",
              opacity: hotelTabActive ? 1 : 0,
              transition: "opacity 0.15s",
              transform: showHotelPanel ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▲
          </div>
        </button>
      </div>

      {/* ── Hotel picker sub-panel ───────────────────────────────────────────── */}
      {showHotelPanel && (
        <div
          style={{
            marginTop: 8,
            borderTop: "1px solid rgba(212, 160, 23, 0.2)",
            paddingTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p
            style={{
              fontFamily: "var(--street-font)",
              fontSize: 9,
              fontWeight: 700,
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 4,
            }}
          >
            Select Your Hotel
          </p>

          {hotels.length === 0 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-geist-sans)" }}>
              No hotels listed for this city yet.
            </p>
          )}

          {hotels.map((hotel) => {
            const isSelected = selectedHotel?.id === hotel.id;
            const tierColor = TIER_COLORS[hotel.tier];

            return (
              <button
                key={hotel.id}
                onClick={() => handleHotelPick(hotel)}
                style={{
                  width: "100%",
                  background: isSelected ? "rgba(212, 160, 23, 0.1)" : "rgba(255,255,255,0.02)",
                  border: isSelected
                    ? "1px solid var(--accent-gold)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  borderLeft: `3px solid ${isSelected ? "var(--accent-gold)" : tierColor}`,
                }}
              >
                {/* Hotel name + tier badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span
                    style={{
                      fontFamily: "var(--street-font)",
                      fontSize: 11,
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: isSelected ? "var(--accent-gold)" : "white",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {hotel.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--street-font)",
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: tierColor,
                      border: `1px solid ${tierColor}`,
                      padding: "1px 4px",
                    }}
                  >
                    {TIER_LABELS[hotel.tier]}
                  </span>
                </div>

                {/* Price range */}
                <div
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10,
                    color: "var(--accent-gold)",
                    marginBottom: 2,
                  }}
                >
                  {hotel.priceRange}
                </div>

                {/* Efficiency insight */}
                <div
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {hotel.efficiency}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Active hotel summary (shown when hotel is selected + panel closed) ─ */}
      {isHotelMode && selectedHotel && !showHotelPanel && (
        <div
          style={{
            marginTop: 8,
            padding: "7px 10px",
            borderLeft: "3px solid var(--accent-gold)",
            background: "rgba(212, 160, 23, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--street-font)",
                fontSize: 10,
                fontWeight: 800,
                fontStyle: "italic",
                color: "var(--accent-gold)",
                letterSpacing: "0.05em",
              }}
            >
              {selectedHotel.name}
            </div>
            <div style={{ fontFamily: "var(--font-geist-sans)", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {selectedHotel.efficiency}
            </div>
          </div>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 10,
              color: TIER_COLORS[selectedHotel.tier],
            }}
          >
            {selectedHotel.priceRange}
          </span>
        </div>
      )}
    </div>
  );
}
