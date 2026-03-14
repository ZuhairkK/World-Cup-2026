/**
 * FIFA / EA Sports FC iconic soundtrack editions.
 *
 * Each edition has:
 *  - A YouTube playlist ID (replace placeholders with real IDs)
 *  - A curated list of notable tracks for the tracklist display
 *  - An accent colour used as the gradient cover art background
 *
 * To find the real YouTube playlist ID:
 *   Search "FIFA [year] full soundtrack playlist" on YouTube,
 *   open the playlist, and copy the ID from the URL: ?list=XXXXX
 */

export interface FifaEdition {
  id: string;
  year: number;
  title: string;          // Display title, e.g. "FIFA 98" or "EA FC 25"
  subtitle: string;       // Subtitle shown in tracklist panel
  playlistId: string;     // YouTube playlist ID — replace with real value
  accentColor: string;    // CSS gradient stop colour for cover art
  accentColor2: string;   // Secondary gradient colour
  tracks: string[];       // 4–6 notable track titles for display
  /**
   * Optional footballer background image for the Apple Music–style player.
   * Path relative to /public (e.g. "/maxresdefault%20(1).jpg").
   * When absent the player falls back to the accentColor gradient.
   */
  footballerImage?: string;
}

// Footballer background images — two available, alternated across editions so
// every card always has a player photo. Inside a quoted CSS url() parentheses
// are safe; only spaces need %20 encoding.
const RONALDO = "/maxresdefault%20(1).jpg"; // FIFA Street 2, Ronaldo (Portugal kit)
const MESSI   = "/download%20(1).jpg";      // FIFA Street 2012 cover, Messi

export const FIFA_EDITIONS: FifaEdition[] = [
  {
    id: "fifa-98",
    year: 1998,
    title: "FIFA 98",
    subtitle: "Road to World Cup",
    playlistId: "PLplaceholder_98",
    accentColor: "#1a237e",
    accentColor2: "#b71c1c",
    footballerImage: RONALDO,
    tracks: [
      "Chumbawamba — Tubthumping",
      "Blur — Song 2",
      "New Found Glory — All Downhill From Here",
      "Semisonic — FNT",
      "Fatboy Slim — The Rockafeller Skank",
    ],
  },
  {
    id: "fifa-2002",
    year: 2002,
    title: "FIFA 2002",
    subtitle: "Road to FIFA World Cup",
    playlistId: "PLplaceholder_2002",
    accentColor: "#880e4f",
    accentColor2: "#212121",
    footballerImage: MESSI,
    tracks: [
      "Oxide & Neutrino — No Good 4 Me",
      "Basement Jaxx — Where's Your Head At",
      "White Stripes — Fell in Love with a Girl",
      "Gorillaz — 5/4",
      "Queens of the Stone Age — No One Knows",
    ],
  },
  {
    id: "fifa-street-2005",
    year: 2005,
    title: "FIFA Street",
    subtitle: "World Tour",
    playlistId: "PLplaceholder_street05",
    accentColor: "#e65100",
    accentColor2: "#f9a825",
    footballerImage: RONALDO, // Ronaldo in Portugal kit — matches this era
    tracks: [
      "N.E.R.D. — Lap of Luxury",
      "Audioweb — Policeman",
      "Outkast — The Way You Move",
      "Spankrock — Bump",
      "E-40 — Tell Me When To Go",
    ],
  },
  {
    id: "fifa-06",
    year: 2006,
    title: "FIFA 06",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_06",
    accentColor: "#0d47a1",
    accentColor2: "#1b5e20",
    footballerImage: MESSI,
    tracks: [
      "Bloc Party — Helicopter",
      "The Killers — Somebody Told Me",
      "Athlete — Wires",
      "Kaiser Chiefs — I Predict a Riot",
      "Franz Ferdinand — Do You Want To",
    ],
  },
  {
    id: "fifa-10",
    year: 2010,
    title: "FIFA 10",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_10",
    accentColor: "#1b5e20",
    accentColor2: "#212121",
    footballerImage: RONALDO,
    tracks: [
      "Dizzee Rascal — Bonkers",
      "Empire of the Sun — Walking on a Dream",
      "Them Crooked Vultures — New Fang",
      "Gorillaz — Stylo",
      "Vampire Weekend — Cousins",
    ],
  },
  {
    id: "fifa-14",
    year: 2014,
    title: "FIFA 14",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_14",
    accentColor: "#4a148c",
    accentColor2: "#b71c1c",
    footballerImage: MESSI, // Messi peak era — FIFA Street 2012 cover
    tracks: [
      "Imagine Dragons — Radioactive",
      "Bastille — Pompeii",
      "The 1975 — Chocolate",
      "Alt-J — Tessellate",
      "Arctic Monkeys — Why'd You Only Call Me When You're High?",
    ],
  },
  {
    id: "fifa-18",
    year: 2018,
    title: "FIFA 18",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_18",
    accentColor: "#006064",
    accentColor2: "#1a237e",
    footballerImage: RONALDO,
    tracks: [
      "Liam Gallagher — For What It's Worth",
      "Imagine Dragons — Whatever It Takes",
      "Stormzy — Blinded By Your Grace",
      "Khalid — Location",
      "Charli XCX — Boys",
    ],
  },
  {
    id: "fifa-22",
    year: 2022,
    title: "FIFA 22",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_22",
    accentColor: "#37474f",
    accentColor2: "#6a1b9a",
    footballerImage: MESSI,
    tracks: [
      "Glass Animals — Heat Waves",
      "Surfaces — Sunday Best",
      "doja cat — Need to Know",
      "beabadoobee — Last Day on Earth",
      "Pa Salieu — Frontline",
    ],
  },
  {
    id: "ea-fc-25",
    year: 2025,
    title: "EA FC 25",
    subtitle: "Official Soundtrack",
    playlistId: "PLplaceholder_fc25",
    accentColor: "#004d40",
    accentColor2: "#00838f",
    footballerImage: RONALDO,
    tracks: [
      "FKA twigs — Drums of Death",
      "Nemzzz — Freestyle",
      "Seun Kuti & Egypt 80 — K.O.N.K.",
      "Overmono — So U Kno",
      "Nkosi — Turn Up",
    ],
  },
];
