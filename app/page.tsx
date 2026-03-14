"use client";

/**
 * page.tsx — root page
 *
 * Manages the global state machine:
 *
 *   globe → [zoom + fade-in] → map → [fade-in] → gems → [fade-in] → map
 *                                  ↘ [fade-in] → globe
 *
 * Views:
 *   "globe" — R3F interactive 3D globe (landing)
 *   "map"   — Mapbox routing view with HUD panel, music player
 *   "gems"  — Full-screen hidden gems Mapbox mode
 *
 * Transitions use a pendingViewRef to decouple "what to show next" from
 * the current view, allowing the same TransitionOverlay to handle any
 * view-to-view crossfade.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

import Globe from "@/components/Globe";
import TransitionOverlay, { type OverlayPhase } from "@/components/TransitionOverlay";
import GlobeBackButton from "@/components/GlobeBackButton";
import AnchorCarousel from "@/components/AnchorCarousel";
import ModeCards from "@/components/ModeCards";
import MusicPlayer from "@/components/MusicPlayer";

import { STADIUMS } from "@/data/stadiums";
import { getHotelsForCity } from "@/data/hotels";
import { getGemsForCity } from "@/data/hiddenGems";
import type { Stadium, Anchor, Mode, RouteResult, RouteCache, Hotel } from "@/data/types";
import routesData from "@/data/routes.json";
import { type MapViewHandle } from "@/components/MapView";

const routes = routesData as RouteCache;

// SSR-safe Mapbox imports (both maps access window/document at import time)
const MapView    = dynamic(() => import("@/components/MapView"),    { ssr: false });
const GemsMapView = dynamic(() => import("@/components/GemsMapView"), { ssr: false });

// ─── View state ────────────────────────────────────────────────────────────────
type ActiveView = "globe" | "map" | "gems";

export default function Home() {
  const [activeView, setActiveView]           = useState<ActiveView>("globe");
  const [overlayPhase, setOverlayPhase]       = useState<OverlayPhase>("idle");

  // Stadium / anchor / mode selection
  const [anchorIndex, setAnchorIndex]         = useState(0);
  const [selectedMode, setSelectedMode]       = useState<Mode>("transit");
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);

  // Hotel state — hotel selection replaces the standard anchor
  const [isHotelMode, setIsHotelMode]         = useState(false);
  const [selectedHotel, setSelectedHotel]     = useState<Hotel | null>(null);
  // Live-fetched routes for the selected hotel (one per travel mode)
  const [hotelRoutes, setHotelRoutes]         = useState<Partial<Record<Mode, RouteResult | null>>>({});

  const mapRef         = useRef<MapViewHandle>(null);
  // Stores which view to transition INTO on the next fade-in-complete
  const pendingViewRef = useRef<ActiveView>("map");

  // ── Derived active anchor (hotel or standard) ──────────────────────────────
  // When a hotel is selected, synthesise an Anchor-shaped object from it so
  // the rest of the routing pipeline (route key lookup, MapView) works unchanged.
  const activeAnchor: Anchor = isHotelMode && selectedHotel
    ? { id: selectedHotel.id, label: selectedHotel.name, type: "hotel", coords: selectedHotel.coords }
    : selectedStadium.anchors[anchorIndex];

  const routeKey   = `${selectedStadium.id}__${activeAnchor.id}__${selectedMode}`;
  const activeRoute: RouteResult | null = isHotelMode
    ? (hotelRoutes[selectedMode] ?? null)
    : (routes[routeKey] as RouteResult) ?? null;

  // Hotels and gems for the currently selected city
  const cityHotels = getHotelsForCity(selectedStadium.id);
  const cityGems   = getGemsForCity(selectedStadium.id);

  // ── Transition helpers ─────────────────────────────────────────────────────
  const transitionTo = useCallback((view: ActiveView) => {
    pendingViewRef.current = view;
    setOverlayPhase("fade-in");
  }, []);

  // Fade-in done → swap to the pending view, then fade out
  const handleFadeInComplete = useCallback(() => {
    setActiveView(pendingViewRef.current);
    setOverlayPhase("fade-out");
  }, []);

  // Fade-out done → overlay back to idle
  const handleFadeOutComplete = useCallback(() => {
    setOverlayPhase("idle");
  }, []);

  // ── Globe → Map (stadium selected on globe) ────────────────────────────────
  const handleStadiumSelect = useCallback((stadium: Stadium) => {
    setSelectedStadium(stadium);
    setAnchorIndex(0);
    setIsHotelMode(false);
    setSelectedHotel(null);
    setHotelRoutes({});
    transitionTo("map");
  }, [transitionTo]);

  // ── Map → Globe (back button) ──────────────────────────────────────────────
  const handleBackToGlobe = useCallback(() => {
    transitionTo("globe");
  }, [transitionTo]);

  // ── Map → Gems (hidden gems button) ───────────────────────────────────────
  const handleOpenGems = useCallback(() => {
    transitionTo("gems");
  }, [transitionTo]);

  // ── Gems → Map (back button inside gems) ──────────────────────────────────
  const handleBackFromGems = useCallback(() => {
    transitionTo("map");
  }, [transitionTo]);

  // ── Anchor carousel change ─────────────────────────────────────────────────
  const handleAnchorChange = useCallback((anchor: Anchor, idx: number) => {
    setAnchorIndex(idx);
    setIsHotelMode(false);
    setSelectedHotel(null);
    // Fly to show both anchor and stadium
    mapRef.current?.flyTo(
      (anchor.coords.lat + selectedStadium.coords.lat) / 2,
      (anchor.coords.lng + selectedStadium.coords.lng) / 2,
      11
    );
  }, [selectedStadium]);

  // ── Hotel selection ────────────────────────────────────────────────────────
  const handleHotelSelect = useCallback((hotel: Hotel) => {
    setIsHotelMode(true);
    setSelectedHotel(hotel);
    setHotelRoutes({});
    // Fly map to show hotel location relative to stadium
    mapRef.current?.flyTo(
      (hotel.coords.lat + selectedStadium.coords.lat) / 2,
      (hotel.coords.lng + selectedStadium.coords.lng) / 2,
      13
    );
  }, [selectedStadium]);

  // ── Fetch live routes for selected hotel from Mapbox Directions API ─────────
  useEffect(() => {
    if (!isHotelMode || !selectedHotel) {
      setHotelRoutes({});
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    const { lat: hLat, lng: hLng } = selectedHotel.coords;
    const { lat: sLat, lng: sLng } = selectedStadium.coords;
    const coords = `${hLng},${hLat};${sLng},${sLat}`;

    // Mapbox profile per mode (no native transit API — use driving as approximation)
    const profileMap: Record<Mode, string> = {
      transit:  "driving-traffic",
      driving:  "driving-traffic",
      cycling:  "cycling",
      walking:  "walking",
    };

    let cancelled = false;

    const fetchRoute = async (mode: Mode): Promise<RouteResult | null> => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profileMap[mode]}/${coords}` +
          `?geometries=geojson&access_token=${token}`
        );
        const data = await res.json();
        const r = data.routes?.[0];
        if (!r) return null;
        return {
          stadiumId:   selectedStadium.id,
          anchorId:    selectedHotel.id,
          mode,
          durationMin: Math.round(r.duration / 60),
          distanceKm:  Math.round(r.distance / 100) / 10,
          geometry:    r.geometry,
        };
      } catch {
        return null;
      }
    };

    const MODES: Mode[] = ["transit", "cycling", "walking", "driving"];
    Promise.all(MODES.map((m) => fetchRoute(m).then((r) => [m, r] as const))).then(
      (results) => {
        if (cancelled) return;
        setHotelRoutes(Object.fromEntries(results));
      }
    );

    return () => { cancelled = true; };
  }, [isHotelMode, selectedHotel, selectedStadium]);

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

          {/* Atmospheric fog vignette */}
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

          {/* ── Hidden Gems floating button ────────────────────────────────── */}
          <button
            onClick={handleOpenGems}
            style={{
              position: "absolute",
              top: 70,
              left: 20,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              background: "rgba(5, 5, 9, 0.9)",
              border: "1px solid rgba(74, 222, 128, 0.35)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(74,222,128,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#4ade80";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(5, 5, 9, 0.9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(74, 222, 128, 0.35)";
            }}
          >
            <span style={{ fontSize: 14 }}>📍</span>
            <span
              style={{
                fontFamily: "var(--street-font)",
                fontSize: 10,
                fontWeight: 800,
                fontStyle: "italic",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#4ade80",
              }}
            >
              Hidden Gems
            </span>
          </button>

          {/* ── FIFA Soundtrack Player (bottom-left) ─────────────────────── */}
          <MusicPlayer />

          {/* ── FIFA Street WT HUD panel (bottom-right) ─────────────────────── */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              width: 400,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              background: "var(--street-panel-bg)",
              borderLeft: "3px solid var(--accent-gold)",
              boxShadow: "0 0 60px rgba(0,0,0,0.8), -4px 0 30px rgba(212, 160, 23, 0.06)",
            }}
          >
            {/* ── Header strip — exact FIFA Street "STADIUM: [NAME]" match ──── */}
            {/* Reference: fifa_street_stadium_transport_details.png top-right bar */}
            <div
              style={{
                padding: "12px 20px 10px",
                background: "rgba(0,0,0,0.85)",
                borderBottom: "2px solid var(--accent-gold)",
              }}
            >
              {/* "STADIUM:" label — small caps hint */}
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 9,
                  fontWeight: 700,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.38em",
                  color: "rgba(245,200,66,0.65)",
                  marginBottom: 2,
                }}
              >
                Stadium
              </div>
              {/* Stadium name — large bold yellow, dominant */}
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 22,
                  fontWeight: 900,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  color: "#F5C842",
                  textShadow: "0 0 24px rgba(245,200,66,0.35)",
                }}
              >
                {selectedStadium.name}
              </div>
              {/* City sub-label */}
              <div
                style={{
                  fontFamily: "var(--street-font)",
                  fontSize: 10,
                  fontWeight: 700,
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 3,
                }}
              >
                {selectedStadium.city} · Canada
              </div>
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
              {/* Nested tier — anchor + hotel selector */}
              <AnchorCarousel
                anchors={selectedStadium.anchors}
                selectedIndex={anchorIndex}
                onSelect={handleAnchorChange}
                hotels={cityHotels}
                isHotelMode={isHotelMode}
                selectedHotel={selectedHotel}
                onHotelSelect={handleHotelSelect}
              />

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Mode comparison cards */}
              <ModeCards
                stadiumId={selectedStadium.id}
                anchorId={activeAnchor.id}
                selectedMode={selectedMode}
                onModeSelect={setSelectedMode}
                hotelRoutes={isHotelMode ? hotelRoutes : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Gems view ───────────────────────────────────────────────────────── */}
      {activeView === "gems" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <GemsMapView
            cityCoords={selectedStadium.coords}
            cityName={selectedStadium.city}
            gems={cityGems}
            onBack={handleBackFromGems}
          />
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
