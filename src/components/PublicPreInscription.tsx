import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft, User, BookOpen, Users, School, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface PublicPreInscriptionProps {
  schoolSlug: string;
}

export const PublicPreInscription: React.FC<PublicPreInscriptionProps> = ({ schoolSlug }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matriculeNational: '',
    sexe: 'M',
    dateNaissance: '',
    cycle: 'Primaire',
    classe: '',
    parentNom: '',
    parentTelephone: '+229',
    parentEmail: '',
    photoUrl: '',
  });

  const [schoolData, setSchoolData] = useState<{name: string, logo: string | null}>({ name: 'Chargement...', logo: null });

  useEffect(() => {
    // Récupérer les infos publiques de l'école (logo, nom)
    fetch(`${API_BASE_URL}/schools`)
      .then(res => res.json())
      .then(data => {
        const school = data.find((s: any) => s.slug === schoolSlug);
        if (school) {
          setSchoolData({ name: school.name, logo: school.logo });
        } else {
          setError("École introuvable.");
        }
      })
      .catch(() => setError("Erreur de connexion."));
  }, [schoolSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 2 Mo");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    // Validation basique
    if (step === 1 && (!formData.nom || !formData.prenom || !formData.dateNaissance)) return;
    if (step === 2 && !formData.classe) return;
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentNom || !formData.parentTelephone) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/pre-inscriptions/${schoolSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full relative z-10"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pré-inscription Envoyée !</h2>
          <p className="text-slate-300">
            Votre demande a bien été transmise à <strong>{schoolData.name}</strong>. 
            La direction vous contactera très prochainement pour finaliser l'inscription.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Poppins']">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {schoolData.logo ? (
            <img src={schoolData.logo} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4 bg-white/10 p-2 rounded-2xl backdrop-blur-md" />
          ) : (
            <div className="w-20 h-20 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <School size={32} />
            </div>
          )}
          <h1 className="text-3xl font-black text-white mb-2">Pré-inscription</h1>
          <p className="text-blue-200">{schoolData.name}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-8">
          
          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700/50 rounded-full -z-10"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full -z-10 transition-all duration-500`} style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= num ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                {num === 1 ? <User size={18} /> : num === 2 ? <BookOpen size={18} /> : <Users size={18} />}
              </div>
            ))}
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Identité de l'élève</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Nom *</label>
                      <input required type="text" name="nom" value={formData.nom} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nom de famille" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Prénom(s) *</label>
                      <input required type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Prénom(s)" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Matricule National (Optionnel)</label>
                    <input type="text" name="matriculeNational" value={formData.matriculeNational} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition uppercase placeholder:normal-case" placeholder="Ex: BEN-2026-XXXXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Photo d'identité (Optionnel)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-900/50 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.photoUrl ? (
                          <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-slate-500" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition file:cursor-pointer" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Sexe</label>
                      <select name="sexe" value={formData.sexe} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Date de naissance *</label>
                      <input required type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Projet de formation</h3>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Cycle</label>
                    <select name="cycle" value={formData.cycle} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                      <option value="Maternelle">Maternelle</option>
                      <option value="Primaire">Primaire</option>
                      <option value="Collège">Collège</option>
                      <option value="Lycée">Lycée</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Classe souhaitée *</label>
                    <input required type="text" name="classe" value={formData.classe} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ex: 6ème A, CM2..." />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Contact Parent / Tuteur</h3>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Nom du parent responsable *</label>
                    <input required type="text" name="parentNom" value={formData.parentNom} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nom complet" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Numéro de téléphone (WhatsApp si possible) *</label>
                    <input required type="tel" name="parentTelephone" value={formData.parentTelephone} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="+229..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Email (Optionnel)</label>
                    <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="parent@email.com" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Retour
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
              >
                {step < 3 ? (
                  <>Suivant <ChevronRight size={18} /></>
                ) : (
                  <>{loading ? 'Envoi...' : 'Terminer l\'inscription'} <CheckCircle2 size={18} /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
