// ============================================================
// ROUTES — Authentification
// ============================================================
const router = require('express').Router();
const { register, registerTeacher, registerSchool, login, logout, deleteSelfAccount, updatePushToken, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limite chaque IP à 10 requêtes par 15 minutes pour ces routes
    message: { error: 'Trop de tentatives, veuillez réessayer plus tard.' }
});

router.post('/register', authLimiter, register);
router.post('/register-teacher', authLimiter, registerTeacher);
router.post('/register-school', authLimiter, registerSchool);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/change-password', authenticateToken, authLimiter, changePassword);
router.post('/update-push-token', authenticateToken, updatePushToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
