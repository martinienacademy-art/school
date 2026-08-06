const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');
const Joi = require('joi');
const crypto = require('crypto');

// Joi validation schema for Parent registration
const parentRegisterSchema = Joi.object({
    nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom complet est requis.'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'L\'adresse e-mail est requise.',
        'string.email': 'L\'adresse e-mail est invalide.'
    }),
    telephone: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone est requis.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est requis.'
    }),
    school_slug: Joi.string().trim().required().messages({
        'any.required': 'Le code de l\'établissement (school_slug) est requis.'
    }),
    accepted_terms: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter les conditions d\'utilisation.'
    }),
    accepted_privacy_policy: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter le traitement de vos données scolaires.'
    }),
    marketing_consent: Joi.boolean().default(false),
    parent_photo_authorization: Joi.boolean().default(false)
});

function getIpHash(req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip);
    return crypto.createHash('sha256').update(clientIp).digest('hex');
}

// ── Register (Uniquement Parents) ──────────────────────────────
async function register(req, res) {
    const { value: validatedData, error: validationError } = parentRegisterSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    let { nom, email, telephone, password, school_slug, accepted_terms, accepted_privacy_policy, marketing_consent, parent_photo_authorization } = validatedData;
    telephone = telephone.replace(/\s+/g, '').trim();

    try {
        const { data: school } = await supabase
            .from('schools')
            .select('status')
            .eq('slug', school_slug)
            .single();
            
        if (!school) {
            return res.status(404).json({ error: "Établissement inconnu." });
        }
        if (school.status === 'suspended') {
            return res.status(403).json({ error: "L'établissement est suspendu." });
        }

        // Vérifier si existant
        const { data: existing } = await supabase
            .from(`profiles_${school_slug}`)
            .select('id')
            .eq('telephone', telephone.trim())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone est déjà enregistré.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const ipHash = getIpHash(req);

        // Mass assignment protection
        const insertPayload = {
            nom: nom.trim(),
            email: email.toLowerCase().trim(),
            telephone: telephone.trim(),
            password: hashed,
            role: 'parent',
            accepted_terms,
            accepted_privacy_policy,
            marketing_consent,
            consented_at: new Date().toISOString(),
            signup_ip_hash: ipHash,
            parent_photo_authorization
        };

        const { data: parent, error } = await supabase
            .from(`profiles_${school_slug}`)
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { id: parent.id, nom: parent.nom, role: parent.role, schoolSlug: school_slug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // On met le token dans un cookie HttpOnly sécurisé
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });

        return res.status(201).json({
            message: 'Compte créé avec succès.',
            token, // On le garde pour compatibilité temporaire si besoin, mais le frontend doit utiliser credentials: true
            user: { id: parent.id, nom: parent.nom, telephone: parent.telephone, role: parent.role, schoolSlug: school_slug },
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte : ' + err.message });
    }
}

// ── Register (Enseignants / Professeurs) ─────────────────────
const teacherRegisterSchema = Joi.object({
    nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom complet est requis.'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'L\'adresse e-mail est requise.',
        'string.email': 'L\'adresse e-mail est invalide.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est requis.'
    }),
    school_slug: Joi.string().trim().required().messages({
        'any.required': 'Le code de l\'établissement (school_slug) est requis.'
    })
});

async function registerTeacher(req, res) {
    const { value: validatedData, error: validationError } = teacherRegisterSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    let { nom, email, password, school_slug } = validatedData;
    const cleanEmail = email.toLowerCase().trim();

    try {
        const { data: school } = await supabase
            .from('schools')
            .select('status')
            .eq('slug', school_slug)
            .single();
            
        if (!school) {
            return res.status(404).json({ error: "Établissement inconnu." });
        }
        if (school.status === 'suspended') {
            return res.status(403).json({ error: "L'établissement est suspendu." });
        }

        const { data: existing } = await supabase
            .from(`profiles_${school_slug}`)
            .select('id')
            .eq('email', cleanEmail)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Cette adresse e-mail est déjà enregistrée.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const ipHash = getIpHash(req);

        const insertPayload = {
            nom: nom.trim(),
            email: cleanEmail,
            telephone: cleanEmail,
            password: hashed,
            role: 'enseignant',
            consented_at: new Date().toISOString(),
            signup_ip_hash: ipHash
        };

        const { data: teacher, error } = await supabase
            .from(`profiles_${school_slug}`)
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { id: teacher.id, nom: teacher.nom, role: 'enseignant', schoolSlug: school_slug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: 'Compte Enseignant créé avec succès.',
            token,
            user: { id: teacher.id, nom: teacher.nom, email: teacher.email, role: 'enseignant', schoolSlug: school_slug }
        });
    } catch (err) {
        console.error('Register Teacher Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte enseignant : ' + err.message });
    }
}

// ── Login (Tout Rôles) ──────────────────────────
async function login(req, res) {
    let { telephone, email, password, schoolSlug } = req.body;
    let identifier = (telephone || email || '').replace(/\s+/g, '').trim().toLowerCase();

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Champs requis : identifiant (email/téléphone) et mot de passe.' });
    }

    try {
        console.log(`🔍 [Auth] Tentative login pour: ${identifier}`);

        // ── 1. Vérifier si c'est le SuperAdmin ──
        const { data: superadmin } = await supabase
            .from('superadmins')
            .select('*')
            .or(`telephone.eq.${identifier},email.eq.${identifier}`)
            .single();

        if (superadmin) {
            const valid = await bcrypt.compare(password, superadmin.password);
            if (valid) {
                console.log(`✅ [Auth] SuperAdmin identifié !`);
                const token = jwt.sign(
                    { id: superadmin.id, nom: superadmin.nom, role: 'superadmin', schoolSlug: null },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES }
                );
                res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
                return res.json({
                    message: 'Connexion globale réussie.',
                    token,
                    user: { id: superadmin.id, nom: superadmin.nom, telephone: superadmin.telephone, role: 'superadmin' }
                });
            } else {
                return res.status(401).json({ error: 'Mot de passe SuperAdmin incorrect.' });
            }
        }
        
        // ── 2. Sinon, l'utilisateur DOIT avoir sélectionné une école ──
        if (!schoolSlug) {
            return res.status(400).json({ error: 'Veuillez sélectionner votre établissement pour vous connecter.' });
        }

        // Vérification accès école
        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .select('id, name, slug, status, trial_ends_at, logo_url')
            .eq('slug', schoolSlug)
            .single();

        if (schoolErr || !school) {
            return res.status(404).json({ error: 'Établissement introuvable ou supprimé.' });
        }

        if (!['active', 'trial'].includes(school.status)) {
            return res.status(403).json({ error: "L'accès à cet établissement est suspendu ou désactivé." });
        }
        if (school.status === 'trial' && new Date(school.trial_ends_at) < new Date()) {
            return res.status(402).json({ error: 'trial_expired', message: "La période d'essai est terminée." });
        }

        // ── 3. Chercher l'utilisateur dans la table de l'établissement ──
        const { data: user, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('*')
            .or(`telephone.eq.${identifier},email.eq.${identifier}`)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
        }

        console.log(`✅ [Auth] Utilisateur trouvé: ${user.nom} (Rôle: ${user.role}) - École: ${schoolSlug}`);

        const token = jwt.sign(
            { id: user.id, nom: user.nom, role: user.role, schoolSlug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Update last login de façon asynchrone
        supabase.from(`profiles_${schoolSlug}`).update({ last_login: new Date().toISOString() }).eq('id', user.id).then(() => {});

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                telephone: user.telephone,
                role: user.role,
                school_name: school.name,
                school_slug: school.slug,
                school_logo: school.logo_url
            },
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({ error: 'Erreur de connexion serveur.' });
    }
}

// ── Delete Account (Self) ─────────────────────────────────────
async function deleteSelfAccount(req, res) {
    const { id, role, schoolSlug } = req.user;

    if (role === 'superadmin') {
        return res.status(403).json({ error: "Le compte superadmin ne peut être supprimé ici." });
    }

    try {
        const { error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.json({ message: 'Compte supprimé avec succès.' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
    }
}

// ── Update Push Token ──────────────────────────────────────────
async function updatePushToken(req, res) {
    const { id, role, schoolSlug } = req.user;
    const { push_token } = req.body;
    
    const table = role === 'superadmin' ? 'superadmins' : `profiles_${schoolSlug}`;

    try {
        console.log(`📲 Tentative de mise à jour du push_token pour l'utilisateur ${id}`);

        const { error } = await supabase
            .from(table)
            .update({ push_token })
            .eq('id', id);

        if (error) throw error;
        return res.json({ success: true, message: 'Token de notification mis à jour.' });
    } catch (err) {
        console.error('Update Push Token Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du token.' });
    }
}

async function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    const schoolSlug = req.user.schoolSlug;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'L\'ancien et le nouveau mot de passe sont requis.' });
    }

    try {
        let table = '';
        if (role === 'superadmin') {
            table = 'superadmins';
        } else {
            table = `profiles_${schoolSlug}`;
        }

        const { data: user, error } = await supabase
            .from(table)
            .select('password')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'L\'ancien mot de passe est incorrect.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from(table)
            .update({ password: hashed })
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }

        return res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur changePassword:', error.message);
        return res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
    }
}

// ── Mot de Passe Oublié ──────────────────────────────────
async function forgotPassword(req, res) {
    const { email, schoolSlug } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'L\'adresse e-mail est requise.' });
    }

    try {
        let userFound = null;
        let tableFound = '';

        // Chercher dans superadmins
        let { data: sa } = await supabase.from('superadmins').select('id, email, nom').eq('email', email).single();
        if (sa) {
            userFound = sa;
            tableFound = 'superadmins';
        } else {
            // Chercher dans parents
            let { data: p } = await supabase.from('parents').select('id, email, nom').eq('email', email).single();
            if (p) {
                userFound = p;
                tableFound = 'parents';
            } else if (schoolSlug) {
                // Chercher dans profiles de l'école (Staff)
                let { data: staff } = await supabase.from(`profiles_${schoolSlug}`).select('id, email, nom').eq('email', email).single();
                if (staff) {
                    userFound = staff;
                    tableFound = `profiles_${schoolSlug}`;
                }
            }
        }

        if (!userFound) {
            // Sécurité : Ne pas révéler que l'e-mail n'existe pas
            return res.json({ message: 'Si cet e-mail correspond à un compte, un lien de réinitialisation a été envoyé.' });
        }

        // Générer un token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 heure valide

        await supabase.from('password_resets').insert({
            email: email,
            token: token,
            expires_at: expiresAt.toISOString()
        });

        // Envoi de l'e-mail (Simulation si nodemailer n'est pas configuré ici)
        console.log(`[AUTH] Lien de réinitialisation pour ${email}: /reset-password?token=${token}&email=${email}&table=${tableFound}`);
        
        // TODO: Envoyer réellement l'e-mail via SMTP si configuré

        return res.json({ message: 'Si cet e-mail correspond à un compte, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
        console.error('Erreur forgotPassword:', error);
        return res.status(500).json({ error: 'Une erreur interne est survenue.' });
    }
}

async function resetPassword(req, res) {
    const { token, email, table, newPassword } = req.body;
    if (!token || !email || !table || !newPassword) {
        return res.status(400).json({ error: 'Données manquantes ou invalides.' });
    }

    try {
        // Vérifier le token
        const { data: resetRecord } = await supabase
            .from('password_resets')
            .select('*')
            .eq('token', token)
            .eq('email', email)
            .single();

        if (!resetRecord) {
            return res.status(400).json({ error: 'Lien de réinitialisation invalide.' });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Le lien de réinitialisation a expiré.' });
        }

        // Hacher le nouveau mot de passe
        const hashed = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from(table)
            .update({ password: hashed })
            .eq('email', email);

        if (updateError) {
            throw updateError;
        }

        // Supprimer le token
        await supabase.from('password_resets').delete().eq('id', resetRecord.id);

        return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
        console.error('Erreur resetPassword:', error);
        return res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe.' });
    }
}

// ── Logout ────────────────────────────────────────────────────
async function logout(req, res) {
    res.clearCookie('token');
    return res.json({ message: 'Déconnecté avec succès.' });
}

// ── Export ────────────────────────────────────────────────────
module.exports = { register, registerTeacher, login, logout, deleteSelfAccount, updatePushToken, changePassword, forgotPassword, resetPassword };
