"use client";

/**
 * PlayerPin.tsx
 *
 * A 3D player figure pinned to a geographic coordinate on the Mapbox map.
 * Rendered as a CSS `position:absolute` div containing a small R3F Canvas.
 * Position is recomputed on every map `move`/`zoom` event via map.project().
 *
 * The triangle at the bottom of the pin points precisely to the dropped
 * lat/lng coordinate. The label badge ("ORIGIN" / "DESTINATION") sits above.
 */

import { useState, useEffect, useRef, useMemo, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Bounds, Center, Environment } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type mapboxgl from "mapbox-gl";

import { PLAYERS, type PlayerId } from "@/data/players";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerPinProps {
  playerId:   PlayerId;
  lngLat:     { lng: number; lat: number };
  map:        mapboxgl.Map;
  label:      "ORIGIN" | "DESTINATION";
}

// ─── Error boundary for missing GLB ──────────────────────────────────────────

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

// ─── Fallback figure (capsule + sphere head) ──────────────────────────────────

function FallbackFigure({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.5; });
  return (
    <group ref={ref}>
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.25, 0.55, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  );
}

// ─── Live GLTF model ──────────────────────────────────────────────────────────
// Same auto-scale + animation logic as PlayerShowcase so pins look consistent.

function GLTFFigure({ playerId }: { playerId: string }) {
  // GLBs live in /public (e.g. /messi.glb), not /public/models
  const { scene, animations } = useGLTF(`/${playerId}.glb`);
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  // SkeletonUtils.clone() correctly deep-clones skinned/animated Mixamo meshes.
  // scene.clone(true) breaks bone hierarchies, making the mesh invisible.
  const cloned = useMemo(() => {
    const clone  = SkeletonUtils.clone(scene);
    const box    = new THREE.Box3().setFromObject(scene);
    const height = box.getSize(new THREE.Vector3()).y;
    if (height > 0) clone.scale.setScalar(1.8 / height);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y -= box2.min.y;
    return clone;
  }, [scene]);

  useEffect(() => {
    const first = Object.values(actions)[0];
    first?.reset().play();
  }, [actions]);

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerPin({ playerId, lngLat, map, label }: PlayerPinProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const player = PLAYERS.find((p) => p.id === playerId)!;

  // Track map movement — reproject the coordinate each frame the map moves
  useEffect(() => {
    const update = () => {
      const { x, y } = map.project([lngLat.lng, lngLat.lat]);
      setPos({ x, y });
    };

    update(); // initial position
    map.on("move",   update);
    map.on("zoom",   update);
    map.on("rotate", update);
    map.on("pitch",  update);

    return () => {
      map.off("move",   update);
      map.off("zoom",   update);
      map.off("rotate", update);
      map.off("pitch",  update);
    };
  }, [map, lngLat]);

  if (!pos) return null;

  const isOrigin = label === "ORIGIN";
  const labelColor = isOrigin ? "#F5C842" : "#00E5FF";

  return (
    <div
      style={{
        position:      "absolute",
        left:          pos.x,
        top:           pos.y,
        // Bottom-center of this div aligns to the map coordinate
        transform:     "translate(-50%, -100%)",
        pointerEvents: "none",
        zIndex:        11,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
      }}
    >
      {/* Label badge */}
      <div
        style={{
          fontFamily:    "var(--street-font)",
          fontSize:      8,
          fontWeight:    900,
          fontStyle:     "italic",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color:         labelColor,
          background:    `${labelColor}18`,
          border:        `1px solid ${labelColor}55`,
          padding:       "2px 6px",
          marginBottom:  4,
          textShadow:    `0 0 10px ${labelColor}80`,
        }}
      >
        {label}
      </div>

      {/* 3D canvas */}
      <div
        style={{
          width:      80,
          height:     110,
          background: "rgba(0,0,0,0.35)",
          border:     `1.5px solid ${player.accentColor}`,
          boxShadow:  `0 0 18px ${player.accentColor}50`,
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 4, 2]} intensity={1.2} />
          <pointLight position={[-2, 0, 2]} intensity={0.5} color={player.accentColor} />
          <Environment preset="city" />

          <GLTFErrorBoundary fallback={<FallbackFigure color={player.accentColor} />}>
            <Suspense fallback={<FallbackFigure color={player.accentColor} />}>
              <Bounds fit clip observe margin={1.2}>
                <Center>
                  <GLTFFigure playerId={playerId} />
                </Center>
              </Bounds>
            </Suspense>
          </GLTFErrorBoundary>
        </Canvas>
      </div>

      {/* Triangle pointer — tip points to the exact map coordinate */}
      <div
        style={{
          width:             0,
          height:            0,
          borderLeft:        "9px solid transparent",
          borderRight:       "9px solid transparent",
          borderTop:         `13px solid ${player.accentColor}`,
          filter:            `drop-shadow(0 4px 8px ${player.accentColor}60)`,
        }}
      />
    </div>
  );
}
