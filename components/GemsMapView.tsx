"use client";

/**
 * GemsMapView.tsx
 *
 * Full-screen Mapbox GL map showing curated "hidden gems" for the selected city.
 * This is a second map mode the user enters from the main map view.
 *
 * Features:
 * - Dark satellite map centered on the selected city
 * - Custom HTML markers for each gem (🍜 food / 👕 jersey)
 * - Click a marker → map flies to it + a popup card appears
 * - Back button to return to main map view
 *
 * SSR safety: must be loaded via next/dynamic with ssr:false
 */

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { HiddenGem, GemCategory, Coords } from "@/data/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

const CATEGORY_EMOJI: Record<GemCategory, string> = {
  food:   "🍜",
  jersey: "👕",
};

const CATEGORY_LABEL: Record<GemCategory, string> = {
  food:   "FOOD SPOT",
  jersey: "JERSEY STORE",
};

const CATEGORY_COLOR: Record<GemCategory, string> = {
  food:   "#4ade80",
  jersey: "#c084fc",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface GemsMapViewProps {
  cityCoords: Coords;
  cityName: string;
  gems: HiddenGem[];
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GemsMapView({ cityCoords, cityName, gems, onBack }: GemsMapViewProps) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<mapboxgl.Map | null>(null);
  const markersRef        = useRef<mapboxgl.Marker[]>([]);
  // Prevents the map canvas click (which clears activeGem) from firing
  // immediately after a marker click (which sets it).
  const skipMapClickRef   = useRef(false);

  // The currently focused gem (shown in popup card)
  const [activeGem, setActiveGem] = useState<HiddenGem | null>(null);

  // ── Initialize map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [cityCoords.lng, cityCoords.lat],
      zoom: 13,
      pitch: 40,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Desaturate to match main map aesthetic
      map.setPaintProperty("satellite", "raster-saturation", -0.6);
      map.setPaintProperty("satellite", "raster-brightness-max", 0.45);
      map.setPaintProperty("satellite", "raster-contrast", 0.15);

      // ── Add a custom HTML marker for each gem ───────────────────────────────
      gems.forEach((gem) => {
        const el = document.createElement("div");
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease;
        `;

        // Emoji pin bubble
        const bubble = document.createElement("div");
        bubble.style.cssText = `
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: ${CATEGORY_COLOR[gem.category]};
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        `;

        const emojiSpan = document.createElement("span");
        emojiSpan.style.cssText = "font-size: 16px; transform: rotate(45deg); display: block;";
        emojiSpan.textContent = CATEGORY_EMOJI[gem.category];
        bubble.appendChild(emojiSpan);

        // Drop shadow pin stem
        const stem = document.createElement("div");
        stem.style.cssText = `
          width: 2px;
          height: 8px;
          background: ${CATEGORY_COLOR[gem.category]};
          opacity: 0.6;
        `;

        el.appendChild(bubble);
        el.appendChild(stem);

        // Hover scale
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

        // Click → fly + show popup.
        // Set the skip flag so the map's canvas click handler (which clears
        // activeGem) ignores the immediately-following synthetic canvas event.
        el.addEventListener("click", () => {
          skipMapClickRef.current = true;
          setActiveGem(gem);
          map.flyTo({
            center: [gem.coords.lng, gem.coords.lat],
            zoom: 16,
            pitch: 50,
            duration: 1200,
            essential: true,
          });
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([gem.coords.lng, gem.coords.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    // Close popup on map click (not on a marker)
    map.on("click", () => {
      if (skipMapClickRef.current) { skipMapClickRef.current = false; return; }
      setActiveGem(null);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      {/* Mapbox canvas */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Atmospheric vignette — matches main map */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(10,11,15,0.7) 75%, rgba(10,11,15,0.92) 100%)",
        }}
      />

      {/* ── Back button ──────────────────────────────────────────────────────── */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "rgba(5, 5, 9, 0.9)",
          border: "1px solid rgba(212, 160, 23, 0.35)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,160,23,0.15)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-gold)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(5, 5, 9, 0.9)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212, 160, 23, 0.35)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 13L5 8l5-5" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 11,
            fontWeight: 800,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--accent-gold)",
          }}
        >
          Back to Map
        </span>
      </button>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 13,
            fontWeight: 900,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.35em",
            color: "var(--accent-gold)",
          }}
        >
          {cityName} — Hidden Gems
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
          <LegendBadge color={CATEGORY_COLOR.food} emoji="🍜" label="Food Spots" />
          <LegendBadge color={CATEGORY_COLOR.jersey} emoji="👕" label="Jersey Stores" />
        </div>
      </div>

      {/* ── Gem popup card ────────────────────────────────────────────────────── */}
      {activeGem && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            width: 360,
            background: "rgba(5, 5, 9, 0.97)",
            border: `1px solid ${CATEGORY_COLOR[activeGem.category]}`,
            borderLeft: `4px solid ${CATEGORY_COLOR[activeGem.category]}`,
            boxShadow: `0 0 40px rgba(0,0,0,0.8), 0 0 20px ${CATEGORY_COLOR[activeGem.category]}33`,
            padding: "14px 16px",
          }}
        >
          {/* Category badge + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{CATEGORY_EMOJI[activeGem.category]}</span>
            <div>
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: CATEGORY_COLOR[activeGem.category],
                  marginBottom: 1,
                }}
              >
                {CATEGORY_LABEL[activeGem.category]}
              </div>
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 15,
                  fontWeight: 900,
                  fontStyle: "italic",
                  color: "white",
                  letterSpacing: "0.02em",
                }}
              >
                {activeGem.name}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); setActiveGem(null); }}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--font-geist-sans)",
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            {activeGem.description}
          </p>

          {/* Local tip */}
          <div
            style={{
              padding: "7px 10px",
              background: "rgba(212, 160, 23, 0.06)",
              borderLeft: "2px solid var(--accent-gold)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--street-font)",
                fontSize: 9,
                fontWeight: 700,
                fontStyle: "italic",
                letterSpacing: "0.2em",
                color: "var(--accent-gold)",
              }}
            >
              LOCAL TIP{" "}
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {activeGem.tip}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend badge sub-component ───────────────────────────────────────────────

function LegendBadge({ color, emoji, label }: { color: string; emoji: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        background: "rgba(5,5,9,0.8)",
        border: `1px solid ${color}55`,
      }}
    >
      <span style={{ fontSize: 11 }}>{emoji}</span>
      <span
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}
