-- WebAuthn (passkeys) credentials per user.
CREATE TABLE IF NOT EXISTS webauthn_credential (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  credential_id   TEXT NOT NULL UNIQUE,           -- base64url
  public_key      BYTEA NOT NULL,
  counter         BIGINT NOT NULL DEFAULT 0,
  transports      TEXT[],
  device_name     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS webauthn_user_idx ON webauthn_credential (user_id);

-- Short-lived challenges keyed by user (for registration + assertion).
CREATE TABLE IF NOT EXISTS webauthn_challenge (
  user_id      UUID PRIMARY KEY,
  challenge    TEXT NOT NULL,
  kind         TEXT NOT NULL,                     -- 'register' | 'authenticate'
  expires_at   TIMESTAMPTZ NOT NULL
);

-- AI conversations (server-side memory)
CREATE TABLE IF NOT EXISTS ai_conversation (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES app_user(id) ON DELETE CASCADE,
  client_id    TEXT,                              -- anonymous fallback
  title        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_conversation_user_idx ON ai_conversation (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_conversation_client_idx ON ai_conversation (client_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_message (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES ai_conversation(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,                  -- 'user' | 'assistant' | 'system'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_message_conv_idx ON ai_message (conversation_id, created_at);
