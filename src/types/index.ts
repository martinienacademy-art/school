// ============================================================
// TYPES PRINCIPAUX — EduFinance
// ============================================================



export type Cycle = 'Primaire' | 'Collège' | 'Lycée';

export type PaymentStatus = 'Soldé' | 'Partiel' | 'Non soldé';

export interface Student {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string; // Matricule interne de l'école
  matriculeNational?: string;
  classe: string;
  telephone: string;
  parentId?: string;
  sexe: 'M' | 'F';
  redoublant: boolean;
  ecoleProvenance: string;
  ecolage: number;
  dejaPaye: number;
  restant: number;
  recu: string;
  adsn?: string;
  nationalite?: string;
  adresse?: string;
  numeroCNI?: string;
  dateDelivranceCNI?: string;
  statutAdmin?: 'Actif' | 'Suspendu' | 'Abandon' | 'Admis' | 'Ajourné';
  statutElv?: 'NOUVEAU' | 'ANCIEN' | 'REDOUBLANT';
  dateNaissance?: string;
  acteNaissanceUrl?: string;
  photoUrl?: string;  // Photo passeport de l'élève (base64 data URL)
  cycle: Cycle;
  status: PaymentStatus;
  historiquesPaiements: Payment[];
  paiements?: Payment[];
  dateInscription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  montant: number;
  date: string;
  recu: string;
  mode?: string;
  reference?: string;
  commentaire?: string;
  note?: string;
  methode?: string;
}

export interface ClassConfig {
  name: string;
  cycle: Cycle;
  niveau?: string;
  ecolage: number;
}

export interface ClassInfo {
  id?: string;
  nom: string;
  cycle: Cycle | 'Maternelle' | 'Crèche';
  niveau?: string;
  ecolage: number;
}

export type StatusPaiement = 'solde' | 'tranche_validee' | 'tranche_partielle' | 'non_solde';

export interface ClassStats {
  classe: string;
  cycle: Cycle;
  totalEleves: number;
  effectif: number;
  totalEcolage: number;
  ecolageTotal: number;
  totalPaye: number;
  paye: number;
  totalRestant: number;
  restant: number;
  tauxRecouvrement: number;
}

export interface AdminSettings {
  seuilDeuxiemeTranche: number;
  schoolName: string;
  schoolYear: string;
  messageRemerciement: string;
  messageRappel: string;
  // Champs additionnels pour la génération PDF
  nomEcole?: string;
  anneScolaire?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export interface Tranche {
  id: string;
  nom: string;
  dateLimite: string; // YYYY-MM-DD
  pourcentage: number; // 0 à 100
}

export interface AppSettings extends AdminSettings {
  currency: string;
  badgeParentResponsable: string;
  badge2emeTranche: string;
  messageSolde?: string; 
  messagePartiel?: string; 
  messageNonPaye?: string; 
  schoolAddress?: string; 
  schoolPhone?: string; 
  schoolEmail?: string; 
  academicYear?: string; 
  tranches?: Tranche[];
  acronyme?: string;
  adressePhysique?: string;
  emailOfficiel?: string;
  siteWeb?: string;
  description?: string;
  agrement?: string;
  devise?: string;
  republique?: string;
  ministere?: string;
  localisationMap?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  smtpServer?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecurity?: string;
  smtpSenderEmail?: string;
  smtpSenderName?: string;
  watermarkUrl?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
}

export interface DashboardStats {
  totalEleves: number;
  totalPrimaire: number;
  totalCollege: number;
  totalLycee: number;
  totalEcolageAttendu: number;
  totalDejaPaye: number;
  totalRestant: number;
  tauxRecouvrement: number;
  elevesSoldes: number;
  elevesNonSoldes: number;
}

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'directeur'
  | 'directeur_general'
  | 'proviseur'
  | 'censeur'
  | 'superviseur'
  | 'surveillant'
  | 'comptable'
  | 'enseignant'
  | 'parent';

export interface User {
  id: string;
  username: string; // phone number for parents
  role: UserRole;
  nom: string;
  telephone?: string;
  email?: string;
  schoolSlug?: string; // lié à une école (null pour superadmin)
  school_slug?: string; // alias pour compatibilité enseignant
  schoolName?: string; // nom de l'école pour affichage
  features?: string[]; // fonctionnalités SaaS accordées à cette école
}

// ── École (Multi-Tenant) ─────────────────────────────────
export interface School {
  id: string;
  name: string;
  slug: string;            // ex: 'ecole-alpha'
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  trial_ends_at: string;   // ISO date
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
  student_count?: number;  // calculé côté serveur
  revenue?: number;        // 2000 FCFA/élève
  features?: string[];     // fonctionnalités activées pour cette école
  custom_price_per_student?: number; // tarif personnalisé par élève
}

export interface Parent {
  id: string;
  nom: string;
  telephone: string; // serves as username
  password?: string;
  createdAt: string;
  created_at?: string;
}

// ── Salles & Bâtiments (Infrastructure) ────────────────────
export interface Salle {
  id: string;
  nom: string;
  batiment?: string; // ex: "Bâtiment F" (optionnel/peut être vide)
  capacite?: number;
  etage?: string;
  description?: string;
  createdAt?: string;
}

// ── Présences (pointage QR) ──────────────────────────────
export interface Presence {
  id: string;
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  eleveClasse: string;
  date: string;      // YYYY-MM-DD
  heure: string;     // HH:mm:ss
  statut: 'present' | 'absent' | 'retard';
  type?: 'ENTREE' | 'SORTIE';
}

// ── Horaires par cycle ───────────────────────────────────
export interface CycleSchedule {
  cycle: Cycle;
  heureLimite: string; // HH:mm (ex: "07:30")
}

// ── Annonces école ──────────────────────────────────────
export type AnnouncementImportance = 'info' | 'important' | 'urgent';
export type AnnouncementTarget = 'all' | string; // 'all' ou nom de classe

export interface Announcement {
  id: string;
  titre: string;
  message: string;
  date: string;          // YYYY-MM-DD
  cible: AnnouncementTarget;
  importance: AnnouncementImportance;
  createdBy: string;     // nom de l'utilisateur
  createdAt: string;     // ISO string
}

export interface AnnouncementRead {
  announcementId: string;
  parentId: string;
  readAt: string;        // ISO string
  remindAt?: string;     // ISO string — si "rappeler dans 24h"
}

// ── Logs d'activité ──────────────────────────────────────
export interface ActivityLog {
  id: string;
  utilisateur: string;
  utilisateurRole: string;
  action: 'connexion' | 'paiement' | 'modification_eleve' | 'generation_recu' | 'presence' | 'import' | 'export' | 'suppression' | 'gestion_enseignant' | 'autre';
  description: string;
  dateHeure: string;  // ISO string
  metadata?: Record<string, any>;
}

// ── Vérification de reçu ─────────────────────────────────
export interface ReceiptVerification {
  code: string;       // REC-ANNEE-NUMERO
  studentId: string;
  eleveNom: string;
  elevePrenom: string;
  eleveClasse: string;
  montant: number;
  date: string;
  tranche: string;
  statut: 'authentique' | 'invalide';
}

export type AppPage =
  | 'dashboard'
  | 'eleves'
  | 'paiements'
  | 'analyses'
  | 'documents'
  | 'parametres'
  | 'recouvrement'
  | 'discipline'
  | 'scan_presence'
  | 'scan_sortie'
  | 'scan_information'
  | 'carte_scolaire'
  | 'verification_recu'
  | 'historique_activites'
  | 'annonces'
  | 'gestion_academique'
  | 'saisie_notes'
  | 'bulletins'
  | 'parent_dashboard'
  | 'parent_historique'
  | 'parent_recus'
  | 'parent_badges'
  | 'parent_messages'
  | 'parent_notes'
  | 'parents_list'
  | 'import_export'
  | 'chat'
  | 'gestion_personnel'
  | 'enseignants'
  | 'espace_pedagogique'
  // ── Pages Portail Enseignant ──
  | 'teacher_dashboard'
  | 'teacher_classes'
  | 'teacher_notes'
  | 'teacher_presence'
  // ── Pages SuperAdmin (propriétaire SaaS) ──
  | 'superadmin_dashboard'
  | 'superadmin_schools'
  | 'superadmin_billing'
  | 'pre_inscriptions';

export interface PreInscription {
  id: string;
  school_slug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data: {
    nom: string;
    prenom: string;
    matriculeNational?: string;
    sexe: 'M' | 'F';
    dateNaissance: string;
    cycle: Cycle;
    classe: string;
    parentNom: string;
    parentTelephone: string;
    parentEmail: string;
    photoUrl?: string;
  };
  created_at: string;
}

// ── Enseignants (Professeurs) ────────────────────────────
export interface Teacher {
  id: string;
  ide: string;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  dateNaissance: string;
  telephone: string;
  adresse: string;
  titre: string; // ex: 'M.', 'Mme', 'Dr', 'Prof'
  departement: string;
  statut: 'Actif' | 'Inactif';
  dateEmbauche: string;
  tauxHoraire: number;
  quotaHoraire: number;
  rib: string;
  banque: string;
  createdAt?: string;
  updatedAt?: string;
}

// Les types de cycles existants
export const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée'];

// ── MODULE 2 : ACADÉMIQUE & NOTES ─────────────────────────

export type MatiereCategorie = '1-MATIERES LITTERAIRES' | '2-MATIERES SCIENTIFIQUES' | '3-AUTRES MATIERES';
export type PeriodeType = 'TRIMESTRE 1' | 'TRIMESTRE 2' | 'TRIMESTRE 3' | 'SEMESTRE 1' | 'SEMESTRE 2';

export interface Matiere {
  id: string;
  nom: string;
  categorie: MatiereCategorie;
}

export interface ClasseMatiere {
  id: string;
  classe: string; // ex: '3ème A'
  matiereId: string;
  professeur: string;
  coefficient: number;
}

export interface Note {
  id: string;
  eleveId: string;
  matiereId: string;
  periode: PeriodeType;
  noteInt1: number | null; // Interrogation 1
  noteInt2: number | null; // Interrogation 2
  noteInt3: number | null; // Interrogation 3
  noteDev1: number | null; // Devoir 1
  noteDev2: number | null; // Devoir 2
}

// ── MODULE 3 : ESPACE PÉDAGOGIQUE (BIBLIOTHÈQUE) ────────────────
export type TypeRessource = 'Cours' | 'Epreuve' | 'Livre' | 'TD_TP';

export interface RessourcePedagogique {
  id: string;
  titre: string;
  type: TypeRessource;
  anneeAcademique: string;
  cycle: Cycle | 'Tous';
  classe: string | 'Toutes';
  matiere: string | 'Toutes';
  description?: string;
  fichierUrl: string; // Lien vers le fichier stocké
  fichierNom: string;
  fichierTaille?: number; // en octets
  auteurId: string;
  auteurNom: string;
  dateAjout: string; // ISO string
}

// ── MODULE 4 : EMPLOI DU TEMPS & SÉANCES RÉCURRENTES ───────────
export type SeanceType = 'Cours' | 'TD' | 'Examen' | 'TP';
export type SeanceStatut = 'Planifiée' | 'Effectuée' | 'Suspendue' | 'Annulée';
export type RecurrenceFrequence = 'Quotidienne' | 'Hebdomadaire' | 'Mensuelle' | 'Personnalisée';

export interface CreneauHoraire {
  id: string;
  jour: string; // ex: 'Lundi', 'Mardi', etc.
  heureDebut: string; // ex: '08:00'
  heureFin: string; // ex: '10:00'
  salle: string; // ex: 'Salle 12'
}

export interface Seance {
  id: string;
  anneeAcademique: string;
  sousSysteme?: string;
  classe: string;
  matiereId?: string;
  matiereNom: string;
  enseignant: string;
  salle: string;
  type: SeanceType;
  statut: SeanceStatut;
  date: string; // YYYY-MM-DD
  heureDebut: string; // HH:mm
  heureFin: string; // HH:mm
  jour: string; // ex: 'Lundi'
  creneauId?: string;
  isRecurrent?: boolean;
  frequence?: RecurrenceFrequence;
  createdAt?: string;
}


