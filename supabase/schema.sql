-- ─── neighborhood_scores ──────────────────────────────────────────────────────
-- Stores transit access scores for neighbourhoods near each 2026 FIFA World Cup
-- Canadian host stadium. Scores are seeded by scripts/seed-neighborhoods.ts
-- using real GTFS Static data from TransLink, TTC, and ETS.
--
-- Run this once in the Supabase SQL editor before running the seed script.
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists neighborhood_scores (
  -- Matches the GeoJSON feature id (e.g. "downtown-core")
  -- Not globally unique — combined with city_id as composite primary key
  id                    text        not null,

  -- Display name shown in the overlay panel
  name                  text        not null,

  -- Matches Stadium.id (e.g. "bc-place", "bmo-field", "commonwealth-stadium")
  city_id               text        not null,

  -- Transit stop density within the neighbourhood polygon (0–10, GTFS-derived)
  transit_density       numeric(4,2) not null,

  -- Walk time to nearest FIFA shuttle pickup stop (0–10, hand-crafted)
  shuttle_access        numeric(4,2) not null,

  -- Ease of getting to stadium without transfers (0–10, hand-crafted)
  transfers_to_stadium  numeric(4,2) not null,

  -- Distance from neighbourhood centroid to nearest transit stop (0–10, GTFS-derived)
  walk_to_transit       numeric(4,2) not null,

  -- Equal-weight average of all four factors — pre-computed for default weights
  overall               numeric(4,2) not null,

  -- One-liner shown in the overlay panel describing the transit situation
  transit_summary       text        not null default '',

  primary key (id, city_id)
);

-- Index for the common per-city query in NeighborhoodOverlay
create index if not exists neighborhood_scores_city_id_idx
  on neighborhood_scores (city_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- Enable RLS and grant public read access.
-- The anon key used client-side is safe because this table is read-only.

alter table neighborhood_scores enable row level security;

create policy "public read"
  on neighborhood_scores
  for select
  to anon
  using (true);
