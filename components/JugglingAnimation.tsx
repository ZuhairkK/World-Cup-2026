"use client";

/**
 * JugglingAnimation.tsx
 *
 * Background video of the user juggling, rendered as a semi-transparent
 * overlay on the globe landing page.
 *
 * Setup:
 *   1. Record yourself juggling (portrait orientation works best)
 *   2. Drop the file into  public/juggling.mp4
 *   3. Done — it auto-plays looped and muted in the background
 *
 * Best results: film against a dark/black background so the low opacity
 * and gold glow blend naturally into the globe scene.
 * For a clean cutout with no background: export as WebM with alpha channel.
 */

interface JugglingAnimationProps {
  layer?: "background" | "foreground";
}

export default function JugglingAnimation({ layer = "foreground" }: JugglingAnimationProps) {
  const isBackground = layer === "background";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-60%)",
        transformOrigin: "bottom center",
        width: 300,
        pointerEvents: "none",
        zIndex: isBackground ? 1 : 5,
        opacity: isBackground ? 0.18 : 0.85,
        filter: "drop-shadow(0 0 28px rgba(212, 160, 23, 0.55))",
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "80vh",
          objectFit: "contain",
          objectPosition: "bottom",
          display: "block",
        }}
      >
        <source src="/juggling.mp4" type="video/mp4" />
        {/* WebM with alpha channel also supported for transparent background */}
        <source src="/juggling.webm" type="video/webm" />
      </video>
    </div>
  );
}
