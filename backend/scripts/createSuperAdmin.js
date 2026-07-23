// ============================================================
// SCRIPT — Créer ou mettre à jour le compte SuperAdmin
// Usage : node backend/scripts/createSuperAdmin.js
// ============================================================
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUPERADMIN = {
    nom: 'Super Administrateur',
    telephone: '0162669883',
    password: 'Mot2p@ss'
};

async function createOrUpdateSuperAdmin() {
    console.log('🚀 Création/mise à jour du compte SuperAdmin...');
    console.log(`   Téléphone : ${SUPERADMIN.telephone}`);

    try {
        // Hasher le mot de passe
        const hashed = await bcrypt.hash(SUPERADMIN.password, 10);

        // Upsert dans la table superadmins (insert ou update si téléphone déjà présent)
        const { data, error } = await supabase
            .from('superadmins')
            .upsert(
                {
                    nom: SUPERADMIN.nom,
                    telephone: SUPERADMIN.telephone,
                    password: hashed
                },
                { onConflict: 'telephone' }
            )
            .select('id, nom, telephone')
            .single();

        if (error) {
            console.error('❌ Erreur Supabase:', error.message);
            console.error('   Détail:', error.details || error.hint || '');
            process.exit(1);
        }

        console.log('✅ Compte SuperAdmin créé/mis à jour avec succès !');
        console.log('─────────────────────────────────────────');
        console.log(`   ID        : ${data?.id || 'N/A'}`);
        console.log(`   Nom       : ${data?.nom || SUPERADMIN.nom}`);
        console.log(`   Téléphone : ${data?.telephone || SUPERADMIN.telephone}`);
        console.log(`   Rôle      : superadmin`);
        console.log('─────────────────────────────────────────');
        console.log('🔐 Vous pouvez maintenant vous connecter avec :');
        console.log(`   Téléphone : ${SUPERADMIN.telephone}`);
        console.log(`   Mot de passe : ${SUPERADMIN.password}`);

    } catch (err) {
        console.error('💥 Erreur fatale:', err.message);
        process.exit(1);
    }
}

createOrUpdateSuperAdmin();
