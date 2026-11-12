/**
 * Moroccan Business OS - System Constants & Regulatory Baseline
 */

export const BASE_CURRENCY = 'MAD' as const;

export const SUPPORTED_LANGUAGES = ['ar', 'fr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Standard Moroccan VAT Rates (Taxe sur la Valeur Ajoutée - TVA)
 * Defined per the General Tax Code (Code Général des Impôts - CGI)
 */
export const MOROCCAN_TVA_RATES = {
  STANDARD: 0.20,     // 20% - Standard commercial goods and services
  INTERMEDIATE: 0.14, // 14% - Building work, electricity, transport
  REDUCED: 0.10,      // 10% - Tourism, hotels, catering, bank operations
  SUPER_REDUCED: 0.07,// 7%  - Water, pharmaceuticals, school supplies, refined sugar
  EXEMPT_WITH_DEDUCTION: 0.00, // 0%  - Exports (Article 92 CGI)
} as const;

export type MoroccanTvaRate = typeof MOROCCAN_TVA_RATES[keyof typeof MOROCCAN_TVA_RATES];

/**
 * Moroccan Corporate Legal Forms
 */
export const MOROCCAN_LEGAL_FORMS = [
  'SARL',           // Société à Responsabilité Limitée
  'SARL-AU',        // SARL d'Associé Unique
  'SA',             // Société Anonyme
  'SAS',            // Société par Actions Simplifiée
  'SNC',            // Société en Nom Collectif
  'AUTO_ENTREPRENEUR', // Statut Auto-Entrepreneur
  'PERSONNE_PHYSIQUE'  // Entreprise Individuelle
] as const;

export type MoroccanLegalForm = (typeof MOROCCAN_LEGAL_FORMS)[number];

/**
 * PCGE (Plan Comptable Général Marocain) Account Classes
 */
export const PCGE_ACCOUNT_CLASSES = {
  CLASS_1: { id: 1, nameFr: 'Comptes de capitaux permanents', nameAr: 'حسابات التمويل الدائم' },
  CLASS_2: { id: 2, nameFr: 'Comptes d\'actif immobilisé', nameAr: 'حسابات الأصول الثابتة' },
  CLASS_3: { id: 3, nameFr: 'Comptes d\'actif circulant (hors trésorerie)', nameAr: 'حسابات الأصول المتداولة' },
  CLASS_4: { id: 4, nameFr: 'Comptes de passif circulant (hors trésorerie)', nameAr: 'حسابات الخصوم المتداولة' },
  CLASS_5: { id: 5, nameFr: 'Comptes de trésorerie', nameAr: 'حسابات الخزينة' },
  CLASS_6: { id: 6, nameFr: 'Comptes de charges', nameAr: 'حسابات التكاليف' },
  CLASS_7: { id: 7, nameFr: 'Comptes de produits', nameAr: 'حسابات العائدات' },
  CLASS_8: { id: 8, nameFr: 'Comptes de résultats', nameAr: 'حسابات النتائج' },
} as const;
