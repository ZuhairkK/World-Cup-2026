"use client";

/**
 * MusicPlayer.tsx
 *
 * Apple Music–style frosted-glass music player, mounted bottom-left.
 *
 * Audio: HTML5 <audio> element — no third-party API needed.
 * Drop .mp3 files into /public/music/ with filenames matching the
 * `src` fields in data/fifaSoundtracks.ts to enable playback.
 *
 * Controls:
 *  ⇄  Shuffle — randomises track order within the current edition
 *  |◀  Prev    — previous track (or restart if < 3 s in)
 *  ▶  Play / Pause
 *  ▶|  Next    — advance one track (respects shuffle order)
 *  ↺  Edition  — cycle through FIFA editions (prev / next buttons)
 *
 * Chip image: rotates through player-ronaldo.jpg, player-messi.jpg,
 * and music-ui-reference.jpg as defined per edition in fifaSoundtracks.ts.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { FIFA_EDITIONS, type FifaEdition } from "@/data/fifaSoundtracks";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new randomised array of indices */
function buildShuffleOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MusicPlayer() {
  const [isVisible, setIsVisible]       = useState(true);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [editionIndex, setEditionIndex] = useState(0);
  const [trackIndex, setTrackIndex]     = useState(0);
  const [isShuffled, setIsShuffled]     = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [isFlipping, setIsFlipping]     = useState(false);
  const [flipDir, setFlipDir]           = useState<"left" | "right">("right");

  // Refs to avoid stale closures inside audio event handlers
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef   = useRef(0);
  const editionIndexRef = useRef(0);
  const isShuffledRef   = useRef(false);
  const shuffleOrderRef = useRef<number[]>([]);
  const isPlayingRef    = useRef(false);
  const flipTimersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep refs in sync with state
  useEffect(() => { trackIndexRef.current   = trackIndex;   }, [trackIndex]);
  useEffect(() => { editionIndexRef.current = editionIndex; }, [editionIndex]);
  useEffect(() => { isShuffledRef.current   = isShuffled;   }, [isShuffled]);
  useEffect(() => { shuffleOrderRef.current = shuffleOrder; }, [shuffleOrder]);
  useEffect(() => { isPlayingRef.current    = isPlaying;    }, [isPlaying]);

  const edition      = FIFA_EDITIONS[editionIndex];
  const currentTrack = edition.tracks[trackIndex] ?? edition.tracks[0];

  // ── Create audio element once ──────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // Auto-advance when a track ends
    const handleEnded = () => {
      const tracks = FIFA_EDITIONS[editionIndexRef.current].tracks;
      const idx    = trackIndexRef.current;

      if (isShuffledRef.current) {
        const order = shuffleOrderRef.current;
        const pos   = order.indexOf(idx);
        setTrackIndex(order[(pos + 1) % order.length]);
      } else {
        setTrackIndex((idx + 1) % tracks.length);
      }
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // ── Load new src whenever edition or track changes ─────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const src = edition.tracks[trackIndex]?.src;
    if (!src) return;

    // encodeURI handles spaces and special chars in filenames
    audio.src = encodeURI(src);
    audio.load();

    if (isPlayingRef.current) {
      audio.play().catch(() => {
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionIndex, trackIndex]);

  // ── Play / Pause ─────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src) {
      // First press — load current track
      const src = FIFA_EDITIONS[editionIndexRef.current].tracks[trackIndexRef.current]?.src;
      if (!src) return;
      audio.src = encodeURI(src);
      audio.load();
    }

    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, []);

  // ── Next track ───────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const tracks = FIFA_EDITIONS[editionIndexRef.current].tracks;
    const idx    = trackIndexRef.current;

    if (isShuffledRef.current) {
      const order = shuffleOrderRef.current;
      const pos   = order.indexOf(idx);
      setTrackIndex(order[(pos + 1) % order.length]);
    } else {
      setTrackIndex((idx + 1) % tracks.length);
    }
  }, []);

  // ── Prev track ───────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    const audio  = audioRef.current;
    const tracks = FIFA_EDITIONS[editionIndexRef.current].tracks;
    const idx    = trackIndexRef.current;

    // If more than 3 s in, restart current track instead of going back
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (isShuffledRef.current) {
      const order = shuffleOrderRef.current;
      const pos   = order.indexOf(idx);
      setTrackIndex(order[(pos - 1 + order.length) % order.length]);
    } else {
      setTrackIndex((idx - 1 + tracks.length) % tracks.length);
    }
  }, []);

  // ── Shuffle toggle ───────────────────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        const order = buildShuffleOrder(
          FIFA_EDITIONS[editionIndexRef.current].tracks.length
        );
        setShuffleOrder(order);
        shuffleOrderRef.current = order;
      }
      return next;
    });
  }, []);

  // ── Edition change ───────────────────────────────────────────────────────
  const changeEdition = useCallback(
    (dir: "left" | "right") => {
      if (isFlipping) return;

      const nextIdx =
        dir === "right"
          ? (editionIndex + 1) % FIFA_EDITIONS.length
          : (editionIndex - 1 + FIFA_EDITIONS.length) % FIFA_EDITIONS.length;

      setFlipDir(dir);
      setIsFlipping(true);

      const t1 = setTimeout(() => {
        setEditionIndex(nextIdx);
        setTrackIndex(0);
        trackIndexRef.current   = 0;
        editionIndexRef.current = nextIdx;

        // Rebuild shuffle order for new edition
        if (isShuffledRef.current) {
          const order = buildShuffleOrder(FIFA_EDITIONS[nextIdx].tracks.length);
          setShuffleOrder(order);
          shuffleOrderRef.current = order;
        }
      }, 200);

      const t2 = setTimeout(() => setIsFlipping(false), 420);
      flipTimersRef.current = [t1, t2];
    },
    [isFlipping, editionIndex]
  );

  // Cleanup flip timers on unmount
  useEffect(() => () => { flipTimersRef.current.forEach(clearTimeout); }, []);

  // ── Chip flip animation style ─────────────────────────────────────────────
  const chipFlipStyle: React.CSSProperties = isFlipping
    ? {
        transform: `perspective(500px) rotateY(${flipDir === "right" ? "90deg" : "-90deg"})`,
        opacity: 0,
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }
    : {
        transform: "perspective(500px) rotateY(0deg)",
        opacity: 1,
        transition: "transform 0.22s ease, opacity 0.22s ease",
      };

  const bgOpacity = isFlipping ? 0 : 1;

  if (!isVisible) {
    return <ShowButton onClick={() => setIsVisible(true)} />;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 24,
        zIndex: 10,
        width: 340,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* ── Top card: player controls ───────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {/* Footballer background — blurred, fades during edition flip */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: bgOpacity,
            transition: "opacity 0.4s ease",
            ...(edition.footballerImage
              ? {
                  backgroundImage: `url('${edition.footballerImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  filter: "blur(12px) brightness(0.8) saturate(1.3)",
                  transform: "scale(1.12)",
                }
              : {
                  background: `linear-gradient(135deg, ${edition.accentColor}, ${edition.accentColor2})`,
                  filter: "brightness(0.55)",
                }),
          }}
        />

        {/* Frosted glass overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        <div style={{ position: "relative", padding: "16px 16px 14px" }}>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            title="Hide player"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(0,0,0,0.45)",
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Track info row: chip photo + title/artist + waveform */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              paddingRight: 28,
            }}
          >
            {/* Album art chip — shows player/reference photo, flips on edition change */}
            <div
              style={{
                ...chipFlipStyle,
                width: 46,
                height: 46,
                borderRadius: 10,
                flexShrink: 0,
                overflow: "hidden",
                boxShadow: "0 3px 10px rgba(0,0,0,0.28)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentTrack.chipImage}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1c1c1e",
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                }}
              >
                {currentTrack.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(0,0,0,0.5)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                  marginTop: 1,
                }}
              >
                {currentTrack.artist}
              </div>
            </div>

            {/* Waveform bars */}
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18, flexShrink: 0 }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={isPlaying ? `waveform-bar waveform-bar-${i}` : ""}
                  style={{
                    width: 3,
                    height: isPlaying ? undefined : `${5 + i * 3}px`,
                    background: "rgba(0,0,0,0.55)",
                    borderRadius: 2,
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress bar — cosmetic */}
          <div style={{ position: "relative", height: 8, marginBottom: 14, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", inset: "3px 0", background: "rgba(0,0,0,0.12)", borderRadius: 2 }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 3,
                bottom: 3,
                width: isPlaying ? "40%" : "18%",
                background: "#1c1c1e",
                transition: "width 3s linear",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: isPlaying ? "40%" : "18%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#1c1c1e",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                transition: "left 3s linear",
              }}
            />
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Shuffle */}
            <LightCtrlBtn
              onClick={handleShuffle}
              title={isShuffled ? "Shuffle on" : "Shuffle off"}
              active={isShuffled}
            >
              ⇄
            </LightCtrlBtn>

            {/* Previous edition (left) / Prev track (right click handled separately) */}
            <LightCtrlBtn onClick={handlePrev} title="Previous track">|◀</LightCtrlBtn>

            {/* Play / Pause */}
            <button
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#1c1c1e",
                border: "none",
                color: "white",
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
                transition: "all 0.15s ease",
              }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            {/* Next track */}
            <LightCtrlBtn onClick={handleNext} title="Next track">▶|</LightCtrlBtn>

            {/* Next edition */}
            <LightCtrlBtn onClick={() => changeEdition("right")} title="Next edition">↺</LightCtrlBtn>
          </div>
        </div>
      </div>

      {/* ── Bottom card: tracklist ───────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 18,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "14px 16px 16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1c1c1e",
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-geist-sans), Arial, sans-serif",
            }}
          >
            {edition.title}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#007AFF", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
            tracklist
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            color: "rgba(0,0,0,0.38)",
            fontStyle: "italic",
            marginBottom: 10,
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          }}
        >
          {edition.subtitle} · {edition.year}
        </div>

        {/* Track rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {edition.tracks.map((track, i) => {
            const isActive = i === trackIndex;
            return (
              <div
                key={track.src}
                style={{
                  fontSize: 12,
                  color: isActive && isPlaying ? "#1c1c1e" : "rgba(0,0,0,0.35)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
                onClick={() => setTrackIndex(i)}
              >
                {isActive && isPlaying && (
                  <span style={{ color: "#007AFF", fontSize: 8, flexShrink: 0 }}>♪</span>
                )}
                {track.title} — {track.artist}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Light-theme control button ────────────────────────────────────────────────
function LightCtrlBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick?: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        color: active ? "#007AFF" : "rgba(0,0,0,0.55)",
        fontSize: 14,
        cursor: onClick ? "pointer" : "default",
        padding: "4px 6px",
        transition: "color 0.15s ease",
        lineHeight: 1,
        fontFamily: "Arial, sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#1c1c1e";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.55)";
      }}
    >
      {children}
    </button>
  );
}

// ─── Show button — rendered when player is hidden ──────────────────────────────
function ShowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Show music player"
      style={{
        position: "absolute",
        bottom: 24,
        left: 24,
        zIndex: 10,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "none",
        borderRadius: 20,
        padding: "8px 14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        transition: "all 0.15s ease",
        fontSize: 13,
        color: "#1c1c1e",
        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
        fontWeight: 600,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.97)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.85)"; }}
    >
      <span style={{ fontSize: 14 }}>♪</span>
      Music
    </button>
  );
}
