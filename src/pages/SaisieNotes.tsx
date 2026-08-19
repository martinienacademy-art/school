import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Edit3, Save, CheckCircle2, Award, TrendingUp, BarChart3, AlertCircle, Printer } from 'lucide-react';
import { Note, PeriodeType } from '../types';
import { v4 as uuid } from '../utils/uuid';

export const SaisieNotes: React.FC = () => {
    const currentPeriode = useStore((s) => s.currentPeriode);
    const setCurrentPeriode = useStore((s) => s.setCurrentPeriode);
    const students = useStore((s) => s.students);
    const matieres = useStore((s) => s.matieres);
    const classeMatieres = useStore((s) => s.classeMatieres);
    const storeClasses = useStore((s: any) => s.classes) || [];

    const periods: PeriodeType[] = ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3', 'SEMESTRE 1', 'SEMESTRE 2'];
    
    // Combine classes from students and store classes
    const classesList = useMemo(() => {
        const set = new Set<string>();
        students.forEach(s => { if (s.classe) set.add(s.classe); });
        storeClasses.forEach((c: any) => { if (c.nom) set.add(c.nom); });
        return Array.from(set).sort();
    }, [students, storeClasses]);

    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedMatiereId, setSelectedMatiereId] = useState('');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // Filter students for the selected class
    const classStudents = useMemo(() => {
        return students.filter(s => s.classe === selectedClasse).sort((a,b) => a.nom.localeCompare(b.nom));
    }, [students, selectedClasse]);

    // Matieres available for this class
    const availableMatieres = useMemo(() => {
        return classeMatieres
            .filter(cm => cm.classe === selectedClasse)
            .map(cm => ({ cm, mat: matieres.find(m => m.id === cm.matiereId) }))
            .filter(item => item.mat !== undefined);
    }, [classeMatieres, matieres, selectedClasse]);

    const currentMatiereObj = useMemo(() => {
        return availableMatieres.find(item => item.mat?.id === selectedMatiereId);
    }, [availableMatieres, selectedMatiereId]);

    const currentCoef = currentMatiereObj?.cm.coefficient || 1;

    // Local state for grades being edited
    const [draftNotes, setDraftNotes] = useState<Record<string, Record<string, string>>>({});
    const prevSelectionRef = React.useRef<string>('');

    // Charge les notes existantes dans le brouillon quand la sélection change
    React.useEffect(() => {
        const selectionKey = `${selectedClasse}|${selectedMatiereId}|${currentPeriode}`;
        if (selectionKey === prevSelectionRef.current) return;
        prevSelectionRef.current = selectionKey;

        if (!selectedClasse || !selectedMatiereId) {
            setDraftNotes({});
            return;
        }

        const currentNotes = useStore.getState().notes;
        const newDrafts: Record<string, Record<string, string>> = {};
        
        classStudents.forEach(student => {
            const existing = currentNotes.find(n => n.eleveId === student.id && n.matiereId === selectedMatiereId && n.periode === currentPeriode);
            newDrafts[student.id] = {
                noteInt1: existing?.noteInt1 !== undefined && existing?.noteInt1 !== null ? existing.noteInt1.toString() : '',
                noteInt2: existing?.noteInt2 !== undefined && existing?.noteInt2 !== null ? existing.noteInt2.toString() : '',
                noteInt3: existing?.noteInt3 !== undefined && existing?.noteInt3 !== null ? existing.noteInt3.toString() : '',
                noteDev1: existing?.noteDev1 !== undefined && existing?.noteDev1 !== null ? existing.noteDev1.toString() : '',
                noteDev2: existing?.noteDev2 !== undefined && existing?.noteDev2 !== null ? existing.noteDev2.toString() : ''
            };
        });
        setDraftNotes(newDrafts);
    }, [selectedClasse, selectedMatiereId, currentPeriode, classStudents]);

    const handleNoteChange = (studentId: string, field: 'noteInt1' | 'noteInt2' | 'noteInt3' | 'noteDev1' | 'noteDev2', value: string) => {
        const cleanedValue = value.replace(',', '.');
        if (cleanedValue !== '' && !/^\d*\.?\d*$/.test(cleanedValue)) return;
        const num = parseFloat(cleanedValue);
        if (!isNaN(num) && (num < 0 || num > 20)) return;

        setDraftNotes(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: cleanedValue
            }
        }));
    };

    // Calculs des moyennes pour chaque élève
    const computedStudentStats = useMemo(() => {
        const results: Record<string, { moyInt: number | null; moyDev: number | null; moyenne: number | null; points: number | null; appreciation: string; rang?: number }> = {};

        classStudents.forEach(student => {
            const draft = draftNotes[student.id] || {};
            const i1 = draft.noteInt1 !== '' && !isNaN(parseFloat(draft.noteInt1)) ? parseFloat(draft.noteInt1) : null;
            const i2 = draft.noteInt2 !== '' && !isNaN(parseFloat(draft.noteInt2)) ? parseFloat(draft.noteInt2) : null;
            const i3 = draft.noteInt3 !== '' && !isNaN(parseFloat(draft.noteInt3)) ? parseFloat(draft.noteInt3) : null;
            const d1 = draft.noteDev1 !== '' && !isNaN(parseFloat(draft.noteDev1)) ? parseFloat(draft.noteDev1) : null;
            const d2 = draft.noteDev2 !== '' && !isNaN(parseFloat(draft.noteDev2)) ? parseFloat(draft.noteDev2) : null;

            const ints = [i1, i2, i3].filter((n): n is number => n !== null);
            const moyInt = ints.length > 0 ? ints.reduce((a, b) => a + b, 0) / ints.length : null;

            const devs = [d1, d2].filter((n): n is number => n !== null);
            const moyDev = devs.length > 0 ? devs.reduce((a, b) => a + b, 0) / devs.length : null;

            let moyenne: number | null = null;
            if (moyInt !== null && moyDev !== null) {
                // Formule standard : (Moy. Int + 2 * Moy. Dev) / 3
                moyenne = (moyInt + 2 * moyDev) / 3;
            } else if (moyDev !== null) {
                moyenne = moyDev;
            } else if (moyInt !== null) {
                moyenne = moyInt;
            }

            let appreciation = '—';
            if (moyenne !== null) {
                if (moyenne >= 16) appreciation = 'Très Bien';
                else if (moyenne >= 14) appreciation = 'Bien';
                else if (moyenne >= 12) appreciation = 'Assez Bien';
                else if (moyenne >= 10) appreciation = 'Passable';
                else if (moyenne >= 8) appreciation = 'Insuffisant';
                else appreciation = 'Médiocre';
            }

            const points = moyenne !== null ? moyenne * currentCoef : null;

            results[student.id] = {
                moyInt,
                moyDev,
                moyenne,
                points,
                appreciation
            };
        });

        // Calcul des Rangs
        const ranked = classStudents
            .map(s => ({ id: s.id, moy: results[s.id]?.moyenne }))
            .filter(item => item.moy !== null)
            .sort((a, b) => (b.moy as number) - (a.moy as number));

        ranked.forEach((item, index) => {
            if (results[item.id]) {
                results[item.id].rang = index + 1;
            }
        });

        return results;
    }, [classStudents, draftNotes, currentCoef]);

    // Statistiques globales de la classe
    const classGlobalStats = useMemo(() => {
        const validMoyennes = Object.values(computedStudentStats)
            .map(s => s.moyenne)
            .filter((m): m is number => m !== null);

        if (validMoyennes.length === 0) {
            return {
                moyenneClasse: '--',
                maxNote: '--',
                minNote: '--',
                tauxReussite: 0,
                totalNotesSaisies: 0
            };
        }

        const sum = validMoyennes.reduce((a, b) => a + b, 0);
        const avg = sum / validMoyennes.length;
        const max = Math.max(...validMoyennes);
        const min = Math.min(...validMoyennes);
        const reussiteCount = validMoyennes.filter(m => m >= 10).length;
        const taux = Math.round((reussiteCount / validMoyennes.length) * 100);

        return {
            moyenneClasse: avg.toFixed(2),
            maxNote: max.toFixed(2),
            minNote: min.toFixed(2),
            tauxReussite: taux,
            totalNotesSaisies: validMoyennes.length
        };
    }, [computedStudentStats]);

    const handleSave = async () => {
        if (!selectedMatiereId || !selectedClasse) return;

        const currentNotes = useStore.getState().notes;
        const batch: Note[] = [];
        
        classStudents.forEach(student => {
            const draft = draftNotes[student.id];
            if (draft) {
                const existingNote = currentNotes.find(n => 
                    n.eleveId === student.id && 
                    n.matiereId === selectedMatiereId && 
                    n.periode === currentPeriode
                );

                const nI1 = draft.noteInt1 === '' ? null : parseFloat(draft.noteInt1);
                const nI2 = draft.noteInt2 === '' ? null : parseFloat(draft.noteInt2);
                const nI3 = draft.noteInt3 === '' ? null : parseFloat(draft.noteInt3);
                const nD1 = draft.noteDev1 === '' ? null : parseFloat(draft.noteDev1);
                const nD2 = draft.noteDev2 === '' ? null : parseFloat(draft.noteDev2);

                batch.push({
                    id: existingNote ? existingNote.id : uuid(),
                    eleveId: student.id,
                    matiereId: selectedMatiereId,
                    periode: currentPeriode,
                    noteInt1: isNaN(nI1 as any) ? null : nI1,
                    noteInt2: isNaN(nI2 as any) ? null : nI2,
                    noteInt3: isNaN(nI3 as any) ? null : nI3,
                    noteDev1: isNaN(nD1 as any) ? null : nD1,
                    noteDev2: isNaN(nD2 as any) ? null : nD2,
                });
            }
        });
        
        if (batch.length > 0) {
            useStore.getState().upsertNotes(batch);
            setSaveStatus('💾 Sauvegarde en cours...');
            try {
                const allNotes = useStore.getState().notes;
                const { syncToBackend } = await import('../services/backendSync');
                const result = await syncToBackend({ notes: allNotes });
                useStore.setState({ lastSyncTimestamp: Date.now() });
                if (result) {
                    setSaveStatus('✅ Notes enregistrées et synchronisées avec succès !');
                } else {
                    setSaveStatus('⚠️ Sauvegardé localement');
                }
            } catch (err) {
                console.error('Erreur sync cloud notes:', err);
                setSaveStatus('⚠️ Sauvegardé localement');
            }
        } else {
            setSaveStatus('Aucune note à enregistrer');
        }
        
        setTimeout(() => setSaveStatus(null), 3500);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl">
                        <Edit3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Saisie & Grille des Notes</h2>
                        <p className="text-pink-100 text-xs sm:text-sm font-medium mt-0.5">
                            Interrogations, devoirs, calcul automatique des moyennes, classements et coefficients.
                        </p>
                    </div>
                </div>

                {selectedClasse && selectedMatiereId && (
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black uppercase tracking-wider backdrop-blur-md transition-all self-start sm:self-auto cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Imprimer la grille
                    </button>
                )}
            </div>

            {/* Filtres de sélection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2">Période Académique</label>
                    <select
                        value={currentPeriode}
                        onChange={(e) => setCurrentPeriode(e.target.value as PeriodeType)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-800 dark:text-white outline-none cursor-pointer"
                    >
                        {periods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2">Classe</label>
                    <select
                        value={selectedClasse}
                        onChange={(e) => { setSelectedClasse(e.target.value); setSelectedMatiereId(''); }}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-800 dark:text-white outline-none cursor-pointer"
                    >
                        <option value="">-- Choisir une classe --</option>
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[250px]">
                    <label className="block text-xs font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-2">Matière</label>
                    <select
                        value={selectedMatiereId}
                        onChange={(e) => setSelectedMatiereId(e.target.value)}
                        disabled={!selectedClasse}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-800 dark:text-white outline-none disabled:opacity-50 cursor-pointer"
                    >
                        <option value="">-- Choisir une matière --</option>
                        {availableMatieres.map(item => (
                            <option key={item.mat!.id} value={item.mat!.id}>
                                {item.mat!.nom} (Coefficient: {item.cm.coefficient})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Statistiques rapides de la classe */}
            {selectedClasse && selectedMatiereId && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Moyenne Classe</p>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white">{classGlobalStats.moyenneClasse} / 20</h4>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Plus Forte Note</p>
                            <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400">{classGlobalStats.maxNote} / 20</h4>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Plus Faible Note</p>
                            <h4 className="text-lg font-black text-amber-600 dark:text-amber-400">{classGlobalStats.minNote} / 20</h4>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Taux de Réussite</p>
                            <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{classGlobalStats.tauxReussite}%</h4>
                        </div>
                    </div>
                </div>
            )}

            {/* Table de Saisie */}
            {selectedClasse && selectedMatiereId ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                Effectif : <strong className="text-rose-600 dark:text-rose-400">{classStudents.length} élèves</strong>
                            </span>
                            <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold">
                                Coef : {currentCoef}
                            </span>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            Enregistrer les notes
                        </button>
                    </div>

                    {saveStatus && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold flex items-center justify-center gap-2 text-xs border-b border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" /> {saveStatus}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                                    <th className="p-3.5 text-center w-12">N°</th>
                                    <th className="p-3.5 min-w-[180px]">Nom & Prénom(s)</th>
                                    <th className="p-3 text-center text-blue-600 dark:text-blue-400 w-16">INT 1</th>
                                    <th className="p-3 text-center text-blue-600 dark:text-blue-400 w-16">INT 2</th>
                                    <th className="p-3 text-center text-blue-600 dark:text-blue-400 w-16">INT 3</th>
                                    <th className="p-3 text-center text-indigo-600 dark:text-indigo-400 w-20">Moy. Int</th>
                                    <th className="p-3 text-center text-purple-600 dark:text-purple-400 w-16">DEV 1</th>
                                    <th className="p-3 text-center text-purple-600 dark:text-purple-400 w-16">DEV 2</th>
                                    <th className="p-3 text-center text-purple-600 dark:text-purple-400 w-20">Moy. Dev</th>
                                    <th className="p-3 text-center text-rose-600 dark:text-rose-400 w-24 bg-rose-50/50 dark:bg-rose-950/20">Moyenne</th>
                                    <th className="p-3 text-center text-gray-700 dark:text-slate-300 w-20">Total Pts</th>
                                    <th className="p-3 text-center text-amber-600 dark:text-amber-400 w-16">Rang</th>
                                    <th className="p-3 text-center text-gray-600 dark:text-slate-400 min-w-[120px]">Appréciation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                                {classStudents.map((student, index) => {
                                    const stats = computedStudentStats[student.id] || { moyInt: null, moyDev: null, moyenne: null, points: null, appreciation: '—' };
                                    const isAdmis = stats.moyenne !== null && stats.moyenne >= 10;

                                    return (
                                        <tr key={student.id} className="hover:bg-rose-50/20 dark:hover:bg-slate-800/60 transition-colors">
                                            <td className="p-3 text-center text-xs font-bold text-gray-400">{index + 1}</td>
                                            <td className="p-3 font-bold text-gray-800 dark:text-white">
                                                {student.nom} {student.prenom}
                                            </td>

                                            {/* Interrogations */}
                                            <td className="p-2 text-center">
                                                <input
                                                    type="text"
                                                    className="w-14 px-1.5 py-1.5 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={draftNotes[student.id]?.noteInt1 ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteInt1', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="text"
                                                    className="w-14 px-1.5 py-1.5 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={draftNotes[student.id]?.noteInt2 ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteInt2', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="text"
                                                    className="w-14 px-1.5 py-1.5 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={draftNotes[student.id]?.noteInt3 ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteInt3', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                            <td className="p-2 text-center font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 rounded">
                                                {stats.moyInt !== null ? stats.moyInt.toFixed(2) : '--'}
                                            </td>

                                            {/* Devoirs */}
                                            <td className="p-2 text-center">
                                                <input
                                                    type="text"
                                                    className="w-14 px-1.5 py-1.5 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
                                                    value={draftNotes[student.id]?.noteDev1 ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteDev1', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="text"
                                                    className="w-14 px-1.5 py-1.5 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
                                                    value={draftNotes[student.id]?.noteDev2 ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteDev2', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                            <td className="p-2 text-center font-bold text-xs text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20 rounded">
                                                {stats.moyDev !== null ? stats.moyDev.toFixed(2) : '--'}
                                            </td>

                                            {/* Moyenne Finale & Stats */}
                                            <td className={`p-2 text-center font-black text-sm ${isAdmis ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30' : stats.moyenne !== null ? 'text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/30' : 'text-gray-400'}`}>
                                                {stats.moyenne !== null ? stats.moyenne.toFixed(2) : '--'}
                                            </td>
                                            <td className="p-2 text-center font-bold text-xs text-gray-700 dark:text-slate-300">
                                                {stats.points !== null ? stats.points.toFixed(2) : '--'}
                                            </td>
                                            <td className="p-2 text-center font-black text-xs text-amber-600 dark:text-amber-400">
                                                {stats.rang ? `${stats.rang}${stats.rang === 1 ? 'er' : 'e'}` : '--'}
                                            </td>
                                            <td className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-slate-400">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                    stats.moyenne !== null && stats.moyenne >= 14
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : stats.moyenne !== null && stats.moyenne >= 10
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                        : stats.moyenne !== null
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                                        : 'text-gray-400'
                                                }`}>
                                                    {stats.appreciation}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {classStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={13} className="p-12 text-center text-gray-500 font-semibold">
                                            Aucun élève trouvé dans cette classe.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                    <Edit3 className="w-16 h-16 text-gray-300 dark:text-slate-700 mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300 mb-1">Prêt pour la saisie des notes</h3>
                    <p className="text-gray-400 text-xs sm:text-sm text-center max-w-md">
                        Veuillez sélectionner une <strong>Classe</strong> et une <strong>Matière</strong> dans les filtres ci-dessus pour charger la grille de saisie et les calculs en temps réel.
                    </p>
                </div>
            )}
        </div>
    );
};
