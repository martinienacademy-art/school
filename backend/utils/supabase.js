const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl ? '✓ Configurée' : '❌ MANQUANTE');
console.log('[Supabase] Clé Backend:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ SERVICE_ROLE (RLS Bypass)' : (supabaseKey ? '⚠️ ANON_KEY (Sujet à RLS)' : '❌ MANQUANTE'));

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n======================================================');
    console.error('🔥 ERREUR CRITIQUE: SUPABASE_SERVICE_ROLE_KEY MANQUANTE');
    console.error('La création d\'écoles et les opérations administrateur');
    console.error('vont échouer avec une erreur RLS si cette clé n\'est pas configurée.');
    console.error('Veuillez ajouter SUPABASE_SERVICE_ROLE_KEY dans Render.');
    console.error('======================================================\n');
}

const createFallbackClient = () => {
    const error = new Error('Supabase non configuré.');
    const handle = () => ({ data: null, error });
    const proxy = {
        from: () => proxy,
        select: async () => ({ data: null, error }),
        insert: async () => ({ data: null, error }),
        update: async () => ({ data: null, error }),
        delete: async () => ({ data: null, error }),
        upsert: async () => ({ data: null, error }),
        auth: {
            signIn: async () => ({ data: null, error }),
            signUp: async () => ({ data: null, error }),
            refreshSession: async () => ({ data: null, error }),
        },
        storage: {
            from: () => proxy,
        },
        rpc: async () => ({ data: null, error }),
    };
    return proxy;
};

let supabase;
let supabaseAdmin;

if (supabaseUrl && supabaseKey) {
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
    
    supabaseAdmin = createClient(supabaseUrl, adminKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Dans le backend Express, toutes les requêtes base de données utilisent les droits administrateur (Bypass RLS)
    supabase = supabaseAdmin;

    (async () => {
        try {
            const { data, error } = await supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true });
            if (error) throw error;
            console.log('✅ Supabase Admin connecté avec succès (Bypass RLS actif)');
        } catch (err) {
            console.error('❌ Impossible de se connecter à Supabase:', err.message);
            console.error('Vérifiez vos clés et l\'URL dans le fichier .env');
        }
    })();
} else {
    console.warn('⚠️ Le backend démarre en mode dégradé sans accès à Supabase. Certaines fonctionnalités seront désactivées.');
    supabase = createFallbackClient();
    supabaseAdmin = createFallbackClient();
}

module.exports = { supabase, supabaseAdmin };
