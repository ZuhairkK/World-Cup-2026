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
import NintendoSwitch from "@/components/NintendoSwitch";


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

// ─── Globe title overlay — exact FIFA Street "Canada Transport Guide" match ───
//
// Reference: fifa_street_canada_transport_landing.png
//   • "CANADA" in huge bold yellow at the very top, centered
//   • "TRANSPORT GUIDE" in medium yellow directly below
//   • City names row: VANCOUVER · EDMONTON · TORONTO in small white italic
function GlobeTitle() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-center"
      style={{ whiteSpace: "nowrap" }}
    >
      {/* "CANADA" — dominant yellow headline */}
      <h1
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 82,
          fontWeight: 900,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          lineHeight: 0.88,
          color: "#F5C842",
          textShadow: [
            "0 0 60px rgba(245,200,66,0.55)",
            "0 4px 30px rgba(0,0,0,0.9)",
            "2px 2px 0 rgba(0,0,0,0.5)",
          ].join(", "),
          marginBottom: 4,
        }}
      >
        CANADA
      </h1>

      {/* "TRANSPORT GUIDE" — secondary yellow headline */}
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 34,
          fontWeight: 900,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          lineHeight: 1,
          color: "#F5C842",
          textShadow: "0 2px 16px rgba(0,0,0,0.8)",
          marginBottom: 10,
        }}
      >
        TRANSPORT GUIDE
      </p>

      {/* City names row — VANCOUVER · EDMONTON · TORONTO */}
      <p
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 13,
          fontWeight: 700,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.72)",
          textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        }}
      >
        Vancouver &nbsp;·&nbsp; Edmonton &nbsp;·&nbsp; Toronto
      </p>
    </div>
  );
}

// ─── Globe label overlay — "CLICK A STADIUM TO EXPLORE" bottom prompt ─────────
//
// Reference: bottom-center text with a leading arrow indicator.
// Also renders a minimal EA/FIFA badge bottom-left.
function GlobeLabel() {
  return (
    <>
      {/* Bottom-center CTA */}
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        style={{ whiteSpace: "nowrap" }}
      >
        <p
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 14,
            fontWeight: 800,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          ▶&nbsp; Click a Stadium to Explore
        </p>
      </div>

      {/* EA Sports / FIFA Street badge — bottom-left */}
      <div
        className="pointer-events-none absolute bottom-7 left-8"
        style={{ display: "flex", flexDirection: "column", gap: 1 }}
      >
        <span
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 9,
            fontWeight: 900,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          EA Sports
        </span>
        <span
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 11,
            fontWeight: 900,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.18)",
          }}
        >
          FIFA Street
        </span>
      </div>
    </>
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

      {/* ── Graffiti background — download (1).jpg (FIFA Street 2012 cover,   ──
           Messi in front of a graffiti wall) heavily blurred + darkened.
           Gives the urban street-art texture visible in the reference image.
           No z-index set → sits at the very back of the stacking context.   */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/download%20(1).jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(14px) brightness(0.18) saturate(0.7)",
          transform: "scale(1.06)", // prevent blurred edges showing
        }}
      />

      {/* Juggling video — rendered before canvas, z-index 1 floats above canvas */}
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

      {/* Nintendo Switch — rendered after Canvas so it's always visible.
           Low opacity (0.28) + pointer-events none = background decoration. */}
      <NintendoSwitch />

      <GlobeTitle />
      <GlobeLabel />
    </div>
  );
}
