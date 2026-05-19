-- ============================================================
-- Wayra — extended schema for GTFS service days + shapes,
-- realtime alerts persistence, OAuth / verification tokens,
-- push subscriptions, notification prefs.
-- ============================================================

-- GTFS service window per service_id
CREATE TABLE IF NOT EXISTS service_day (
  id            TEXT PRIMARY KEY,                          -- feed:service_id
  monday        BOOLEAN NOT NULL DEFAULT FALSE,
  tuesday       BOOLEAN NOT NULL DEFAULT FALSE,
  wednesday     BOOLEAN NOT NULL DEFAULT FALSE,
  thursday      BOOLEAN NOT NULL DEFAULT FALSE,
  friday        BOOLEAN NOT NULL DEFAULT FALSE,
  saturday      BOOLEAN NOT NULL DEFAULT FALSE,
  sunday        BOOLEAN NOT NULL DEFAULT FALSE,
  start_date    DATE,
  end_date      DATE
);

-- Service exceptions (calendar_dates)
CREATE TABLE IF NOT EXISTS service_date (
  service_id     TEXT REFERENCES service_day(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  exception_type SMALLINT NOT NULL,                         -- 1=added, 2=removed
  PRIMARY KEY (service_id, date)
);

-- GTFS shapes (drawing route polylines on the map)
CREATE TABLE IF NOT EXISTS shape_point (
  shape_id        TEXT,
  shape_pt_sequence INT,
  geom            geography(POINT, 4326) NOT NULL,
  shape_dist_traveled NUMERIC,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);
CREATE INDEX IF NOT EXISTS shape_point_id_idx ON shape_point (shape_id);

-- Refresh tokens (rotation)
CREATE TABLE IF NOT EXISTS refresh_token (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  user_agent    TEXT,
  ip            INET,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS refresh_token_user_idx ON refresh_token (user_id);

-- Auth tokens for password reset + email verification
CREATE TABLE IF NOT EXISTS auth_action_token (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                              -- 'password_reset' | 'email_verification'
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_action_user_kind_idx ON auth_action_token (user_id, kind);

-- Email verification state on the user
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- User roles (admin / staff)
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- OAuth identity links (Google, Apple)
CREATE TABLE IF NOT EXISTS oauth_identity (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,                             -- 'google' | 'apple'
  subject       TEXT NOT NULL,                             -- provider's user id
  email         TEXT,
  display_name  TEXT,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, subject)
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscription (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES app_user(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,                              -- 'web' | 'ios' | 'android'
  endpoint     TEXT NOT NULL,
  p256dh       TEXT,
  auth         TEXT,
  expo_token   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS push_subscription_user_idx ON push_subscription (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscription_endpoint_idx ON push_subscription (endpoint);
