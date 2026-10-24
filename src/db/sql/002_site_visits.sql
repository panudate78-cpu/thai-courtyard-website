-- Anonymous public-site page views for the admin "Site visits" counter.
--
-- The application also applies this automatically (ensureVisitsTable, called by
-- ensureDatabase) so you normally do not need to run it by hand. This file is
-- here for reference and for repairing a database manually.
--
-- Admin routes (/admin/*) and API routes are never recorded.
-- No IP addresses or cookies are stored: visitor_key is a salted hash that is
-- re-keyed each London day, used only for "distinct visitors today".

CREATE TABLE IF NOT EXISTS "site_visits" (
  "id" bigserial PRIMARY KEY,
  "path" text NOT NULL,
  "visitor_key" text,
  "referrer" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "site_visits_created_idx" ON "site_visits" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "site_visits_path_idx" ON "site_visits" USING btree ("path");
