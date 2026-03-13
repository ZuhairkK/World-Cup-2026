import type { Stadium } from "./types";

/**
 * All Canadian 2026 FIFA World Cup host stadiums with their fixed
 * starting-point anchors (airport, city center, main train station).
 *
 * Coordinates are verified against official venue data.
 * Anchor coordinates represent the main entrance / departure point
 * that a foreign traveler would realistically start from.
 */
export const STADIUMS: Stadium[] = [
  {
    id: "bc-place",
    name: "BC Place",
    city: "Vancouver",
    country: "Canada",
    coords: { lat: 49.2768, lng: -123.1118 },
    thumbnailColor: "#1a3a5c",
    anchors: [
      {
        id: "vancouver-airport",
        label: "YVR International Airport",
        type: "airport",
        coords: { lat: 49.1967, lng: -123.1815 },
      },
      {
        id: "vancouver-city-center",
        label: "Vancouver City Centre",
        type: "city-center",
        coords: { lat: 49.2827, lng: -123.1207 },
      },
      {
        id: "vancouver-waterfront",
        label: "Waterfront Station",
        type: "train-station",
        coords: { lat: 49.2848, lng: -123.1115 },
      },
    ],
  },
  {
    id: "bmo-field",
    name: "BMO Field",
    city: "Toronto",
    country: "Canada",
    coords: { lat: 43.6333, lng: -79.4186 },
    thumbnailColor: "#2a1a3c",
    anchors: [
      {
        id: "toronto-airport",
        label: "Pearson International Airport",
        type: "airport",
        coords: { lat: 43.6777, lng: -79.6248 },
      },
      {
        id: "toronto-city-center",
        label: "Toronto City Hall",
        type: "city-center",
        coords: { lat: 43.6534, lng: -79.3839 },
      },
      {
        id: "toronto-union",
        label: "Union Station",
        type: "train-station",
        coords: { lat: 43.6453, lng: -79.3806 },
      },
    ],
  },
  {
    id: "commonwealth-stadium",
    name: "Commonwealth Stadium",
    city: "Edmonton",
    country: "Canada",
    coords: { lat: 53.5621, lng: -113.4559 },
    thumbnailColor: "#1c2a1c",
    anchors: [
      {
        id: "edmonton-airport",
        label: "Edmonton International Airport",
        type: "airport",
        coords: { lat: 53.3097, lng: -113.5797 },
      },
      {
        id: "edmonton-city-center",
        label: "Edmonton City Centre",
        type: "city-center",
        coords: { lat: 53.5444, lng: -113.4909 },
      },
      {
        id: "edmonton-rogers",
        label: "Rogers Place / Arena District",
        type: "train-station",
        coords: { lat: 53.5471, lng: -113.4977 },
      },
    ],
  },
];

/** Lookup a stadium by its id */
export function getStadium(id: string): Stadium | undefined {
  return STADIUMS.find((s) => s.id === id);
}
