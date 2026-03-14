# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Three UI upgrades: (1) a landscape Nintendo Switch centered on the globe landing page with the juggling video playing inside its screen, alongside the existing juggling figure; (2) a full Apple Music-style white/light music player with blurred world cup goat footballer backgrounds that swap per edition; (3) exact pixel-faithful recreation of the FIFA Street Canada Transport Guide UI — both the globe landing screen and the stadium map detail screen.

## Critical Decisions

- **Switch as overlay on globe:** `NintendoSwitch.tsx` is a new component rendered as an absolutely positioned overlay inside `Globe.tsx`, centered horizontally and vertically on screen, below stadium markers (z-index 3). The existing `JugglingAnimation` stays untouched.
- **Switch screen = juggling video:** The Switch screen div embeds a `<video>` pointing to `/juggling.mp4` — same source as `JugglingAnimation`, just presented inside the Switch frame.
- **Music player full restyle — no Switch widget:** `MusicPlayer.tsx` is redesigned to the Apple Music white light aesthetic. No Nintendo Switch inside the player. Two cards: top (blurred footballer bg + album art chip + track + artist + progress + controls), bottom (track title + "lyrics" label + tracklist).
- **Footballer images per edition:** `footballerImage` field added to `FifaEdition` interface. Ronaldo (`/maxresdefault%20(1).jpg`) → FIFA Street 2005 edition. Messi (`/download%20(1).jpg`) → FIFA 14 edition. Others use accent gradient fallback.
- **Globe landing — exact FIFA Street match:** `GlobeTitle` and `GlobeLabel` in `Globe.tsx` restyled to exactly match the reference: bold yellow `CANADA` (82px) + `TRANSPORT GUIDE`, city names row, `▶ CLICK A STADIUM TO EXPLORE` bottom prompt, EA Sports/FIFA Street badge bottom-left.
- **Map HUD — exact FIFA Street match:** `app/page.tsx` header replaced with "STADIUM: [NAME]" black strip + bold yellow name. `AnchorCarousel.tsx` tabs restyled with gold top-border accent. `ModeCards.tsx` changed from flex-row to 2×2 grid with 32px italic time numbers + `MIN` label.

---

## Tasks

- [x] 🟩 **Step 1: Nintendo Switch Component (Globe Landing)**
  - [x] 🟩 Create `components/NintendoSwitch.tsx` — landscape Switch shell (blue left JoyCon, grey body, red right JoyCon, ABXY + D-pad buttons, home/screenshot buttons)
  - [x] 🟩 Switch screen renders `<video src="/juggling.mp4" autoPlay loop muted playsInline>` filling the screen area
  - [x] 🟩 Mount `<NintendoSwitch />` inside `Globe.tsx` as an absolutely centered overlay (z-index 3, pointer-events none so globe interaction is unaffected)

- [x] 🟩 **Step 2: Music Player Redesign (Apple Music Light Style)**
  - [x] 🟩 Add `footballerImage` field to `FifaEdition` interface + assign Ronaldo/Messi images to matching editions in `data/fifaSoundtracks.ts`
  - [x] 🟩 Redesign `MusicPlayer.tsx` — top card: blurred footballer background image, frosted white overlay, album art chip + track/artist + progress bar + shuffle/prev/pause/next/repeat controls
  - [x] 🟩 Bottom card: edition title + "tracklist" blue tag + subtitle + track rows — white/frosted glass, light drop shadows
  - [x] 🟩 Footballer background cross-fades when edition changes (opacity 0→1 tied to `isFlipping` state)

- [x] 🟩 **Step 3: Globe Landing — Exact FIFA Street Match**
  - [x] 🟩 Restyle `GlobeTitle` in `Globe.tsx` — bold yellow 82px `CANADA`, `TRANSPORT GUIDE` below, `VANCOUVER · EDMONTON · TORONTO` city row
  - [x] 🟩 Restyle `GlobeLabel` — `▶ CLICK A STADIUM TO EXPLORE` white uppercase centered at bottom
  - [x] 🟩 EA Sports / FIFA Street badge added bottom-left in `GlobeLabel`
  - [x] 🟩 Globe background already near-black (`#0a0b0f`) — matches reference

- [x] 🟩 **Step 4: Map HUD — Exact FIFA Street Match**
  - [x] 🟩 HUD panel header in `app/page.tsx` replaced with black strip + "STADIUM:" small label + bold yellow stadium name (22px) + city sub-label
  - [x] 🟩 `AnchorCarousel.tsx` restyled — bolder "STARTING FROM" label, gold top-border accent on active tab, larger icons (20px)
  - [x] 🟩 `ModeCards.tsx` changed to 2×2 CSS grid, time numbers enlarged to 32px italic bold + `MIN` label, 4px colour accent strip at top of active card
