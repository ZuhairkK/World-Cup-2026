"use client";

/**
 * NintendoSwitch.tsx
 *
 * Portrait (vertical) Nintendo Switch shell, rendered as a decoration on the
 * right side of the globe landing page.
 *
 * zIndex: 2 — above the R3F canvas, below title/label overlays.
 *
 * Supports multiple videos: click the screen to cycle through them.
 * Add your mp4 paths to the VIDEOS array below.
 *
 * Layout (portrait):
 *   [Top JoyCon    — blue, wide, short ]
 *   [Console body  — narrow, tall      ]
 *   [Bottom JoyCon — red,  wide, short ]
 *
 * Sizes (scaled ~1.55×):
 *   JoyCons  170 × 46 px
 *   Body     170 × ~310 px
 *   Total    170 × ~402 px
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ── Add your video files to public/ and list them here ───────────────────────
const VIDEOS = [
  "/juggling.mp4",
  "/video2.mp4",
  "/video3.mp4",
];

export default function NintendoSwitch() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const nextVideo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i + 1) % VIDEOS.length);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  }, []);

  const hasMultiple = VIDEOS.length > 1;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 60,
        transform: "translateY(-50%)",
        zIndex: 2,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        opacity: 0.75,
        filter: "drop-shadow(0 16px 50px rgba(0,0,0,0.7))",
      }}
    >
      <TopJoyCon />
      <PortraitBody
        src={VIDEOS[currentIndex]}
        currentIndex={currentIndex}
        total={VIDEOS.length}
        muted={muted}
        onNextVideo={hasMultiple ? nextVideo : undefined}
        onToggleMute={toggleMute}
      />
      <BottomJoyCon />
    </div>
  );
}

// ─── Xbox D-pad ───────────────────────────────────────────────────────────────
function DPad() {
  const arm = (style: React.CSSProperties) => (
    <div style={{
      position: "absolute",
      width: 10, height: 10,
      background: "rgba(0,0,0,0.50)",
      border: "1px solid rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 5, color: "rgba(255,255,255,0.55)",
      ...style,
    }} />
  );
  return (
    <div style={{ position: "relative", width: 30, height: 30 }}>
      {/* center cap */}
      <div style={{ position: "absolute", top: 10, left: 10, width: 10, height: 10, background: "rgba(0,0,0,0.35)" }} />
      {arm({ top: 0,  left: 10, borderRadius: "3px 3px 0 0" })}   {/* ▲ */}
      {arm({ bottom: 0, left: 10, borderRadius: "0 0 3px 3px" })} {/* ▼ */}
      {arm({ left: 0,  top: 10, borderRadius: "3px 0 0 3px" })}   {/* ◄ */}
      {arm({ right: 0, top: 10, borderRadius: "0 3px 3px 0" })}   {/* ► */}
    </div>
  );
}

// ─── Xbox ABXY diamond ────────────────────────────────────────────────────────
function ABXYButtons() {
  const btn = (
    label: string,
    bg: string,
    top: number,
    left: number,
  ) => (
    <div style={{
      position: "absolute",
      top, left,
      transform: "translate(-50%, -50%)",
      width: 13, height: 13,
      borderRadius: "50%",
      background: bg,
      border: "1.5px solid rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 6, fontWeight: 900, color: "rgba(255,255,255,0.9)",
      fontFamily: "Arial",
      lineHeight: 1,
      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15)",
    }}>
      {label}
    </div>
  );
  return (
    <div style={{ position: "relative", width: 30, height: 30 }}>
      {btn("Y", "#C8960A", 2,  15)}  {/* top    — gold   */}
      {btn("X", "#1565C0", 15,  2)}  {/* left   — blue   */}
      {btn("B", "#B71C1C", 15, 28)}  {/* right  — red    */}
      {btn("A", "#1B5E20", 28, 15)}  {/* bottom — green  */}
    </div>
  );
}

// ─── Top JoyCon (blue) — analog stick + D-pad ─────────────────────────────────
function TopJoyCon() {
  return (
    <div
      style={{
        height: 46,
        background: "linear-gradient(180deg, #2DC4F0 0%, #1AACD8 100%)",
        borderRadius: "20px 20px 0 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Analog nub */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, rgba(80,80,80,0.6), rgba(10,10,10,0.85))",
        border: "2px solid rgba(0,0,0,0.3)",
      }} />
      {/* D-pad */}
      <DPad />
    </div>
  );
}

// ─── Console body ─────────────────────────────────────────────────────────────
interface PortraitBodyProps {
  src: string;
  currentIndex: number;
  total: number;
  muted: boolean;
  onNextVideo?: (e: React.MouseEvent) => void;
  onToggleMute: (e: React.MouseEvent) => void;
}

function PortraitBody({ src, currentIndex, total, muted, onNextVideo, onToggleMute }: PortraitBodyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // React doesn't reliably sync `muted` prop to DOM; set via ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted, src]);

  return (
    <div
      style={{
        background: "#1C1C1E",
        padding: "12px 12px 9px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "inset 0 0 28px rgba(0,0,0,0.6)",
      }}
    >
      {/* Screen bezel */}
      <div
        style={{
          width: 146,
          height: 248,
          background: "#000",
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Video — key forces remount when src changes so the new video loads */}
        <video
          ref={videoRef}
          key={src}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          <source src={src} type="video/mp4" />
        </video>

        {/* Screen glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        {/* Mute / unmute button — top-right corner */}
        <button
          onClick={onToggleMute}
          title={muted ? "Unmute" : "Mute"}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1,
            zIndex: 5,
            pointerEvents: "auto",
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* Click-to-next-video overlay (only when multiple videos) */}
        {onNextVideo && (
          <div
            onClick={onNextVideo}
            title="Click to shuffle video"
            style={{
              position: "absolute",
              inset: 0,
              cursor: "pointer",
              zIndex: 4,
              pointerEvents: "auto",
            }}
          />
        )}

        {/* Video index dots */}
        {total > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 7,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 5,
              pointerEvents: "none",
              zIndex: 6,
            }}
          >
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: i === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Home button */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Bottom JoyCon (red) — ABXY diamond + analog nub ─────────────────────────
function BottomJoyCon() {
  return (
    <div
      style={{
        height: 46,
        background: "linear-gradient(180deg, #E4000F 0%, #C20010 100%)",
        borderRadius: "0 0 20px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "inset 0 4px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* ABXY diamond */}
      <ABXYButtons />
      {/* Analog nub */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, rgba(80,80,80,0.6), rgba(10,10,10,0.85))",
        border: "2px solid rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}
