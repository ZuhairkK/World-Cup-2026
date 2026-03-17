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
 * - Flag texture: flag images composited onto a canvas via spherical Voronoi
 *   (each pixel → nearest seed → flag image). Boundaries are smoothly blended
 *   so there are no hard separation lines between panels.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars, Html } from "@react-three/drei";
import * as THREE from "three";

import { STADIUMS } from "@/data/stadiums";
import type { Stadium } from "@/data/types";
import NintendoSwitch from "@/components/NintendoSwitch";

// ─── Globe radius constant ────────────────────────────────────────────────────
const GLOBE_RADIUS = 2;

// ─── Flag seed positions — distributed across the globe ──────────────────────
//
// 21 points arranged in 5 concentric rings for even coverage.
// Each entry maps a country code to a lat/lng where its flag plane will float.
// Flags chosen for maximum colour variety so the globe looks vibrant from all angles.
const PANEL_SEEDS: ReadonlyArray<{ code: string; lat: number; lng: number }> = [
  // ── Polar cap ──────────────────────────────────────────────────────────────
  { code: "ca", lat:  80, lng:    0 },   // Canada — red/white

  // ── Upper ring (lat +52°, 0 72 144 −144 −72) ──────────────────────────────
  { code: "no", lat:  52, lng:    0 },   // Norway — Nordic cross
  { code: "de", lat:  52, lng:   72 },   // Germany — bold tricolour
  { code: "jp", lat:  52, lng:  144 },   // Japan — red circle
  { code: "kr", lat:  52, lng: -144 },   // South Korea — taegukgi
  { code: "gb", lat:  52, lng:  -72 },   // England — Union Jack

  // ── Mid-upper ring (lat +16°, 36 108 180 −108 −36) ────────────────────────
  { code: "us", lat:  16, lng:   36 },   // USA — stars & stripes
  { code: "ir", lat:  16, lng:  108 },   // Iran — green/white/red
  { code: "au", lat:  16, lng:  180 },   // Australia — Southern Cross
  { code: "fr", lat:  16, lng: -108 },   // France — tricolour
  { code: "ma", lat:  16, lng:  -36 },   // Morocco — red/green star

  // ── Mid-lower ring (lat −16°, 0 72 144 −144 −72) ──────────────────────────
  { code: "eg", lat: -16, lng:    0 },   // Egypt — red/white/black eagle
  { code: "sa", lat: -16, lng:   72 },   // Saudi Arabia — all-green
  { code: "nz", lat: -16, lng:  144 },   // New Zealand — Southern Cross
  { code: "sn", lat: -16, lng: -144 },   // Senegal — green/yellow/red
  { code: "mx", lat: -16, lng:  -72 },   // Mexico — eagle crest

  // ── Lower ring (lat −52°, 36 108 180 −108 −36) ────────────────────────────
  { code: "co", lat: -52, lng:   36 },   // Colombia — yellow/blue/red
  { code: "pt", lat: -52, lng:  108 },   // Portugal — green/red
  { code: "br", lat: -52, lng:  180 },   // Brazil — green/yellow/blue
  { code: "ar", lat: -52, lng: -108 },   // Argentina — sky-blue/white
  { code: "za", lat: -52, lng:  -36 },   // South Africa — rainbow
] as const;

// ─── Utility: load an image element ──────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`[Globe] Could not load: ${src}`));
    img.src = src;
  });
}

// ─── Precomputed seed frame ───────────────────────────────────────────────────
interface SeedFrame {
  sx: number; sy: number; sz: number; // unit sphere position
  rx: number; ry: number; rz: number; // local right axis (tangent)
  ux: number; uy: number; uz: number; // local up axis (tangent)
}

function buildSeedFrame(lat: number, lng: number): SeedFrame {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const sx = -Math.sin(phi) * Math.cos(theta);
  const sy =  Math.cos(phi);
  const sz =  Math.sin(phi) * Math.sin(theta);

  // right = seed × Y  →  (-sz, 0, sx)
  const rLen = Math.sqrt(sz * sz + sx * sx);
  let rx: number, ry: number, rz: number;
  if (rLen > 0.01) { rx = -sz / rLen; ry = 0; rz = sx / rLen; }
  else             { rx = 1;           ry = 0; rz = 0; } // pole fallback

  // up = right × seed
  const ux = ry * sz - rz * sy;
  const uy = rz * sx - rx * sz;
  const uz = rx * sy - ry * sx;

  return { sx, sy, sz, rx, ry, rz, ux, uy, uz };
}

// ─── Build the Voronoi flag globe texture ─────────────────────────────────────
//
// Each output pixel is mapped to a point on the unit sphere (equirectangular).
// We find the two nearest Voronoi seeds (by chord distance) and sample the
// corresponding flag image. Near boundaries the two flag colours are crossfaded
// so there are no hard separation lines.
async function buildFlagTexture(): Promise<THREE.CanvasTexture> {
  const W = 2048, H = 1024; // output texture resolution
  const FW = 256, FH = 170; // internal flag resolution for pixel sampling

  // Load each flag and rasterise it onto a small canvas for pixel access
  const flagPixels: Uint8ClampedArray[] = await Promise.all(
    PANEL_SEEDS.map(async (s) => {
      const img = await loadImage(`/flags/${s.code}.png`);
      const fc  = document.createElement("canvas");
      fc.width  = FW;
      fc.height = FH;
      fc.getContext("2d")!.drawImage(img, 0, 0, FW, FH);
      return fc.getContext("2d")!.getImageData(0, 0, FW, FH).data;
    })
  );

  // Precompute local tangent frames for each seed (avoids per-pixel allocation)
  const frames: SeedFrame[] = PANEL_SEEDS.map(s => buildSeedFrame(s.lat, s.lng));

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const out = ctx.createImageData(W, H);
  const buf = out.data;

  // How much of the flag's extent maps to one Voronoi cell:
  // smaller → flag is more "zoomed in" (shows less of it); larger → more visible.
  const SCALE = 1.4;

  for (let py = 0; py < H; py++) {
    // Equirectangular: top = +90°, bottom = -90°
    const lat    = Math.PI * (0.5 - (py + 0.5) / H);
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    for (let px = 0; px < W; px++) {
      const lng = 2 * Math.PI * ((px + 0.5) / W) - Math.PI;
      const nx  = cosLat * Math.cos(lng);
      const ny  = sinLat;
      const nz  = cosLat * Math.sin(lng);

      // ── Find nearest two seeds (squared chord distance) ──────────────────
      let i1 = 0, i2 = 1, d1 = 1e9, d2 = 1e9;
      for (let i = 0; i < frames.length; i++) {
        const f  = frames[i];
        const dx = nx - f.sx, dy = ny - f.sy, dz = nz - f.sz;
        const d  = dx * dx + dy * dy + dz * dz;
        if      (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; }
        else if (d < d2) { d2 = d; i2 = i; }
      }

      // ── Sample helper: project world point onto seed's tangent plane ──────
      const sample = (fi: number): [number, number, number] => {
        const f    = frames[fi];
        const dot  = nx * f.sx + ny * f.sy + nz * f.sz;
        // tangent component (remove the part along the seed direction)
        const tx   = nx - f.sx * dot;
        const ty   = ny - f.sy * dot;
        const tz   = nz - f.sz * dot;
        const uLoc = tx * f.rx + ty * f.ry + tz * f.rz;
        const vLoc = tx * f.ux + ty * f.uy + tz * f.uz;
        const iu   = Math.min(FW - 1, Math.max(0, Math.round(( uLoc / SCALE + 0.5) * (FW - 1))));
        const iv   = Math.min(FH - 1, Math.max(0, Math.round((-vLoc / SCALE + 0.5) * (FH - 1))));
        const idx  = (iv * FW + iu) * 4;
        const fd   = flagPixels[fi];
        return [fd[idx], fd[idx + 1], fd[idx + 2]];
      };

      // ── Smooth blend near Voronoi boundary ───────────────────────────────
      // ratio = d1/d2: 0 at seed centre, 1 at boundary midpoint.
      // We start blending when ratio > 0.55, fully blended at 1.0.
      const ratio = d1 / d2;
      const blend = ratio < 0.55 ? 0 : (ratio - 0.55) / 0.45;

      const outIdx = (py * W + px) * 4;
      const [r1, g1, b1] = sample(i1);

      if (blend < 0.01) {
        buf[outIdx]     = r1;
        buf[outIdx + 1] = g1;
        buf[outIdx + 2] = b1;
      } else {
        const [r2, g2, b2] = sample(i2);
        buf[outIdx]     = Math.round(r1 * (1 - blend) + r2 * blend);
        buf[outIdx + 1] = Math.round(g1 * (1 - blend) + g2 * blend);
        buf[outIdx + 2] = Math.round(b1 * (1 - blend) + b2 * blend);
      }
      buf[outIdx + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

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

// ─── Earth sphere — Voronoi flag texture ─────────────────────────────────────
// Builds the texture asynchronously on mount; renders nothing until it's ready.
function EarthSphere() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildFlagTexture()
      .then(tex => { if (!cancelled) setTexture(tex); })
      .catch(err => console.error("[Globe] flag texture failed:", err));
    return () => { cancelled = true; };
  }, []);

  if (!texture) return null;

  return (
    <Sphere args={[GLOBE_RADIUS, 64, 64]}>
      <meshStandardMaterial map={texture} roughness={0.6} metalness={0.0} />
    </Sphere>
  );
}

// ─── Continent outline overlay (subtle wireframe) ─────────────────────────────
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
      {/* Lighting — boosted ambient so dark textures stay visible */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 4, 5]} intensity={1.5} color="#fff8e8" />
      <pointLight position={[-6, -3, -6]} intensity={0.4} color="#1a4a9a" />

      {/* Stars backdrop */}
      <Stars radius={80} depth={50} count={4000} factor={3} fade speed={0.6} />

      {/* Globe layers — flag texture builds async, sphere appears once ready */}
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


// ─── Globe title overlay ──────────────────────────────────────────────────────
function GlobeTitle() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-center"
      style={{ whiteSpace: "nowrap" }}
    >
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
        World Cup
      </h1>

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
        Fan Guide
      </p>

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
        Canada Edition
      </p>
    </div>
  );
}

// ─── Globe label overlay ──────────────────────────────────────────────────────
function GlobeLabel() {
  return (
    <>
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
    // Reset so the globe is interactive again if the user dismisses the sheet
    setIsZooming(false);
    setZoomTarget(null);
  }, [onStadiumSelect]);

  return (
    <div className="relative w-full h-full" style={{ background: "var(--bg-base)" }}>

      {/* Graffiti background — blurred + darkened */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/player-messi.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(14px) brightness(0.18) saturate(0.7)",
          transform: "scale(1.06)",
        }}
      />

      {/* R3F canvas */}
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

      {/* Nintendo Switch decoration — right side */}
      <NintendoSwitch />

      <GlobeTitle />
      <GlobeLabel />
    </div>
  );
}
