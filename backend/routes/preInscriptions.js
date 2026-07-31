const express = require('express');
const router = express.Router();
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { supabase } = require('../utils/supabase');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

// Rate limiting : 100 requêtes par heure par IP pour prévenir le spam tout en permettant les tests
const preInscriptionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 100,
    message: { error: 'Trop de demandes de pré-inscription. Veuillez réessayer plus tard.' }
});

// Schéma de validation Joi
const preInscriptionSchema = Joi.object({
    nom: Joi.string().trim().min(2).max(100).required(),
    prenom: Joi.string().trim().min(2).max(100).required(),
    dateNaissance: Joi.string().isoDate().required(),
    sexe: Joi.string().valid('M', 'F').required(),
    cycle: Joi.string().trim().max(50).required(),
    classe: Joi.string().trim().max(50).required(),
    parentNom: Joi.string().trim().max(100).required(),
    parentTelephone: Joi.string().trim().max(50).required(),
    parentEmail: Joi.string().email({ tlds: { allow: false } }).allow('', null)
}).unknown(false); // Refuse les champs non définis

// 1. ROUTE PUBLIQUE : Créer une pré-inscription (appelée sans token)
router.post('/:schoolSlug', preInscriptionLimiter, async (req, res) => {
    try {
        const { schoolSlug } = req.params;
        
        // Validation stricte des données avec Joi
        const { error: validationError, value: data } = preInscriptionSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError.details[0].message });
        }

        // Vérifier si l'école existe (optionnel mais recommandé)
        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .select('slug')
            .eq('slug', schoolSlug)
            .single();

        if (schoolErr || !school) {
            return res.status(404).json({ error: 'École introuvable' });
        }

        const { error: insertErr } = await supabase
            .from('pre_inscriptions')
            .insert([
                {
                    school_slug: schoolSlug,
                    data,
                    status: 'PENDING'
                }
            ]);

        if (insertErr) throw insertErr;

        res.json({ success: true, message: 'Pré-inscription enregistrée avec succès.' });
    } catch (err) {
        console.error('Erreur POST /pre-inscriptions:', err);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
    }
});

// 2. ROUTE PROTEGÉE : Lire les pré-inscriptions (Admin)
router.get('/', authenticateToken, requireSchool, requireSchoolAdmin, async (req, res) => {
    try {
        const { schoolSlug } = req.user;
        const { data, error } = await supabase
            .from('pre_inscriptions')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Erreur GET /pre-inscriptions:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
});

// 3. ROUTE PROTEGÉE : Mettre à jour le statut (Accepter/Refuser)
router.put('/:id/status', authenticateToken, requireSchool, requireSchoolAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { schoolSlug } = req.user;

        const { error } = await supabase
            .from('pre_inscriptions')
            .update({ status })
            .eq('id', id)
            .eq('school_slug', schoolSlug);

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Erreur PUT /pre-inscriptions/status:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

module.exports = router;
