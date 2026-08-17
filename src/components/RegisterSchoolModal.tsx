import React, { useState } from 'react';
import { X, Eye, EyeOff, Building2, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface RegisterSchoolModalProps {
  onClose: () => void;
  onSuccess: (schoolSlug: string, email: string) => void;
}

export const RegisterSchoolModal: React.FC<RegisterSchoolModalProps> = ({ onClose, onSuccess }) => {
  const [createdSchool, setCreatedSchool] = useState<{ name: string; slug: string; email: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    acronym: '',
    address: '',
    phone: '',
    email: '',
    admin_nom: '',
    admin_telephone: '',
    admin_password: '',
    admin_password_confirm: '',
    accepted_terms: false,
    accepted_privacy_policy: false,
    marketing_consent: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateSlug = (n: string, a: string) => {
    const base = `${n} ${a}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return base.replace(/-+$/, ''); // Remove trailing dash
  };

  const handleNameChange = (name: string) => {
    const slug = updateSlug(name, form.acronym);
    setForm((f) => ({ ...f, name, slug }));
  };

  const handleAcronymChange = (acronym: string) => {
    const uppercaseAcronym = acronym.toUpperCase();
    const slug = updateSlug(form.name, uppercaseAcronym);
    setForm((f) => ({ ...f, acronym: uppercaseAcronym, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.accepted_terms || !form.accepted_privacy_policy) {
      setError("Vous devez accepter les CGU et la politique de traitement des données.");
      return;
    }

    if (form.admin_password !== form.admin_password_confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const hasMinLength = form.admin_password.length >= 8;
    const hasUppercase = /[A-Z]/.test(form.admin_password);
    const hasNumber = /[0-9]/.test(form.admin_password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.admin_password);

    if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-school`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de l\'établissement.');

      // Afficher l'écran de succès
      setCreatedSchool({
        name: data.school?.name || form.name,
        slug: form.slug,
        email: form.email
      });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 font-['Poppins']">
        
        {/* If created successfully -> Success View */}
        {createdSchool ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Établissement créé avec succès ! 🎉</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Votre établissement <span className="font-bold text-slate-900">"{createdSchool.name}"</span> est désormais enregistré et actif en période d'essai gratuit.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left max-w-md mx-auto space-y-2">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Récapitulatif de vos identifiants :</p>
              <div className="text-xs text-slate-700 space-y-1">
                <p>• <strong>Établissement :</strong> {createdSchool.name}</p>
                <p>• <strong>Code (Slug) :</strong> <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">{createdSchool.slug}</code></p>
                <p>• <strong>Email de connexion (Gmail) :</strong> {createdSchool.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              ✉️ Un e-mail de confirmation et de bienvenue a été envoyé à <strong>{createdSchool.email}</strong>.
            </p>

            <button
              onClick={() => onSuccess(createdSchool.slug, createdSchool.email)}
              className="w-full max-w-md mx-auto py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Se connecter à mon établissement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-amber-500 text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Inscrire mon établissement</h2>
                  <p className="text-white/80 text-xs font-medium">30 jours d'essai gratuit • Sans engagement</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-left">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: École */}
          <div>
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>1. Information de l'Établissement</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet de l'établissement *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ex: Complexe Scolaire Sainte Marie" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acronyme / Sigle (ex: CSMA) *</label>
                <input 
                  type="text" 
                  value={form.acronym} 
                  onChange={e => handleAcronymChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                  placeholder="CSMA" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Code / Identifiant URL (Slug) *</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden px-3">
                  <span className="text-slate-400 text-xs font-bold mr-1">/</span>
                  <input 
                    type="text" 
                    value={form.slug} 
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="w-full bg-transparent py-3 text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="sainte-marie" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse physique</label>
                <input 
                  type="text" 
                  value={form.address} 
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ex: Cotonou / Porto-Novo (Bénin)" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de l'école</label>
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+229 90000000" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Compte Directeur */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">
              2. Identifiants du Directeur (Administration)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet du Directeur *</label>
                <input 
                  type="text" 
                  value={form.admin_nom} 
                  onChange={e => setForm(f => ({ ...f, admin_nom: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="M. Jean Dupont" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de Téléphone *</label>
                <input 
                  type="tel" 
                  value={form.admin_telephone} 
                  onChange={e => setForm(f => ({ ...f, admin_telephone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+229 90000001" 
                  required 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email (Gmail de Connexion) *</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="directeur@gmail.com" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.admin_password} 
                    onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-10 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le mot de passe *</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={form.admin_password_confirm} 
                  onChange={e => setForm(f => ({ ...f, admin_password_confirm: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Répéter le mot de passe" 
                  required 
                />
              </div>

              <div className="sm:col-span-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <p className="font-bold text-slate-700 text-[11px]">Critères mot de passe professionnel :</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className={form.admin_password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    ✓ 8+ caractères
                  </span>
                  <span className={/[A-Z]/.test(form.admin_password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    ✓ 1 Lettre Majuscule
                  </span>
                  <span className={/[0-9]/.test(form.admin_password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    ✓ 1 Chiffre (0-9)
                  </span>
                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.admin_password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    ✓ 1 Caractère Spécial
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Legal & Consent */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conformité Loi Béninoise & Protection des données (APDP)</span>
            </p>
            
            <label className="flex items-start gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.accepted_terms} 
                onChange={e => setForm(f => ({ ...f, accepted_terms: e.target.checked }))} 
                className="mt-1 accent-amber-500 rounded" 
                required 
              />
              <span className="text-[10px] text-slate-600 leading-tight">
                J'accepte les <span className="font-bold text-slate-800">Conditions Générales d'Utilisation</span> de la plateforme SaaS. <span className="text-rose-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.accepted_privacy_policy} 
                onChange={e => setForm(f => ({ ...f, accepted_privacy_policy: e.target.checked }))} 
                className="mt-1 accent-amber-500 rounded" 
                required 
              />
              <span className="text-[10px] text-slate-600 leading-tight">
                J'autorise la création de l'espace numérique sécurisé pour mon établissement. <span className="text-rose-500">*</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Création de votre école en cours...' : '🚀 Créer mon établissement (Essai gratuit)'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};
