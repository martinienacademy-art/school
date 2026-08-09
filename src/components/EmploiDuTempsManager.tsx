import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SeanceType, SeanceStatut, RecurrenceFrequence, CreneauHoraire } from '../types';
import { v4 as uuid } from '../utils/uuid';
import { Plus, Trash2, Copy, Info, Save } from 'lucide-react';

export const EmploiDuTempsManager: React.FC = () => {
    const { schoolYear, matieres, addSeance } = useStore();

    // 1. Informations générales
    const [anneeAcademique, setAnneeAcademique] = useState(schoolYear || '2026-2027');
    const [sousSysteme, setSousSysteme] = useState('Tous');
    const [classe, setClasse] = useState('4ème A');
    const [matiereNom, setMatiereNom] = useState(matieres[0]?.nom || 'Mathématiques');
    const [enseignant, setEnseignant] = useState('M. KOFFI Jean');
    const [salleGenerale, setSalleGenerale] = useState('Salle 12');
    const [typeSeance, setTypeSeance] = useState<SeanceType>('Cours');
    const [statut, setStatut] = useState<SeanceStatut>('Planifiée');

    // 2. Récurrence / Répétition
    const [isRecurrente, setIsRecurrente] = useState(true);
    const [frequence, setFrequence] = useState<RecurrenceFrequence>('Hebdomadaire');
    const [joursSelectionnes, setJoursSelectionnes] = useState<string[]>(['Lun', 'Mer', 'Ven']);
    const [dateDebut, setDateDebut] = useState('2026-08-08');
    const [dateFin, setDateFin] = useState('2026-10-31');
    const [nombreOccurrences, setNombreOccurrences] = useState<number | ''>(12);

    // 3. Créneaux horaires
    const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([
        { id: uuid(), jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', salle: 'Salle 12' },
        { id: uuid(), jour: 'Mercredi', heureDebut: '14:00', heureFin: '16:00', salle: 'Salle 12' },
        { id: uuid(), jour: 'Vendredi', heureDebut: '10:00', heureFin: '12:00', salle: 'Salle 12' }
    ]);

    const joursList = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const joursComplets: Record<string, string> = {
        Lun: 'Lundi', Mar: 'Mardi', Mer: 'Mercredi', Jeu: 'Jeudi', Ven: 'Vendredi', Sam: 'Samedi', Dim: 'Dimanche'
    };

    const toggleJour = (j: string) => {
        if (joursSelectionnes.includes(j)) {
            setJoursSelectionnes(joursSelectionnes.filter(item => item !== j));
        } else {
            setJoursSelectionnes([...joursSelectionnes, j]);
        }
    };

    const handleAddCreneau = () => {
        setCreneaux([
            ...creneaux,
            { id: uuid(), jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', salle: salleGenerale }
        ]);
    };

    const handleDuplicateCreneau = (c: CreneauHoraire) => {
        setCreneaux([
            ...creneaux,
            { ...c, id: uuid() }
        ]);
    };

    const handleDeleteCreneau = (id: string) => {
        setCreneaux(creneaux.filter(c => c.id !== id));
    };

    const handleCreneauChange = (id: string, field: keyof CreneauHoraire, value: string) => {
        setCreneaux(creneaux.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Génération automatique des séances selon les créneaux
        creneaux.forEach(c => {
            addSeance({
                id: uuid(),
                anneeAcademique,
                sousSysteme,
                classe,
                matiereNom,
                enseignant,
                salle: c.salle,
                type: typeSeance,
                statut: statut,
                date: dateDebut,
                heureDebut: c.heureDebut,
                heureFin: c.heureFin,
                jour: c.jour
            });
        });

        alert(`${creneaux.length} créneau(x) d'emploi du temps généré(s) et enregistré(s) avec succès !`);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Ajouter un emploi du temps / séance récurrente
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Planifiez les cours réguliers. Le système créera automatiquement toutes les séances selon la récurrence et les créneaux définis.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* 1. Informations générales */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">1</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Informations générales</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Année académique *</label>
                            <select value={anneeAcademique} onChange={e => setAnneeAcademique(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="2026-2027">2026-2027</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sous-système</label>
                            <select value={sousSysteme} onChange={e => setSousSysteme(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Tous">Tous</option>
                                <option value="Francophone">Francophone</option>
                                <option value="Anglophone">Anglophone</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classe *</label>
                            <select value={classe} onChange={e => setClasse(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="4ème A">4ème A</option>
                                <option value="3ème B">3ème B</option>
                                <option value="2nde C">2nde C</option>
                                <option value="Tle D">Tle D</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matière / Cours *</label>
                            <select value={matiereNom} onChange={e => setMatiereNom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Mathématiques">Mathématiques</option>
                                <option value="Physique-Chimie">Physique-Chimie</option>
                                <option value="SVT">SVT</option>
                                <option value="Français">Français</option>
                                <option value="Anglais">Anglais</option>
                                <option value="Histoire-Géo">Histoire-Géo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enseignant *</label>
                            <select value={enseignant} onChange={e => setEnseignant(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="M. KOFFI Jean">M. KOFFI Jean</option>
                                <option value="Mme. DOUA Marie">Mme. DOUA Marie</option>
                                <option value="M. KONAN Patrice">M. KONAN Patrice</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salle *</label>
                            <select value={salleGenerale} onChange={e => setSalleGenerale(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Salle 12">Salle 12</option>
                                <option value="Salle 10">Salle 10</option>
                                <option value="Labo Info">Labo Info</option>
                                <option value="Amphi A">Amphi A</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type de séance *</label>
                            <select value={typeSeance} onChange={e => setTypeSeance(e.target.value as SeanceType)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Cours">Cours</option>
                                <option value="TD">TD</option>
                                <option value="TP">TP</option>
                                <option value="Examen">Examen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Statut *</label>
                            <select value={statut} onChange={e => setStatut(e.target.value as SeanceStatut)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Planifiée">Planifiée</option>
                                <option value="Effectuée">Effectuée</option>
                                <option value="Suspendue">Suspendue</option>
                                <option value="Annulée">Annulée</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Récurrence / Répétition */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">2</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Récurrence / Répétition</h3>
                    </div>

                    <div className="pl-10 space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isRecurrente} onChange={e => setIsRecurrente(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Séance récurrente</span>
                        </label>

                        {isRecurrente && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fréquence *</label>
                                        <select value={frequence} onChange={e => setFrequence(e.target.value as RecurrenceFrequence)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                                            <option value="Hebdomadaire">Hebdomadaire</option>
                                            <option value="Quotidienne">Quotidienne</option>
                                            <option value="Mensuelle">Mensuelle</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Se répète le / les jours *</label>
                                        <div className="flex gap-2 flex-wrap pt-1">
                                            {joursList.map(j => (
                                                <label key={j} className="flex items-center gap-1 text-xs font-medium cursor-pointer bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                                    <input type="checkbox" checked={joursSelectionnes.includes(j)} onChange={() => toggleJour(j)} className="rounded text-indigo-600" />
                                                    {j}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de début *</label>
                                        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de fin (optionnel)</label>
                                        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre d'occurrences (optionnel)</label>
                                        <input type="number" value={nombreOccurrences} onChange={e => setNombreOccurrences(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white" />
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-xs flex items-start gap-2 border border-blue-100 dark:border-blue-800/30">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Le système créera automatiquement les séances selon les créneaux définis ci-dessous, jusqu'à la date de fin ou jusqu'au nombre d'occurrences indiqué (la première limite atteinte sera appliquée).</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Créneaux horaires */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">3</span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Créneaux horaires <span className="text-xs font-normal text-slate-500">(plusieurs jours ou heures possibles)</span></h3>
                        </div>
                        <button type="button" onClick={handleAddCreneau} className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Ajouter un créneau
                        </button>
                    </div>

                    <div className="pl-10 space-y-4">
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="p-3">Jour *</th>
                                        <th className="p-3">Heure début *</th>
                                        <th className="p-3">Heure fin *</th>
                                        <th className="p-3">Salle *</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {creneaux.map((c) => (
                                        <tr key={c.id}>
                                            <td className="p-3">
                                                <select value={c.jour} onChange={e => handleCreneauChange(c.id, 'jour', e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white">
                                                    {Object.values(joursComplets).map(j => <option key={j} value={j}>{j}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input type="time" value={c.heureDebut} onChange={e => handleCreneauChange(c.id, 'heureDebut', e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                                            </td>
                                            <td className="p-3">
                                                <input type="time" value={c.heureFin} onChange={e => handleCreneauChange(c.id, 'heureFin', e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                                            </td>
                                            <td className="p-3">
                                                <select value={c.salle} onChange={e => handleCreneauChange(c.id, 'salle', e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white">
                                                    <option value="Salle 12">Salle 12</option>
                                                    <option value="Salle 10">Salle 10</option>
                                                    <option value="Labo Info">Labo Info</option>
                                                </select>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <button type="button" onClick={() => handleDuplicateCreneau(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Copy className="w-4 h-4" /></button>
                                                <button type="button" onClick={() => handleDeleteCreneau(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 4. Résumé de la génération */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">4</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Résumé de la génération</h3>
                    </div>

                    <div className="pl-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 font-medium">Fréquence</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{frequence}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 font-medium">Jours sélectionnés</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{joursSelectionnes.join(', ')}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 font-medium">Total estimé</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{nombreOccurrences} occurrences <span className="text-xs font-normal text-slate-400">(ou jusqu'au {dateFin})</span></p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Annuler
                    </button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all">
                        <Save className="w-4 h-4" /> Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
};
