// ============================================================
// PORTAIL ENSEIGNANT — Connexion & Inscription
// Email + Mot de passe uniquement
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../config';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, BookOpen, Users, Award } from 'lucide-react';

export const TeacherLogin: React.FC = () => {
    const login = useStore((s) => s.login);

    const [view, setView] = useState<'login' | 'register'>('login');

    // Login states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Register states
    const [regEmail, setRegEmail] = useState('');
    const [regTelephone, setRegTelephone] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regNom, setRegNom] = useState('');
    const [regShowPassword, setRegShowPassword] = useState(false);
    const [schools, setSchools] = useState<{ slug: string; name: string }[]>([]);
    const [selectedSchool, setSelectedSchool] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/schools`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setSchools(data); })
            .catch(console.error);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // On envoie l'email comme identifiant ; le backend supporte email OR téléphone
            const ok = await login(email, password, selectedSchool);
            if (!ok) setError('Email ou mot de passe incorrect.');
        } catch (err: any) {
            setError(err?.message || 'Erreur de connexion.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!selectedSchool) {
            setError('Veuillez sélectionner votre établissement.');
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        const hasMinLength = regPassword.length >= 8;
        const hasUppercase = /[A-Z]/.test(regPassword);
        const hasNumber = /[0-9]/.test(regPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword);

        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
            setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register-teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: regNom,
                    email: regEmail,
                    telephone: regTelephone,
                    password: regPassword,
                    school_slug: selectedSchool,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription.');
            setSuccess('Compte créé avec succès ! Votre directeur doit valider votre accès. Vous pouvez maintenant vous connecter.');
            setView('login');
            setEmail(regEmail);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: <BookOpen className="w-5 h-5" />, label: 'Saisie des notes et bulletins' },
        { icon: <Users className="w-5 h-5" />, label: 'Gestion des classes' },
        { icon: <Award className="w-5 h-5" />, label: 'Espace pédagogique' },
    ];

    return (
        <div className="min-h-screen flex font-['Poppins'] bg-slate-950">
            {/* ── Panneau gauche : Branding ────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e40af 0%, #312e81 60%, #0f172a 100%)' }}>
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-black text-xl tracking-tight">MasterFlow</span>
                    </div>
                    <p className="text-blue-200/60 text-xs font-medium uppercase tracking-widest">Portail Enseignant</p>
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center">
                    <h1 className="text-5xl font-black text-white leading-tight mb-4">
                        Bienvenue,<br />
                        <span className="text-blue-300">Professeur</span> 👋
                    </h1>
                    <p className="text-blue-100/70 text-base leading-relaxed mb-10 max-w-sm">
                        Votre espace de travail numérique. Gérez vos classes, saisissez les notes et collaborez avec votre équipe pédagogique.
                    </p>

                    <div className="space-y-4">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                <div className="text-blue-300">{f.icon}</div>
                                <span className="text-white/80 text-sm font-medium">{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-blue-200/40 text-xs font-medium">
                        © {new Date().getFullYear()} MasterFlow • Tous droits réservés
                    </p>
                </div>
            </div>

            {/* ── Panneau droit : Formulaire ───────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-black text-lg">MasterFlow</span>
                </div>

                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white mb-1">
                            {view === 'login' ? 'Se connecter' : 'Créer un compte'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {view === 'login'
                                ? 'Accédez à votre portail enseignant'
                                : 'Rejoignez votre établissement en tant que professeur'}
                        </p>
                    </div>

                    {/* Success banner */}
                    {success && (
                        <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm">
                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{success}</p>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* ── FORMULAIRE CONNEXION ── */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* École (optionnel au login si déjà dans le token) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Établissement</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={selectedSchool}
                                    onChange={e => setSelectedSchool(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Choisissez votre établissement --</option>
                                    {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Adresse e-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="professeur@ecole.bj"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Se connecter'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setView('register'); setError(''); setSuccess(''); }}
                                className="w-full py-3 text-slate-400 hover:text-blue-400 text-sm font-semibold transition"
                            >
                                Pas encore de compte ? <span className="text-blue-400 underline">S'inscrire</span>
                            </button>
                        </form>
                    )}

                    {/* ── FORMULAIRE INSCRIPTION ── */}
                    {view === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); }}
                                className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                            </button>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Établissement <span className="text-red-400">*</span></label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={selectedSchool}
                                    onChange={e => setSelectedSchool(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Choisissez votre établissement --</option>
                                    {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Nom complet <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={regNom}
                                        onChange={e => setRegNom(e.target.value)}
                                        placeholder="Ex: M. Jean Kouassi"
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Adresse Email (Gmail) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={regEmail}
                                        onChange={e => setRegEmail(e.target.value)}
                                        placeholder="professeur@gmail.com"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Numéro de Téléphone <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        required
                                        value={regTelephone}
                                        onChange={e => setRegTelephone(e.target.value)}
                                        placeholder="+229 90000000"
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Mot de passe <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={regShowPassword ? 'text' : 'password'}
                                        required
                                        value={regPassword}
                                        onChange={e => setRegPassword(e.target.value)}
                                        placeholder="Min 8 car, 1 Maj, 1 Chiffre, 1 Spécial"
                                        className="w-full pl-11 pr-12 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <button type="button" onClick={() => setRegShowPassword(!regShowPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1">
                                        {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmer le mot de passe <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={regShowPassword ? 'text' : 'password'}
                                        required
                                        value={regConfirmPassword}
                                        onChange={e => setRegConfirmPassword(e.target.value)}
                                        placeholder="Répéter le mot de passe"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="w-full text-xs text-slate-400 space-y-1 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                                <p className="font-bold text-slate-300">Critères mot de passe professionnel :</p>
                                <div className="grid grid-cols-2 gap-1 text-[11px]">
                                  <span className={regPassword.length >= 8 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>✓ 8+ caractères</span>
                                  <span className={/[A-Z]/.test(regPassword) ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>✓ 1 Majuscule</span>
                                  <span className={/[0-9]/.test(regPassword) ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>✓ 1 Chiffre</span>
                                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword) ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>✓ 1 Spécial</span>
                                </div>
                            </div>

                            <p className="mt-1.5 text-xs text-slate-500">
                                ℹ️ Votre compte sera actif après validation par votre directeur.
                            </p>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : "Créer mon compte enseignant"}
                            </button>
                        </form>
                    )}

                    <p className="mt-8 text-center text-xs text-slate-600">
                        Vous êtes directeur ou administrateur ?{' '}
                        <a href="/" className="text-blue-400 hover:underline">Accès administration</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeacherLogin;
