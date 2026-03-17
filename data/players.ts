/**
 * data/players.ts
 *
 * Shared player registry used by PlayerShowcase (selection panel),
 * PlayerPin (map markers), and page.tsx (route state).
 */

export const PLAYERS = [
  {
    id:          "messi",
    name:        "Messi",
    nationality: "Argentina",
    /** Argentina sky-blue */
    accentColor: "#A8D8EA",
  },
  {
    id:          "ronaldo",
    name:        "Ronaldo",
    nationality: "Portugal",
    /** Portugal green */
    accentColor: "#1E9E3D",
  },
  {
    id:          "neymar",
    name:        "Neymar",
    nationality: "Brazil",
    /** Brazil yellow */
    accentColor: "#FFDD00",
  },
] as const;

export type PlayerId = typeof PLAYERS[number]["id"];
