const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// ── Middleware d'authentification de base ──────────────────────
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // Contient id, nom, role, schoolSlug (ou null pour superadmin)
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }
}

// ── Middleware SuperAdmin uniquement ───────────────────────────
// Protège les routes qui ne doivent être accessibles qu'au propriétaire SaaS
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Accès réservé au SuperAdmin.' });
    }
    next();
}

// ── Middleware école requise ────────────────────────────────────
// Garantit que tout utilisateur (sauf superadmin) possède un schoolSlug et que l'école existe toujours
async function requireSchool(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié.' });
    }
    // Le SuperAdmin a des accès globaux
    if (req.user.role === 'superadmin') {
        return next();
    }
    if (!req.user.schoolSlug) {
        return res.status(403).json({
            error: 'Aucun établissement défini dans la session.'
        });
    }

    try {
        const { supabaseAdmin } = require('../utils/supabase');
        const { data: school } = await supabaseAdmin
            .from('schools')
            .select('id, status')
            .eq('slug', req.user.schoolSlug)
            .single();

        if (!school || !['active', 'trial'].includes(school.status)) {
            return res.status(403).json({ error: 'Cet établissement a été supprimé ou son accès a été suspendu.' });
        }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Erreur vérification établissement.' });
    }
}

// ── Middleware rôle école (admin / directeur / etc.) ──────────
function requireSchoolAdmin(req, res, next) {
    const schoolAdminRoles = ['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur', 'superviseur'];
    if (!req.user || !schoolAdminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permission refusée. Rôle insuffisant.' });
    }
    next();
}

module.exports = { authenticateToken, requireSuperAdmin, requireSchool, requireSchoolAdmin };
