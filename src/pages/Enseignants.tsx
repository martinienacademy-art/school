import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Teacher } from '../types';
import { Plus, Search, Edit2, Trash2, Download, Upload, FileText, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { generateNextSequence } from '../utils/idGenerator';

export default function Enseignants() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, importTeachers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    ide: '', nom: '', prenom: '', email: '', matricule: '',
    dateNaissance: '', telephone: '', adresse: '', titre: 'M.',
    departement: '', statut: 'Actif', dateEmbauche: '',
    tauxHoraire: 0, quotaHoraire: 0, rib: '', banque: ''
  });

  const filteredTeachers = (teachers || []).filter(t => 
    (t.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.matricule || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData(teacher);
    } else {
      setEditingTeacher(null);
      const allMatricules = teachers?.map(t => t.matricule || '') || [];
      const autoMatricule = generateNextSequence('M', allMatricules, 6);
      
      setFormData({
        ide: '', nom: '', prenom: '', email: '', matricule: autoMatricule,
        dateNaissance: '', telephone: '', adresse: '', titre: 'M.',
        departement: '', statut: 'Actif', dateEmbauche: '',
        tauxHoraire: 0, quotaHoraire: 0, rib: '', banque: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tauxHoraire' || name === 'quotaHoraire' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, formData);
    } else {
      addTeacher(formData as Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet enseignant ?')) {
      deleteTeacher(id);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Liste des Enseignants', 14, 15);
    const tableData = filteredTeachers.map(t => [
      t.matricule || '', `${t.nom} ${t.prenom}`, t.telephone || '', t.titre || '', t.departement || '', t.statut || ''
    ]);
    autoTable(doc, {
      head: [['Matricule', 'Nom & Prénom', 'Téléphone', 'Titre', 'Département', 'Statut']],
      body: tableData,
      startY: 20
    });
    doc.save('enseignants.pdf');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTeachers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enseignants");
    XLSX.writeFile(workbook, "enseignants.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const importedTeachers: any[] = data.map(row => ({
          ide: row.ide?.toString() || '',
          nom: row.nom?.toString() || '',
          prenom: row.prenom?.toString() || '',
          email: row.email?.toString() || '',
          matricule: row.matricule?.toString() || '',
          dateNaissance: row.dateNaissance?.toString() || '',
          telephone: row.telephone?.toString() || '',
          adresse: row.adresse?.toString() || '',
          titre: row.titre?.toString() || 'M.',
          departement: row.departement?.toString() || '',
          statut: row.statut?.toString() || 'Actif',
          dateEmbauche: row.dateEmbauche?.toString() || '',
          tauxHoraire: Number(row.tauxHoraire) || 0,
          quotaHoraire: Number(row.quotaHoraire) || 0,
          rib: row.rib?.toString() || '',
          banque: row.banque?.toString() || ''
        }));
        
        importTeachers(importedTeachers);
        alert(`${importedTeachers.length} enseignants importés avec succès !`);
      } catch (error) {
        alert("Erreur lors de l'importation. Vérifiez le format du fichier.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Enseignants</h1>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> Importer
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-750/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Matricule</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nom & Prénom</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Téléphone</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Titre</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Département</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Statut</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium dark:text-slate-300">{teacher.matricule}</td>
                  <td className="py-3 px-4 text-sm font-semibold dark:text-white">{teacher.nom} {teacher.prenom}</td>
                  <td className="py-3 px-4 text-sm dark:text-slate-300">{teacher.telephone}</td>
                  <td className="py-3 px-4 text-sm dark:text-slate-300">{teacher.titre}</td>
                  <td className="py-3 px-4 text-sm dark:text-slate-300">{teacher.departement}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.statut === 'Actif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      {teacher.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button onClick={() => handleOpenModal(teacher)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(teacher.id)} className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucun enseignant trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulaire */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden my-8 mt-24">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingTeacher ? 'Modifier Enseignant' : 'Ajouter un Enseignant'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Informations de base */}
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Titre</label>
                      <select name="titre" value={formData.titre} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border">
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Mlle">Mlle</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nom *</label>
                      <input required type="text" name="nom" value={formData.nom} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Prénom *</label>
                      <input required type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Sexe / IDE</label>
                      <input type="text" name="ide" value={formData.ide} onChange={handleChange} placeholder="Carte d'identité" className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Date de Naissance</label>
                      <input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Coordonnées</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Téléphone *</label>
                      <input required type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Adresse</label>
                      <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                  </div>
                </div>

                {/* Contrat & Pédagogie */}
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Emploi & Pédagogie</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Matricule</label>
                      <input type="text" name="matricule" value={formData.matricule} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Département</label>
                      <input type="text" name="departement" value={formData.departement} onChange={handleChange} placeholder="Ex: Mathématiques" className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Statut</label>
                      <select name="statut" value={formData.statut} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border">
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Date d'embauche</label>
                      <input type="date" name="dateEmbauche" value={formData.dateEmbauche} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Taux Horaire</label>
                      <input type="number" min="0" name="tauxHoraire" value={formData.tauxHoraire} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Quota Horaire (H)</label>
                      <input type="number" min="0" name="quotaHoraire" value={formData.quotaHoraire} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                  </div>
                </div>

                {/* Finance */}
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Informations Bancaires</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Banque</label>
                      <input type="text" name="banque" value={formData.banque} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">RIB / IBAN</label>
                      <input type="text" name="rib" value={formData.rib} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-transparent dark:text-white px-3 py-2 border" />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                  {editingTeacher ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
