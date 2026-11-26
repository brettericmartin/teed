-- Remembers Firecrawl page reads by URL so the same product page is not paid for
-- again, and records a pause after Firecrawl says the credits ran out (HTTP 402).
-- Only server code with the service role reads or writes it: RLS is on and no
-- policy grants browser roles anything.
CREATE TABLE IF NOT EXISTS public.firecrawl_cache (
  key text PRIMARY KEY,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.firecrawl_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.firecrawl_cache FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firecrawl_cache TO service_role;

CREATE INDEX IF NOT EXISTS firecrawl_cache_fetched_at_idx ON public.firecrawl_cache (fetched_at);
