"use client";

interface GlobeBackButtonProps {
  onClick: () => void;
}

export default function GlobeBackButton({ onClick }: GlobeBackButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Back to globe"
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px 8px 10px",
        background: "rgba(5, 5, 9, 0.9)",
        border: "2px solid var(--panel-border)",
        borderRadius: 0,
        cursor: "pointer",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(212, 160, 23, 0.12)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4A017";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(5, 5, 9, 0.9)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212, 160, 23, 0.35)";
      }}
    >
      {/* Home icon — matches FIFA Street WT top-left nav */}
      <span
        style={{
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 10L10 3L17 10V17C17 17.55 16.55 18 16 18H4C3.45 18 3 17.55 3 17V10Z"
            stroke="#D4A017"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 18V11H12V18"
            stroke="#D4A017"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        style={{
          fontFamily: "var(--street-font)",
          fontSize: 13,
          fontWeight: 800,
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "white",
        }}
      >
        Globe
      </span>
    </button>
  );
}
