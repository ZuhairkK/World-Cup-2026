"use client";

import { useState, useCallback, useRef } from "react";
import type { Stadium } from "@/data/types";
import { STADIUMS } from "@/data/stadiums";

interface CityCarouselProps {
  selectedIndex: number;
  onCityChange: (stadium: Stadium, index: number) => void;
}

export default function CityCarousel({ selectedIndex, onCityChange }: CityCarouselProps) {
  const [flipping, setFlipping] = useState(false);
  const dirRef = useRef<"left" | "right">("right");

  const navigate = useCallback(
    (dir: "left" | "right") => {
      if (flipping) return;
      dirRef.current = dir;
      setFlipping(true);

      const next =
        dir === "right"
          ? (selectedIndex + 1) % STADIUMS.length
          : (selectedIndex - 1 + STADIUMS.length) % STADIUMS.length;

      setTimeout(() => {
        onCityChange(STADIUMS[next], next);
      }, 200);

      setTimeout(() => setFlipping(false), 420);
    },
    [flipping, selectedIndex, onCityChange]
  );

  const stadium = STADIUMS[selectedIndex];

  const flipStyle: React.CSSProperties = flipping
    ? {
        transform: `perspective(800px) rotateY(${dirRef.current === "right" ? "90deg" : "-90deg"})`,
        opacity: 0,
      }
    : {
        transform: "perspective(800px) rotateY(0deg)",
        opacity: 1,
      };

  const indexStr = String(selectedIndex + 1).padStart(2, "0");
  const totalStr = String(STADIUMS.length).padStart(2, "0");

  return (
    <div>
      {/* Section label */}
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 10,
          fontWeight: 700,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.3em",
          color: "var(--accent-gold)",
          marginBottom: 10,
        }}
      >
        Stadium
      </p>

      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        {/* LB button */}
        <button
          onClick={() => navigate("left")}
          disabled={flipping}
          style={bumperBtnStyle}
          aria-label="Previous city"
        >
          <span style={{ display: "block", fontSize: 9, letterSpacing: "0.05em" }}>LB</span>
          <span style={{ display: "block", fontSize: 14, lineHeight: 1 }}>◀</span>
        </button>

        {/* Stadium card */}
        <div
          style={{
            flex: 1,
            borderLeft: "3px solid var(--accent-gold)",
            background: "rgba(212, 160, 23, 0.07)",
            transformStyle: "preserve-3d",
            transition: "transform 0.22s ease, opacity 0.22s ease",
            overflow: "hidden",
            ...flipStyle,
          }}
        >
          {/* Top accent strip */}
          <div
            style={{
              height: 3,
              background: "linear-gradient(90deg, var(--accent-gold), transparent)",
            }}
          />
          <div style={{ display: "flex" }}>
            {/* Stadium thumbnail preview */}
            <div
              style={{
                width: 72,
                minHeight: 72,
                flexShrink: 0,
                background: stadium.thumbnailColor ?? "#1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Stadium icon placeholder — replace with real image via <img> */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 12L5 6H19L21 12M3 12V18C3 18.55 3.45 19 4 19H20C20.55 19 21 18.55 21 18V12M3 12H21M7 15H8M16 15H17"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div style={{ flex: 1, padding: "10px 14px 12px" }}>
              {/* Counter + city */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {indexStr} / {totalStr}
                </p>
                <p
                  style={{
                    fontFamily: "var(--street-font)",
                    fontSize: 10,
                    fontWeight: 700,
                    fontStyle: "italic",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {stadium.city} · Canada
                </p>
              </div>

              {/* Stadium name — huge bold italic */}
              <h2
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 26,
                  fontWeight: 900,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  lineHeight: 0.95,
                  color: "white",
                }}
              >
                {stadium.name}
              </h2>

              {/* Progress indicator */}
              <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                {STADIUMS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 3,
                      flex: i === selectedIndex ? 3 : 1,
                      background:
                        i === selectedIndex
                          ? "var(--accent-gold)"
                          : "rgba(255,255,255,0.15)",
                      transition: "flex 0.3s ease, background 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RB button */}
        <button
          onClick={() => navigate("right")}
          disabled={flipping}
          style={bumperBtnStyle}
          aria-label="Next city"
        >
          <span style={{ display: "block", fontSize: 9, letterSpacing: "0.05em" }}>RB</span>
          <span style={{ display: "block", fontSize: 14, lineHeight: 1 }}>▶</span>
        </button>
      </div>
    </div>
  );
}

const bumperBtnStyle: React.CSSProperties = {
  width: 44,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 0,
  color: "rgba(255,255,255,0.55)",
  fontFamily: "var(--font-geist-mono)",
  fontWeight: 700,
  fontSize: 10,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
};
