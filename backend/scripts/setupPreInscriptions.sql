CREATE TABLE IF NOT EXISTS "public"."pre_inscriptions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "public"."pre_inscriptions" ENABLE ROW LEVEL SECURITY;
