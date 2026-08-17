// ============================================================
// PAGE DE CONNEXION — Hybride PC (Sliding) / Mobile (Slideshow)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parentApi } from '../services/parentApi';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, Phone, CheckCircle, Store, Eye, EyeOff, Mail, Building2, Star } from 'lucide-react';
import { API_BASE_URL } from '../config';

// ── Images de fond (Mobile uniquement) ──
import bgImage1 from '../assets/login-bg1.jpg';
import bgImage2 from '../assets/login-bg2.jpg';
import bgImage3 from '../assets/login-bg3.jpg';
import bgImage4 from '../assets/login-bg4.jpg';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { RegisterSchoolModal } from './RegisterSchoolModal';
import { validatePassword } from '../utils/passwordUtils';

const BG_IMAGES = [bgImage1, bgImage2, bgImage3, bgImage4];
const SLIDE_DURATION = 5000;

// ── COMPOSANTS PARTAGÉS ──────────────────────────────────────

const SchoolLogo: React.FC<{ className?: string, size?: string }> = ({ className = "h-20 w-auto mix-blend-multiply", size }) => {
  return (
    <img src="/logo-masterflow.png" alt="MasterFlow Logo" className={`mb-6 drop-shadow-md object-contain ${className} ${size || ''}`} />
  );
};

const BackgroundSlideshow: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const goToNext = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, []);
  
    useEffect(() => {
      const timer = setInterval(goToNext, SLIDE_DURATION);
      return () => clearInterval(timer);
    }, [goToNext]);
  
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        {BG_IMAGES.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 z-[1] bg-[#0055CC]/40 backdrop-blur-[2px]" />
      </div>
    );
};

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────

export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const appName = "MasterFlow";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState<'login' | 'register' | 'link'>('login');
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  
  // Auth Form States
  const [username, setUsername] = useState(''); // Email de connexion
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState('');
  const [trialExpiredSchool, setTrialExpiredSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
  // Consent States
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [parentPhotoAuth, setParentPhotoAuth] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  // NOUVEAU : Sélection Établissement
  const [schools, setSchools] = useState<{slug: string, name: string, logo_url: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  // NOUVEAU : Inscription Établissement (Directeur)
  const [isRegisterSchoolOpen, setIsRegisterSchoolOpen] = useState(false);

  // NOUVEAU : Mot de passe oublié
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const fetchSchoolsList = useCallback(() => {
    fetch(`${API_BASE_URL}/schools`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSchools(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchSchoolsList();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchSchoolsList]);

  const handleSchoolCreated = (slug: string, email: string) => {
    setIsRegisterSchoolOpen(false);
    fetchSchoolsList();
    setSelectedSchool(slug);
    setUsername(email);
    setPassword('');
    setError('');
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setError('');
    setTrialExpiredSchool(null);
    setLoading(true);

    try {
        if (type === 'login') {
            const ok = await login(username, password, selectedSchool);
            if (!ok) setError('Identifiants incorrects (Vérifiez votre email et mot de passe).');
        } else {
            if (!acceptedTerms || !acceptedPrivacy) {
                setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError("Les mots de passe ne correspondent pas.");
                setLoading(false);
                return;
            }

            const val = validatePassword(password);
            if (!val.isValid) {
                setError(val.message || "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
                setLoading(false);
                return;
            }

            setLoading(true);
            await parentApi.register({
                nom,
                email: email || username,
                telephone,
                password,
                school_slug: selectedSchool,
                accepted_terms: acceptedTerms,
                accepted_privacy_policy: acceptedPrivacy,
                parent_photo_authorization: parentPhotoAuth,
                marketing_consent: marketingConsent
            });
            // On reste en local pour l'étape de liaison avant de déclencher l'auth globale
            setView('link');
        }
    } catch (err: any) {
        const msg: string = err?.message || err?.error || "Une erreur est survenue.";
        if (msg.startsWith('TRIAL_EXPIRED:')) {
            setTrialExpiredSchool(msg.replace('TRIAL_EXPIRED:', ''));
        } else {
            setError(msg);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotPasswordStatus('loading');
      setForgotPasswordMessage('');
      try {
          const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: forgotPasswordEmail, schoolSlug: selectedSchool })
          });
          const data = await res.json();
          if (res.ok) {
              setForgotPasswordStatus('success');
              setForgotPasswordMessage(data.message || 'Lien envoyé.');
          } else {
              setForgotPasswordStatus('error');
              setForgotPasswordMessage(data.error || 'Erreur lors de la demande.');
          }
      } catch (err) {
          setForgotPasswordStatus('error');
          setForgotPasswordMessage('Erreur de connexion au serveur.');
      }
  };


  if (view === 'link') {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
                <LinkStudent onComplete={async () => {
                   // Une fois lié, on connecte officiellement
                   await login(username, password, selectedSchool);
                }} />
                <button 
                  onClick={async () => await login(username, password, selectedSchool)}
                  className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-[#1479E8] transition"
                >
                  Passer cette étape pour le moment
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-['Poppins'] overflow-hidden bg-white relative">
      <style>{`
        /* ──── DESKTOP SLIDING OVERLAY ──── */
        .auth-container {
          background-color: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          position: relative;
          overflow: hidden;
          width: 850px;
          max-width: 100%;
          min-height: 550px;
          z-index: 10;
        }

        .form-container {
          position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out;
        }

        .sign-in-container { left: 0; width: 50%; z-index: 2; }
        .auth-container.right-panel-active .sign-in-container { transform: translateX(100%); }

        .sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }
        .auth-container.right-panel-active .sign-up-container {
          transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute; top: 0; left: 50%; width: 50%; height: 100%;
          overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100;
        }
        .auth-container.right-panel-active .overlay-container { transform: translateX(-100%); }

        .overlay {
          background: #0055CC;
          color: #FFFFFF; position: relative; left: -100%; height: 100%; width: 200%;
          transform: translateX(0); transition: transform 0.6s cubic-bezier(0.7, 0, 0.3, 1);
        }
        .auth-container.right-panel-active .overlay { transform: translateX(50%); }

        .overlay-panel {
          position: absolute; display: flex; align-items: center; justify-content: center;
          flex-direction: column; padding: 0 50px; text-align: center; top: 0; height: 100%; width: 50%;
          transform: translateX(0); transition: transform 0.6s cubic-bezier(0.7, 0, 0.3, 1);
        }
        .overlay-left { transform: translateX(-20%); }
        .auth-container.right-panel-active .overlay-left { transform: translateX(0); }
        .overlay-right { right: 0; transform: translateX(0); }
        .auth-container.right-panel-active .overlay-right { transform: translateX(20%); }

        .auth-form {
          background-color: #FFFFFF; display: flex; align-items: center; justify-content: center;
          flex-direction: column; padding: 0 50px; height: 100%; text-align: center;
        }

        .auth-input {
          background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 12px 15px; margin: 8px 0;
          width: 100%; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.3s ease;
        }
        .auth-input:focus {
          border-color: #1479E8;
          box-shadow: 0 0 0 2px rgba(20, 121, 232, 0.3);
        }

        .auth-button {
          border-radius: 12px; border: 1px solid #1479E8; background-color: #1479E8; color: #FFFFFF;
          font-size: 12px; font-weight: bold; padding: 12px 45px; letter-spacing: 1px;
          text-transform: uppercase; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; margin-top: 15px; box-shadow: 0 4px 14px 0 rgba(20, 121, 232, 0.39);
        }
        .auth-button:hover { background-color: rgba(20, 121, 232, 0.9); border-color: rgba(20, 121, 232, 0.9); transform: scale(1.05); box-shadow: 0 10px 15px -3px rgba(20, 121, 232, 0.3); }
        .auth-button:active { transform: scale(0.95); box-shadow: none; }
        .auth-button.ghost { background-color: transparent; border-color: #FFFFFF; }

        .social-container { margin: 15px 0; }
        .social-container a {
          border: 1px solid #e2e8f0; border-radius: 50%; display: inline-flex; justify-content: center;
          align-items: center; margin: 0 5px; height: 38px; width: 38px; color: #1e293b; transition: all 0.3s;
        }
        .social-container a:hover { background: #f1f5f9; border-color: #eab308; color: #eab308; }

        /* ──── MOBILE CARDS ──── */
        .mobile-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            width: 90%;
            max-width: 400px;
            padding: 32px 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            z-index: 10;
        }
      `}</style>

      {/* --- DESKTOP VIEW --- */}
      {!isMobile && (
        <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`}>
          
          {/* Register Panel */}
          <div className="form-container sign-up-container">
            <form className="auth-form overflow-y-auto max-h-[85vh] py-4" onSubmit={(e) => handleAuth(e, 'register')}>
              <SchoolLogo size="w-12 h-12" />
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">Créer un compte</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Inscription Parent</div>
              
              <select className="auth-input mb-3 font-bold text-slate-600 border border-slate-200 text-xs py-2.5" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required>
                  <option value="" disabled>-- Sélectionnez votre établissement --</option>
                  {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>

              <input type="text" placeholder="Nom complet *" className="auth-input mb-2 text-xs py-2.5" value={nom} onChange={(e) => setNom(e.target.value)} required />
              <input type="email" placeholder="Adresse Email (Gmail) *" className="auth-input mb-2 text-xs py-2.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="tel" placeholder="Numéro de Téléphone *" className="auth-input mb-2 text-xs py-2.5" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
              
              <div className="relative w-full mb-2">
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="auth-input text-xs py-2.5 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1479E8] p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative w-full mb-2">
                <input type={showPassword ? "text" : "password"} placeholder="Confirmer le mot de passe *" className="auth-input text-xs py-2.5 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <div className="w-full text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200 mb-2">
                <p className="font-bold text-slate-700">Sécurité du mot de passe :</p>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <span className={password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 8+ caractères</span>
                  <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Majuscule</span>
                  <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Chiffre</span>
                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Spécial</span>
                </div>
              </div>

              <div className="text-left w-full mt-1 space-y-1 max-w-[280px]">
                <p className="text-[10px] font-bold text-slate-700">Confidentialité & Données (loi béninoise / APDP)</p>
                
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" required />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    J'accepte les <span className="font-bold text-slate-700">CGU</span> de l'application de mon établissement. <span className="text-rose-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" required />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    J'autorise le traitement des <span className="font-bold text-slate-700">données de scolarité/présences</span> de mon enfant. <span className="text-rose-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={parentPhotoAuth} onChange={(e) => setParentPhotoAuth(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    <span className="font-bold text-slate-700">Droit à l'image</span> : J'autorise l'affichage de la photo de mon enfant. <span className="text-slate-400">(Optionnel)</span>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    J'accepte de recevoir des actus et conseils d'YZO. <span className="text-slate-400">(Optionnel)</span>
                  </span>
                </label>
              </div>
              {error && <div className="text-rose-500 text-xs mt-2 font-bold">{error}</div>}
              <button className="auth-button mt-3" type="submit" disabled={loading}>{loading ? 'Chargement...' : "S'inscrire"}</button>
            </form>
          </div>

          {/* Login Panel */}
          <div className="form-container sign-in-container">
            <form className="auth-form" onSubmit={(e) => handleAuth(e, 'login')}>
              <SchoolLogo />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Se connecter</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Accès {appName}</div>
              
              <select className="auth-input mb-4 font-bold text-slate-600 border border-slate-200" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
                  <option value="">Accès SuperAdmin Global</option>
                  <option disabled>────── Établissements ──────</option>
                  {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>

              <div className="relative w-full">
                <input type="email" placeholder="Adresse Email (Gmail) *" className="auth-input pl-4" value={username} onChange={(e) => setUsername(e.target.value)} required />
                
              </div>

              <div className="relative w-full">
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="auth-input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1479E8] p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center w-full px-1 text-[11px] mt-1 mb-2">
                <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-slate-400 hover:text-[#1479E8]">Mot de passe oublié ?</button>
                <button 
                  type="button" 
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-slate-400 hover:text-[#1479E8] underline cursor-pointer"
                >
                  Confidentialité & Sécurité
                </button>
              </div>

              {trialExpiredSchool && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left w-full my-2">
                  <p className="text-amber-800 font-bold text-xs">⏰ Période d'essai expirée</p>
                  <p className="text-amber-700 text-xs mt-1">"{trialExpiredSchool}" — Contactez l'administrateur pour régler l'abonnement.</p>
                </div>
              )}
              {error && <div className="text-rose-500 text-xs italic font-bold my-1">{error}</div>}

              <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Traitement...' : 'Se connecter'}</button>
              
              <button 
                type="button" 
                onClick={() => setIsRegisterSchoolOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-[#1479E8] to-[#1479E8]/90 hover:from-[#1479E8] hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#1479E8]/30 active:scale-98 transition-all flex items-center justify-center gap-2 mt-3"
              >
                <Building2 className="w-4 h-4 text-white" />
                <span>Directeur ? Inscrivez votre école</span>
              </button>
            </form>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-left duration-700">Content de vous revoir ! 👋</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">Retrouvez tout l'univers scolaire de vos enfants en un clic. Votre tableau de bord personnalisé vous attend.</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> Accès tableau de bord</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> Consultation des bulletins</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> Alertes et annonces</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(false)}>Se connecter</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-right duration-700 flex items-center justify-center gap-3">
                  <Star className="w-10 h-10 text-[#F5A623] fill-[#F5A623] drop-shadow-md" /> Bonjour, Parent !
                </h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">Plongez au cœur de l'éducation de votre enfant. Suivez chaque instant de sa réussite avec nous.</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> Suivi des notes en temps réel</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> Notifications de présence</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> Communication école-famille</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(true)}>Créer un compte</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE VIEW --- */}
      {isMobile && (
        <>
            <BackgroundSlideshow />
            <div className="mobile-card">
                <div className="flex flex-col items-center">
                    <SchoolLogo size="w-20 h-20" />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter text-center">
                        {view === 'login' ? 'Bienvenue !' : 'Rejoignez-nous'}
                    </h1>
                    <p className="text-[10px] text-[#1479E8] font-extrabold uppercase tracking-[0.2em] mt-2 mb-6 bg-amber-50 px-3 py-1 rounded-full">
                        {appName} • Excellence
                    </p>
                </div>

                <form onSubmit={(e) => handleAuth(e, view === 'login' ? 'login' : 'register')} className="space-y-4">
                    <div className="relative mb-2">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1479E8]" />
                        <select className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 appearance-none" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required={view === 'register'}>
                            {view !== 'register' && <option value="">Accès SuperAdmin Global</option>}
                            {view !== 'register' && <option disabled>────── Établissements ──────</option>}
                            {view === 'register' && <option value="" disabled>-- Sélectionnez votre école --</option>}
                            {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                        </select>
                    </div>

                    {view === 'register' ? (
                        <>
                            <div className="relative">
                                
                                <input type="text" placeholder="Nom complet *" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={nom} onChange={(e) => setNom(e.target.value)} required />
                            </div>
                            <div className="relative mt-3">
                                
                                <input type="email" placeholder="Adresse Email (Gmail) *" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="relative mt-3">
                                
                                <input type="tel" placeholder="Numéro de Téléphone *" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
                            </div>
                            <div className="relative mt-3">
                                
                                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1479E8] p-1">
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative mt-3">
                                
                                <input type={showPassword ? "text" : "password"} placeholder="Confirmer le mot de passe *" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <div className="w-full text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 mt-2 text-left">
                                <p className="font-bold text-slate-700">Sécurité du mot de passe :</p>
                                <div className="grid grid-cols-2 gap-1 text-[9px]">
                                  <span className={password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 8+ caractères</span>
                                  <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Majuscule</span>
                                  <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Chiffre</span>
                                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>✓ 1 Spécial</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                
                                <input type="email" placeholder="Adresse Email (Gmail) *" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div className="relative mt-3">
                                
                                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1479E8] p-1">
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </>
                    )}

                    {view === 'login' ? (
                      <div className="flex justify-between items-center px-1 text-[11px] mt-1">
                        <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-slate-400 hover:text-[#1479E8]">Mot de passe oublié ?</button>
                        <button 
                          type="button" 
                          onClick={() => setIsPrivacyOpen(true)}
                          className="text-slate-400 hover:text-[#1479E8] underline cursor-pointer"
                        >
                          Confidentialité & Sécurité
                        </button>
                      </div>
                    ) : (
                      <div className="text-left w-full mt-2 space-y-1.5 px-1 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-bold text-slate-700">Confidentialité & Données (loi béninoise / APDP)</p>
                        
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" required />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            J'accepte les <span className="font-bold text-slate-700">CGU</span> de l'application de mon établissement. <span className="text-rose-500">*</span>
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" required />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            J'autorise le traitement des <span className="font-bold text-slate-700">données de scolarité/présences</span> de mon enfant. <span className="text-rose-500">*</span>
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={parentPhotoAuth} onChange={(e) => setParentPhotoAuth(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            <span className="font-bold text-slate-700">Droit à l'image</span> : J'autorise l'affichage de la photo de mon enfant. <span className="text-slate-400">(Optionnel)</span>
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-[#1479E8] rounded scale-90" />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            J'accepte de recevoir des actualités et conseils d'YZO. <span className="text-slate-400">(Optionnel)</span>
                          </span>
                        </label>
                      </div>
                    )}

                    {trialExpiredSchool && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                            <p className="text-amber-800 font-bold text-xs">⏰ Période d'essai expirée</p>
                            <p className="text-amber-700 text-xs mt-1">"{trialExpiredSchool}" — Contactez l'administrateur pour régler l'abonnement.</p>
                        </div>
                    )}
                    {error && <div className="text-rose-500 text-xs italic text-center font-bold px-4">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full py-4 bg-[#1479E8] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1479E8]/30 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4">
                        {loading ? 'Traitement...' : (view === 'login' ? 'Décollage' : 'Inscrire')}
                    </button>
                    
                    <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full py-2 text-[#1479E8] text-[10px] font-black uppercase tracking-widest mt-2">
                        {view === 'login' ? "Nouveau ? Créer un compte" : "Déjà un compte ? Se connecter"}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setIsRegisterSchoolOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-[#1479E8] to-[#1479E8]/90 hover:from-[#1479E8] hover:to-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#1479E8]/30 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-3"
                    >
                      <Building2 className="w-4 h-4 text-white" />
                      <span>Directeur ? Inscrivez votre école</span>
                    </button>
                </form>
            </div>
        </>
      )}

      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 z-20 text-[10px] font-black uppercase tracking-[0.3em] ${isMobile ? 'text-white/60' : 'text-slate-400'} whitespace-nowrap`}>
        <span>© {new Date().getFullYear()} {appName} • Éducation Connectée</span>
        <span className="hidden sm:inline">•</span>
        <button 
          onClick={() => setIsPrivacyOpen(true)}
          className="hover:text-[#1479E8] transition-colors underline cursor-pointer"
        >
          Confidentialité
        </button>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {isRegisterSchoolOpen && (
        <RegisterSchoolModal 
          onClose={() => setIsRegisterSchoolOpen(false)} 
          onSuccess={handleSchoolCreated} 
        />
      )}

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setIsForgotPasswordOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <span className="sr-only">Fermer</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublié</h3>
            <p className="text-sm text-gray-500 mb-6">Saisissez l'adresse e-mail associée à votre compte. Si elle existe, nous vous enverrons un lien de réinitialisation.</p>
            
            {forgotPasswordStatus === 'success' ? (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex gap-2 items-start">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p>{forgotPasswordMessage}</p>
                </div>
            ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse E-mail</label>
                        <input 
                            type="email" 
                            required 
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#1479E8] focus:border-[#1479E8] p-2 border"
                            placeholder="votre.email@exemple.com"
                        />
                    </div>
                    
                    {forgotPasswordStatus === 'error' && (
                        <p className="text-sm text-red-600">{forgotPasswordMessage}</p>
                    )}

                    <button 
                        type="submit" 
                        disabled={forgotPasswordStatus === 'loading'}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#1479E8] hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1479E8] disabled:opacity-50"
                    >
                        {forgotPasswordStatus === 'loading' ? 'Envoi...' : 'Envoyer le lien'}
                    </button>
                </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
