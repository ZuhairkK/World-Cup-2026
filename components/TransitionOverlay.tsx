"use client";

/**
 * TransitionOverlay.tsx
 *
 * A full-screen black overlay that fades in/out to mask the canvas swap
 * between the R3F globe and the Mapbox GL map.
 *
 * The parent drives a single `phase` prop:
 *
 *   "idle"    — overlay hidden (opacity 0, pointer-events none)
 *   "fade-in" — overlay fades TO opaque  (globe zoomed → black screen)
 *   "fade-out"— overlay fades FROM opaque (map mounted → reveal)
 *
 * Callbacks `onFadeInComplete` / `onFadeOutComplete` let the parent know
 * when each half-transition is done so it can swap components at the right moment.
 */

import { useEffect, useRef } from "react";

export type OverlayPhase = "idle" | "fade-in" | "fade-out";

interface TransitionOverlayProps {
  phase: OverlayPhase;
  onFadeInComplete: () => void;
  onFadeOutComplete: () => void;
  /** Duration for each fade leg in ms. Default 500. */
  duration?: number;
}

export default function TransitionOverlay({
  phase,
  onFadeInComplete,
  onFadeOutComplete,
  duration = 500,
}: TransitionOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (phase === "fade-in") {
      timerRef.current = setTimeout(onFadeInComplete, duration);
    } else if (phase === "fade-out") {
      timerRef.current = setTimeout(onFadeOutComplete, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, duration, onFadeInComplete, onFadeOutComplete]);

  const opacity = phase === "idle" ? 0 : phase === "fade-in" ? 1 : 0;
  const pointerEvents = phase === "idle" ? "none" : "all";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        opacity,
        pointerEvents,
        zIndex: 50,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    />
  );
}
