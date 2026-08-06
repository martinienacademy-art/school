// ============================================================
// DASHBOARD ENSEIGNANT — Tableau de bord du portail professeur
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders, parseResponse } from '../../services/apiHelpers';
import {
    GraduationCap, BookOpen, Users, Award, LogOut, Bell,
    Calendar, ChevronRight, Edit3, FileText, Sun, Moon,
    TrendingUp, ClipboardList, MessageSquare, Settings
} from 'lucide-react';

// ── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4 hover:bg-slate-800 transition-all">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5">{label}</p>
        </div>
    </div>
);

// ── Quick Action ───────────────────────────────────────────────
const QuickAction: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; color: string }> = ({ label, icon, onClick, color }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 hover:border-slate-600 transition-all group text-center"
    >
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight">{label}</span>
    </button>
);

// ── Main Component ─────────────────────────────────────────────
export const TeacherDashboard: React.FC = () => {
    const user = useStore(s => s.user);
    const logout = useStore(s => s.logout);
    const setCurrentPage = useStore(s => s.setCurrentPage);

    const [darkMode] = useState(true); // Always dark for teacher portal
    const [currentTime, setCurrentTime] = useState(new Date());

    // Stats placeholder — à remplacer avec de vraies données API
    const [stats] = useState({
        classes: 0,
        eleves: 0,
        notes: 0,
        ressources: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const greeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Porto-Novo' });
    const dateStr = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Porto-Novo' });

    const quickActions = [
        { label: 'Saisie des notes', icon: <Edit3 className="w-5 h-5 text-white" />, color: 'bg-blue-600', action: () => setCurrentPage('saisie_notes') },
        { label: 'Mes bulletins', icon: <Award className="w-5 h-5 text-white" />, color: 'bg-purple-600', action: () => setCurrentPage('bulletins') },
        { label: 'Espace pédago.', icon: <BookOpen className="w-5 h-5 text-white" />, color: 'bg-emerald-600', action: () => setCurrentPage('espace_pedagogique') },
        { label: 'Messagerie', icon: <MessageSquare className="w-5 h-5 text-white" />, color: 'bg-amber-600', action: () => setCurrentPage('chat') },
        { label: 'Annonces', icon: <Bell className="w-5 h-5 text-white" />, color: 'bg-rose-600', action: () => setCurrentPage('annonces') },
        { label: 'Mes documents', icon: <FileText className="w-5 h-5 text-white" />, color: 'bg-cyan-600', action: () => setCurrentPage('documents') },
    ];

    return (
        <div className="min-h-screen bg-slate-950 font-['Poppins'] text-white">
            {/* ── Header ───────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white leading-none">GestioSchool</p>
                            <p className="text-[9px] text-blue-400 font-medium uppercase tracking-widest">Portail Enseignant</p>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-black text-white">{timeStr}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest capitalize">{dateStr}</span>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition text-xs font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* ── Greeting ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">
                            {greeting()}, <span className="text-blue-400">{user?.nom?.split(' ')[0] || 'Professeur'}</span> 👋
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            Votre tableau de bord — Année scolaire en cours
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-300 text-xs font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            Portail actif
                        </div>
                    </div>
                </div>

                {/* ── Stats ────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Classes assignées" value={stats.classes} icon={<Users className="w-5 h-5 text-white" />} color="bg-blue-600" />
                    <StatCard label="Élèves suivis" value={stats.eleves} icon={<GraduationCap className="w-5 h-5 text-white" />} color="bg-purple-600" />
                    <StatCard label="Notes saisies" value={stats.notes} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-emerald-600" />
                    <StatCard label="Ressources" value={stats.ressources} icon={<BookOpen className="w-5 h-5 text-white" />} color="bg-amber-600" />
                </div>

                {/* ── Quick Actions ──────────────────────────── */}
                <div>
                    <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                        Actions rapides
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {quickActions.map((a, i) => (
                            <QuickAction key={i} label={a.label} icon={a.icon} onClick={a.action} color={a.color} />
                        ))}
                    </div>
                </div>

                {/* ── Info Banner ───────────────────────────── */}
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600/30 rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">Portail enseignant opérationnel</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Votre espace est configuré. Utilisez les actions rapides ci-dessus pour accéder à vos fonctionnalités.
                            Si certaines sections ne sont pas accessibles, contactez votre directeur pour ajuster vos permissions.
                        </p>
                    </div>
                </div>

                {/* ── Profile Card ──────────────────────────── */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Mon profil</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
                            {(user?.nom || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-white text-lg">{user?.nom || 'Professeur'}</p>
                            <p className="text-blue-400 text-sm font-medium">{user?.email || user?.telephone || '—'}</p>
                            <p className="text-slate-500 text-xs mt-0.5 capitalize">
                                Enseignant · {user?.school_slug || 'Établissement'}
                            </p>
                        </div>
                        <button
                            onClick={() => setCurrentPage('parametres')}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
