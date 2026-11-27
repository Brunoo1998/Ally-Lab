CREATE TABLE IF NOT EXISTS ally_ai_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ally_ai_limits_expiration ON ally_ai_limits (expires);
