-- Ce script nettoie les anciens triggers et fonctions qui causent 
-- l'erreur : "new row level security pollicy for table profiles"
-- lors de la création d'un établissement.

-- 1. Supprimer le trigger sur la table schools s'il existe
DROP TRIGGER IF EXISTS on_school_created ON public.schools;

-- 2. Supprimer la fonction create_school_tables
DROP FUNCTION IF EXISTS public.create_school_tables(text);
