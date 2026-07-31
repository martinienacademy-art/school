const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { supabase } = require('../utils/supabase');
const { authenticateToken, requireSchoolAdmin, requireSchool } = require('../middleware/auth');

const classSchema = Joi.object({
    nom: Joi.string().trim().max(50).required(),
    cycle: Joi.string().valid('Primaire', 'Collège', 'Lycée', 'Maternelle', 'Crèche').required(),
    ecolage: Joi.number().min(0).required()
});

// GET /api/classes - Récupérer les classes de l'école
router.get('/', authenticateToken, requireSchool, async (req, res) => {
    try {
        const { schoolSlug } = req.user;
        const { data, error } = await supabase
            .from('school_classes')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('cycle', { ascending: false })
            .order('nom', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erreur GET /classes:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des classes' });
    }
});

// POST /api/classes - Ajouter une nouvelle classe
router.post('/', authenticateToken, requireSchool, requireSchoolAdmin, async (req, res) => {
    try {
        const { error: validationError, value } = classSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError.details[0].message });
        }

        const { schoolSlug } = req.user;

        // Vérifier si une classe avec le même nom existe déjà pour cette école
        const { data: existing } = await supabase
            .from('school_classes')
            .select('id')
            .eq('school_slug', schoolSlug)
            .ilike('nom', value.nom)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Une classe avec ce nom existe déjà.' });
        }

        const { data, error } = await supabase
            .from('school_classes')
            .insert([{ ...value, school_slug: schoolSlug }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Erreur POST /classes:', err);
        res.status(500).json({ error: 'Erreur lors de la création de la classe' });
    }
});

// PUT /api/classes/:id - Modifier une classe
router.put('/:id', authenticateToken, requireSchool, requireSchoolAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error: validationError, value } = classSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError.details[0].message });
        }

        const { schoolSlug } = req.user;

        const { data, error } = await supabase
            .from('school_classes')
            .update(value)
            .eq('id', id)
            .eq('school_slug', schoolSlug)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Classe introuvable' });
        
        res.json(data);
    } catch (err) {
        console.error('Erreur PUT /classes:', err);
        res.status(500).json({ error: 'Erreur lors de la modification de la classe' });
    }
});

// DELETE /api/classes/:id - Supprimer une classe
router.delete('/:id', authenticateToken, requireSchool, requireSchoolAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolSlug } = req.user;

        const { error } = await supabase
            .from('school_classes')
            .delete()
            .eq('id', id)
            .eq('school_slug', schoolSlug);

        if (error) throw error;
        res.json({ success: true, message: 'Classe supprimée avec succès' });
    } catch (err) {
        console.error('Erreur DELETE /classes:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de la classe' });
    }
});

module.exports = router;
