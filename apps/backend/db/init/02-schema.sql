-- ============================================================
-- Wayra — core schema (PostGIS-enabled)
-- ============================================================

CREATE TABLE IF NOT EXISTS country (
  code         CHAR(2) PRIMARY KEY,
  name         TEXT NOT NULL,
  centroid     geography(POINT, 4326),
  default_zoom SMALLINT
);

CREATE TABLE IF NOT EXISTS agency (
  id           TEXT PRIMARY KEY,
  feed_id      TEXT,
  country_code CHAR(2) REFERENCES country(code),
  name         TEXT NOT NULL,
  short_name   TEXT,
  url          TEXT,
  timezone     TEXT
);

CREATE TABLE IF NOT EXISTS place (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  name            TEXT NOT NULL,
  -- Stored as Point for routing; geography for distance queries.
  geom            geography(POINT, 4326) NOT NULL,
  country_code    CHAR(2) REFERENCES country(code),
  parent_id       TEXT REFERENCES place(id) ON DELETE SET NULL,
  modes           TEXT[],
  address         JSONB,
  localized_names JSONB,
  external_ids    JSONB
);

CREATE INDEX IF NOT EXISTS place_geom_idx     ON place USING GIST (geom);
CREATE INDEX IF NOT EXISTS place_name_trgm    ON place USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS place_country_idx  ON place (country_code);
CREATE INDEX IF NOT EXISTS place_type_idx     ON place (type);

CREATE TABLE IF NOT EXISTS line (
  id          TEXT PRIMARY KEY,
  agency_id   TEXT REFERENCES agency(id) ON DELETE CASCADE,
  short_name  TEXT NOT NULL,
  long_name   TEXT,
  mode        TEXT NOT NULL,
  color       CHAR(7),
  text_color  CHAR(7)
);

CREATE TABLE IF NOT EXISTS trip (
  id                     TEXT PRIMARY KEY,
  line_id                TEXT REFERENCES line(id) ON DELETE CASCADE,
  headsign               TEXT,
  direction              SMALLINT,
  wheelchair_accessible  BOOLEAN,
  bikes_allowed          BOOLEAN
);

CREATE TABLE IF NOT EXISTS stop_time (
  trip_id         TEXT REFERENCES trip(id) ON DELETE CASCADE,
  stop_id         TEXT REFERENCES place(id) ON DELETE CASCADE,
  stop_sequence   INT NOT NULL,
  arrival_time    INT,    -- seconds since service start
  departure_time  INT,
  platform        TEXT,
  PRIMARY KEY (trip_id, stop_sequence)
);
CREATE INDEX IF NOT EXISTS stop_time_stop_idx ON stop_time (stop_id);

CREATE TABLE IF NOT EXISTS realtime_update (
  id               BIGSERIAL PRIMARY KEY,
  trip_id          TEXT,
  stop_id          TEXT,
  type             TEXT NOT NULL,         -- delay|cancellation|platform_change|...
  delay_seconds    INT,
  predicted_time   TIMESTAMPTZ,
  new_platform     TEXT,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS realtime_trip_idx ON realtime_update (trip_id, fetched_at DESC);

CREATE TABLE IF NOT EXISTS disruption (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  severity        TEXT NOT NULL,
  title           TEXT,
  description     TEXT,
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  affected_lines  TEXT[],
  affected_stops  TEXT[],
  source_url      TEXT,
  language        TEXT
);

CREATE TABLE IF NOT EXISTS fare (
  id            TEXT PRIMARY KEY,
  agency_id     TEXT REFERENCES agency(id),
  country_code  CHAR(2),
  type          TEXT NOT NULL,
  name          TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  currency      CHAR(3) NOT NULL,
  source        TEXT NOT NULL,           -- official|estimated|unknown
  description   TEXT,
  booking_url   TEXT,
  valid_from    DATE,
  valid_until   DATE
);

CREATE TABLE IF NOT EXISTS app_user (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  locale        TEXT NOT NULL DEFAULT 'en',
  theme         TEXT NOT NULL DEFAULT 'system',
  home_country  CHAR(2),
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_place (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES app_user(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  label       TEXT,
  place_id    TEXT REFERENCES place(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_route (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID REFERENCES app_user(id) ON DELETE CASCADE,
  label                    TEXT,
  data                     JSONB NOT NULL,
  notify_on_disruption     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offline_region (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES app_user(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  country_code  CHAR(2),
  bbox          geography(POLYGON, 4326),
  size_bytes    BIGINT,
  version       TIMESTAMPTZ NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preference (
  user_id              UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  push_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  channels             JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Seed countries
INSERT INTO country (code, name, centroid, default_zoom) VALUES
  ('DE', 'Deutschland', ST_GeographyFromText('SRID=4326;POINT(10.452 51.165)'), 6),
  ('FR', 'France',      ST_GeographyFromText('SRID=4326;POINT(1.888 46.603)'), 6),
  ('TN', 'Tunisie',     ST_GeographyFromText('SRID=4326;POINT(9.537 33.886)'), 7)
ON CONFLICT (code) DO NOTHING;
