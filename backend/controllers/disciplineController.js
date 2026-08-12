const { supabase } = require('../utils/supabase');

const getSchoolSlug = (req) => req.user?.schoolSlug;

// ==========================================
// PARAMÈTRES ET TYPES D'INFRACTIONS
// ==========================================

async function getSettings(req, res) {
    const schoolSlug = getSchoolSlug(req);
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        let { data, error } = await supabase
            .from('discipline_settings')
            .select('*')
            .eq('school_slug', schoolSlug)
            .single();

        if (error && error.code === 'PGRST116') {
            // Créer les paramètres par défaut
            const { data: newSettings, error: insertError } = await supabase
                .from('discipline_settings')
                .insert({ school_slug: schoolSlug })
                .select()
                .single();
            if (insertError) throw insertError;
            data = newSettings;
        } else if (error) throw error;

        return res.json(data);
    } catch (err) {
        console.error('getSettings Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur.' });
    }
}

async function updateSettings(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { heures_max_absence, email_notification, telephone_sms } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('discipline_settings')
            .upsert({ 
                school_slug: schoolSlug,
                heures_max_absence,
                email_notification,
                telephone_sms,
                updated_at: new Date().toISOString()
            }, { onConflict: 'school_slug' })
            .select()
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getInfractionTypes(req, res) {
    const schoolSlug = getSchoolSlug(req);
    try {
        const { data, error } = await supabase
            .from('discipline_infraction_types')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('nom');
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createInfractionType(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { nom, gravite, sanction_defaut, points_retrait } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('discipline_infraction_types')
            .insert({ school_slug: schoolSlug, nom, gravite, sanction_defaut, points_retrait })
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function deleteInfractionType(req, res) {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('discipline_infraction_types').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ==========================================
// INCIDENTS (INFRACTIONS)
// ==========================================

async function getIncidents(req, res) {
    const schoolSlug = getSchoolSlug(req);
    try {
        const { data, error } = await supabase
            .from('discipline_incidents')
            .select('*, type:type_infraction_id(*)')
            .eq('school_slug', schoolSlug)
            .order('date', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createIncident(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { date, eleve_id, eleve_nom, classe, type_infraction_id, sanction, statut, motif } = req.body;
    try {
        const { data, error } = await supabase
            .from('discipline_incidents')
            .insert({ school_slug: schoolSlug, date, eleve_id, eleve_nom, classe, type_infraction_id, sanction, statut, motif })
            .select('*, type:type_infraction_id(*)')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ==========================================
// ABSENCES ET RETARDS
// ==========================================

async function getAbsences(req, res) {
    const schoolSlug = getSchoolSlug(req);
    try {
        const { data, error } = await supabase
            .from('discipline_absences')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('date', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createAbsence(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { date, eleve_id, eleve_nom, classe, type, duree_heures, justifiee, justificatif_url, motif } = req.body;
    try {
        const { data, error } = await supabase
            .from('discipline_absences')
            .insert({ school_slug: schoolSlug, date, eleve_id, eleve_nom, classe, type, duree_heures, justifiee, justificatif_url, motif })
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ==========================================
// OBJETS CONFISQUÉS
// ==========================================

async function getObjets(req, res) {
    const schoolSlug = getSchoolSlug(req);
    try {
        const { data, error } = await supabase
            .from('discipline_objets_confisques')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('date', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createObjet(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { date, eleve_id, eleve_nom, classe, objet, circonstances } = req.body;
    try {
        const { data, error } = await supabase
            .from('discipline_objets_confisques')
            .insert({ school_slug: schoolSlug, date, eleve_id, eleve_nom, classe, objet, circonstances })
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function updateObjetRestitue(req, res) {
    const { id } = req.params;
    const { restitue } = req.body;
    try {
        const { data, error } = await supabase
            .from('discipline_objets_confisques')
            .update({ restitue })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ==========================================
// CONSEILS DE DISCIPLINE
// ==========================================

async function getConseils(req, res) {
    const schoolSlug = getSchoolSlug(req);
    try {
        const { data, error } = await supabase
            .from('discipline_conseils')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('date', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function createConseil(req, res) {
    const schoolSlug = getSchoolSlug(req);
    const { date, eleve_id, eleve_nom, classe, motif, decision } = req.body;
    try {
        const { data, error } = await supabase
            .from('discipline_conseils')
            .insert({ school_slug: schoolSlug, date, eleve_id, eleve_nom, classe, motif, decision })
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ==========================================
// TABLEAU DE BORD ET STATISTIQUES
// ==========================================

async function getStats(req, res) {
    const schoolSlug = getSchoolSlug(req);
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        // Date limite : début du mois
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const dateStr = startOfMonth.toISOString().split('T')[0];

        // 1. Incidents du mois
        const { count: incidentsMois } = await supabase
            .from('discipline_incidents')
            .select('*', { count: 'exact', head: true })
            .eq('school_slug', schoolSlug)
            .gte('date', dateStr);

        // 2. Absences non justifiées
        const { count: absencesNJ } = await supabase
            .from('discipline_absences')
            .select('*', { count: 'exact', head: true })
            .eq('school_slug', schoolSlug)
            .eq('justifiee', false);

        // 3. Objets confisqués non restitués
        const { count: objets } = await supabase
            .from('discipline_objets_confisques')
            .select('*', { count: 'exact', head: true })
            .eq('school_slug', schoolSlug)
            .eq('restitue', false);

        // 4. Sanctions en cours (ici, on prend les incidents non résolus pour l'exemple)
        const { count: sanctions } = await supabase
            .from('discipline_incidents')
            .select('*', { count: 'exact', head: true })
            .eq('school_slug', schoolSlug)
            .eq('statut', 'Non résolu');
            
        // 5. Récupérer les données pour graphiques (répartition par classe, top infractions)
        const { data: incidents } = await supabase
            .from('discipline_incidents')
            .select('classe, type:type_infraction_id(nom)')
            .eq('school_slug', schoolSlug);
            
        const repartition = {};
        const topInfractions = {};
        
        if (incidents) {
            incidents.forEach(inc => {
                repartition[inc.classe] = (repartition[inc.classe] || 0) + 1;
                if (inc.type && inc.type.nom) {
                    topInfractions[inc.type.nom] = (topInfractions[inc.type.nom] || 0) + 1;
                }
            });
        }

        return res.json({
            kpi: {
                incidents_mois: incidentsMois || 0,
                absences_non_justifiees: absencesNJ || 0,
                objets_confisques: objets || 0,
                sanctions_en_cours: sanctions || 0
            },
            charts: {
                repartition_classe: Object.keys(repartition).map(k => ({ name: k, value: repartition[k] })),
                top_infractions: Object.keys(topInfractions).map(k => ({ name: k, count: topInfractions[k] })).sort((a,b) => b.count - a.count).slice(0,5)
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getSettings, updateSettings,
    getInfractionTypes, createInfractionType, deleteInfractionType,
    getIncidents, createIncident,
    getAbsences, createAbsence,
    getObjets, createObjet, updateObjetRestitue,
    getConseils, createConseil,
    getStats
};
