import React, { useState } from 'react';
import { BookOpen, Folder, FileText, CheckSquare, Upload, Search, Filter, RefreshCw, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CYCLES, RessourcePedagogique, TypeRessource } from '../types';
import { CLASS_CONFIG } from '../data/classConfig';

// Mock function for file upload - replace with Supabase storage upload later
const uploadToSupabase = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(URL.createObjectURL(file));
    }, 1000);
  });
};

export default function EspacePedagogique() {
  const { ressources, addRessource, user, schoolYear } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState(schoolYear);
  const [filterCycle, setFilterCycle] = useState('Tous');
  const [filterClasse, setFilterClasse] = useState('Toutes');
  const [filterType, setFilterType] = useState('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = {
    total: ressources.length,
    cours: ressources.filter(r => r.type === 'Cours').length,
    epreuves: ressources.filter(r => r.type === 'Epreuve').length,
    livres: ressources.filter(r => r.type === 'Livre').length,
    tdtp: ressources.filter(r => r.type === 'TD_TP').length,
  };

  const filteredRessources = ressources.filter(r => {
    if (searchTerm && !r.titre.toLowerCase().includes(searchTerm.toLowerCase()) && !r.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterYear !== 'Toutes' && r.anneeAcademique !== filterYear) return false;
    if (filterCycle !== 'Tous' && r.cycle !== filterCycle) return false;
    if (filterClasse !== 'Toutes' && r.classe !== filterClasse) return false;
    if (filterType !== 'Tous' && r.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Espace Pédagogique</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez la bibliothèque numérique de l'établissement</p>
        </div>
        {(user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'censeur' || user?.role === 'superviseur' || user?.role === 'enseignant') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Upload size={20} />
            Déposer une ressource
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-600">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <Folder size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Ressources</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Supports de cours</p>
            <p className="text-2xl font-bold text-gray-900">{stats.cours}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="bg-red-100 p-3 rounded-lg text-red-500">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Épreuves</p>
            <p className="text-2xl font-bold text-gray-900">{stats.epreuves}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="bg-green-100 p-3 rounded-lg text-green-500">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Livres</p>
            <p className="text-2xl font-bold text-gray-900">{stats.livres}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (Titre, description...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Toutes">Année : Toutes</option>
              <option value={schoolYear}>{schoolYear}</option>
            </select>
          </div>
          <div>
            <select
              value={filterCycle}
              onChange={(e) => {
                setFilterCycle(e.target.value);
                setFilterClasse('Toutes');
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Tous">Cycle : Tous</option>
              {CYCLES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
             <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={filterCycle === 'Tous'}
            >
              <option value="Toutes">Classe : Toutes</option>
              {filterCycle !== 'Tous' && CLASS_CONFIG.find((c: any) => c.name === filterCycle)?.classes.map((cl: any) => (
                <option key={cl} value={cl}>{cl}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-emerald-600 text-white rounded-lg flex justify-center items-center gap-2 hover:bg-emerald-700">
              <Filter size={18} />
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterYear(schoolYear);
                setFilterCycle('Tous');
                setFilterClasse('Toutes');
                setFilterType('Tous');
              }}
              className="flex-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg flex justify-center items-center gap-2 hover:bg-gray-100"
              title="Réinitialiser"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setFilterType('Tous')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
              filterType === 'Tous' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Folder size={16} /> Tous <span className="bg-black/20 px-2 rounded-full text-xs">{stats.total}</span>
          </button>
          <button
            onClick={() => setFilterType('Cours')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
              filterType === 'Cours' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText size={16} /> Cours <span className="bg-black/20 px-2 rounded-full text-xs">{stats.cours}</span>
          </button>
          <button
            onClick={() => setFilterType('Epreuve')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
              filterType === 'Epreuve' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CheckSquare size={16} /> Epreuves <span className="bg-black/20 px-2 rounded-full text-xs">{stats.epreuves}</span>
          </button>
          <button
            onClick={() => setFilterType('Livre')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
              filterType === 'Livre' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={16} /> Livres <span className="bg-black/20 px-2 rounded-full text-xs">{stats.livres}</span>
          </button>
           <button
            onClick={() => setFilterType('TD_TP')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
              filterType === 'TD_TP' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="font-mono text-xs">{"</>"}</span> TD/TP <span className="bg-black/20 px-2 rounded-full text-xs">{stats.tdtp}</span>
          </button>
        </div>
      </div>

      {/* List */}
      {filteredRessources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="text-gray-300" size={48} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune ressource trouvée</h3>
          <p className="text-gray-500">Aucun document ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRessources.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
               <div className={`h-2 ${
                 r.type === 'Cours' ? 'bg-blue-500' : 
                 r.type === 'Epreuve' ? 'bg-red-500' : 
                 r.type === 'Livre' ? 'bg-green-500' : 'bg-purple-500'
               }`} />
               <div className="p-4 flex-1 flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                   <div className="bg-gray-50 p-2 rounded-lg">
                     {r.type === 'Cours' && <FileText size={24} className="text-blue-500" />}
                     {r.type === 'Epreuve' && <CheckSquare size={24} className="text-red-500" />}
                     {r.type === 'Livre' && <BookOpen size={24} className="text-green-500" />}
                     {r.type === 'TD_TP' && <Folder size={24} className="text-purple-500" />}
                   </div>
                   <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                     {r.classe !== 'Toutes' ? r.classe : r.cycle}
                   </span>
                 </div>
                 <h4 className="font-bold text-gray-900 mb-1 line-clamp-2" title={r.titre}>{r.titre}</h4>
                 <p className="text-xs text-gray-500 mb-2 line-clamp-2">{r.description || 'Aucune description'}</p>
                 <div className="mt-auto space-y-2">
                    <div className="text-xs text-gray-400 flex justify-between items-center">
                      <span>{r.auteurNom}</span>
                      <span>{new Date(r.dateAjout).toLocaleDateString()}</span>
                    </div>
                    <a 
                      href={r.fichierUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block w-full py-2 text-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Télécharger
                    </a>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <UploadModal 
          onClose={() => setIsModalOpen(false)}
          onUpload={(r) => {
            addRessource(r);
            setIsModalOpen(false);
          }}
        />
      )}

    </div>
  );
}

function UploadModal({ onClose, onUpload }: { onClose: () => void, onUpload: (r: RessourcePedagogique) => void }) {
  const { user, schoolYear } = useStore();
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<TypeRessource>('Cours');
  const [annee, setAnnee] = useState(schoolYear);
  const [cycle, setCycle] = useState('Tous');
  const [classe, setClasse] = useState('Toutes');
  const [matiere, setMatiere] = useState('Toutes');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre || !file) return;

    setIsUploading(true);
    try {
      const url = await uploadToSupabase(file);
      const newRessource: RessourcePedagogique = {
        id: crypto.randomUUID(),
        titre,
        type,
        anneeAcademique: annee,
        cycle: cycle as any,
        classe,
        matiere,
        description,
        fichierUrl: url,
        fichierNom: file.name,
        fichierTaille: file.size,
        auteurId: user?.id || 'admin',
        auteurNom: user?.nom || 'Administration',
        dateAjout: new Date().toISOString()
      };
      onUpload(newRessource);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-emerald-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Upload size={20} />
            Déposer une ressource
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-emerald-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dropzone */}
          <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
            <input 
              type="file" 
              id="fileUpload" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Upload size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm text-gray-600">
                Glissez votre fichier ici ou <span className="text-emerald-600 font-medium">parcourir</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, XLSX, ZIP — Max 100 Mo</p>
              {file && (
                <div className="mt-4 p-2 bg-emerald-100 text-emerald-800 rounded text-sm font-medium">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Titre <span className="text-red-500">*</span></label>
              <input 
                required
                value={titre}
                onChange={e => setTitre(e.target.value)}
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Ex: Algorithmique avancée - Chapitre 1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as TypeRessource)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Cours">Cours</option>
                <option value="Epreuve">Épreuve</option>
                <option value="Livre">Livre</option>
                <option value="TD_TP">TD/TP</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Année académique <span className="text-red-500">*</span></label>
            <select 
              value={annee}
              onChange={e => setAnnee(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value={schoolYear}>{schoolYear}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                Cycle
              </label>
              <select 
                value={cycle}
                onChange={e => {
                  setCycle(e.target.value);
                  setClasse('Toutes');
                }}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="Tous">Choisir...</option>
                {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className={`text-sm font-medium flex items-center gap-2 ${cycle === 'Tous' ? 'text-gray-400' : 'text-gray-700'}`}>
                <span className={`${cycle === 'Tous' ? 'bg-gray-300' : 'bg-emerald-600'} text-white w-5 h-5 rounded-full flex items-center justify-center text-xs`}>2</span>
                Classe
              </label>
              <select 
                disabled={cycle === 'Tous'}
                value={classe}
                onChange={e => setClasse(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="Toutes">Choisir...</option>
                {cycle !== 'Tous' && CLASS_CONFIG.find((c: any) => c.name === cycle)?.classes.map((cl: any) => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className={`text-sm font-medium flex items-center gap-2 ${classe === 'Toutes' ? 'text-gray-400' : 'text-gray-700'}`}>
                <span className={`${classe === 'Toutes' ? 'bg-gray-300' : 'bg-emerald-600'} text-white w-5 h-5 rounded-full flex items-center justify-center text-xs`}>3</span>
                Matière
              </label>
              <select 
                disabled={classe === 'Toutes'}
                value={matiere}
                onChange={e => setMatiere(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="Toutes">Choisir...</option>
                <option value="Mathématiques">Mathématiques</option>
                <option value="Français">Français</option>
                <option value="Physique">Physique</option>
                <option value="SVT">SVT</option>
                <option value="Anglais">Anglais</option>
                <option value="Histoire-Géo">Histoire-Géo</option>
                <option value="Philosophie">Philosophie</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
              placeholder="Décrivez brièvement le contenu de cette ressource..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isUploading || !file || !titre}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Publication...
                </>
              ) : (
                <>
                  <CheckSquare size={18} />
                  Publier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
