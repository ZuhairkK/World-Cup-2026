"use client";

/**
 * Globe.tsx
 *
 * The R3F 3D globe landing experience.
 *
 * Renders an Earth sphere with three stadium markers. Clicking a marker
 * triggers a camera zoom-in animation toward the stadium, then calls
 * `onStadiumSelect` so the parent can initiate the crossfade to Mapbox.
 *
 * Architecture notes:
 * - Uses @react-three/fiber <Canvas> with an orbital camera.
 * - The zoom-in is a manual camera lerp inside useFrame; once the camera
 *   reaches a threshold distance we fire the callback.
 * - Stars are a simple Points mesh for depth/atmosphere.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars, Html } from "@react-three/drei";
import * as THREE from "three";

import { STADIUMS } from "@/data/stadiums";
import type { Stadium } from "@/data/types";
import JugglingAnimation from "@/components/JugglingAnimation";


// ─── Utility: convert lat/lng to a 3D point on a unit sphere ─────────────────
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Globe radius constant ────────────────────────────────────────────────────
const GLOBE_RADIUS = 2;

// ─── Stadium marker mesh ──────────────────────────────────────────────────────
interface MarkerProps {
  stadium: Stadium;
  onSelect: (stadium: Stadium) => void;
  isZooming: boolean;
}

function StadiumMarker({ stadium, onSelect, isZooming }: MarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = latLngToVec3(
    stadium.coords.lat,
    stadium.coords.lng,
    GLOBE_RADIUS + 0.06 // slightly above surface
  );

  // Label sits a bit further out so it clears the dot
  const labelPosition = latLngToVec3(
    stadium.coords.lat,
    stadium.coords.lng,
    GLOBE_RADIUS + 0.28
  );

  // Pulse animation on hover
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const scale = hovered
      ? 1 + Math.sin(clock.getElapsedTime() * 6) * 0.15
      : 1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={position}
        onClick={() => !isZooming && onSelect(stadium)}
        onPointerOver={() => { setHovered(true);  document.body.style.cursor = "pointer"; }}
        onPointerOut={()  => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#f5c842" : "#d4a017"}
          emissive={hovered ? "#f5c842" : "#8a6810"}
          emissiveIntensity={hovered ? 1.2 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* City label — always visible, brightens on hover, clickable */}
      <Html position={labelPosition} center distanceFactor={6}>
        <div
          onClick={() => !isZooming && onSelect(stadium)}
          onMouseEnter={() => { setHovered(true);  document.body.style.cursor = "pointer"; }}
          onMouseLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}
          style={{
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: hovered ? "#f5c842" : "rgba(255,255,255,0.85)",
            background: hovered
              ? "rgba(245,200,66,0.12)"
              : "rgba(0,0,0,0.5)",
            border: hovered
              ? "1px solid rgba(245,200,66,0.5)"
              : "1px solid rgba(255,255,255,0.12)",
            padding: "2px 7px 2px 7px",
            borderRadius: 3,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
            transition: "all 0.15s",
          }}
        >
          {stadium.city}
        </div>
      </Html>
    </>
  );
}

// ─── Camera zoom controller ───────────────────────────────────────────────────
interface CameraZoomProps {
  target: THREE.Vector3 | null;
  onZoomComplete: () => void;
}

function CameraZoom({ target, onZoomComplete }: CameraZoomProps) {
  const { camera } = useThree();
  const completedRef = useRef(false);

  useFrame(() => {
    if (!target || completedRef.current) return;

    // Destination: close to the target, slightly offset
    const dest = target.clone().multiplyScalar(3.5);
    camera.position.lerp(dest, 0.045);
    camera.lookAt(target);

    // Fire callback once we're close enough
    if (camera.position.distanceTo(dest) < 0.4) {
      completedRef.current = true;
      onZoomComplete();
    }
  });

  return null;
}

// ─── Earth sphere ─────────────────────────────────────────────────────────────
// Attempts to load /earth-texture.jpg from the public folder.
// If missing, falls back to an ocean-blue material.
// → To enable the texture: drop any equirectangular earth map into
//   public/earth-texture.jpg (free NASA Blue Marble images work great).
function EarthSphere() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/earth-texture.jpg",
      (tex) => setTexture(tex),
      undefined,
      () => {} // silently skip if file isn't there
    );
  }, []);

  return (
    <Sphere args={[GLOBE_RADIUS, 64, 64]}>
      {texture ? (
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.0} />
      ) : (
        <meshStandardMaterial
          color="#1565c0"
          roughness={0.75}
          metalness={0.05}
        />
      )}
    </Sphere>
  );
}

// ─── Continent outline overlay (subtle wireframe) ─────────────────────────────
// Green tint gives a land-mass suggestion even without a real texture.
// Opacity is low enough to blend with both the colour fallback and a real texture.
function GlobeWireframe() {
  return (
    <Sphere args={[GLOBE_RADIUS + 0.002, 48, 48]}>
      <meshBasicMaterial
        color="#2ecc71"
        wireframe
        transparent
        opacity={0.07}
      />
    </Sphere>
  );
}

// ─── Atmosphere glow ring ─────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <Sphere args={[GLOBE_RADIUS + 0.12, 32, 32]}>
      <meshBasicMaterial
        color="#0a4080"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </Sphere>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
interface SceneProps {
  zoomTarget: THREE.Vector3 | null;
  onZoomComplete: () => void;
  onStadiumSelect: (stadium: Stadium) => void;
  isZooming: boolean;
}

function Scene({ zoomTarget, onZoomComplete, onStadiumSelect, isZooming }: SceneProps) {
  return (
    <>
      {/* Lighting — sunlight from upper-right, soft fill from the left */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 4, 5]} intensity={1.5} color="#fff8e8" />
      <pointLight position={[-6, -3, -6]} intensity={0.25} color="#1a4a9a" />

      {/* Stars backdrop */}
      <Stars radius={80} depth={50} count={4000} factor={3} fade speed={0.6} />

      {/* Globe layers */}
      <EarthSphere />
      <GlobeWireframe />
      <Atmosphere />

      {/* Stadium markers */}
      {STADIUMS.map((s) => (
        <StadiumMarker
          key={s.id}
          stadium={s}
          onSelect={onStadiumSelect}
          isZooming={isZooming}
        />
      ))}

      {/* Camera animation (only active after a marker click) */}
      {zoomTarget && (
        <CameraZoom target={zoomTarget} onZoomComplete={onZoomComplete} />
      )}

      {/* Orbital controls — disabled while zooming */}
      <OrbitControls
        enableZoom={!isZooming}
        enablePan={false}
        rotateSpeed={0.35}
        minDistance={3.5}
        maxDistance={9}
        autoRotate={!isZooming}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

// ─── Globe label overlay ──────────────────────────────────────────────────────
function GlobeLabel() {
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 13,
          fontWeight: 700,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.35em",
          color: "rgba(255, 255, 255, 0.55)",
        }}
      >
        Click a Stadium to Explore
      </p>
    </div>
  );
}

// ─── Title overlay ────────────────────────────────────────────────────────────
function GlobeTitle() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 text-center">
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 11,
          fontWeight: 800,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.45em",
          color: "var(--accent-gold)",
          marginBottom: 6,
        }}
      >
        FIFA World Cup 2026
      </p>
      <h1
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 52,
          fontWeight: 900,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 0.9,
          color: "white",
          textShadow: "0 0 40px rgba(212, 160, 23, 0.4), 0 4px 24px rgba(0,0,0,0.8)",
        }}
      >
        Canada
        <br />
        <span style={{ color: "var(--accent-gold)", fontSize: 36 }}>
          Transport Guide
        </span>
      </h1>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
interface GlobeProps {
  onStadiumSelect: (stadium: Stadium) => void;
}

export default function Globe({ onStadiumSelect }: GlobeProps) {
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const pendingStadiumRef = useRef<Stadium | null>(null);

  const handleMarkerClick = useCallback((stadium: Stadium) => {
    pendingStadiumRef.current = stadium;
    const target = latLngToVec3(stadium.coords.lat, stadium.coords.lng, GLOBE_RADIUS);
    setZoomTarget(target);
    setIsZooming(true);
  }, []);

  const handleZoomComplete = useCallback(() => {
    if (pendingStadiumRef.current) {
      onStadiumSelect(pendingStadiumRef.current);
    }
  }, [onStadiumSelect]);

  return (
    <div className="relative w-full h-full" style={{ background: "var(--bg-base)" }}>
      {/* Juggling video — rendered first so it sits below the Canvas in the stack */}
      <JugglingAnimation layer="background" />

      {/* Canvas with alpha:true so the 3D scene layers cleanly over the video */}
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 2]}
      >
        <Scene
          zoomTarget={zoomTarget}
          onZoomComplete={handleZoomComplete}
          onStadiumSelect={handleMarkerClick}
          isZooming={isZooming}
        />
      </Canvas>

      <GlobeTitle />
      <GlobeLabel />
    </div>
  );
}
