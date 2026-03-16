/**
 * data/matches.ts
 *
 * Static 2026 FIFA World Cup match schedule for the three Canadian host
 * stadiums. Used by the TicketConfirmationSheet to verify a fan is going
 * to the right venue before route planning begins.
 *
 * Match IDs follow the format: WC26-{CITY_CODE}-{MATCH_NUM}
 * e.g. WC26-YVR-01 = Vancouver, match 1
 *
 * NOTE: The official group draw has not been announced. Team names are
 * PLACEHOLDERS — update once FIFA releases the official schedule.
 * Dates and kickoff times are based on publicly confirmed tournament windows.
 */

export interface Match {
  id: string;            // e.g. "WC26-YVR-01"
  stadiumId: string;     // matches Stadium.id
  stadiumName: string;
  city: string;
  date: string;          // ISO 8601 date: "2026-06-12"
  kickoff: string;       // Local time: "19:00"
  round: string;         // "Group Stage · Matchday 1"
  homeTeam: string;      // Placeholder until draw
  awayTeam: string;
  homeTeamFlag?: string; // ISO 3166-1 alpha-2 lowercase, e.g. "ca"
  awayTeamFlag?: string;
  groupOrRound: string;  // "Group A" | "Round of 16" | "Quarter-Final" etc.
}

// ─── Vancouver — BC Place ─────────────────────────────────────────────────────

const VANCOUVER_MATCHES: Match[] = [
  {
    id: "WC26-YVR-01",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-06-12",
    kickoff: "18:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "Canada",
    awayTeam: "Mexico",
    homeTeamFlag: "ca",
    awayTeamFlag: "mx",
    groupOrRound: "Group A",
  },
  {
    id: "WC26-YVR-02",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-06-15",
    kickoff: "15:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "Brazil",
    awayTeam: "Germany",
    homeTeamFlag: "br",
    awayTeamFlag: "de",
    groupOrRound: "Group B",
  },
  {
    id: "WC26-YVR-03",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-06-19",
    kickoff: "21:00",
    round: "Group Stage · Matchday 2",
    homeTeam: "Argentina",
    awayTeam: "France",
    homeTeamFlag: "ar",
    awayTeamFlag: "fr",
    groupOrRound: "Group A",
  },
  {
    id: "WC26-YVR-04",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-06-26",
    kickoff: "18:00",
    round: "Group Stage · Matchday 3",
    homeTeam: "Portugal",
    awayTeam: "Spain",
    homeTeamFlag: "pt",
    awayTeamFlag: "es",
    groupOrRound: "Group B",
  },
  {
    id: "WC26-YVR-R16",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-07-03",
    kickoff: "19:00",
    round: "Round of 16",
    homeTeam: "TBD",
    awayTeam: "TBD",
    groupOrRound: "Round of 16",
  },
  {
    id: "WC26-YVR-QF",
    stadiumId: "bc-place",
    stadiumName: "BC Place",
    city: "Vancouver",
    date: "2026-07-11",
    kickoff: "19:00",
    round: "Quarter-Final",
    homeTeam: "TBD",
    awayTeam: "TBD",
    groupOrRound: "Quarter-Final",
  },
];

// ─── Toronto — BMO Field ──────────────────────────────────────────────────────

const TORONTO_MATCHES: Match[] = [
  {
    id: "WC26-TOR-01",
    stadiumId: "bmo-field",
    stadiumName: "BMO Field",
    city: "Toronto",
    date: "2026-06-13",
    kickoff: "18:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "USA",
    awayTeam: "Canada",
    homeTeamFlag: "us",
    awayTeamFlag: "ca",
    groupOrRound: "Group C",
  },
  {
    id: "WC26-TOR-02",
    stadiumId: "bmo-field",
    stadiumName: "BMO Field",
    city: "Toronto",
    date: "2026-06-17",
    kickoff: "15:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "England",
    awayTeam: "Japan",
    homeTeamFlag: "gb",
    awayTeamFlag: "jp",
    groupOrRound: "Group D",
  },
  {
    id: "WC26-TOR-03",
    stadiumId: "bmo-field",
    stadiumName: "BMO Field",
    city: "Toronto",
    date: "2026-06-20",
    kickoff: "21:00",
    round: "Group Stage · Matchday 2",
    homeTeam: "Morocco",
    awayTeam: "Senegal",
    homeTeamFlag: "ma",
    awayTeamFlag: "sn",
    groupOrRound: "Group C",
  },
  {
    id: "WC26-TOR-04",
    stadiumId: "bmo-field",
    stadiumName: "BMO Field",
    city: "Toronto",
    date: "2026-06-25",
    kickoff: "18:00",
    round: "Group Stage · Matchday 3",
    homeTeam: "Netherlands",
    awayTeam: "Australia",
    homeTeamFlag: "nl",
    awayTeamFlag: "au",
    groupOrRound: "Group D",
  },
  {
    id: "WC26-TOR-R16",
    stadiumId: "bmo-field",
    stadiumName: "BMO Field",
    city: "Toronto",
    date: "2026-07-04",
    kickoff: "19:00",
    round: "Round of 16",
    homeTeam: "TBD",
    awayTeam: "TBD",
    groupOrRound: "Round of 16",
  },
];

// ─── Edmonton — Commonwealth Stadium ─────────────────────────────────────────

const EDMONTON_MATCHES: Match[] = [
  {
    id: "WC26-EDM-01",
    stadiumId: "commonwealth-stadium",
    stadiumName: "Commonwealth Stadium",
    city: "Edmonton",
    date: "2026-06-14",
    kickoff: "18:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "Mexico",
    awayTeam: "Iran",
    homeTeamFlag: "mx",
    awayTeamFlag: "ir",
    groupOrRound: "Group E",
  },
  {
    id: "WC26-EDM-02",
    stadiumId: "commonwealth-stadium",
    stadiumName: "Commonwealth Stadium",
    city: "Edmonton",
    date: "2026-06-18",
    kickoff: "15:00",
    round: "Group Stage · Matchday 1",
    homeTeam: "South Korea",
    awayTeam: "Saudi Arabia",
    homeTeamFlag: "kr",
    awayTeamFlag: "sa",
    groupOrRound: "Group F",
  },
  {
    id: "WC26-EDM-03",
    stadiumId: "commonwealth-stadium",
    stadiumName: "Commonwealth Stadium",
    city: "Edmonton",
    date: "2026-06-22",
    kickoff: "21:00",
    round: "Group Stage · Matchday 2",
    homeTeam: "South Africa",
    awayTeam: "Egypt",
    homeTeamFlag: "za",
    awayTeamFlag: "eg",
    groupOrRound: "Group E",
  },
  {
    id: "WC26-EDM-04",
    stadiumId: "commonwealth-stadium",
    stadiumName: "Commonwealth Stadium",
    city: "Edmonton",
    date: "2026-06-27",
    kickoff: "18:00",
    round: "Group Stage · Matchday 3",
    homeTeam: "Colombia",
    awayTeam: "Panama",
    homeTeamFlag: "co",
    awayTeamFlag: "pa",
    groupOrRound: "Group F",
  },
  {
    id: "WC26-EDM-R16",
    stadiumId: "commonwealth-stadium",
    stadiumName: "Commonwealth Stadium",
    city: "Edmonton",
    date: "2026-07-05",
    kickoff: "19:00",
    round: "Round of 16",
    homeTeam: "TBD",
    awayTeam: "TBD",
    groupOrRound: "Round of 16",
  },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const ALL_MATCHES: Match[] = [
  ...VANCOUVER_MATCHES,
  ...TORONTO_MATCHES,
  ...EDMONTON_MATCHES,
];

export function getMatchesForStadium(stadiumId: string): Match[] {
  return ALL_MATCHES.filter((m) => m.stadiumId === stadiumId);
}

export function getMatchById(id: string): Match | undefined {
  return ALL_MATCHES.find((m) => m.id === id);
}

/** Format a match date for display: "Friday, 12 June 2026" */
export function formatMatchDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
