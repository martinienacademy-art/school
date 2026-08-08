import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Salle } from '../types';
import { Building2, DoorOpen, Plus, Search, Edit2, Trash2, Users, Layers, Info, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const SallesManager: React.FC = () => {
  const salles = useStore((s) => s.salles || []);
  const addSalle = useStore((s) => s.addSalle);
  const updateSalle = useStore((s) => s.updateSalle);
  const deleteSalle = useStore((s) => s.deleteSalle);

  const [search, setSearch] = useState('');
  const [selectedBatimentFilter, setSelectedBatimentFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    batiment: '',
    etage: '',
    capacite: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Extraire la liste unique des bâtiments existants pour les filtres et suggestions
  const batiments = Array.from(new Set(salles.map((s) => s.batiment).filter(Boolean))) as string[];

  const filteredSalles = salles.filter((s) => {
    const matchSearch = (s.nom || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.batiment || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.description || '').toLowerCase().includes(search.toLowerCase());
    
    if (selectedBatimentFilter === 'ALL') return matchSearch;
    if (selectedBatimentFilter === 'NONE') return matchSearch && !s.batiment;
    return matchSearch && s.batiment === selectedBatimentFilter;
  });

  const totalCapacite = salles.reduce((acc, s) => acc + (Number(s.capacite) || 0), 0);

  const handleOpenCreateModal = () => {
    setEditingSalle(null);
    setFormData({ nom: '', batiment: '', etage: '', capacite: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (salle: Salle) => {
    setEditingSalle(salle);
    setFormData({
      nom: salle.nom || '',
      batiment: salle.batiment || '',
      etage: salle.etage || '',
      capacite: salle.capacite !== undefined ? String(salle.capacite) : '',
      description: salle.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast.error('Le nom de la salle est obligatoire.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nom: formData.nom.trim(),
        batiment: formData.batiment.trim() || undefined,
        etage: formData.etage.trim() || undefined,
        capacite: formData.capacite ? Number(formData.capacite) : undefined,
        description: formData.description.trim() || undefined
      };

      if (editingSalle) {
        await updateSalle(editingSalle.id, payload);
        toast.success('Salle mise à jour avec succès !');
      } else {
        await addSalle(payload);
        toast.success('Nouvelle salle enregistrée avec succès !');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error('Erreur lors de l\'enregistrement de la salle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (salle: Salle) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la salle "${salle.nom}" ?`)) {
      try {
        await deleteSalle(salle.id);
        toast.success('Salle supprimée.');
      } catch (e) {
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <DoorOpen className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Salles & Bâtiments
            </h2>
            <p className="text-xs text-slate-400">
              Gestion de l'infrastructure, des bâtiments et des salles de classe de l'établissement.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Salle
        </button>
      </div>

      {/* Cartes Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{salles.length}</p>
            <p className="text-xs text-slate-400 font-medium">Salles au total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{batiments.length}</p>
            <p className="text-xs text-slate-400 font-medium">Bâtiment(s) répertorié(s)</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalCapacite || '-'}</p>
            <p className="text-xs text-slate-400 font-medium">Capacité totale (places)</p>
          </div>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une salle, un bâtiment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filtre Bâtiments */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedBatimentFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBatimentFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tous ({salles.length})
          </button>

          {batiments.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBatimentFilter(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedBatimentFilter === b
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}

          {salles.some((s) => !s.batiment) && (
            <button
              onClick={() => setSelectedBatimentFilter('NONE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedBatimentFilter === 'NONE'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Sans Bâtiment
            </button>
          )}
        </div>
      </div>

      {/* Grille des Salles */}
      {filteredSalles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <DoorOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white">Aucune salle trouvée</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || selectedBatimentFilter !== 'ALL'
              ? 'Aucun résultat ne correspond à vos critères de recherche.'
              : 'Commencez par ajouter votre première salle de classe.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalles.map((salle) => (
            <div
              key={salle.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-amber-500" />
                      {salle.nom}
                    </h3>
                    {salle.etage && (
                      <p className="text-xs text-slate-400 mt-0.5">{salle.etage}</p>
                    )}
                  </div>

                  {salle.batiment ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 shrink-0 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {salle.batiment}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 shrink-0">
                      Sans bâtiment
                    </span>
                  )}
                </div>

                {salle.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{salle.description}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {salle.capacite ? `${salle.capacite} places` : 'Capacité non précisée'}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(salle)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(salle)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-amber-400" />
                {editingSalle ? 'Modifier la Salle' : 'Nouvelle Salle de Classe'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Nom de la Salle <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Salle 101, Labo Informatique"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Bâtiment <span className="text-slate-500 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Bâtiment F, Bloc A"
                    list="batiments-list"
                    value={formData.batiment}
                    onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="batiments-list">
                    {batiments.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Étage / Emplacement <span className="text-slate-500 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 1er étage, Rez-de-chaussée"
                    value={formData.etage}
                    onChange={(e) => setFormData({ ...formData, etage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Capacité (Nombre de places) <span className="text-slate-500 font-normal">(Optionnel)</span>
                </label>
                <input
                  type="number"
                  placeholder="ex: 40"
                  min="1"
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Description / Équipements <span className="text-slate-500 font-normal">(Optionnel)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="ex: Projecteur disponible, 35 tables individuelles..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {editingSalle ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
