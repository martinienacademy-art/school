const express = require('express');
const router = express.Router();
const disciplineController = require('../controllers/disciplineController');
const { authenticateToken, requireSchool } = require('../middleware/auth');

// Middleware pour vérifier les rôles
const requireRole = (roles) => (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'superadmin')) {
        return res.status(403).json({ error: 'Permission refusée. Rôle insuffisant.' });
    }
    next();
};

// Appliquer le middleware de vérification du token à toutes les routes
router.use(authenticateToken, requireSchool);

// ==========================================
// PARAMÈTRES ET TYPES D'INFRACTIONS
// ==========================================
router.get('/settings', requireRole(['admin', 'superadmin']), disciplineController.getSettings);
router.put('/settings', requireRole(['admin', 'superadmin']), disciplineController.updateSettings);

router.get('/infractions', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.getInfractionTypes);
router.post('/infractions', requireRole(['admin', 'superadmin']), disciplineController.createInfractionType);
router.delete('/infractions/:id', requireRole(['admin', 'superadmin']), disciplineController.deleteInfractionType);

// ==========================================
// INCIDENTS (INFRACTIONS)
// ==========================================
router.get('/incidents', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.getIncidents);
router.post('/incidents', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.createIncident);

// ==========================================
// ABSENCES ET RETARDS
// ==========================================
router.get('/absences', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.getAbsences);
router.post('/absences', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.createAbsence);

// ==========================================
// OBJETS CONFISQUÉS
// ==========================================
router.get('/objets', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.getObjets);
router.post('/objets', requireRole(['admin', 'enseignant', 'superadmin']), disciplineController.createObjet);
router.patch('/objets/:id/restituer', requireRole(['admin', 'superadmin']), disciplineController.updateObjetRestitue);

// ==========================================
// CONSEILS DE DISCIPLINE
// ==========================================
router.get('/conseils', requireRole(['admin', 'superadmin']), disciplineController.getConseils);
router.post('/conseils', requireRole(['admin', 'superadmin']), disciplineController.createConseil);

// ==========================================
// STATISTIQUES (TABLEAU DE BORD)
// ==========================================
router.get('/stats', requireRole(['admin', 'superadmin']), disciplineController.getStats);

module.exports = router;
