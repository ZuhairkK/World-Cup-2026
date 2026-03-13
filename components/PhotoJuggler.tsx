"use client";

/**
 * PhotoJuggler.tsx
 *
 * Lets the user import their own juggling photo, displayed as a foreground
 * figure on the globe landing page.
 *
 * - Small upload button in the bottom-left corner
 * - Once a photo is selected it renders full-height at the bottom of the screen
 * - Image URL is a local blob URL (no server upload needed)
 */

import { useState, useRef } from "react";

export default function PhotoJuggler() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous blob to avoid memory leaks
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(URL.createObjectURL(file));
  };

  return (
    <>
      {/* ── Upload button (bottom-left) ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            fontFamily: "var(--street-font)",
            fontSize: 10,
            fontWeight: 800,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: imgUrl ? "var(--accent-gold)" : "rgba(255,255,255,0.45)",
            background: "rgba(5,5,9,0.75)",
            border: imgUrl
              ? "1px solid rgba(212,160,23,0.4)"
              : "1px solid rgba(255,255,255,0.12)",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all 0.2s",
            backdropFilter: "blur(6px)",
          }}
        >
          {imgUrl ? "↺ Change Juggling Photo" : "+ Add Your Juggling Photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      {/* ── Foreground juggling photo ────────────────────────────────────────── */}
      {imgUrl && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            // Mirror offset of SVG juggler but slightly to the right so they
            // don't fully overlap; user can see both silhouette and photo.
            transform: "translateX(-38%)",
            transformOrigin: "bottom center",
            pointerEvents: "none",
            zIndex: 10,
            maxHeight: "75vh",
            filter:
              "drop-shadow(0 0 32px rgba(212, 160, 23, 0.75)) drop-shadow(0 8px 16px rgba(0,0,0,0.9))",
          }}
        >
          <img
            src={imgUrl}
            alt="Your juggling"
            style={{
              display: "block",
              maxHeight: "75vh",
              width: "auto",
              objectFit: "contain",
              objectPosition: "bottom",
            }}
          />
        </div>
      )}
    </>
  );
}
