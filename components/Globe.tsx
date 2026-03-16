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
 * - Flag compositing: each country's flag PNG is drawn onto an offscreen
 *   canvas at the correct equirectangular UV position, then handed to Three.js
 *   as a CanvasTexture. No shaders or DecalGeometry needed.
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

// ─── Soccer ball panel seeds — spherical Voronoi layout ──────────────────────
//
// 21 seed points arranged in 5 concentric rings on the sphere surface.
// The spherical Voronoi diagram of these seeds produces large, organically
// curved panels that look like the inflated panels of a real match ball.
//
// Ring structure (1 + 5 + 5 + 5 + 5 = 21):
//   Polar cap  — 1 panel  at the north pole
//   Upper ring — 5 panels at lat ≈ +52°, every 72° longitude
//   Mid-upper  — 5 panels at lat ≈ +16°, every 72°, offset +36°
//   Mid-lower  — 5 panels at lat ≈ -16°, every 72°, offset  0°
//   Lower ring — 5 panels at lat ≈ -52°, every 72°, offset +36°
//
// Flags are chosen for maximum colour variety and visual contrast so the ball
// looks vibrant from every angle.
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

// ─── Utility: load an HTMLImageElement via Promise ────────────────────────────
// No crossOrigin needed — all assets are same-origin (public/).
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`[Globe] Could not load: ${src}`));
    img.src = src;
  });
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

// ─── Earth sphere — soccer ball flag panels via spherical Voronoi ─────────────
//
// Flow:
//  1. Load all 21 flag PNGs in parallel
//  2. Compute a spherical Voronoi diagram: for every texel find the nearest
//     seed point (max dot-product on the unit sphere → closest great-circle
//     distance). Each texel is labelled with its panel index.
//  3. Paint each panel: draw the flag centred at the seed UV, large enough to
//     blanket the whole cell, then copy only that cell's labelled texels.
//  4. Groove pass: a two-pass Chebyshev distance transform locates every texel
//     within GROOVE_R pixels of a panel boundary; a cosine ramp darkens those
//     texels to simulate the deep inset groove on a real match ball.
//  5. A faint 1–2 px bright highlight just outside the groove adds the subtle
//     "raised panel" rim visible on the reference image.
//  6. Hand the CanvasTexture to Three.js. meshStandardMaterial with the scene
//     lighting gives the ball its inflated 3-D shading automatically.
function EarthSphere() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    let cancelled = false;

    async function buildTexture() {
      const W = 2048, H = 1024;
      const canvas = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // ── 1. Neutral base (only visible if a flag fails to load) ───────────────
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, W, H);

      // ── 2. Load all flag PNGs in parallel ─────────────────────────────────
      const flagResults = await Promise.allSettled(
        PANEL_SEEDS.map(s => loadImage(`/flags/${s.code}.png`))
      );
      if (cancelled) return;

      // ── 3. Seed → pre-computed 3-D unit vectors ────────────────────────────
      const N = PANEL_SEEDS.length;
      const seedVec = PANEL_SEEDS.map(({ lat, lng }) => {
        const phi   = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return [
          -Math.sin(phi) * Math.cos(theta),
           Math.cos(phi),
           Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number];
      });

      // ── 4. Spherical Voronoi — O(W × H × N) ───────────────────────────────
      //    For each texel convert UV → unit sphere, find max dot-product seed.
      const voronoi = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) {
        const phi    = (y / H) * Math.PI;           // 0 (N pole) → π (S pole)
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const row    = y * W;
        for (let x = 0; x < W; x++) {
          const theta = (x / W) * 2 * Math.PI;      // 0 → 2π
          const px = -sinPhi * Math.cos(theta);
          const py =  cosPhi;
          const pz =  sinPhi * Math.sin(theta);
          let best = 0, bestDot = -2;
          for (let c = 0; c < N; c++) {
            const v = seedVec[c];
            const d = px * v[0] + py * v[1] + pz * v[2];
            if (d > bestDot) { bestDot = d; best = c; }
          }
          voronoi[row + x] = best;
        }
      }
      if (cancelled) return;

      // ── 5. Paint flags into Voronoi cells ─────────────────────────────────
      //    Off-white seam colour pre-fills mainData; each flag overwrites only
      //    its own cell's texels.
      const mainData = new Uint8ClampedArray(W * H * 4);
      // Alpha fully opaque everywhere; RGB filled by flags below
      for (let i = 3; i < mainData.length; i += 4) mainData[i] = 255;

      for (let c = 0; c < N; c++) {
        const res = flagResults[c];
        if (res.status !== "fulfilled") continue;
        const img = res.value;

        // Seed UV centre
        const cx = Math.round(((PANEL_SEEDS[c].lng + 180) / 360) * W);
        const cy = Math.round(((90 - PANEL_SEEDS[c].lat) / 180) * H);

        // Flag drawn large enough (30 % of canvas width) to blanket any cell
        const fw = Math.round(W * 0.30);
        const fh = Math.round(fw * img.naturalHeight / img.naturalWidth);

        // Off-screen canvas for this flag (full W×H so pixel indices match)
        const tmp  = document.createElement("canvas");
        tmp.width  = W; tmp.height = H;
        const tc   = tmp.getContext("2d")!;
        // Draw three times to handle horizontal wrap at ±180°
        for (const ox of [-W, 0, W]) {
          tc.drawImage(img, cx - fw / 2 + ox, cy - fh / 2, fw, fh);
        }
        const fd = tc.getImageData(0, 0, W, H).data;

        for (let i = 0; i < W * H; i++) {
          if (voronoi[i] === c) {
            const p = i * 4;
            mainData[p]   = fd[p];
            mainData[p+1] = fd[p+1];
            mainData[p+2] = fd[p+2];
          }
        }
      }

      ctx.putImageData(new ImageData(mainData, W, H), 0, 0);
      if (cancelled || !matRef.current) return;

      // ── 7. Push to Three.js ────────────────────────────────────────────────
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace  = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      matRef.current.map = tex;
      matRef.current.color.set(0xffffff);
      matRef.current.needsUpdate = true;
    }

    buildTexture();
    return () => { cancelled = true; };
  }, []);

  return (
    <Sphere args={[GLOBE_RADIUS, 64, 64]}>
      {/*
        meshStandardMaterial so the directional + point lights in <Scene>
        produce the shading that makes the panels look inflated/3-D.
        Off-white colour shows while the async texture builds.
      */}
      <meshStandardMaterial ref={matRef} color="#888888" roughness={0.55} metalness={0.0} />
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
