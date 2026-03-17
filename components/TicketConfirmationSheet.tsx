"use client";

/**
 * TicketConfirmationSheet.tsx
 *
 * Apple-style white bottom sheet that fires when a fan selects a stadium
 * on the globe. Inspired by the real-world incident where a fan went to the
 * wrong stadium — this confirms the fan is going to the RIGHT venue before
 * route planning loads.
 *
 * Flow:
 *   1. Fan taps stadium on globe
 *   2. Sheet slides up (over globe, before map transition)
 *   3. Fan enters match ID or picks from the list
 *   4. Match details confirm venue, date, kickoff
 *   5. "Get Directions" → triggers the normal globe→map transition
 *   6. "Explore without ticket" → same transition, no match locked
 *
 * QR scanning is a placeholder — browser camera API can be wired here later.
 */

import { useState } from "react";
import type { Stadium } from "@/data/types";
import type { Match } from "@/data/matches";
import { getMatchesForStadium, getMatchById, formatMatchDate } from "@/data/matches";

function MatchupFlags({ match, size = "lg" }: { match: Match; size?: "sm" | "lg" }) {
  const isTbd = match.homeTeam === "TBD";
  const flagSize = size === "lg" ? 48 : 28;
  const nameSize = size === "lg" ? 13 : 11;
  const vsSize   = size === "lg" ? 15 : 11;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: size === "lg" ? 16 : 10 }}>
      {/* Home */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: size === "lg" ? 72 : 48 }}>
        {match.homeTeamFlag
          ? <img src={`/flags/${match.homeTeamFlag}.png`} alt={match.homeTeam} style={{ width: flagSize, height: flagSize * 0.67, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(0,0,0,0.1)" }} />
          : <div style={{ width: flagSize, height: flagSize * 0.67, background: "#e5e5ea", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: flagSize * 0.4, color: "#8e8e93" }}>?</div>
        }
        {!isTbd && (
          <span style={{ fontSize: nameSize, fontWeight: 700, color: "#1c1c1e", textAlign: "center", lineHeight: 1.2 }}>
            {match.homeTeam}
          </span>
        )}
      </div>

      {/* VS */}
      <span style={{ fontSize: vsSize, fontWeight: 800, color: "#8e8e93", letterSpacing: "0.05em" }}>
        {isTbd ? "TBD" : "VS"}
      </span>

      {/* Away */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: size === "lg" ? 72 : 48 }}>
        {match.awayTeamFlag
          ? <img src={`/flags/${match.awayTeamFlag}.png`} alt={match.awayTeam} style={{ width: flagSize, height: flagSize * 0.67, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(0,0,0,0.1)" }} />
          : <div style={{ width: flagSize, height: flagSize * 0.67, background: "#e5e5ea", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: flagSize * 0.4, color: "#8e8e93" }}>?</div>
        }
        {!isTbd && (
          <span style={{ fontSize: nameSize, fontWeight: 700, color: "#1c1c1e", textAlign: "center", lineHeight: 1.2 }}>
            {match.awayTeam}
          </span>
        )}
      </div>
    </div>
  );
}

interface TicketConfirmationSheetProps {
  stadium: Stadium;
  onConfirm: (match: Match | null) => void;  // null = skipped
  onDismiss: () => void;                      // user cancelled / went back
}

export default function TicketConfirmationSheet({
  stadium,
  onConfirm,
  onDismiss,
}: TicketConfirmationSheetProps) {
  const [matchId, setMatchId]           = useState("");
  const [confirmedMatch, setConfirmed]  = useState<Match | null>(null);
  const [error, setError]               = useState("");

  const matches = getMatchesForStadium(stadium.id);

  const handleLookup = () => {
    const found = getMatchById(matchId.trim().toUpperCase());
    if (!found) {
      setError("Match ID not found. Check your ticket and try again.");
      setConfirmed(null);
      return;
    }
    if (found.stadiumId !== stadium.id) {
      setError(
        `⚠ That match is at ${found.stadiumName} in ${found.city} — not ${stadium.name}. Check your ticket!`
      );
      setConfirmed(null);
      return;
    }
    setError("");
    setConfirmed(found);
  };

  const handleSelectFromList = (match: Match) => {
    setMatchId(match.id);
    setConfirmed(match);
    setError("");
  };

  return (
    // ── Full-screen backdrop ──────────────────────────────────────────────────
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      {/* ── White sheet ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "0 0 env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.3)",
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e0e0e0" }} />
        </div>

        <div style={{ padding: "8px 24px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#8e8e93", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Confirm Your Match
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1c1c1e", margin: 0, lineHeight: 1.2 }}>
              {stadium.name}
            </h2>
            <p style={{ fontSize: 14, color: "#8e8e93", margin: "4px 0 0" }}>
              {stadium.city}, Canada
            </p>
          </div>

          {/* Venue confirmation badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: "#f2f2f7",
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 28 }}>🏟</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e", margin: 0 }}>
                You are planning routes to:
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#007aff", margin: "2px 0 0" }}>
                {stadium.name} · {stadium.city}
              </p>
            </div>
          </div>

          {/* Match ID input */}
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e", margin: "0 0 8px" }}>
            Enter your Match ID
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={matchId}
              onChange={(e) => { setMatchId(e.target.value.toUpperCase()); setError(""); setConfirmed(null); }}
              placeholder="e.g. WC26-YVR-01"
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "1.5px solid #e0e0e0",
                borderRadius: 10,
                fontSize: 15,
                fontFamily: "monospace",
                color: "#1c1c1e",
                outline: "none",
                background: "#fafafa",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
            />
            <button
              onClick={handleLookup}
              style={{
                padding: "12px 18px",
                background: "#007aff",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Find
            </button>
          </div>

          {/* QR placeholder */}
          <button
            style={{
              width: "100%",
              padding: "10px",
              border: "1.5px dashed #c7c7cc",
              borderRadius: 10,
              background: "#f9f9fb",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
              color: "#8e8e93",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 18 }}>📷</span>
            Scan ticket QR code (coming soon)
          </button>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fff1f0",
                border: "1px solid #ffccc7",
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 13, color: "#cf1322", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Confirmed match card */}
          {confirmedMatch && (
            <div
              style={{
                padding: "16px 14px",
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Match confirmed!</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#8e8e93", fontFamily: "monospace" }}>{confirmedMatch.id}</span>
              </div>
              <MatchupFlags match={confirmedMatch} size="lg" />
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #bbf7d0", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#48484a", margin: "0 0 2px" }}>
                  {formatMatchDate(confirmedMatch.date)} · {confirmedMatch.kickoff} local
                </p>
                <p style={{ fontSize: 13, color: "#48484a", margin: "0 0 2px" }}>
                  {confirmedMatch.stadiumName} · {confirmedMatch.city}
                </p>
                <p style={{ fontSize: 12, color: "#8e8e93", margin: 0 }}>
                  {confirmedMatch.groupOrRound}
                </p>
              </div>
            </div>
          )}

          {/* Matches at this stadium — quick pick list */}
          {!confirmedMatch && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1e", margin: "0 0 8px" }}>
                Or pick your match at {stadium.name}:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectFromList(m)}
                    style={{
                      padding: "12px 14px",
                      background: "#f2f2f7",
                      border: "1.5px solid transparent",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = "#e8e8ed"; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = "#f2f2f7"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#636366" }}>{m.round}</span>
                      <span style={{ fontSize: 10, color: "#8e8e93", fontFamily: "monospace" }}>{m.id}</span>
                    </div>
                    <MatchupFlags match={m} size="sm" />
                    <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 8, textAlign: "center" }}>
                      {formatMatchDate(m.date)} · {m.kickoff}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* CTA buttons */}
          <button
            onClick={() => onConfirm(confirmedMatch)}
            style={{
              width: "100%",
              padding: "16px",
              background: "#007aff",
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            {confirmedMatch ? "✓ Confirm Match" : "Continue without match"}
          </button>

          <button
            onClick={onDismiss}
            style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#8e8e93",
              border: "none",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Slide-up keyframe */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
