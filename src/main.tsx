import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import './index.css';

// ── Configuration de sécurité globale ────────────────────────────────────────
// S'assure que toutes les requêtes fetch vers le backend envoient les cookies (HttpOnly)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const [resource, config] = args;
  const newConfig = config || {};
  if (newConfig.credentials === undefined) {
    newConfig.credentials = 'include';
  }
  return originalFetch(resource, newConfig);
};
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
