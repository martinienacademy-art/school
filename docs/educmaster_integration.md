# Plan d'Intégration : GestioSchool <> EducMaster (Bénin)

## Contexte
Étant donné qu'EducMaster ne dispose pas d'API publique ouverte pour des logiciels tiers, l'intégration se fera via un système de passerelle par fichiers (Import / Export) pour éviter la double saisie aux directeurs d'établissements.

## Fonctionnalités prévues

### 1. Ajout du Matricule EducMaster
- **Base de données / Frontend** : Ajouter un champ optionnel `matricule_educmaster` dans le profil de chaque élève (table `students`).
- **Affichage** : Faire apparaître ce matricule sur les interfaces de gestion et sur les bulletins officiels générés par GestioSchool.

### 2. Export vers EducMaster
- **Objectif** : Permettre au directeur d'exporter les données de GestioSchool pour les injecter directement dans EducMaster.
- **Fonctionnement** :
  - Création d'un bouton "Export EducMaster" dans l'interface d'administration.
  - Génération d'un fichier Excel (.xlsx) ou CSV respectant **strictement** le format de colonnes attendu par la plateforme EducMaster.
  - Types de données exportables : Liste des élèves (pour les inscriptions de rentrée), Notes/Moyennes périodiques.

### 3. Import depuis EducMaster
- **Objectif** : Faciliter la configuration initiale de GestioSchool en récupérant les données déjà présentes sur EducMaster.
- **Fonctionnement** :
  - Outil d'importation (upload de fichier CSV/Excel) dans GestioSchool.
  - Mapping automatique des colonnes du fichier généré par EducMaster pour créer les classes, les élèves et pré-remplir leurs matricules nationaux.

## Étapes de réalisation (à venir)
1. Récupérer un fichier Excel "modèle" vierge ou d'exemple provenant d'EducMaster pour identifier exactement les noms des colonnes attendues.
2. Mettre à jour le Store Zustand et le schéma de base de données (Supabase) pour inclure le champ `matricule_educmaster`.
3. Développer les scripts de génération de fichiers (via une librairie comme `xlsx` ou équivalent).
4. Ajouter les composants UI (boutons d'import/export) dans la page des Élèves et/ou Paramètres.
