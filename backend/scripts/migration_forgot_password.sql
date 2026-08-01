ALTER TABLE parents ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE superadmins ADD COLUMN IF NOT EXISTS email text;
CREATE TABLE IF NOT EXISTS password_resets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
