const express = require('express');
const router = express.Router();
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Graceful fallback if nodemailer fails to install
}

router.post('/test-smtp', async (req, res) => {
    if (!nodemailer) {
       return res.status(500).json({ error: 'Nodemailer module is not installed. Please try reinstalling it or use a fallback.' });
    }
    
    try {
        const {
            smtpServer,
            smtpPort,
            smtpUser,
            smtpPass,
            smtpSecurity,
            smtpSenderEmail,
            smtpSenderName,
            testEmail
        } = req.body;

        if (!smtpServer || !smtpPort || !smtpUser || !smtpPass || !testEmail) {
            return res.status(400).json({ error: 'Tous les champs SMTP sont requis' });
        }

        const secure = smtpSecurity === 'SSL' || (smtpSecurity === 'TLS' && smtpPort === '465');

        const transporter = nodemailer.createTransport({
            host: smtpServer,
            port: parseInt(smtpPort),
            secure: secure,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `"${smtpSenderName}" <${smtpSenderEmail || smtpUser}>`,
            to: testEmail,
            subject: 'Test de configuration SMTP - GestioSchool',
            text: 'Ceci est un message de test envoyé depuis GestioSchool pour vérifier votre configuration SMTP.',
            html: '<p>Ceci est un message de test envoyé depuis <b>GestioSchool</b> pour vérifier votre configuration SMTP.</p>'
        };

        const info = await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email de test envoyé', messageId: info.messageId });
    } catch (err) {
        console.error('Erreur test SMTP:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
