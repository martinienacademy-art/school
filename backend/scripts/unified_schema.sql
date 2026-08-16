-- ============================================================
-- SCHÉMA UNIFIÉ MULTI-TENANT POUR EDUFINANCE
-- ============================================================
-- Ce script remplace l'ancienne architecture qui créait une 
-- table par école (ex: profiles_monecole) par un schéma
-- multi-tenant propre basé sur `school_slug` et protégé par
-- le Row Level Security (RLS) de PostgreSQL.
-- ============================================================

-- 1. Tables Globales (Non liées à une école spécifique)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    accepted_terms BOOLEAN DEFAULT false,
    accepted_privacy_policy BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    consented_at TIMESTAMP WITH TIME ZONE,
    signup_ip_hash TEXT,
    features JSONB,
    custom_price_per_student NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.saas_settings (
    id SERIAL PRIMARY KEY,
    price_per_student NUMERIC DEFAULT 2000,
    default_trial_days INTEGER DEFAULT 60,
    currency VARCHAR(10) DEFAULT 'FCFA',
    premium_features JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.superadmins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tables Multi-tenant (Communes à toutes les écoles, filtrées par school_slug)

CREATE TABLE IF NOT EXISTS public.app_settings (
    id SERIAL PRIMARY KEY,
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom_ecole VARCHAR(255),
    acronyme VARCHAR(50),
    telephone VARCHAR(50),
    email VARCHAR(255),
    adresse TEXT,
    logo_url TEXT,
    directeur_nom VARCHAR(255),
    annee_scolaire_active VARCHAR(20),
    devise VARCHAR(10) DEFAULT 'FCFA',
    langue_defaut VARCHAR(10) DEFAULT 'fr',
    UNIQUE(school_slug)
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'parent', 'directeur', 'enseignant', 'comptable', etc.
    push_token TEXT,
    accepted_terms BOOLEAN DEFAULT false,
    accepted_privacy_policy BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    parent_photo_authorization BOOLEAN DEFAULT false,
    consented_at TIMESTAMP WITH TIME ZONE,
    signup_ip_hash TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(school_slug, telephone), -- Dans une école, un tel est unique
    UNIQUE(school_slug, email) -- Dans une école, un email est unique
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    matricule VARCHAR(100),
    date_naissance DATE,
    lieu_naissance VARCHAR(255),
    sexe VARCHAR(10),
    classe VARCHAR(100),
    cycle VARCHAR(100),
    ecolage NUMERIC DEFAULT 0,
    deja_paye NUMERIC DEFAULT 0,
    restant NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'inscrit',
    telephone_parent VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    montant NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    recu VARCHAR(255),
    note TEXT,
    mode_paiement VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.presences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    statut VARCHAR(50) NOT NULL, -- 'present', 'absent', 'retard'
    heure_arrivee TIME,
    heure_depart TIME,
    justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    eleve_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    matiere_id UUID,
    matiere_nom VARCHAR(255),
    trimestre VARCHAR(50),
    valeur NUMERIC NOT NULL,
    type_evaluation VARCHAR(100),
    date_evaluation DATE,
    coefficient NUMERIC DEFAULT 1,
    appreciation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relation VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.matieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.school_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    cycle VARCHAR(100),
    niveau VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.classe_matieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
    matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
    coefficient NUMERIC DEFAULT 1,
    professeur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(classe_id, matiere_id)
);

CREATE TABLE IF NOT EXISTS public.ressources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    url TEXT,
    classe_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE,
    matiere_id UUID REFERENCES public.matieres(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.salles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    capacite INTEGER,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug VARCHAR(255) NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sujet VARCHAR(255),
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Les politiques RLS pour empêcher un utilisateur d'une école A
-- de voir ou modifier les données de l'école B
-- ============================================================

-- Fonction pour obtenir le school_slug de la requête courante (à passer via JWT ou PostgREST)
-- En utilisant auth.jwt() de Supabase
CREATE OR REPLACE FUNCTION get_jwt_school_slug()
RETURNS text AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'schoolSlug';
$$ LANGUAGE sql STABLE;

-- Activation du RLS sur toutes les tables Multi-tenant
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classe_matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ressources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Création des politiques génériques (pour chaque table, le slug doit correspondre au JWT)
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('app_settings', 'profiles', 'students', 'payments', 'presences', 'notes', 'parent_student', 'badges', 'activity_logs', 'matieres', 'school_classes', 'classe_matieres', 'ressources', 'salles', 'messages')
    LOOP
        EXECUTE format('
            CREATE POLICY "Isolation par école %I" 
            ON public.%I 
            FOR ALL 
            USING (school_slug = get_jwt_school_slug())
            WITH CHECK (school_slug = get_jwt_school_slug());
        ', t_name, t_name);
    END LOOP;
END
$$;
