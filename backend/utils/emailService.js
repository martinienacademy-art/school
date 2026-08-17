const nodemailer = require('nodemailer');

// Fonction pour créer un transporteur SMTP basé sur les variables d'environnement ou la config
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Envoyer un email de bienvenue à la création d'un établissement (Directeur)
 */
async function sendSchoolWelcomeEmail({ email, adminNom, schoolName, schoolSlug }) {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@masterflow.com';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.05em;">MasterFlow</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Bienvenue dans votre Espace Éducatif SaaS</p>
        </div>

        <div style="padding: 32px; color: #1e293b;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Félicitations, ${adminNom} ! 🎉</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Votre établissement <strong>${schoolName}</strong> a été créé avec succès sur la plateforme MasterFlow. 
            Votre période d'essai gratuit de <strong>30 jours</strong> est désormais active.
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 12px 12px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #334155;">vos Identifiants de Connexion :</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Établissement :</strong> ${schoolName}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Code (Slug) :</strong> ${schoolSlug}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Adresse Email (Identifiant) :</strong> ${email}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Vous pouvez dès à présent vous connecter pour configurer vos classes, ajouter vos enseignants et vos élèves.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MasterFlow • Plateforme SaaS de Gestion Scolaire</p>
        </div>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: `"MasterFlow" <${fromAddress}>`,
        to: email,
        subject: `🎉 Bienvenue sur MasterFlow - ${schoolName} est prêt !`,
        html: htmlContent
      });
      console.log(`✉️ Email de bienvenue envoyé à ${email} pour ${schoolName}`);
    } else {
      console.log(`ℹ️ [SMTP] Transporteur non configuré. Email de bienvenue simulé pour ${email}`);
    }
  } catch (err) {
    console.error(`⚠️ Erreur envoi email bienvenue école (${email}):`, err.message);
  }
}

/**
 * Envoyer un email de bienvenue à un utilisateur (Parent ou Enseignant)
 */
async function sendUserWelcomeEmail({ email, nom, role, schoolName }) {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@masterflow.com';
    const roleLabel = role === 'parent' ? 'Parent d\'élève' : role === 'enseignant' ? 'Enseignant' : 'Utilisateur';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">MasterFlow</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Espace Intégré ${roleLabel}</p>
        </div>

        <div style="padding: 32px; color: #1e293b;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Bonjour ${nom},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Votre compte <strong>${roleLabel}</strong> a été créé avec succès sur l'application de votre établissement <strong>${schoolName || 'votre école'}</strong>.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Votre adresse e-mail de connexion est : <strong>${email}</strong>.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MasterFlow</p>
        </div>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: `"MasterFlow" <${fromAddress}>`,
        to: email,
        subject: `Bienvenue sur MasterFlow - ${schoolName || 'Votre établissement'}`,
        html: htmlContent
      });
      console.log(`✉️ Email utilisateur envoyé à ${email}`);
    } else {
      console.log(`ℹ️ [SMTP] Transporteur non configuré. Email simulé pour ${email}`);
    }
  } catch (err) {
    console.error(`⚠️ Erreur envoi email utilisateur (${email}):`, err.message);
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
async function sendPasswordResetEmail({ email, token, tableFound }) {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@masterflow.com';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: #0f172a; padding: 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">MasterFlow</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">Réinitialisation de mot de passe</p>
        </div>

        <div style="padding: 32px; color: #1e293b;">
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Vous avez demandé la réinitialisation du mot de passe associé à l'adresse e-mail <strong>${email}</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Code de réinitialisation : <strong>${token}</strong>
          </p>
        </div>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: `"MasterFlow Sécurité" <${fromAddress}>`,
        to: email,
        subject: `🔐 Réinitialisation de votre mot de passe MasterFlow`,
        html: htmlContent
      });
      console.log(`✉️ Email réinitialisation envoyé à ${email}`);
    }
  } catch (err) {
    console.error(`⚠️ Erreur email réinitialisation (${email}):`, err.message);
  }
}

module.exports = {
  sendSchoolWelcomeEmail,
  sendUserWelcomeEmail,
  sendPasswordResetEmail
};
