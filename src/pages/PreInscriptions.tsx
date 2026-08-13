import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, CheckCircle, XCircle, Search, Clock, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PreInscriptions: React.FC = () => {
  const { preInscriptions, fetchPreInscriptions, updatePreInscriptionStatus, addStudent, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPreInscriptions();
  }, [fetchPreInscriptions]);

  const handleAccept = async (req: any) => {
    if (!window.confirm(`Accepter la pré-inscription de ${req.data?.prenom || 'Inconnu'} ${req.data?.nom || ''} ?`)) return;
    
    // Ajouter l'élève dans GestioSchool
    addStudent({
      nom: req.data?.nom || 'Inconnu',
      prenom: req.data?.prenom || 'Inconnu',
      sexe: req.data?.sexe || 'M',
      dateNaissance: req.data?.dateNaissance || '',
      classe: req.data?.classe || '',
      telephone: req.data?.parentTelephone || '',
      redoublant: false,
      ecoleProvenance: '',
      dejaPaye: 0,
      recu: '',
      photoUrl: req.data?.photoUrl || '',
    });

    // Mettre à jour le statut
    await updatePreInscriptionStatus(req.id, 'APPROVED');
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Refuser cette pré-inscription ?")) return;
    await updatePreInscriptionStatus(id, 'REJECTED');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/inscription/${user?.schoolSlug || 'demo'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = preInscriptions.filter(p => 
    p.data?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.data?.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = preInscriptions.filter(p => p.status === 'PENDING').length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-['Poppins']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserPlus className="text-blue-600" />
            Pré-inscriptions ({pendingCount} en attente)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes d'inscription reçues via votre lien public.</p>
        </div>
        <button 
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200 dark:border-blue-800"
        >
          {copied ? <CheckCircle size={18} className="text-green-500" /> : <LinkIcon size={18} />}
          {copied ? 'Lien copié !' : 'Copier le lien d\'inscription'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou prénom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Élève</th>
                <th className="px-6 py-4">Classe Souhaitée</th>
                <th className="px-6 py-4">Contact Parent</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {req.data?.photoUrl ? (
                        <img src={req.data.photoUrl} alt="Photo" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          {req.data?.prenom?.charAt(0)}{req.data?.nom?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-white">{req.data?.nom} {req.data?.prenom}</div>
                        <div className="text-xs text-slate-500">{req.data?.sexe} - Né(e) le {req.data?.dateNaissance}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600">
                      {req.data?.classe} ({req.data?.cycle})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-slate-800 dark:text-white font-medium">{req.data?.parentNom}</div>
                    <div className="text-slate-500">{req.data?.parentTelephone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'PENDING' && <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">En attente</span>}
                    {req.status === 'APPROVED' && <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Accepté</span>}
                    {req.status === 'REJECTED' && <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Refusé</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {req.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleAccept(req)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Accepter"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Refuser"
                        >
                          <XCircle size={20} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucune pré-inscription trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
