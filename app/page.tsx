"use client";

/**
 * page.tsx — root page
 *
 * Manages the global state machine:
 *
 *   globe → [zoom + fade-in] → map → [fade-in + fade-out] → globe
 *
 * State:
 *   activeView       — which canvas is currently visible
 *   selectedStadium  — which stadium the user clicked
 *   overlayPhase     — drives the TransitionOverlay component
 *
 * The Mapbox map, carousels, and mode cards are all in the map view.
 * The R3F globe is the landing view.
 */

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

import Globe from "@/components/Globe";
import TransitionOverlay, { type OverlayPhase } from "@/components/TransitionOverlay";
import GlobeBackButton from "@/components/GlobeBackButton";
import CityCarousel from "@/components/CityCarousel";
import AnchorCarousel from "@/components/AnchorCarousel";
import ModeCards from "@/components/ModeCards";

import { STADIUMS } from "@/data/stadiums";
import type { Stadium, Anchor, Mode, RouteResult, RouteCache } from "@/data/types";
import routesData from "@/data/routes.json";
import { type MapViewHandle } from "@/components/MapView";

const routes = routesData as RouteCache;

// SSR-safe Mapbox import
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─── View state ────────────────────────────────────────────────────────────────
type ActiveView = "globe" | "map";

export default function Home() {
  const [activeView, setActiveView]           = useState<ActiveView>("globe");
  const [overlayPhase, setOverlayPhase]       = useState<OverlayPhase>("idle");

  // Stadium / anchor / mode selection
  const [cityIndex, setCityIndex]             = useState(0);
  const [anchorIndex, setAnchorIndex]         = useState(0);
  const [selectedMode, setSelectedMode]       = useState<Mode>("transit");
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);

  const mapRef = useRef<MapViewHandle>(null);

  // ── Derived active route ───────────────────────────────────────────────────
  const activeAnchor: Anchor = selectedStadium.anchors[anchorIndex];
  const routeKey = `${selectedStadium.id}__${activeAnchor.id}__${selectedMode}`;
  const activeRoute: RouteResult | null = (routes[routeKey] as RouteResult) ?? null;

  // ── Globe → Map transition ─────────────────────────────────────────────────
  // Called by Globe when camera zoom-in completes
  const handleStadiumSelect = useCallback((stadium: Stadium) => {
    setSelectedStadium(stadium);

    // Find the index of this stadium so carousels are in sync
    const idx = STADIUMS.findIndex((s) => s.id === stadium.id);
    if (idx !== -1) {
      setCityIndex(idx);
      setAnchorIndex(0);
    }

    // Begin forward crossfade: fade to black, then mount map
    setOverlayPhase("fade-in");
  }, []);

  // Fade-in done → swap to map view, then fade out
  const handleFadeInComplete = useCallback(() => {
    if (activeView === "globe") {
      setActiveView("map");
    } else {
      setActiveView("globe");
    }
    setOverlayPhase("fade-out");
  }, [activeView]);

  // Fade-out done → overlay back to idle
  const handleFadeOutComplete = useCallback(() => {
    setOverlayPhase("idle");
  }, []);

  // ── Map → Globe transition (back button) ───────────────────────────────────
  const handleBackToGlobe = useCallback(() => {
    setOverlayPhase("fade-in");
  }, []);

  // ── City carousel change ───────────────────────────────────────────────────
  const handleCityChange = useCallback((stadium: Stadium, idx: number) => {
    setSelectedStadium(stadium);
    setCityIndex(idx);
    setAnchorIndex(0);      // reset anchor when city changes
    setSelectedMode("transit");

    // Fly the map to the new stadium
    mapRef.current?.flyTo(stadium.coords.lat, stadium.coords.lng, 13);
  }, []);

  // ── Anchor carousel change ─────────────────────────────────────────────────
  const handleAnchorChange = useCallback((anchor: Anchor, idx: number) => {
    setAnchorIndex(idx);

    // Fly to show both anchor and stadium
    mapRef.current?.flyTo(
      (anchor.coords.lat + selectedStadium.coords.lat) / 2,
      (anchor.coords.lng + selectedStadium.coords.lng) / 2,
      11
    );
  }, [selectedStadium]);

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>

      {/* ── Globe view ──────────────────────────────────────────────────────── */}
      {activeView === "globe" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Globe onStadiumSelect={handleStadiumSelect} />
        </div>
      )}

      {/* ── Map view ────────────────────────────────────────────────────────── */}
      {activeView === "map" && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Mapbox canvas fills the screen */}
          <MapView
            ref={mapRef}
            stadiumLat={selectedStadium.coords.lat}
            stadiumLng={selectedStadium.coords.lng}
            stadiumName={selectedStadium.name}
            activeRoute={activeRoute}
          />

          {/* Atmospheric fog vignette — mimics FIFA Street WT map edge fog */}
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

          {/* Back to globe */}
          <GlobeBackButton onClick={handleBackToGlobe} />

          {/* ── FIFA Street WT HUD panel (bottom-right) ─────────────────────── */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              width: 400,
              display: "flex",
              flexDirection: "column",
              background: "var(--street-panel-bg)",
              borderLeft: "3px solid var(--accent-gold)",
              boxShadow: "0 0 60px rgba(0,0,0,0.8), -4px 0 30px rgba(212, 160, 23, 0.06)",
            }}
          >
            {/* Header strip */}
            <div
              style={{
                padding: "10px 20px 8px",
                background: "var(--panel-header-bg)",
                borderBottom: "1px solid rgba(212, 160, 23, 0.18)",
                display: "flex",
                alignItems: "baseline",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 11,
                  fontWeight: 900,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                  color: "var(--accent-gold)",
                }}
              >
                FIFA World Cup 2026
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.1em",
                }}
              >
                · CANADA
              </span>
            </div>

            {/* Panel content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "18px 20px 22px",
              }}
            >
              {/* Top tier — city/stadium selector */}
              <CityCarousel
                selectedIndex={cityIndex}
                onCityChange={handleCityChange}
              />

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Nested tier — anchor selector */}
              <AnchorCarousel
                anchors={selectedStadium.anchors}
                selectedIndex={anchorIndex}
                onSelect={handleAnchorChange}
              />

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Mode comparison cards */}
              <ModeCards
                stadiumId={selectedStadium.id}
                anchorId={activeAnchor.id}
                selectedMode={selectedMode}
                onModeSelect={setSelectedMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Crossfade overlay ────────────────────────────────────────────────── */}
      <TransitionOverlay
        phase={overlayPhase}
        onFadeInComplete={handleFadeInComplete}
        onFadeOutComplete={handleFadeOutComplete}
        duration={480}
      />
    </main>
  );
}
