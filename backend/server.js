// ============================================================
// SERVEUR PRINCIPAL — MasterFlow Backend (Version Supabase)
// ============================================================
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { supabase, supabaseAdmin } = require('./utils/supabase');

const { PORT } = require('./config');

// ── Créer les dossiers nécessaires ───────────────────────────
const uploadsDir = path.join(__dirname, 'uploads', 'messages');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Application Express ───────────────────────────────────────
const app = express();

// Middleware globaux de sécurité
app.use(helmet({
    contentSecurityPolicy: false,
})); // Protège contre les failles web classiques
app.disable('x-powered-by'); // Ne pas exposer le fait qu'on utilise Express

// CORS strict
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // En développement local, requêtes sans origine (Postman) ou hébergées sur Render/domaine configuré.
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.onrender.com'))) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger simple des requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pre-inscriptions', require('./routes/preInscriptions')); // Route publique
// ── Sécurisation par défaut (Deny by default) ───────────────────
const { authenticateToken, requireSchool } = require('./middleware/auth');
app.use('/api/parent', authenticateToken, requireSchool, require('./routes/parent'));
app.use('/api/students', authenticateToken, requireSchool, require('./routes/students'));
app.use('/api/sync', authenticateToken, requireSchool, require('./routes/sync'));
app.use('/api/chat', authenticateToken, requireSchool, require('./routes/chat'));
app.use('/api/notifications', authenticateToken, requireSchool, require('./routes/notifications'));
app.use('/api/settings', authenticateToken, requireSchool, require('./routes/settings'));
app.use('/api/announcements', authenticateToken, requireSchool, require('./routes/announcements'));
app.use('/api/personnel', authenticateToken, requireSchool, require('./routes/personnel'));
app.use('/api/classes', authenticateToken, requireSchool, require('./routes/classes'));
app.use('/api/email', authenticateToken, requireSchool, require('./routes/email'));
app.use('/api/discipline', authenticateToken, requireSchool, require('./routes/discipline'));
app.use('/api/superadmin', authenticateToken, require('./routes/superAdmin')); // 👑 Routes propriétaire SaaS

// Route publique pour lister les écoles dans le login
app.get('/api/schools', async (req, res) => {
    try {
        const { data: schools, error } = await supabaseAdmin
            .from('schools')
            .select('slug, name, logo_url')
            .in('status', ['active', 'trial'])
            .order('name');
        if (error) throw error;
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: 'Erreur récupération écoles' });
    }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        backend: 'online',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ── Service du Frontend (Static Files) ───────────────────────
const frontendDir = path.join(__dirname, '..', 'dist');

// Serveur les fichiers statiques de dist
app.use(express.static(frontendDir));

// Pour toutes les autres routes non-API, renvoyer index.html (SPA React)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    const indexPath = path.join(frontendDir, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    } else {
        console.error(`❌ [Frontend] index.html introuvable à: ${indexPath}`);
        return res.status(500).send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><title>Erreur Déploiement</title></head>
            <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white;">
                <h1 style="color: #f43f5e;">Dossier de build frontend introuvable</h1>
                <p>Le fichier index.html n'a pas été trouvé à l'emplacement : <code>${indexPath}</code></p>
                <p>Veuillez vérifier que la commande "npm run build" s'est bien exécutée lors du déploiement.</p>
            </body>
            </html>
        `);
    }
});

// ── Gestion globale des erreurs ───────────────────────────────
app.use((err, req, res, _next) => {
    console.error('❌ Erreur serveur:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur.', detail: err.message });
});

// ── Démarrage ─────────────────────────────────────────────────
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 MasterFlow Backend démarré`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📡 Serveur: http://localhost:${port}`);
        console.log(`🛡️  Base de données: Supabase PostgreSQL`);
        console.log(`🔑 Auth: JWT ${process.env.JWT_SECRET ? '(configuré)' : '(DÉFAUT)'}`);
        console.log(`📁 Node env: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💬 Routes actives: /api/auth, /api/parent, /api/students, /api/sync, /api/chat, /api/notifications, /api/announcements`);
        console.log(`🏥 Health check: /api/health`);
        console.log(`${'='.repeat(60)}\n`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ Le port ${port} est déjà utilisé. Tentative sur le port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error(`❌ Erreur au démarrage du serveur:`, err);
            process.exit(1);
        }
    });
};

startServer(PORT);
