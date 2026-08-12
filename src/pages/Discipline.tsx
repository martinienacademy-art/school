import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, Archive, Users, Settings, Plus, LayoutDashboard, Search, Trash2, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';

type Tab = 'dashboard' | 'types' | 'incidents' | 'absences' | 'objets' | 'conseils' | 'parametres';

export const Discipline: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { schoolSlug } = useStore(s => s.user || {});
  
  // State for data
  const [stats, setStats] = useState<any>(null);
  const [infractionTypes, setInfractionTypes] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [objets, setObjets] = useState<any[]>([]);
  const [conseils, setConseils] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { students } = useStore();

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/discipline/stats', { headers: getAuthHeaders() });
      if (res.ok) setStats(await parseResponse(res));
    } catch (e) { console.error(e); }
  };

  const fetchInfractionTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discipline/infractions', { headers: getAuthHeaders() });
      if (res.ok) setInfractionTypes(await parseResponse(res));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discipline/incidents', { headers: getAuthHeaders() });
      if (res.ok) setIncidents(await parseResponse(res));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/discipline/settings', { headers: getAuthHeaders() });
      if (res.ok) setSettings(await parseResponse(res));
    } catch (e) { console.error(e); }
  };

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discipline/absences', { headers: getAuthHeaders() });
      if (res.ok) setAbsences(await parseResponse(res));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchObjets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discipline/objets', { headers: getAuthHeaders() });
      if (res.ok) setObjets(await parseResponse(res));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchConseils = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discipline/conseils', { headers: getAuthHeaders() });
      if (res.ok) setConseils(await parseResponse(res));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'types') fetchInfractionTypes();
    if (activeTab === 'incidents') { fetchIncidents(); fetchInfractionTypes(); }
    if (activeTab === 'absences') fetchAbsences();
    if (activeTab === 'objets') fetchObjets();
    if (activeTab === 'conseils') fetchConseils();
    if (activeTab === 'parametres') fetchSettings();
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'types', label: 'Types d\'infractions', icon: AlertTriangle },
    { id: 'incidents', label: 'Incidents', icon: Shield },
    { id: 'absences', label: 'Absences / Retards', icon: Clock },
    { id: 'objets', label: 'Objets confisqués', icon: Archive },
    { id: 'conseils', label: 'Conseils de discipline', icon: Users },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap
                  ${isActive ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_-2px_10px_rgba(245,158,11,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-fadeIn">
        {activeTab === 'dashboard' && <DisciplineDashboard stats={stats} />}
        {activeTab === 'types' && <InfractionTypes types={infractionTypes} onRefresh={fetchInfractionTypes} />}
        {activeTab === 'incidents' && <IncidentsList incidents={incidents} types={infractionTypes} onRefresh={fetchIncidents} students={students} />}
        {activeTab === 'absences' && <AbsencesList absences={absences} onRefresh={fetchAbsences} students={students} />}
        {activeTab === 'objets' && <ObjetsConfisquesList objets={objets} onRefresh={fetchObjets} students={students} />}
        {activeTab === 'conseils' && <ConseilsDisciplineList conseils={conseils} onRefresh={fetchConseils} students={students} />}
        {activeTab === 'parametres' && <DisciplineSettings settings={settings} onRefresh={fetchSettings} />}
      </div>
    </div>
  );
};

// ==========================================
// Sous-composants
// ==========================================

const DisciplineDashboard = ({ stats }: { stats: any }) => {
  if (!stats) return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Incidents du mois" value={stats.kpi?.incidents_mois || 0} icon={Shield} color="bg-rose-500" />
      <StatCard title="Absences (Non justifiées)" value={stats.kpi?.absences_non_justifiees || 0} icon={Clock} color="bg-amber-500" />
      <StatCard title="Objets confisqués" value={stats.kpi?.objets_confisques || 0} icon={Archive} color="bg-indigo-500" />
      <StatCard title="Sanctions en cours" value={stats.kpi?.sanctions_en_cours || 0} icon={AlertTriangle} color="bg-emerald-500" />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

const InfractionTypes = ({ types, onRefresh }: { types: any[], onRefresh: () => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [nom, setNom] = useState('');
  const [gravite, setGravite] = useState('mineure');
  const [sanction, setSanction] = useState('');
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/discipline/infractions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom, gravite, sanction_defaut: sanction })
      });
      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce type ?')) return;
    try {
      const res = await fetch(`/api/discipline/infractions/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Types d'infractions</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Nom</th>
              <th className="px-6 py-4 font-semibold">Gravité</th>
              <th className="px-6 py-4 font-semibold">Sanction par défaut</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {types.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.nom}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                    ${t.gravite === 'mineure' ? 'bg-emerald-100 text-emerald-700' : t.gravite === 'majeure' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {t.gravite}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{t.sanction_defaut}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr><td colSpan={4} className="text-center p-8 text-slate-500">Aucun type d'infraction configuré.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Ajouter un type d'infraction</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Nom de l'infraction</label>
                <input required value={nom} onChange={e => setNom(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Gravité</label>
                <select value={gravite} onChange={e => setGravite(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option value="mineure">Mineure</option>
                  <option value="majeure">Majeure</option>
                  <option value="grave">Grave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Sanction par défaut</label>
                <input value={sanction} onChange={e => setSanction(e.target.value)} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const IncidentsList = ({ incidents, types, onRefresh, students }: { incidents: any[], types: any[], onRefresh: () => void, students: any[] }) => {
  const [showModal, setShowModal] = useState(false);
  
  // States for new incident
  const [eleveId, setEleveId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sanction, setSanction] = useState('');
  const [motif, setMotif] = useState('');
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const eleve = students.find(s => s.id === eleveId);
    if (!eleve) return alert('Sélectionnez un élève');
    try {
      const res = await fetch('/api/discipline/incidents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          date, 
          eleve_id: eleve.id, 
          eleve_nom: `${eleve.nom} ${eleve.prenom}`, 
          classe: eleve.classe, 
          type_infraction_id: typeId, 
          sanction, 
          motif 
        })
      });
      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registre des incidents</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20">
          <Plus className="w-4 h-4" /> Ajouter un incident
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Élève</th>
              <th className="px-6 py-4 font-semibold">Classe</th>
              <th className="px-6 py-4 font-semibold">Infraction</th>
              <th className="px-6 py-4 font-semibold">Sanction</th>
              <th className="px-6 py-4 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {incidents.map(inc => (
              <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(inc.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inc.eleve_nom}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{inc.classe}</td>
                <td className="px-6 py-4 text-sm font-semibold text-rose-600">{inc.type?.nom || 'Inconnu'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{inc.sanction || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${inc.statut === 'Résolu' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inc.statut}
                  </span>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 text-slate-500">Aucun incident enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Ajouter une Infraction
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Rechercher un élève</label>
                  <select required value={eleveId} onChange={e => setEleveId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="">Sélectionner...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom} - {s.classe}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Date de l'incident</label>
                  <input required value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Type d'infraction</label>
                  <select required value={typeId} onChange={e => setTypeId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="">Sélectionner...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Sanction (Optionnelle)</label>
                  <input value={sanction} onChange={e => setSanction(e.target.value)} type="text" placeholder="Ex: Exclusion de 2 jours..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Motif ou détails</label>
                  <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} placeholder="Détails de l'incident..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"></textarea>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20">Enregistrer l'infraction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DisciplineSettings = ({ settings, onRefresh }: { settings: any, onRefresh: () => void }) => {
  const [heures, setHeures] = useState(settings?.heures_max_absence || 10);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/discipline/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ heures_max_absence: heures })
      });
      if (res.ok) { alert('Paramètres sauvegardés'); onRefresh(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Paramètres de Discipline</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Heures max d'absences avant alerte</label>
          <input type="number" value={heures} onChange={e => setHeures(parseInt(e.target.value))} className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
        </div>
        <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20">
          Enregistrer les paramètres
        </button>
      </form>
    </div>
  );
};

// --- Nouveaux composants (Absences, Objets, Conseils) ---

const AbsencesList = ({ absences, onRefresh, students }: { absences: any[], onRefresh: () => void, students: any[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [eleveId, setEleveId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Absence');
  const [duree, setDuree] = useState('1');
  const [justifiee, setJustifiee] = useState(false);
  const [motif, setMotif] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const eleve = students.find(s => s.id === eleveId);
    if (!eleve) return alert('Sélectionnez un élève');
    try {
      const res = await fetch('/api/discipline/absences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date, eleve_id: eleve.id, eleve_nom: `${eleve.nom} ${eleve.prenom}`, classe: eleve.classe,
          type, duree_heures: parseFloat(duree), justifiee, motif
        })
      });
      if (res.ok) { setShowModal(false); onRefresh(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Absences et Retards</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Signaler
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Élève</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Durée (h)</th>
              <th className="px-6 py-4 font-semibold">Justifiée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {absences.map(abs => (
              <tr key={abs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(abs.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{abs.eleve_nom}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${abs.type === 'Absence' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {abs.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{abs.duree_heures}</td>
                <td className="px-6 py-4 text-sm">
                  {abs.justifiee ? <span className="text-emerald-500 font-bold">Oui</span> : <span className="text-rose-500 font-bold">Non</span>}
                </td>
              </tr>
            ))}
            {absences.length === 0 && (
              <tr><td colSpan={5} className="text-center p-8 text-slate-500">Aucune absence enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-slideUp">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Signaler une Absence / Retard</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Élève</label>
                  <select required value={eleveId} onChange={e => setEleveId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="">Sélectionner...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom} - {s.classe}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Date</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="Absence">Absence</option>
                    <option value="Retard">Retard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Durée (heures)</label>
                  <input required type="number" step="0.5" value={duree} onChange={e => setDuree(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" id="justif" checked={justifiee} onChange={e => setJustifiee(e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="justif" className="text-sm font-semibold">Absence justifiée</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Motif</label>
                  <input type="text" value={motif} onChange={e => setMotif(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ObjetsConfisquesList = ({ objets, onRefresh, students }: { objets: any[], onRefresh: () => void, students: any[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [eleveId, setEleveId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [objet, setObjet] = useState('');
  const [circonstances, setCirconstances] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const eleve = students.find(s => s.id === eleveId);
    if (!eleve) return alert('Sélectionnez un élève');
    try {
      const res = await fetch('/api/discipline/objets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date, eleve_id: eleve.id, eleve_nom: `${eleve.nom} ${eleve.prenom}`, classe: eleve.classe,
          objet, circonstances
        })
      });
      if (res.ok) { setShowModal(false); onRefresh(); }
    } catch (e) { console.error(e); }
  };

  const handleRestituer = async (id: string, restitue: boolean) => {
    try {
      const res = await fetch(`/api/discipline/objets/${id}/restituer`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ restitue })
      });
      if (res.ok) onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Objets Confisqués</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Élève</th>
              <th className="px-6 py-4 font-semibold">Objet</th>
              <th className="px-6 py-4 font-semibold">Restitué</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {objets.map(obj => (
              <tr key={obj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-sm">{new Date(obj.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium">{obj.eleve_nom}</td>
                <td className="px-6 py-4 font-medium">{obj.objet}</td>
                <td className="px-6 py-4">
                  {obj.restitue ? <span className="text-emerald-500 font-bold">Oui</span> : <span className="text-rose-500 font-bold">Non</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {!obj.restitue && (
                    <button onClick={() => handleRestituer(obj.id, true)} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200">
                      Restituer
                    </button>
                  )}
                  {obj.restitue && (
                    <button onClick={() => handleRestituer(obj.id, false)} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {objets.length === 0 && (<tr><td colSpan={5} className="text-center p-8 text-slate-500">Aucun objet confisqué.</td></tr>)}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Ajouter un Objet Confisqué</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Élève</label>
                <select required value={eleveId} onChange={e => setEleveId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <option value="">Sélectionner...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom} - {s.classe}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Objet</label>
                <input required type="text" value={objet} onChange={e => setObjet(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ConseilsDisciplineList = ({ conseils, onRefresh, students }: { conseils: any[], onRefresh: () => void, students: any[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [eleveId, setEleveId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [motif, setMotif] = useState('');
  const [decision, setDecision] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const eleve = students.find(s => s.id === eleveId);
    if (!eleve) return alert('Sélectionnez un élève');
    try {
      const res = await fetch('/api/discipline/conseils', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date, eleve_id: eleve.id, eleve_nom: `${eleve.nom} ${eleve.prenom}`, classe: eleve.classe,
          motif, decision
        })
      });
      if (res.ok) { setShowModal(false); onRefresh(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Conseils de discipline</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-semibold flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Programmer
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Élève</th>
              <th className="px-6 py-4 font-semibold">Motif</th>
              <th className="px-6 py-4 font-semibold">Décision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {conseils.map(cons => (
              <tr key={cons.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-sm font-semibold">{new Date(cons.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium">{cons.eleve_nom}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{cons.motif}</td>
                <td className="px-6 py-4 text-sm font-semibold text-rose-600">{cons.decision || 'En attente'}</td>
              </tr>
            ))}
            {conseils.length === 0 && (<tr><td colSpan={4} className="text-center p-8 text-slate-500">Aucun conseil de discipline programmé.</td></tr>)}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-slideUp">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Nouveau Conseil de Discipline</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Élève concerné</label>
                  <select required value={eleveId} onChange={e => setEleveId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="">Sélectionner...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom} - {s.classe}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Date prévue</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Motif de la convocation</label>
                  <textarea required value={motif} onChange={e => setMotif(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"></textarea>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Décision (Optionnelle)</label>
                  <input type="text" value={decision} onChange={e => setDecision(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
