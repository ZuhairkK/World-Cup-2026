"use client";

/**
 * MusicPlayer.tsx
 *
 * Apple Music–style white/frosted glass music player, mounted bottom-left
 * on the map view.
 *
 * Two stacked cards:
 *  • Top card  — blurred footballer background image (or accent gradient) +
 *                frosted white overlay + album art chip + track/artist info +
 *                progress bar + shuffle / prev / pause / next / repeat controls.
 *  • Bottom card — edition title + "tracklist" blue tag + track list rows.
 *
 * Footballer background fades out during the edition-flip and fades back in
 * once the new edition is set, giving a smooth cross-fade effect.
 *
 * Audio: YouTube IFrame Player API (hidden 1×1 div). Replace playlist IDs in
 * data/fifaSoundtracks.ts with real YouTube playlist IDs to enable playback.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { FIFA_EDITIONS, type FifaEdition } from "@/data/fifaSoundtracks";

// ─── Minimal TypeScript types for the YouTube IFrame API ──────────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  loadPlaylist(opts: { listType: string; list: string; index?: number }): void;
  getPlayerState(): number;
  getVideoData(): { title: string; author: string };
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        id: string,
        opts: {
          height: string | number;
          width: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: 1; PAUSED: 2; ENDED: 0; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MusicPlayer() {
  const [isVisible, setIsVisible]       = useState(true);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [editionIndex, setEditionIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState("");
  const [isFlipping, setIsFlipping]     = useState(false);
  const [flipDir, setFlipDir]           = useState<"left" | "right">("right");

  const playerRef     = useRef<YTPlayer | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const flipTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const edition: FifaEdition = FIFA_EDITIONS[editionIndex];
  const hasRealPlaylist = !edition.playlistId.startsWith("PLplaceholder");

  // ── Load YouTube IFrame API + cleanup ───────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    return () => {
      flipTimersRef.current.forEach(clearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch (_) { /* noop */ }
      playerRef.current = null;
    };
  }, []);

  // ── Initialize YT player for a given edition index ──────────────────────────
  const initPlayer = useCallback((idx: number) => {
    const ed = FIFA_EDITIONS[idx];
    if (ed.playlistId.startsWith("PLplaceholder")) return;

    const setup = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) { /* noop */ }
        playerRef.current = null;
      }
      playerRef.current = new window.YT!.Player("yt-hidden-player", {
        height: "1",
        width: "1",
        playerVars: { listType: "playlist", list: ed.playlistId, autoplay: 1, controls: 0 },
        events: {
          onStateChange: (e) => {
            const playing = e.data === 1;
            setIsPlaying(playing);
            if (playing) {
              try {
                const data = e.target.getVideoData();
                setCurrentTrack(data.title || ed.tracks[0]);
              } catch (_) {
                setCurrentTrack(ed.tracks[0]);
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      setup();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setup();
        }
      }, 200);
    }
  }, []);

  // ── Play / Pause ─────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) {
      initPlayer(editionIndex);
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, editionIndex, initPlayer]);

  // ── Edition flip ─────────────────────────────────────────────────────────────
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
        setCurrentTrack("");
        if (isPlaying) initPlayer(nextIdx);
      }, 200);
      const t2 = setTimeout(() => setIsFlipping(false), 420);
      flipTimersRef.current = [t1, t2];
    },
    [isFlipping, editionIndex, isPlaying, initPlayer]
  );

  // ── Album art chip flip style (3-D card flip on edition change) ──────────────
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

  // ── Footballer background opacity — fades out while flipping, fades in after ─
  const bgOpacity = isFlipping ? 0 : 1;

  if (!isVisible) {
    return <ShowButton onClick={() => setIsVisible(true)} />;
  }

  // ── Track display strings ────────────────────────────────────────────────────
  const trackTitle  = currentTrack || edition.tracks[0].split(" — ")[0];
  const trackArtist = currentTrack
    ? edition.subtitle
    : edition.tracks[0].split(" — ")[1] ?? edition.subtitle;

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
                  filter: "blur(22px) brightness(0.65) saturate(1.2)",
                  transform: "scale(1.12)", // prevent blurred edges showing
                }
              : {
                  background: `linear-gradient(135deg, ${edition.accentColor}, ${edition.accentColor2})`,
                  filter: "blur(0px) brightness(0.55)",
                }),
          }}
        />

        {/* White frosted glass overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        />

        {/* Content sits on top of the background layers */}
        <div style={{ position: "relative", padding: "16px 16px 14px" }}>

          {/* Close button — top right */}
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

          {/* Track info row: album art chip + title/artist + waveform */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              paddingRight: 28, // don't overlap close button
            }}
          >
            {/* Album art chip — flips on edition change */}
            <div
              style={{
                ...chipFlipStyle,
                width: 46,
                height: 46,
                borderRadius: 10,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${edition.accentColor}, ${edition.accentColor2})`,
                boxShadow: "0 3px 10px rgba(0,0,0,0.28)",
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Track title */}
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
                {trackTitle}
              </div>
              {/* Artist / subtitle */}
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
                {trackArtist}
              </div>
            </div>

            {/* Waveform bars — animate while playing */}
            <div
              style={{
                display: "flex",
                gap: 2,
                alignItems: "flex-end",
                height: 18,
                flexShrink: 0,
              }}
            >
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

          {/* Progress bar */}
          <div
            style={{
              position: "relative",
              height: 8,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Track */}
            <div
              style={{
                position: "absolute",
                inset: "3px 0",
                background: "rgba(0,0,0,0.12)",
                borderRadius: 2,
              }}
            />
            {/* Fill */}
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
            {/* Scrubber dot */}
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

          {/* Playback controls: shuffle / prev / play+pause / next / repeat */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Shuffle */}
            <LightCtrlBtn title="Shuffle">⇄</LightCtrlBtn>

            {/* Previous edition */}
            <LightCtrlBtn onClick={() => changeEdition("left")} title="Previous edition">
              |◀
            </LightCtrlBtn>

            {/* Play / Pause — filled circle */}
            <button
              onClick={hasRealPlaylist ? handlePlayPause : undefined}
              title={
                !hasRealPlaylist
                  ? "Add a YouTube playlist ID to fifaSoundtracks.ts"
                  : isPlaying
                  ? "Pause"
                  : "Play"
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: !hasRealPlaylist ? "rgba(0,0,0,0.1)" : "#1c1c1e",
                border: "none",
                color: !hasRealPlaylist ? "rgba(0,0,0,0.25)" : "white",
                fontSize: 15,
                cursor: hasRealPlaylist ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: hasRealPlaylist ? "0 2px 10px rgba(0,0,0,0.28)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {!hasRealPlaylist ? "—" : isPlaying ? "⏸" : "▶"}
            </button>

            {/* Next edition */}
            <LightCtrlBtn onClick={() => changeEdition("right")} title="Next edition">
              ▶|
            </LightCtrlBtn>

            {/* Repeat */}
            <LightCtrlBtn title="Repeat">↺</LightCtrlBtn>
          </div>
        </div>
      </div>

      {/* ── Bottom card: tracklist styled as lyrics panel ────────────────────── */}
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
        {/* Header: edition title + "tracklist" blue tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 3,
          }}
        >
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
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#007AFF",
              fontFamily: "var(--font-geist-sans), Arial, sans-serif",
            }}
          >
            tracklist
          </span>
        </div>

        {/* Edition subtitle — like a pronunciation line */}
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
          {edition.tracks.map((track, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color:
                  i === 0 && isPlaying
                    ? "#1c1c1e"
                    : "rgba(0,0,0,0.35)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
                fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {/* Playing indicator */}
              {i === 0 && isPlaying && (
                <span style={{ color: "#007AFF", fontSize: 8, flexShrink: 0 }}>
                  ♪
                </span>
              )}
              {track}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden YouTube player container (1×1, off-screen) */}
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          top: -9999,
          left: -9999,
        }}
        aria-hidden="true"
      >
        <div id="yt-hidden-player" />
      </div>
    </div>
  );
}

// ─── Light-theme control button ────────────────────────────────────────────────
function LightCtrlBtn({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        color: "rgba(0,0,0,0.55)",
        fontSize: 14,
        cursor: onClick ? "pointer" : "default",
        padding: "4px 6px",
        transition: "color 0.15s ease",
        lineHeight: 1,
        fontFamily: "Arial, sans-serif",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "#1c1c1e";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.55)";
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
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.97)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.85)";
      }}
    >
      <span style={{ fontSize: 14 }}>♪</span>
      Music
    </button>
  );
}
