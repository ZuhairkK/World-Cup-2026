"use client";

/**
 * page.tsx — root page
 *
 * State machine:
 *   globe → [ticket confirmation sheet] → map → gems → map
 *
 * Core focus: get fans to the right stadium via shuttle + transit.
 * Walking is de-prioritised — these venues are not walkable from most origins.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

import Globe from "@/components/Globe";
import TransitionOverlay, { type OverlayPhase } from "@/components/TransitionOverlay";
import GlobeBackButton from "@/components/GlobeBackButton";
import AnchorCarousel from "@/components/AnchorCarousel";
import ModeCards from "@/components/ModeCards";
import MusicPlayer from "@/components/MusicPlayer";
import NeighborhoodOverlay from "@/components/NeighborhoodOverlay";
import TicketConfirmationSheet from "@/components/TicketConfirmationSheet";

import { STADIUMS } from "@/data/stadiums";
import { getHotelsForCity } from "@/data/hotels";
import { getGemsForCity } from "@/data/hiddenGems";
import { getShuttleForStadium } from "@/data/shuttles";
import { getDocksForCity, getProvidersForCity, type MicromobilityProvider } from "@/data/micromobility";
import type { Stadium, Anchor, Mode, RouteResult, RouteCache, Hotel } from "@/data/types";
import type { Match } from "@/data/matches";
import routesData from "@/data/routes.json";
import { type MapViewHandle } from "@/components/MapView";

const routes = routesData as RouteCache;

// SSR-safe Mapbox imports
const MapView     = dynamic(() => import("@/components/MapView"),    { ssr: false });
const GemsMapView = dynamic(() => import("@/components/GemsMapView"), { ssr: false });

type ActiveView = "globe" | "map" | "gems";

export default function Home() {
  const [activeView, setActiveView]         = useState<ActiveView>("globe");
  const [overlayPhase, setOverlayPhase]     = useState<OverlayPhase>("idle");

  // ── Stadium / anchor / mode ────────────────────────────────────────────────
  const [anchorIndex, setAnchorIndex]       = useState(0);
  const [selectedMode, setSelectedMode]     = useState<Mode>("shuttle");
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);

  // ── Hotel mode ─────────────────────────────────────────────────────────────
  const [isHotelMode, setIsHotelMode]       = useState(false);
  const [selectedHotel, setSelectedHotel]   = useState<Hotel | null>(null);
  const [hotelRoutes, setHotelRoutes]       = useState<Partial<Record<Mode, RouteResult | null>>>({});

  // ── Ticket confirmation ────────────────────────────────────────────────────
  const [showTicketSheet, setShowTicketSheet] = useState(false);
  const [pendingStadium, setPendingStadium]   = useState<Stadium | null>(null);
  const [confirmedMatch, setConfirmedMatch]   = useState<Match | null>(null);

  // ── Micromobility provider toggles ────────────────────────────────────────
  const [activeProviders, setActiveProviders] = useState<Set<MicromobilityProvider>>(new Set());

  // ── Neighbourhood heatmap ─────────────────────────────────────────────────
  const [heatmapData, setHeatmapData]         = useState<GeoJSON.FeatureCollection | null>(null);

  const mapRef         = useRef<MapViewHandle>(null);
  const pendingViewRef = useRef<ActiveView>("map");

  // ── Derived data ───────────────────────────────────────────────────────────
  const activeAnchor: Anchor = isHotelMode && selectedHotel
    ? { id: selectedHotel.id, label: selectedHotel.name, type: "hotel", coords: selectedHotel.coords }
    : selectedStadium.anchors[anchorIndex];

  const routeKey    = `${selectedStadium.id}__${activeAnchor.id}__${selectedMode}`;
  const activeRoute: RouteResult | null = isHotelMode
    ? (hotelRoutes[selectedMode] ?? null)
    : ((routes[routeKey] as RouteResult) ?? null);

  const cityHotels  = getHotelsForCity(selectedStadium.id);
  const cityGems    = getGemsForCity(selectedStadium.id);
  const shuttleRoute = getShuttleForStadium(selectedStadium.id);
  const cityDocks   = getDocksForCity(selectedStadium.id);

  // ── Transition helpers ─────────────────────────────────────────────────────
  const transitionTo = useCallback((view: ActiveView) => {
    pendingViewRef.current = view;
    setOverlayPhase("fade-in");
  }, []);

  const handleFadeInComplete = useCallback(() => {
    setActiveView(pendingViewRef.current);
    setOverlayPhase("fade-out");
  }, []);

  const handleFadeOutComplete = useCallback(() => {
    setOverlayPhase("idle");
  }, []);

  // ── Globe → ticket sheet → map ────────────────────────────────────────────
  const handleGlobeStadiumClick = useCallback((stadium: Stadium) => {
    // Reset state for the new stadium
    setAnchorIndex(0);
    setIsHotelMode(false);
    setSelectedHotel(null);
    setHotelRoutes({});
    setConfirmedMatch(null);
    setActiveProviders(new Set());
    setHeatmapData(null);
    // Show ticket confirmation before transitioning to map
    setPendingStadium(stadium);
    setShowTicketSheet(true);
  }, []);

  const handleTicketConfirm = useCallback((match: Match | null) => {
    if (!pendingStadium) return;
    setConfirmedMatch(match);
    setShowTicketSheet(false);
    setSelectedStadium(pendingStadium);
    setSelectedMode("shuttle");  // default to shuttle — not walking
    transitionTo("map");
  }, [pendingStadium, transitionTo]);

  const handleTicketDismiss = useCallback(() => {
    setShowTicketSheet(false);
    setPendingStadium(null);
  }, []);

  // ── Map → Globe ────────────────────────────────────────────────────────────
  const handleBackToGlobe = useCallback(() => {
    setConfirmedMatch(null);
    transitionTo("globe");
  }, [transitionTo]);

  // ── Map ↔ Gems ─────────────────────────────────────────────────────────────
  const handleOpenGems  = useCallback(() => transitionTo("gems"), [transitionTo]);
  const handleBackFromGems = useCallback(() => transitionTo("map"), [transitionTo]);

  // ── Anchor change ──────────────────────────────────────────────────────────
  const handleAnchorChange = useCallback((anchor: Anchor, idx: number) => {
    setAnchorIndex(idx);
    setIsHotelMode(false);
    setSelectedHotel(null);
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
    mapRef.current?.flyTo(
      (hotel.coords.lat + selectedStadium.coords.lat) / 2,
      (hotel.coords.lng + selectedStadium.coords.lng) / 2,
      13
    );
  }, [selectedStadium]);

  // ── Live hotel routing via Google Routes API (server-side proxy) ────────────
  useEffect(() => {
    if (!isHotelMode || !selectedHotel) {
      setHotelRoutes({});
      return;
    }

    let cancelled = false;

    const fetchMode = async (mode: Exclude<Mode, "shuttle">): Promise<RouteResult | null> => {
      try {
        const res = await fetch("/api/hotel-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originLat: selectedHotel.coords.lat,
            originLng: selectedHotel.coords.lng,
            destLat:   selectedStadium.coords.lat,
            destLng:   selectedStadium.coords.lng,
            mode,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { stadiumId: selectedStadium.id, anchorId: selectedHotel.id, mode, ...data };
      } catch {
        return null;
      }
    };

    const ROUTED_MODES = ["transit", "cycling", "walking", "driving"] as const;

    Promise.all(
      ROUTED_MODES.map((m) => fetchMode(m).then((r) => [m, r] as const))
    ).then((results) => {
      if (cancelled) return;
      setHotelRoutes(Object.fromEntries(results));
    });

    return () => { cancelled = true; };
  }, [isHotelMode, selectedHotel, selectedStadium]);

  // ── Provider toggle ────────────────────────────────────────────────────────
  const toggleProvider = useCallback((provider: MicromobilityProvider) => {
    setActiveProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  }, []);

  const cityProviders = getProvidersForCity(selectedStadium.id);
  const { PROVIDER_META } = require("@/data/micromobility");

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>

      {/* ── Globe view ──────────────────────────────────────────────────────── */}
      {activeView === "globe" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Globe onStadiumSelect={handleGlobeStadiumClick} />
        </div>
      )}

      {/* ── Map view ────────────────────────────────────────────────────────── */}
      {activeView === "map" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <MapView
            ref={mapRef}
            stadiumLat={selectedStadium.coords.lat}
            stadiumLng={selectedStadium.coords.lng}
            stadiumName={selectedStadium.name}
            activeRoute={selectedMode === "shuttle" ? null : activeRoute}
            shuttleRoute={selectedMode === "shuttle" ? shuttleRoute : null}
            micromobilityDocks={cityDocks}
            activeProviders={activeProviders}
            neighborhoodHeatmap={heatmapData}
          />

          {/* Vignette fog */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 1,
              background: "radial-gradient(ellipse at center, transparent 35%, rgba(10,11,15,0.7) 75%, rgba(10,11,15,0.92) 100%)",
            }}
          />

          {/* Back to globe */}
          <GlobeBackButton onClick={handleBackToGlobe} />

          {/* Hidden Gems button */}
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
              background: "rgba(5,5,9,0.9)",
              border: "1px solid rgba(74,222,128,0.35)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "rgba(74,222,128,0.1)";
              (e.currentTarget).style.borderColor = "#4ade80";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "rgba(5,5,9,0.9)";
              (e.currentTarget).style.borderColor = "rgba(74,222,128,0.35)";
            }}
          >
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontFamily: "var(--street-font)", fontSize: 10, fontWeight: 800, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.2em", color: "#4ade80" }}>
              Hidden Gems
            </span>
          </button>

          {/* Neighbourhood heatmap overlay */}
          <NeighborhoodOverlay
            cityId={selectedStadium.id}
            onHeatmapData={setHeatmapData}
          />

          {/* Micromobility provider toggles */}
          {cityProviders.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 20,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <p style={{ fontFamily: "var(--street-font)", fontSize: 8, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)", margin: "0 0 2px" }}>
                Bikes & Scooters
              </p>
              {cityProviders.map((provider) => {
                const meta   = PROVIDER_META[provider];
                const active = activeProviders.has(provider);
                return (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      background: active ? `${meta.color}22` : "rgba(5,5,9,0.85)",
                      border: `1px solid ${active ? meta.color : "rgba(255,255,255,0.15)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{meta.emoji}</span>
                    <span style={{ fontFamily: "var(--street-font)", fontSize: 9, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.1em", color: active ? meta.color : "rgba(255,255,255,0.45)" }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* FIFA Soundtrack Player */}
          <MusicPlayer />

          {/* ── HUD panel (bottom-right) ───────────────────────────────────── */}
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
              boxShadow: "0 0 60px rgba(0,0,0,0.8), -4px 0 30px rgba(212,160,23,0.06)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 20px 10px",
                background: "rgba(0,0,0,0.85)",
                borderBottom: "2px solid var(--accent-gold)",
              }}
            >
              {/* Confirmed match badge */}
              {confirmedMatch && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                    padding: "4px 8px",
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                  }}
                >
                  <span style={{ fontSize: 10 }}>✅</span>
                  <span style={{ fontFamily: "var(--font-geist-sans)", fontSize: 9, color: "#4ade80" }}>
                    {confirmedMatch.round} · {confirmedMatch.kickoff}
                  </span>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 8, color: "rgba(74,222,128,0.6)", marginLeft: "auto" }}>
                    {confirmedMatch.id}
                  </span>
                </div>
              )}

              <div style={{ fontFamily: "var(--street-font)", fontSize: 9, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.38em", color: "rgba(245,200,66,0.65)", marginBottom: 2 }}>
                Stadium
              </div>
              <div style={{ fontFamily: "var(--street-font)", fontSize: 22, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1, color: "#F5C842", textShadow: "0 0 24px rgba(245,200,66,0.35)" }}>
                {selectedStadium.name}
              </div>
              <div style={{ fontFamily: "var(--street-font)", fontSize: 10, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                {selectedStadium.city} · Canada
              </div>
            </div>

            {/* Panel content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "18px 20px 22px" }}>

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

              <ModeCards
                stadiumId={selectedStadium.id}
                anchorId={activeAnchor.id}
                selectedMode={selectedMode}
                onModeSelect={setSelectedMode}
                hotelRoutes={isHotelMode ? hotelRoutes : undefined}
                shuttleRoute={shuttleRoute}
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

      {/* ── Ticket confirmation sheet (over globe, before map transition) ──── */}
      {showTicketSheet && pendingStadium && (
        <TicketConfirmationSheet
          stadium={pendingStadium}
          onConfirm={handleTicketConfirm}
          onDismiss={handleTicketDismiss}
        />
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
