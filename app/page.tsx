"use client";

/**
 * page.tsx — root page
 *
 * State machine:
 *   globe → map  (ticket confirmation is a toggle panel inside the map)
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
import PlayerShowcase, { type DropPhase } from "@/components/PlayerShowcase";
import PlayerPin from "@/components/PlayerPin";

import { STADIUMS } from "@/data/stadiums";
import { getHotelsForCity } from "@/data/hotels";
import { getShuttleForStadium } from "@/data/shuttles";
import { getDocksForCity, getProvidersForCity, type MicromobilityProvider } from "@/data/micromobility";
import { type PlayerId } from "@/data/players";
import type { Stadium, Anchor, Mode, RouteResult, RouteCache, Hotel } from "@/data/types";
import type { Match } from "@/data/matches";
import type mapboxgl from "mapbox-gl";
import routesData from "@/data/routes.json";
import { type MapViewHandle } from "@/components/MapView";

const routes = routesData as RouteCache;

// SSR-safe Mapbox import
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type ActiveView = "globe" | "map";

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
  const [showTicketPanel, setShowTicketPanel] = useState(false);
  const [confirmedMatch, setConfirmedMatch]   = useState<Match | null>(null);

  // ── Player drop navigation ────────────────────────────────────────────────
  const [selectedPlayer, setSelectedPlayer]       = useState<PlayerId>("messi");
  const [dropPhase, setDropPhase]                 = useState<DropPhase>("idle");
  const [playerOrigin, setPlayerOrigin]           = useState<{ lng: number; lat: number } | null>(null);
  const [playerDest, setPlayerDest]               = useState<{ lng: number; lat: number } | null>(null);
  const [playerHotelRoutes, setPlayerHotelRoutes] = useState<Partial<Record<Mode, RouteResult | null>>>({});
  /** Raw Mapbox map instance — populated via onMapReady callback */
  const mapInstanceRef  = useRef<mapboxgl.Map | null>(null);
  /** Ref on the map wrapper div — used by PlayerShowcase for drop hit-testing */
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
  // Suppress the gold anchor route when the player route is active (cyan layer takes over)
  const activeRoute: RouteResult | null = dropPhase === "ready"
    ? null
    : isHotelMode
      ? (hotelRoutes[selectedMode] ?? null)
      : ((routes[routeKey] as RouteResult) ?? null);

  const cityHotels   = getHotelsForCity(selectedStadium.id);
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

  // ── Globe → map (direct, no intermediate sheet) ───────────────────────────
  const handleGlobeStadiumClick = useCallback((stadium: Stadium) => {
    setAnchorIndex(0);
    setIsHotelMode(false);
    setSelectedHotel(null);
    setHotelRoutes({});
    setConfirmedMatch(null);
    setActiveProviders(new Set());
    setHeatmapData(null);
    setShowTicketPanel(false);
    setSelectedStadium(stadium);
    setSelectedMode("shuttle");
    transitionTo("map");
  }, [transitionTo]);

  // ── Ticket panel (in-map toggle) ───────────────────────────────────────────
  const handleTicketConfirm = useCallback((match: Match | null) => {
    setConfirmedMatch(match);
    setShowTicketPanel(false);
  }, []);

  const handleTicketDismiss = useCallback(() => {
    setShowTicketPanel(false);
  }, []);

  // ── Map → Globe ────────────────────────────────────────────────────────────
  const handleBackToGlobe = useCallback(() => {
    setConfirmedMatch(null);
    // Also clear any active player route
    setDropPhase("idle");
    setPlayerOrigin(null);
    setPlayerDest(null);
    setPlayerHotelRoutes({});
    mapRef.current?.setPlayerRoute(null);
    transitionTo("globe");
  }, [transitionTo]);

  // ── Player route — receive raw map on load ─────────────────────────────────
  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapInstanceRef.current = map;
  }, []);

  // ── Player drop — advances the two-drop state machine ─────────────────────
  const handlePlayerDrop = useCallback(async (lngLat: { lng: number; lat: number }) => {
    if (dropPhase === "idle") {
      setPlayerOrigin(lngLat);
      setDropPhase("awaiting-dest");
    } else if (dropPhase === "awaiting-dest" && playerOrigin) {
      setPlayerDest(lngLat);
      setDropPhase("ready");

      // Fetch all routed modes (no shuttle — player route uses live API)
      const ROUTED_MODES = ["transit", "cycling", "walking", "driving"] as const;
      const origin = playerOrigin;

      const results = await Promise.all(
        ROUTED_MODES.map(async (mode) => {
          try {
            const res = await fetch("/api/hotel-route", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                originLat: origin.lat, originLng: origin.lng,
                destLat:   lngLat.lat, destLng:   lngLat.lng,
                mode,
              }),
            });
            if (!res.ok) return [mode, null] as const;
            const data = await res.json();
            return [mode, { stadiumId: "player", anchorId: "player-dest", mode, ...data }] as const;
          } catch {
            return [mode, null] as const;
          }
        })
      );

      setPlayerHotelRoutes(Object.fromEntries(results));
    }
  }, [dropPhase, playerOrigin]);

  // ── Clear player route ─────────────────────────────────────────────────────
  const handleClearPlayerRoute = useCallback(() => {
    setDropPhase("idle");
    setPlayerOrigin(null);
    setPlayerDest(null);
    setPlayerHotelRoutes({});
    mapRef.current?.setPlayerRoute(null);
  }, []);

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

  // ── Sync player route layer with selected mode ────────────────────────────
  // Runs whenever the player route is ready and the user switches modes.
  useEffect(() => {
    if (dropPhase !== "ready") return;
    const routedMode = selectedMode as Exclude<Mode, "shuttle">;
    const result = playerHotelRoutes[routedMode];
    mapRef.current?.setPlayerRoute(result?.geometry ?? null);
  }, [dropPhase, selectedMode, playerHotelRoutes]);

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
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }}>
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
            onMapReady={handleMapReady}
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

          {/* ── Player showcase + map pins ──────────────────────────────────── */}
          <PlayerShowcase
            map={mapInstanceRef.current}
            mapContainerRef={mapContainerRef}
            dropPhase={dropPhase}
            onDrop={handlePlayerDrop}
            onPlayerSelect={setSelectedPlayer}
          />
          {playerOrigin && mapInstanceRef.current && (
            <PlayerPin
              playerId={selectedPlayer}
              lngLat={playerOrigin}
              map={mapInstanceRef.current}
              label="ORIGIN"
            />
          )}
          {playerDest && mapInstanceRef.current && (
            <PlayerPin
              playerId={selectedPlayer}
              lngLat={playerDest}
              map={mapInstanceRef.current}
              label="DESTINATION"
            />
          )}

          {/* Back to globe */}
          <GlobeBackButton onClick={handleBackToGlobe} />

          {/* Where to Stay — neighbourhood heatmap overlay */}
          <NeighborhoodOverlay
            cityId={selectedStadium.id}
            onHeatmapData={setHeatmapData}
          />

          {/* Micromobility provider toggles — top-right */}
          {cityProviders.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 24,
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

          {/* Ticket confirmation panel — toggleable from HUD header */}
          {showTicketPanel && (
            <TicketConfirmationSheet
              stadium={selectedStadium}
              onConfirm={handleTicketConfirm}
              onDismiss={handleTicketDismiss}
            />
          )}

          {/* FIFA Soundtrack Player */}
          <MusicPlayer />

          {/* ── HUD panel (bottom-right) ───────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              width: 380,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 48px)",
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
              {/* Player route active indicator + clear button */}
              {dropPhase === "ready" && (
                <div
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    gap:            8,
                    marginBottom:   8,
                    padding:        "6px 10px",
                    background:     "rgba(0,229,255,0.07)",
                    border:         "1px solid rgba(0,229,255,0.3)",
                  }}
                >
                  <span style={{ fontSize: 10 }}>🎮</span>
                  <span style={{ fontFamily: "var(--street-font)", fontSize: 8, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.15em", color: "#00E5FF", flex: 1 }}>
                    Player Route Active
                  </span>
                  <button
                    onClick={handleClearPlayerRoute}
                    style={{
                      fontFamily:    "var(--street-font)",
                      fontSize:      7,
                      fontWeight:    700,
                      fontStyle:     "italic",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color:         "rgba(255,255,255,0.4)",
                      background:    "none",
                      border:        "1px solid rgba(255,255,255,0.15)",
                      cursor:        "pointer",
                      padding:       "2px 6px",
                    }}
                  >
                    Clear ✕
                  </button>
                </div>
              )}

              {/* Ticket toggle bar */}
              <button
                onClick={() => setShowTicketPanel((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  padding: "7px 10px",
                  background: showTicketPanel
                    ? "rgba(245,200,66,0.12)"
                    : confirmedMatch
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${showTicketPanel ? "rgba(245,200,66,0.4)" : confirmedMatch ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13 }}>🎫</span>
                <span style={{ fontFamily: "var(--street-font)", fontSize: 9, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.18em", color: confirmedMatch ? "#4ade80" : "rgba(255,255,255,0.55)", flex: 1, textAlign: "left" }}>
                  {confirmedMatch ? `${confirmedMatch.round} · ${confirmedMatch.kickoff}` : "My Ticket"}
                </span>
                {confirmedMatch && (
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 8, color: "rgba(74,222,128,0.5)" }}>
                    {confirmedMatch.id}
                  </span>
                )}
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
                  {showTicketPanel ? "▲" : "▼"}
                </span>
              </button>

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

            {/* Panel content — scrollable so it never overflows the viewport */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 18px 18px", overflowY: "auto" }}>

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
                hotelRoutes={
                  // Player route overrides all other route sources when active
                  dropPhase === "ready"
                    ? playerHotelRoutes
                    : isHotelMode
                      ? hotelRoutes
                      : undefined
                }
                shuttleRoute={
                  // Hide shuttle when player route is active (no shuttle for free-form routes)
                  dropPhase === "ready" ? null : shuttleRoute
                }
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
