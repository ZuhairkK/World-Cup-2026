"use client";

/**
 * NintendoSwitch.tsx
 *
 * Portrait (vertical) Nintendo Switch shell, rendered as a background
 * decoration on the globe landing page.
 *
 * It sits BEHIND the R3F canvas (no explicit z-index → canvas DOM order
 * wins). Because the canvas uses alpha: true, the globe sphere covers the
 * centre while the Switch is visible around it in the transparent regions.
 *
 * Layout (portrait):
 *   [Top JoyCon    — blue, wide, short ]
 *   [Console body  — narrow, tall      ]
 *   [Bottom JoyCon — red,  wide, short ]
 *
 * Sizes:
 *   JoyCons  110 × 30 px
 *   Body     110 × 210 px
 *   Total    110 × 270 px
 */

export default function NintendoSwitch() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2,          // above canvas (1), below title overlays
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        opacity: 0.35,
        filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.7))",
      }}
    >
      <TopJoyCon />
      <PortraitBody />
      <BottomJoyCon />
    </div>
  );
}

// ─── Top JoyCon (blue) — wide, short, rounded top corners ────────────────────
function TopJoyCon() {
  return (
    <div
      style={{
        height: 30,
        background: "linear-gradient(180deg, #2DC4F0 0%, #1AACD8 100%)",
        borderRadius: "14px 14px 0 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.2)",
      }}
    >
      {/* Analog stick */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 32%, rgba(80,80,80,0.6), rgba(10,10,10,0.85))",
          border: "1.5px solid rgba(0,0,0,0.3)",
        }}
      />
      {/* − button + screenshot */}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <div style={{ width: 12, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.3)" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(0,0,0,0.18)" }} />
      </div>
    </div>
  );
}

// ─── Console body ─────────────────────────────────────────────────────────────
function PortraitBody() {
  return (
    <div
      style={{
        background: "#1C1C1E",
        padding: "8px 8px 6px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Screen bezel */}
      <div
        style={{
          width: 94,
          height: 160,
          background: "#000",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Juggling video fills the screen */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          <source src="/juggling.mp4" type="video/mp4" />
          <source src="/juggling.webm" type="video/webm" />
        </video>
        {/* Screen glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
          }}
        />
      </div>
      {/* Home button */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 5 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Bottom JoyCon (red) — wide, short, rounded bottom corners ────────────────
function BottomJoyCon() {
  return (
    <div
      style={{
        height: 30,
        background: "linear-gradient(180deg, #E4000F 0%, #C20010 100%)",
        borderRadius: "0 0 14px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        boxShadow: "inset 0 3px 6px rgba(0,0,0,0.2)",
      }}
    >
      {/* + button + home */}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(0,0,0,0.18)" }} />
        <div style={{ width: 12, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.3)" }} />
      </div>
      {/* Analog stick */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 32%, rgba(80,80,80,0.6), rgba(10,10,10,0.85))",
          border: "1.5px solid rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}
