"use client";

/**
 * PlayerShowcase.tsx
 *
 * Tekken-style player selection panel rendered over the Mapbox map.
 * Shows three player slots in a horizontal row — the center one is selected
 * (full colour, larger canvas, name visible) and the adjacent two are dimmed.
 * Left / right arrow buttons cycle the selection.
 *
 * Drag mechanic (one motion):
 *   1. pointerdown on the selected card → pointer captured, ghost appears
 *   2. pointermove → ghost follows cursor across the map
 *   3. pointerup over the map → map.unproject(pixel) → onDrop({ lng, lat })
 *
 * The parent controls the drop phase; this component only fires onDrop and
 * reports the new selectedPlayer via onPlayerSelect.
 */

import { useState, useRef, useCallback, useEffect, useMemo, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Bounds, Environment } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type mapboxgl from "mapbox-gl";

import { PLAYERS, type PlayerId } from "@/data/players";

// ─── Drop phase labels / colours ─────────────────────────────────────────────

export type DropPhase = "idle" | "awaiting-dest" | "ready";

const PHASE_LABEL: Record<DropPhase, string> = {
  "idle":          "↓ Drag to set origin",
  "awaiting-dest": "↓ Drag to set destination",
  "ready":         "Route active ✓",
};

const PHASE_COLOR: Record<DropPhase, string> = {
  "idle":          "rgba(255,255,255,0.45)",
  "awaiting-dest": "#00E5FF",
  "ready":         "#4ade80",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayerShowcaseProps {
  /** Raw Mapbox map instance — needed for unproject on drop. */
  map: mapboxgl.Map | null;
  /** Ref to the div that wraps the full-screen MapView — used for hit testing. */
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  dropPhase: DropPhase;
  onDrop: (lngLat: { lng: number; lat: number }) => void;
  onPlayerSelect: (id: PlayerId) => void;
}

// ─── GLB error boundary — renders a fallback sphere when .glb is missing ─────

class GLTFErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

// ─── Fallback: coloured capsule (shows until the .glb file is placed) ─────────

function FallbackFigure({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.6; });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.28, 0.6, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ─── Live GLTF model ──────────────────────────────────────────────────────────
// Auto-scales the model to a consistent 1.8-unit height so any GLB from
// Mixamo or Sketchfab fits the canvas regardless of its original units.
// Plays the first baked animation (usually the idle clip from Mixamo).

function GLTFFigure({ playerId }: { playerId: string }) {
  // GLBs live in /public (e.g. /messi.glb), not /public/models
  const { scene, animations } = useGLTF(`/${playerId}.glb`);

  // Wrapper group so the AnimationMixer can traverse the cloned hierarchy
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  // Clone so the same GLB can be mounted in both the showcase and a map pin
  // simultaneously. SkeletonUtils handles skinned meshes; static meshes too.
  const cloned = useMemo(() => SkeletonUtils.clone(scene) as THREE.Group, [scene]);

  useEffect(() => {
    const first = Object.values(actions)[0];
    first?.reset().play();
  }, [actions]);

  // Slow rotation when there are no baked animation clips
  useFrame((_, dt) => {
    if (groupRef.current && animations.length === 0) {
      groupRef.current.rotation.y += dt * 0.45;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Single player card (canvas + optional name label) ────────────────────────

interface CardProps {
  player: typeof PLAYERS[number];
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?:   (e: React.PointerEvent<HTMLDivElement>) => void;
  onClick?:       () => void;
}

function PlayerCard({
  player,
  isSelected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
}: CardProps) {
  const w = isSelected ? 108 : 64;
  const h = isSelected ? 148 : 90;

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            4,
        cursor:         isSelected ? "grab" : "pointer",
        filter:         isSelected ? "none" : "brightness(0.25) saturate(0)",
        transition:     "filter 0.25s ease, transform 0.25s ease",
        transform:      isSelected ? "scale(1)" : "scale(0.9)",
        userSelect:     "none",
        touchAction:    "none",   // prevent scroll interference on mobile
      }}
    >
      {/* 3D canvas */}
      <div
        style={{
          width:     w,
          height:    h,
          border:    isSelected
            ? `2px solid ${player.accentColor}`
            : "2px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.45)",
          position:  "relative",
          boxShadow: isSelected ? `0 0 22px ${player.accentColor}55` : "none",
          transition: "box-shadow 0.25s",
        }}
      >
        {/* pointer-events:none on Canvas so the parent div captures all events */}
        <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
            dpr={[1, 1.5]}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow />
            <pointLight position={[-2, 0, 2]} intensity={0.4} color={player.accentColor} />
            {/* IBL environment — required for Sketchfab PBR materials to show textures */}
            <Environment preset="city" />

            <GLTFErrorBoundary fallback={<FallbackFigure color={player.accentColor} />}>
              <Suspense fallback={<FallbackFigure color={player.accentColor} />}>
                {/* Bounds auto-fits the camera to whatever Sketchfab geometry
                    is loaded — no manual scale/position arithmetic needed. */}
                <Bounds fit clip observe margin={1.15}>
                  <GLTFFigure playerId={player.id} />
                </Bounds>
              </Suspense>
            </GLTFErrorBoundary>
          </Canvas>
        </div>
      </div>

      {/* Name — only on selected card */}
      {isSelected && (
        <div
          style={{
            fontFamily:    "var(--street-font)",
            fontSize:      10,
            fontWeight:    900,
            fontStyle:     "italic",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color:         player.accentColor,
            textShadow:    `0 0 14px ${player.accentColor}90`,
          }}
        >
          {player.name}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerShowcase({
  map,
  mapContainerRef,
  dropPhase,
  onDrop,
  onPlayerSelect,
}: PlayerShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging]       = useState(false);
  const [ghostPos, setGhostPos]           = useState({ x: 0, y: 0 });

  const leftIndex  = (selectedIndex - 1 + PLAYERS.length) % PLAYERS.length;
  const rightIndex = (selectedIndex + 1) % PLAYERS.length;
  const player     = PLAYERS[selectedIndex];

  // ── Arrow navigation ────────────────────────────────────────────────────────
  const goLeft = useCallback(() => {
    const next = (selectedIndex - 1 + PLAYERS.length) % PLAYERS.length;
    setSelectedIndex(next);
    onPlayerSelect(PLAYERS[next].id);
  }, [selectedIndex, onPlayerSelect]);

  const goRight = useCallback(() => {
    const next = (selectedIndex + 1) % PLAYERS.length;
    setSelectedIndex(next);
    onPlayerSelect(PLAYERS[next].id);
  }, [selectedIndex, onPlayerSelect]);

  // ── Drag handlers (on the selected card so pointer capture works) ───────────

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dropPhase === "ready") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, [dropPhase]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    const container = mapContainerRef.current;
    if (!map || !container) return;

    const rect = container.getBoundingClientRect();
    const inMap =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;

    if (inMap) {
      const px: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
      const lngLat = map.unproject(px);
      onDrop({ lng: lngLat.lng, lat: lngLat.lat });
    }
  }, [isDragging, map, mapContainerRef, onDrop]);

  const phaseColor = PHASE_COLOR[dropPhase];
  const phaseLabel = PHASE_LABEL[dropPhase];

  return (
    <>
      {/* ── Showcase panel ────────────────────────────────────────────────────── */}
      <div
        style={{
          position:       "absolute",
          bottom:         20,
          left:           "50%",
          transform:      "translateX(-50%)",
          zIndex:         12,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            8,
          padding:        "10px 14px 10px",
          background:     "rgba(5,5,9,0.84)",
          backdropFilter: "blur(14px)",
          border:         "1px solid rgba(255,255,255,0.09)",
          borderLeft:     `3px solid ${player.accentColor}`,
          boxShadow:      "0 8px 48px rgba(0,0,0,0.72)",
          transition:     "border-left-color 0.3s",
        }}
      >
        {/* Panel title */}
        <p
          style={{
            fontFamily:    "var(--street-font)",
            fontSize:      7,
            fontWeight:    900,
            fontStyle:     "italic",
            textTransform: "uppercase",
            letterSpacing: "0.4em",
            color:         "rgba(255,255,255,0.3)",
            margin:        0,
          }}
        >
          Choose Player
        </p>

        {/* ── Three player cards with arrow buttons ────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>

          {/* Left arrow */}
          <button
            onClick={goLeft}
            style={{
              background: "none",
              border:     "none",
              color:      "rgba(255,255,255,0.35)",
              fontSize:   13,
              cursor:     "pointer",
              padding:    "4px 3px",
              lineHeight: 1,
              alignSelf:  "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
          >
            ◄
          </button>

          {/* Left (dimmed) player — clicking it navigates left */}
          <PlayerCard
            player={PLAYERS[leftIndex]}
            isSelected={false}
            onClick={goLeft}
          />

          {/* Center (selected) player — this card handles drag */}
          <PlayerCard
            player={player}
            isSelected={true}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Right (dimmed) player — clicking it navigates right */}
          <PlayerCard
            player={PLAYERS[rightIndex]}
            isSelected={false}
            onClick={goRight}
          />

          {/* Right arrow */}
          <button
            onClick={goRight}
            style={{
              background: "none",
              border:     "none",
              color:      "rgba(255,255,255,0.35)",
              fontSize:   13,
              cursor:     "pointer",
              padding:    "4px 3px",
              lineHeight: 1,
              alignSelf:  "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
          >
            ►
          </button>
        </div>

        {/* Phase status indicator */}
        <div
          style={{
            fontFamily:    "var(--street-font)",
            fontSize:      7.5,
            fontWeight:    700,
            fontStyle:     "italic",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color:         phaseColor,
            transition:    "color 0.3s",
            textAlign:     "center",
          }}
        >
          {phaseLabel}
        </div>
      </div>

      {/* ── Drag ghost — follows cursor while dragging ────────────────────────── */}
      {isDragging && (
        <div
          style={{
            position:       "fixed",
            left:           ghostPos.x - 30,
            top:            ghostPos.y - 30,
            width:          60,
            height:         60,
            zIndex:         9999,
            pointerEvents:  "none",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            background:     `${player.accentColor}20`,
            border:         `2px solid ${player.accentColor}`,
            borderRadius:   "50%",
            backdropFilter: "blur(6px)",
            boxShadow:      `0 0 20px ${player.accentColor}50`,
          }}
        >
          <span
            style={{
              fontFamily:    "var(--street-font)",
              fontSize:      9,
              fontWeight:    900,
              fontStyle:     "italic",
              color:         player.accentColor,
              textTransform: "uppercase",
              textAlign:     "center",
              lineHeight:    1.2,
            }}
          >
            {player.name}
          </span>
        </div>
      )}
    </>
  );
}

// Preload all GLBs so they're ready before the panel mounts
PLAYERS.forEach((p) => {
  try { useGLTF.preload(`/${p.id}.glb`); } catch { /* file not added yet */ }
});
