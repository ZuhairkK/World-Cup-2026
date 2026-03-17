/**
 * data/fifaSoundtracks.ts
 *
 * FIFA / EA Sports FC iconic soundtrack editions.
 *
 * Audio: HTML5 <audio> element — place .mp3 files in /public/music/
 * and set the `src` field on each track accordingly.
 * Filenames with spaces are fine — the player calls encodeURI() before use.
 *
 * chipImage: shown in the 46×46 album art chip and changes per track.
 * Use one of: /player-ronaldo.jpg, /player-messi.jpg, /music-ui-reference.jpg
 */

export interface FifaTrack {
  title:     string;   // e.g. "Song 2"
  artist:    string;   // e.g. "Blur"
  /** Path relative to /public — e.g. "/music/blur-song2.mp3". Spaces OK. */
  src:       string;
  /** Image shown in the album art chip for this specific track */
  chipImage: string;
}

export interface FifaEdition {
  id:             string;
  year:           number;
  title:          string;       // e.g. "FIFA 98"
  subtitle:       string;       // e.g. "Road to World Cup"
  accentColor:    string;
  accentColor2:   string;
  /** Image shown in the 46×46 album art chip */
  chipImage:      string;
  /** Optional blurred background image behind the frosted glass */
  footballerImage?: string;
  tracks:         FifaTrack[];
}

// ─── Chip images — rotate across tracks ───────────────────────────────────────
const RONALDO   = "/player-ronaldo.jpg";
const MESSI     = "/player-messi.jpg";
const MUSIC_REF = "/music-ui-reference.png";

export const FIFA_EDITIONS: FifaEdition[] = [
  {
    id:             "wc-anthems",
    year:           2026,
    title:          "World Cup 2026",
    subtitle:       "Match Day Anthems",
    accentColor:    "#D4A017",
    accentColor2:   "#1a237e",
    chipImage:      RONALDO,         // fallback — overridden per track
    footballerImage: RONALDO,
    tracks: [
      {
        title: "On Top Of The World", artist: "Imagine Dragons", chipImage: RONALDO,
        src: "/music/Imagine Dragons - On Top Of The World (Official Music Video) - ImagineDragons (128k).mp3",
      },
      {
        title: "Love Me Again", artist: "John Newman", chipImage: MESSI,
        src: "/music/John Newman - Love Me Again - John Newman (128k).mp3",
      },
      {
        title: "Kids", artist: "MGMT", chipImage: MUSIC_REF,
        src: "/music/MGMT - Kids (Official HD Video) - MGMT (128k).mp3",
      },
      {
        title: "KU LO SA", artist: "Oxlade", chipImage: RONALDO,
        src: "/music/Oxlade - KU LO SA A COLORS SHOW - COLORS (128k).mp3",
      },
      {
        title: "Waka Waka", artist: "Shakira", chipImage: MESSI,
        src: "/music/Shakira - Waka Waka (This Time for Africa) (The Official 2010 FIFA World Cup™ Song) - Shakira (128k).mp3",
      },
    ],
  },
  {
    id:             "fifa-2002",
    year:           2002,
    title:          "FIFA 2002",
    subtitle:       "Road to FIFA World Cup",
    accentColor:    "#880e4f",
    accentColor2:   "#212121",
    chipImage:      MESSI,
    footballerImage: MESSI,
    tracks: [
      { title: "19-2000 (Soulchild Remix)", artist: "Gorillaz",    chipImage: RONALDO,   src: "/music/gorillaz-19-2000.mp3" },
      { title: "Flight 643",                artist: "DJ Tiësto",   chipImage: MESSI,     src: "/music/tiesto-flight-643.mp3" },
      { title: "Redemption",                artist: "Conjure One", chipImage: MUSIC_REF, src: "/music/conjure-one-redemption.mp3" },
      { title: "Stop and Panic",            artist: "Cirrus",      chipImage: RONALDO,   src: "/music/cirrus-stop-and-panic.mp3" },
    ],
  },
  {
    id:             "fifa-street-2005",
    year:           2005,
    title:          "FIFA Street",
    subtitle:       "World Tour",
    accentColor:    "#e65100",
    accentColor2:   "#f9a825",
    chipImage:      MUSIC_REF,
    footballerImage: RONALDO,
    tracks: [
      { title: "Stand Up Tall", artist: "Dizzee Rascal",           chipImage: MESSI,     src: "/music/dizzee-stand-up-tall.mp3" },
      { title: "Jin Go Lo Ba",  artist: "Fatboy Slim",             chipImage: MUSIC_REF, src: "/music/fatboy-slim-jin-go-lo-ba.mp3" },
      { title: "Uprising",      artist: "Artificial Intelligence", chipImage: RONALDO,   src: "/music/ai-uprising.mp3" },
      { title: "The Feeling",   artist: "Baobinga & I.D.",         chipImage: MESSI,     src: "/music/baobinga-the-feeling.mp3" },
    ],
  },
  {
    id:             "fifa-06",
    year:           2006,
    title:          "FIFA 06",
    subtitle:       "Official Soundtrack",
    accentColor:    "#0d47a1",
    accentColor2:   "#1b5e20",
    chipImage:      RONALDO,
    footballerImage: MESSI,
    tracks: [
      { title: "Helicopter",                       artist: "Bloc Party",      chipImage: MUSIC_REF, src: "/music/bloc-party-helicopter.mp3" },
      { title: "Daft Punk Is Playing at My House", artist: "LCD Soundsystem", chipImage: RONALDO,   src: "/music/lcd-daft-punk.mp3" },
      { title: "Lyla",                             artist: "Oasis",           chipImage: MESSI,     src: "/music/oasis-lyla.mp3" },
      { title: "Welcome to Jamrock",               artist: "Damian Marley",   chipImage: MUSIC_REF, src: "/music/damian-marley-jamrock.mp3" },
    ],
  },
  {
    id:             "fifa-10",
    year:           2010,
    title:          "FIFA 10",
    subtitle:       "Official Soundtrack",
    accentColor:    "#1b5e20",
    accentColor2:   "#212121",
    chipImage:      MESSI,
    footballerImage: RONALDO,
    tracks: [
      { title: "Gold Guns Girls",        artist: "Metric",               chipImage: RONALDO,   src: "/music/metric-gold-guns-girls.mp3" },
      { title: "Hold the Line",          artist: "Major Lazer",          chipImage: MESSI,     src: "/music/major-lazer-hold-the-line.mp3" },
      { title: "Moth's Wings",           artist: "Passion Pit",          chipImage: MUSIC_REF, src: "/music/passion-pit-moths-wings.mp3" },
      { title: "Nothing to Worry About", artist: "Peter Bjorn and John", chipImage: RONALDO,   src: "/music/pbj-nothing-to-worry.mp3" },
      { title: "Daylight",               artist: "Matt & Kim",           chipImage: MESSI,     src: "/music/matt-kim-daylight.mp3" },
    ],
  },
  {
    id:             "fifa-14",
    year:           2014,
    title:          "FIFA 14",
    subtitle:       "Official Soundtrack",
    accentColor:    "#4a148c",
    accentColor2:   "#b71c1c",
    chipImage:      MUSIC_REF,
    footballerImage: MESSI,
    tracks: [
      { title: "Love Me Again", artist: "John Newman",     chipImage: MUSIC_REF, src: "/music/john-newman-love-me-again.mp3" },
      { title: "F For You",     artist: "Disclosure",      chipImage: RONALDO,   src: "/music/disclosure-f-for-you.mp3" },
      { title: "Worship You",   artist: "Vampire Weekend", chipImage: MESSI,     src: "/music/vampire-weekend-worship-you.mp3" },
      { title: "The City",      artist: "The 1975",        chipImage: MUSIC_REF, src: "/music/the-1975-the-city.mp3" },
      { title: "We Sink",       artist: "Chvrches",        chipImage: RONALDO,   src: "/music/chvrches-we-sink.mp3" },
    ],
  },
  {
    id:             "fifa-18",
    year:           2018,
    title:          "FIFA 18",
    subtitle:       "Official Soundtrack",
    accentColor:    "#006064",
    accentColor2:   "#1a237e",
    chipImage:      RONALDO,
    footballerImage: RONALDO,
    tracks: [
      { title: "Supercut",      artist: "Lorde",          chipImage: MESSI,     src: "/music/lorde-supercut.mp3" },
      { title: "Dangerous",     artist: "The XX",         chipImage: MUSIC_REF, src: "/music/the-xx-dangerous.mp3" },
      { title: "Deadcrush",     artist: "alt-J",          chipImage: RONALDO,   src: "/music/alt-j-deadcrush.mp3" },
      { title: "Mean Demeanor", artist: "Run The Jewels", chipImage: MESSI,     src: "/music/rtj-mean-demeanor.mp3" },
    ],
  },
  {
    id:             "fifa-22",
    year:           2022,
    title:          "FIFA 22",
    subtitle:       "Official Soundtrack",
    accentColor:    "#37474f",
    accentColor2:   "#6a1b9a",
    chipImage:      MESSI,
    footballerImage: MESSI,
    tracks: [
      { title: "I Don't Wanna Talk",         artist: "Glass Animals",          chipImage: MUSIC_REF, src: "/music/glass-animals-dont-wanna-talk.mp3" },
      { title: "Lifetime",                   artist: "Swedish House Mafia",    chipImage: RONALDO,   src: "/music/shm-lifetime.mp3" },
      { title: "The Darkness That You Fear", artist: "The Chemical Brothers",  chipImage: MESSI,     src: "/music/chemical-brothers-darkness.mp3" },
      { title: "skeletons",                  artist: "Easy Life",              chipImage: MUSIC_REF, src: "/music/easy-life-skeletons.mp3" },
      { title: "Fear No Man",                artist: "Little Simz",            chipImage: RONALDO,   src: "/music/little-simz-fear-no-man.mp3" },
    ],
  },
  {
    id:             "ea-fc-25",
    year:           2025,
    title:          "EA FC 25",
    subtitle:       "Official Soundtrack",
    accentColor:    "#004d40",
    accentColor2:   "#00838f",
    chipImage:      MUSIC_REF,
    footballerImage: RONALDO,
    tracks: [
      { title: "CHIHIRO",              artist: "Billie Eilish",  chipImage: MESSI,     src: "/music/billie-eilish-chihiro.mp3" },
      { title: "Sympathy is a knife",  artist: "Charli xcx",     chipImage: MUSIC_REF, src: "/music/charli-xcx-sympathy.mp3" },
      { title: "Girl Feels Good",      artist: "FKA twigs",      chipImage: RONALDO,   src: "/music/fka-twigs-girl-feels-good.mp3" },
      { title: "She's Gone, Dance On", artist: "Disclosure",     chipImage: MESSI,     src: "/music/disclosure-shes-gone.mp3" },
      { title: "Starburster",          artist: "Fontaines D.C.", chipImage: MUSIC_REF, src: "/music/fontaines-starburster.mp3" },
    ],
  },
];
