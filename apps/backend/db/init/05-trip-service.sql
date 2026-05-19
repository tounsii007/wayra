-- Add service_id and shape_id to the trip table so the routing/realtime
-- services know when a trip actually runs and how to draw it on the map.
ALTER TABLE trip
  ADD COLUMN IF NOT EXISTS service_id TEXT,
  ADD COLUMN IF NOT EXISTS shape_id   TEXT;

CREATE INDEX IF NOT EXISTS trip_service_idx ON trip (service_id);
