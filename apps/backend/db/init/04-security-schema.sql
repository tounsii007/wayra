-- Audit log for security-sensitive actions
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES app_user(id) ON DELETE SET NULL,
  actor_email   TEXT,
  action        TEXT NOT NULL,                              -- 'login.success' | 'login.fail' | 'password.change' | 'account.delete' | 'oauth.link' | ...
  ip            INET,
  user_agent    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action, created_at DESC);

-- TOTP 2FA secrets per user
CREATE TABLE IF NOT EXISTS totp_secret (
  user_id     UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  secret      TEXT NOT NULL,                                -- base32 encoded
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at  TIMESTAMPTZ,
  backup_codes_hash TEXT[],                                 -- bcrypt-hashed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login attempts for per-account rate limiting
CREATE TABLE IF NOT EXISTS login_attempt (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  ip            INET,
  success       BOOLEAN NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempt_email_idx ON login_attempt (email, attempted_at DESC);

-- Outbound notification queue (for retries on push fail)
CREATE TABLE IF NOT EXISTS notification_outbox (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES app_user(id) ON DELETE CASCADE,
  payload       JSONB NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ,
  last_error    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GTFS vehicle positions (GTFS-RT)
CREATE TABLE IF NOT EXISTS vehicle_position (
  vehicle_id    TEXT,
  trip_id       TEXT,
  geom          geography(POINT, 4326) NOT NULL,
  bearing       REAL,
  speed_mps     REAL,
  recorded_at   TIMESTAMPTZ NOT NULL,
  feed_id       TEXT,
  PRIMARY KEY (vehicle_id, recorded_at)
);
CREATE INDEX IF NOT EXISTS vehicle_position_trip_idx ON vehicle_position (trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS vehicle_position_geom_idx ON vehicle_position USING GIST (geom);

-- GTFS transfers
CREATE TABLE IF NOT EXISTS transfer (
  from_stop_id     TEXT NOT NULL,
  to_stop_id       TEXT NOT NULL,
  transfer_type    SMALLINT NOT NULL,                       -- 0=recommended 1=timed 2=min_time 3=not_possible
  min_transfer_time INT,                                    -- seconds
  PRIMARY KEY (from_stop_id, to_stop_id)
);

-- Cookie consent state (anonymous, keyed by random cookie id)
CREATE TABLE IF NOT EXISTS consent_event (
  id            BIGSERIAL PRIMARY KEY,
  client_id     TEXT NOT NULL,
  user_id       UUID,
  essential     BOOLEAN NOT NULL DEFAULT TRUE,
  analytics     BOOLEAN NOT NULL DEFAULT FALSE,
  marketing     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_event_client_idx ON consent_event (client_id, created_at DESC);
