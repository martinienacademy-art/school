const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { sendUserWelcomeEmail } = require('../utils/emailService');

// ── GET /api/personnel ──────────────────────────────
async function getPersonnel(req, res) {
    const { role, schoolSlug } = req.user;
    
    if (role !== 'directeur' && role !== 'directeur_general' && role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { data: personnel, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('school_slug', schoolSlug)
            .in('role', ['admin', 'superviseur', 'surveillant', 'comptable', 'censeur', 'proviseur']);

        if (error) throw error;
        return res.json(personnel);
    } catch (err) {
        console.error('getPersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération du personnel.' });
    }
}

// ── POST /api/personnel ──────────────────────────────
async function createPersonnel(req, res) {
    const { role: userRole, schoolSlug } = req.user;
    const { nom, telephone, email, password, role } = req.body;

    if (userRole !== 'directeur' && userRole !== 'directeur_general' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Seul le directeur ou administrateur peut créer un compte membre du personnel.' });
    }

    if (!nom || !telephone || !password || !role) {
        return res.status(400).json({ error: 'Champs requis : nom, telephone, password, role.' });
    }

    if (!['admin', 'superviseur', 'surveillant', 'comptable', 'censeur', 'proviseur'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide.' });
    }

    const cleanPhone = telephone.replace(/\s+/g, '').trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    try {
        // Vérifier si le téléphone ou l'email est déjà utilisé
        let query = supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('school_slug', schoolSlug);

        if (cleanEmail) {
            query = query.or(`telephone.eq.${cleanPhone},email.eq.${cleanEmail}`);
        } else {
            query = query.eq('telephone', cleanPhone);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone ou cet e-mail est déjà enregistré pour un autre compte dans cet établissement.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const { data: personnel, error } = await supabaseAdmin
            .from('profiles')
            .insert({
                school_slug: schoolSlug,
                nom: nom.trim(),
                telephone: cleanPhone,
                email: cleanEmail,
                password: hashed,
                role: role
            })
            .select('id, nom, telephone, email, role, school_slug, created_at')
            .single();

        if (error) throw error;

        // Envoi automatique de l'e-mail de bienvenue si l'e-mail a été renseigné
        if (cleanEmail) {
            sendUserWelcomeEmail({
                email: cleanEmail,
                nom: nom.trim(),
                role: role,
                schoolName: schoolSlug
            }).catch(e => console.error('Erreur email collaborateur:', e.message));
        }

        return res.status(201).json({
            message: 'Compte personnel créé avec succès.',
            personnel
        });
    } catch (err) {
        console.error('createPersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte personnel: ' + err.message });
    }
}

// ── DELETE /api/personnel/:id ──────────────────────────────
async function deletePersonnel(req, res) {
    const { role: userRole, schoolSlug } = req.user;
    const { id } = req.params;

    if (userRole !== 'directeur' && userRole !== 'directeur_general') {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.json({ message: 'Compte personnel supprimé avec succès.' });
    } catch (err) {
        console.error('deletePersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
}

module.exports = { getPersonnel, createPersonnel, deletePersonnel };
