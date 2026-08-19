import React, { useState, useEffect } from 'react';
import { personnelApi } from '../services/personnelApi';
import { Users, UserPlus, Trash2, Loader2, Shield, Mail, Phone, Lock, UserCheck } from 'lucide-react';

export const GestionPersonnel = () => {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('superviseur');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableRoles = [
    { value: 'superviseur', label: 'Surveillant / Gardien (Scan des cartes d\'élèves & Présences)' },
    { value: 'comptable', label: 'Comptable (Finances, Encaissements & Recouvrement)' },
    { value: 'censeur', label: 'Censeur (Gestion académique, Classes & Matières)' },
    { value: 'proviseur', label: 'Proviseur (Supervision pédagogique globale)' },
    { value: 'admin', label: 'Administrateur (Gestion complète de l\'établissement)' },
  ];

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const data = await personnelApi.getPersonnel();
      setPersonnel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!nom || !telephone || !password || !role) {
      setError('Veuillez renseigner au minimum le nom, le téléphone, le mot de passe et le rôle.');
      return;
    }

    setSubmitting(true);
    try {
      await personnelApi.createPersonnel({ 
        nom: nom.trim(), 
        telephone: telephone.trim(), 
        email: email.trim() || undefined,
        password, 
        role 
      });
      setSuccess(`Le collaborateur ${nom} a été créé avec succès !${email ? ' Un e-mail de bienvenue lui a été envoyé.' : ''}`);
      setNom('');
      setTelephone('');
      setEmail('');
      setPassword('');
      setRole('superviseur');
      await fetchPersonnel();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err?.error || err?.message || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'accès pour "${name}" ?`)) return;
    try {
      await personnelApi.deletePersonnel(id);
      await fetchPersonnel();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const roleBadge = (r: string) => {
    switch (r) {
      case 'admin': 
        return { label: 'Administrateur', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200' };
      case 'censeur': 
        return { label: 'Censeur', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200' };
      case 'superviseur': 
        return { label: 'Surveillant / Scan', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200' };
      case 'comptable': 
        return { label: 'Comptable', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200' };
      case 'proviseur': 
        return { label: 'Proviseur', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200' };
      default: 
        return { label: r, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Gestion du Personnel & Collaborateurs
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Créez des accès dédiés pour votre équipe et attribuez librement les fonctions souhaitées.
          </p>
        </div>
      </div>

      {/* Formulaire de création */}
      <form onSubmit={handleSubmit} className="bg-indigo-50/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-indigo-100/60 dark:border-slate-700/60 space-y-4 my-6">
        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-600" /> Ajouter un nouveau collaborateur
        </h4>
        
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 font-semibold">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-semibold flex items-center gap-2"><UserCheck className="w-4 h-4" /> {success}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1.5">Nom et Prénom *</label>
            <input 
              type="text" 
              value={nom} 
              onChange={e => setNom(e.target.value)} 
              placeholder="Ex: Paul HOUENOU" 
              required
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-indigo-500" /> Téléphone (Identifiant) *
            </label>
            <input 
              type="tel" 
              value={telephone} 
              onChange={e => setTelephone(e.target.value)} 
              placeholder="Ex: +22990000000" 
              required
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-indigo-500" /> Adresse E-mail (Optionnel mais recommandé pour SMTP)
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Ex: collaborateur@gmail.com" 
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-500" /> Mot de passe *
            </label>
            <input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Mot de passe sécurisé" 
              required
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" 
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-1.5">
              Fonction / Rôle à attribuer *
            </label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white cursor-pointer"
            >
              {availableRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={submitting} 
            className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Créer le compte collaborateur
          </button>
        </div>
      </form>

      {/* Liste des collaborateurs existants */}
      <div>
        <h4 className="text-xs font-black text-gray-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          Comptes collaborateurs actifs ({personnel.length})
        </h4>
        
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : personnel.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 dark:bg-slate-800/30 rounded-xl">
            Aucun collaborateur supplémentaire n'a été créé pour cet établissement.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personnel.map(p => {
              const badge = roleBadge(p.role);
              return (
                <div key={p.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">{p.nom}</h5>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {p.telephone}</p>
                      {p.email && <p className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400"><Mail className="w-3 h-3" /> {p.email}</p>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(p.id, p.nom)} 
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors" 
                    title="Supprimer ce compte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
