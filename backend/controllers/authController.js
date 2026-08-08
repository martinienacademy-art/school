const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');
const Joi = require('joi');
const crypto = require('crypto');
const { sendSchoolWelcomeEmail, sendUserWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

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
    password: Joi.string().min(8).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
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
            .or(`telephone.eq.${telephone},email.eq.${email}`)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Un compte avec cet e-mail ou ce numéro de téléphone existe déjà.' });
        }

        const ipHash = getIpHash(req);
        const consentedAt = new Date().toISOString();
        const hashed = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from(`profiles_${school_slug}`)
            .insert({
                nom: nom.trim(),
                email: email.trim().toLowerCase(),
                telephone,
                password: hashed,
                role: 'parent',
                accepted_terms,
                accepted_privacy_policy,
                marketing_consent,
                parent_photo_authorization,
                consented_at: consentedAt,
                signup_ip_hash: ipHash
            })
            .select('id, nom, email, telephone, role')
            .single();

        if (error) throw error;

        // Créer un token JWT
        const token = jwt.sign(
            { id: user.id, nom: user.nom, role: user.role, schoolSlug: school_slug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

        sendUserWelcomeEmail({
            email: user.email,
            nom: user.nom,
            role: 'parent',
            schoolName: school_slug
        }).catch(e => console.error('Error background email parent:', e));

        return res.status(201).json({
            message: 'Inscription réussie.',
            token,
            user: { ...user, schoolSlug: school_slug }
        });
    } catch (err) {
        console.error('Parent Register Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de l\'inscription: ' + err.message });
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
    telephone: Joi.string().trim().allow('', null),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
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

        sendUserWelcomeEmail({
            email: cleanEmail,
            nom: validatedData.nom,
            role: 'enseignant',
            schoolName: school_slug
        }).catch(e => console.error('Error background email teacher:', e));

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
            .eq('telephone', identifier)
            .maybeSingle();

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
            .select('id, name, slug, status, trial_ends_at, logo_url, features')
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

        const defaultAllFeatures = ['scan_presence', 'scan_sortie', 'carte_scolaire', 'saisie_notes', 'bulletins', 'recouvrement', 'chat', 'import_export', 'pre_inscriptions', 'documents'];
        const activeFeatures = Array.isArray(school.features) && school.features.length > 0 ? school.features : defaultAllFeatures;

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
                school_logo: school.logo_url,
                trial_ends_at: school.trial_ends_at,
                school_status: school.status,
                features: activeFeatures
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

// ── Public Self-Service Register (Directeurs & Écoles) ─────────
const schoolRegisterSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'any.required': 'Le nom de l\'établissement est requis.'
    }),
    slug: Joi.string().trim().lowercase().required().messages({
        'any.required': 'Le slug de l\'établissement est requis.'
    }),
    acronym: Joi.string().trim().allow('', null),
    address: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().required().messages({
        'any.required': 'L\'adresse e-mail est requise.',
        'string.email': 'L\'adresse e-mail est invalide.'
    }),
    admin_nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom du directeur est requis.'
    }),
    admin_telephone: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone du directeur est requis.'
    }),
    admin_password: Joi.string().min(8).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
        'any.required': 'Le mot de passe est requis.'
    }),
    accepted_terms: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter les conditions générales d\'utilisation.'
    }),
    accepted_privacy_policy: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter la politique de confidentialité.'
    }),
    marketing_consent: Joi.boolean().default(false)
});

async function registerSchool(req, res) {
    const { value: validatedData, error: validationError } = schoolRegisterSchema.validate(req.body, { abortEarly: false });
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    const cleanSlug = validatedData.slug.toLowerCase().trim();
    const cleanEmail = validatedData.email.toLowerCase().trim();
    const cleanPhone = validatedData.admin_telephone.replace(/\s+/g, '').trim();

    try {
        const { data: existing } = await supabase
            .from('schools')
            .select('id')
            .eq('slug', cleanSlug)
            .single();

        if (existing) {
            return res.status(409).json({ error: `Le code/slug "${cleanSlug}" est déjà utilisé par un autre établissement.` });
        }

        const ipHash = getIpHash(req);
        const consentedAt = new Date().toISOString();
        const { getStoredSaasSettings } = require('./superAdminController');
        const saasConfig = await getStoredSaasSettings();
        const trialDays = saasConfig.default_trial_days || 60;
        const defaultFeatures = Array.isArray(saasConfig.premium_features) ? saasConfig.premium_features : ['scan_presence', 'scan_sortie', 'carte_scolaire', 'saisie_notes', 'bulletins', 'recouvrement', 'chat', 'import_export', 'pre_inscriptions', 'documents'];

        const schoolPayload = {
            name: validatedData.name.trim(),
            slug: cleanSlug,
            acronym: validatedData.acronym ? validatedData.acronym.trim() : null,
            address: validatedData.address || null,
            phone: validatedData.phone || cleanPhone,
            email: cleanEmail,
            status: 'trial',
            trial_ends_at: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
            features: defaultFeatures,
            accepted_terms: validatedData.accepted_terms,
            accepted_privacy_policy: validatedData.accepted_privacy_policy,
            marketing_consent: validatedData.marketing_consent,
            consented_at: consentedAt,
            signup_ip_hash: ipHash
        };

        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .insert(schoolPayload)
            .select()
            .single();

        if (schoolErr) throw schoolErr;

        const { error: rpcErr } = await supabase.rpc('create_school_tables', { school_slug: cleanSlug });
        if (rpcErr) console.warn('Warning create_school_tables:', rpcErr.message);

        await new Promise(r => setTimeout(r, 1000));

        try {
            await supabase.from(`app_settings_${cleanSlug}`).upsert({
                id: 1,
                nom_ecole: validatedData.name.trim(),
                acronyme: validatedData.acronym ? validatedData.acronym.trim() : '',
                telephone: validatedData.phone || cleanPhone,
                email: cleanEmail
            });
        } catch (sErr) {
            console.warn('Non-blocking app_settings init warning:', sErr.message);
        }

        const hashed = await bcrypt.hash(validatedData.admin_password, 10);
        const adminPayload = {
            nom: validatedData.admin_nom.trim(),
            telephone: cleanPhone,
            email: cleanEmail,
            password: hashed,
            role: 'directeur',
            accepted_terms: validatedData.accepted_terms,
            accepted_privacy_policy: validatedData.accepted_privacy_policy,
            marketing_consent: validatedData.marketing_consent,
            consented_at: consentedAt,
            signup_ip_hash: ipHash
        };

        const { data: adminUser, error: adminErr } = await supabase
            .from(`profiles_${cleanSlug}`)
            .insert(adminPayload)
            .select('id, nom, telephone, email, role')
            .single();

        if (adminErr) throw adminErr;

        console.log(`🏫 Nouvelle école inscrite par Directeur : ${school.name} (${school.slug}), Admin: ${adminUser.nom}`);

        // Envoi automatique de l'email SMTP de bienvenue
        sendSchoolWelcomeEmail({
            email: cleanEmail,
            adminNom: validatedData.admin_nom,
            schoolName: school.name,
            schoolSlug: cleanSlug
        }).catch(e => console.error('Error background email:', e));

        return res.status(201).json({
            message: `Félicitations ! L'établissement "${school.name}" a été créé avec succès.`,
            school: {
                name: school.name,
                slug: cleanSlug,
                email: cleanEmail,
                admin_nom: adminUser.nom
            }
        });
    } catch (err) {
        console.error('registerSchool Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création de l\'établissement: ' + err.message });
    }
}

// ── Logout ────────────────────────────────────────────────────
async function logout(req, res) {
    res.clearCookie('token');
    return res.json({ message: 'Déconnecté avec succès.' });
}

// ── Export ────────────────────────────────────────────────────
module.exports = { register, registerTeacher, registerSchool, login, logout, deleteSelfAccount, updatePushToken, changePassword, forgotPassword, resetPassword };
