-- Table: discipline_infraction_types
CREATE TABLE IF NOT EXISTS public.discipline_infraction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL,
    nom TEXT NOT NULL,
    gravite TEXT NOT NULL CHECK (gravite IN ('mineure', 'majeure', 'grave')),
    sanction_defaut TEXT,
    points_retrait INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discipline_incidents
CREATE TABLE IF NOT EXISTS public.discipline_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL,
    date DATE NOT NULL,
    eleve_id UUID NOT NULL,
    eleve_nom TEXT,
    classe TEXT,
    type_infraction_id UUID REFERENCES public.discipline_infraction_types(id) ON DELETE SET NULL,
    sanction TEXT,
    statut TEXT DEFAULT 'Non résolu',
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discipline_absences
CREATE TABLE IF NOT EXISTS public.discipline_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL,
    date DATE NOT NULL,
    eleve_id UUID NOT NULL,
    eleve_nom TEXT,
    classe TEXT,
    type TEXT NOT NULL CHECK (type IN ('Absence', 'Retard')),
    duree_heures NUMERIC,
    justifiee BOOLEAN DEFAULT FALSE,
    justificatif_url TEXT,
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discipline_objets_confisques
CREATE TABLE IF NOT EXISTS public.discipline_objets_confisques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL,
    date DATE NOT NULL,
    eleve_id UUID NOT NULL,
    eleve_nom TEXT,
    classe TEXT,
    objet TEXT NOT NULL,
    circonstances TEXT,
    restitue BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discipline_conseils
CREATE TABLE IF NOT EXISTS public.discipline_conseils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL,
    date DATE NOT NULL,
    eleve_id UUID NOT NULL,
    eleve_nom TEXT,
    classe TEXT,
    motif TEXT NOT NULL,
    decision TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discipline_settings
CREATE TABLE IF NOT EXISTS public.discipline_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL UNIQUE,
    heures_max_absence INTEGER DEFAULT 10,
    email_notification TEXT,
    telephone_sms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We disabled RLS for these tables to match the existing SaaS architecture
-- but ideally they should have RLS based on auth.jwt() -> 'user_metadata' -> 'schoolSlug'
