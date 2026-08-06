import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Check, BookOpen } from 'lucide-react';
import { formatMontant } from '../utils/helpers';
import { ClassInfo } from '../types';

export const GestionClasses: React.FC = () => {
  const classes = useStore((s: any) => s.classes);
  const addClass = useStore((s: any) => s.addClass);
  const updateClass = useStore((s: any) => s.updateClass);
  const deleteClass = useStore((s: any) => s.deleteClass);
  const user = useStore((s: any) => s.user);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [cycle, setCycle] = useState('Primaire');
  const [ecolage, setEcolage] = useState('');

  const resetForm = () => {
    setNom('');
    setNiveau('');
    setCycle('Primaire');
    setEcolage('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: ClassInfo) => {
    setNom(c.nom);
    setNiveau(c.niveau || '');
    setCycle(c.cycle);
    setEcolage(c.ecolage.toString());
    setEditingId(c.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!nom || !ecolage) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const payload = {
      nom,
      niveau,
      cycle,
      ecolage: Number(ecolage)
    };

    if (editingId) {
      await updateClass(editingId, payload);
    } else {
      await addClass(payload);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) {
      await deleteClass(id);
    }
  };

  if (user?.role !== 'directeur' && user?.role !== 'comptable' && user?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Classes & Tarifs
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter une classe
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">
            {editingId ? "Modifier la classe" : "Nouvelle classe"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Niveau</label>
              <input
                type="text"
                placeholder="Ex: 6ème"
                value={niveau}
                onChange={(e) => setNiveau(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nom de la classe</label>
              <input
                type="text"
                placeholder="Ex: 6EME A"
                value={nom}
                onChange={(e) => setNom(e.target.value.toUpperCase())}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cycle</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold"
              >
                <option value="Crèche">Crèche</option>
                <option value="Maternelle">Maternelle</option>
                <option value="Primaire">Primaire</option>
                <option value="Collège">Collège</option>
                <option value="Lycée">Lycée</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Écolage (Montant)</label>
              <input
                type="number"
                placeholder="Ex: 50000"
                value={ecolage}
                onChange={(e) => setEcolage(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
            >
              <Check className="w-4 h-4" /> {editingId ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 font-black text-xs text-slate-400 uppercase tracking-wider">Niveau</th>
              <th className="py-3 font-black text-xs text-slate-400 uppercase tracking-wider">Classe</th>
              <th className="py-3 font-black text-xs text-slate-400 uppercase tracking-wider">Cycle</th>
              <th className="py-3 font-black text-xs text-slate-400 uppercase tracking-wider text-right">Écolage</th>
              <th className="py-3 font-black text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {classes.map((c: ClassInfo) => (
              <tr key={c.id || c.nom} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {c.niveau ? <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-bold text-xs">{c.niveau}</span> : <span className="text-slate-400 font-normal">—</span>}
                </td>
                <td className="py-3 text-sm font-bold text-slate-900 dark:text-white">{c.nom}</td>
                <td className="py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">{c.cycle}</span>
                </td>
                <td className="py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                  {formatMontant(c.ecolage)}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => c.id && handleDelete(c.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Aucune classe configurée. Ajoutez votre première classe !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
