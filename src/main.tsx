import React, { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("💥 Uncaught Root Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e', marginBottom: '1rem' }}>Une erreur est survenue lors du chargement de l'application</h1>
          <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '1.5rem' }}>
            {this.state.error?.message || "Erreur de rendu"}
          </p>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }} 
            style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Réinitialiser le cache et recharger
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Configuration de sécurité globale ────────────────────────────────────────
// S'assure que toutes les requêtes fetch vers le backend envoient les cookies (HttpOnly)
const originalFetch = window.fetch;
window.fetch = function (resource: RequestInfo | URL, config?: RequestInit) {
  const newConfig = config || {};
  if (newConfig.credentials === undefined) {
    newConfig.credentials = 'include';
  }
  return originalFetch.call(window, resource, newConfig);
};
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
