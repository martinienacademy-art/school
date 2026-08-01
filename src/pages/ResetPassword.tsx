import React, { useState } from 'react';

import { API_BASE_URL } from '../config';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export const ResetPassword = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const table = searchParams.get('table');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, table, newPassword: password })
            });
            const data = await res.json();
            
            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Votre mot de passe a été réinitialisé avec succès.');
                setTimeout(() => window.location.href = '/', 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Erreur lors de la réinitialisation.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Erreur de connexion au serveur.');
        }
    };

    if (!token || !email || !table) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
                    <p className="text-gray-500 mb-6">Le lien de réinitialisation est incomplet ou invalide.</p>
                    <button onClick={() => window.location.href = '/'} className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600">Retour à l'accueil</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
                    <p className="text-gray-500 mt-2">Veuillez définir votre nouveau mot de passe.</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <p className="text-emerald-700 font-medium mb-6">{message}</p>
                        <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder="Min. 6 caractères"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                            <input 
                                type="password" 
                                required 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder="Retapez le mot de passe"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{message}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                        >
                            {status === 'loading' ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
