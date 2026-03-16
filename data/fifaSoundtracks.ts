/**
 * FIFA / EA Sports FC iconic soundtrack editions.
 *
 * Each edition has:
 *  - The shared FIFA soundtracks compilation playlist ID
 *  - A curated list of verified notable tracks for the tracklist display
 *  - An accent colour used as the gradient cover art background
 *
 * Playlist: https://www.youtube.com/playlist?list=PL7cYcag24D04KK7GD4raNUWnEXQjzqgup
 * All editions point to the same compilation playlist so music always plays.
 */

export interface FifaEdition {
  id: string;
  year: number;
  title: string;          // Display title, e.g. "FIFA 98" or "EA FC 25"
  subtitle: string;       // Subtitle shown in tracklist panel
  playlistId: string;     // YouTube playlist ID
  accentColor: string;    // CSS gradient stop colour for cover art
  accentColor2: string;   // Secondary gradient colour
  tracks: string[];       // 4–6 verified track titles for display
  /**
   * Optional footballer background image for the Apple Music–style player.
   * Path relative to /public.
   * When absent the player falls back to the accentColor gradient.
   */
  footballerImage?: string;
}

// Footballer background images — two available, alternated across editions.
const RONALDO = "/player-ronaldo.jpg"; // FIFA Street 2, Ronaldo (Portugal kit)
const MESSI   = "/player-messi.jpg";   // FIFA Street 2012 cover, Messi

// Shared FIFA soundtracks compilation playlist — all editions use this.
const PLAYLIST_ID = "PL7cYcag24D04KK7GD4raNUWnEXQjzqgup";

export const FIFA_EDITIONS: FifaEdition[] = [
  {
    id: "fifa-98",
    year: 1998,
    title: "FIFA 98",
    subtitle: "Road to World Cup",
    playlistId: PLAYLIST_ID,
    accentColor: "#1a237e",
    accentColor2: "#b71c1c",
    footballerImage: RONALDO,
    tracks: [
      "Blur — Song 2",
      "The Crystal Method — Busy Child",
      "The Crystal Method — Keep Hope Alive",
      "The Crystal Method — More",
      "Electric Skychurch — Hugga Bear",
    ],
  },
  {
    id: "fifa-2002",
    year: 2002,
    title: "FIFA 2002",
    subtitle: "Road to FIFA World Cup",
    playlistId: PLAYLIST_ID,
    accentColor: "#880e4f",
    accentColor2: "#212121",
    footballerImage: MESSI,
    tracks: [
      "Gorillaz — 19-2000 (Soulchild Remix)",
      "DJ Tiësto — Flight 643",
      "BT — Never Gonna Come Back Down (Hybrid's Echoplex Dub)",
      "Conjure One — Redemption (Max Graham's Dead Sea Mix)",
      "Cirrus — Stop and Panic",
    ],
  },
  {
    id: "fifa-street-2005",
    year: 2005,
    title: "FIFA Street",
    subtitle: "World Tour",
    playlistId: PLAYLIST_ID,
    accentColor: "#e65100",
    accentColor2: "#f9a825",
    footballerImage: RONALDO,
    tracks: [
      "Dizzee Rascal — Stand Up Tall",
      "Fatboy Slim — Jin Go Lo Ba",
      "Artificial Intelligence — Uprising",
      "Baobinga & I.D. — The Feeling (Special Edit)",
      "Criminal Mindz — Baptised By Dub",
    ],
  },
  {
    id: "fifa-06",
    year: 2006,
    title: "FIFA 06",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#0d47a1",
    accentColor2: "#1b5e20",
    footballerImage: MESSI,
    tracks: [
      "Bloc Party — Helicopter",
      "LCD Soundsystem — Daft Punk Is Playing at My House",
      "Oasis — Lyla",
      "Jamiroquai — Feels Just Like It Should",
      "Damian Marley — Welcome to Jamrock",
    ],
  },
  {
    id: "fifa-10",
    year: 2010,
    title: "FIFA 10",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#1b5e20",
    accentColor2: "#212121",
    footballerImage: RONALDO,
    tracks: [
      "Metric — Gold Guns Girls",
      "Major Lazer ft. Mr. Lexx & Santigold — Hold the Line",
      "Passion Pit — Moth's Wings",
      "Peter Bjorn and John — Nothing to Worry About",
      "Matt & Kim — Daylight",
    ],
  },
  {
    id: "fifa-14",
    year: 2014,
    title: "FIFA 14",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#4a148c",
    accentColor2: "#b71c1c",
    footballerImage: MESSI,
    tracks: [
      "John Newman — Love Me Again",
      "Disclosure — F For You",
      "Vampire Weekend — Worship You",
      "The 1975 — The City",
      "Chvrches — We Sink",
    ],
  },
  {
    id: "fifa-18",
    year: 2018,
    title: "FIFA 18",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#006064",
    accentColor2: "#1a237e",
    footballerImage: RONALDO,
    tracks: [
      "Lorde — Supercut",
      "Avelino ft. Stormzy & Skepta — Energy",
      "The XX — Dangerous",
      "alt-J — Deadcrush",
      "Run The Jewels — Mean Demeanor",
    ],
  },
  {
    id: "fifa-22",
    year: 2022,
    title: "FIFA 22",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#37474f",
    accentColor2: "#6a1b9a",
    footballerImage: MESSI,
    tracks: [
      "Glass Animals — I Don't Wanna Talk",
      "Swedish House Mafia — Lifetime",
      "The Chemical Brothers — The Darkness That You Fear",
      "Easy Life — skeletons",
      "Little Simz — Fear No Man",
    ],
  },
  {
    id: "ea-fc-25",
    year: 2025,
    title: "EA FC 25",
    subtitle: "Official Soundtrack",
    playlistId: PLAYLIST_ID,
    accentColor: "#004d40",
    accentColor2: "#00838f",
    footballerImage: RONALDO,
    tracks: [
      "Billie Eilish — CHIHIRO",
      "Charli xcx — Sympathy is a knife",
      "FKA twigs — Girl Feels Good",
      "Disclosure — She's Gone, Dance On",
      "Fontaines D.C. — Starburster",
    ],
  },
];
