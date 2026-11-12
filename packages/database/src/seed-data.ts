/**
 * Standard Seed Data for Moroccan Business OS
 * - PCGE (Plan Comptable Général Marocain) Chart of Accounts
 * - Standard Journals (VE, AC, BQ, CA, OD)
 * - Standard System Roles and Permissions
 */

export const STANDARD_PCGE_ACCOUNTS = [
  // Class 1: Financement Permanent
  { accountNumber: '1111', accountClass: 1, nameFr: 'Capital social', nameAr: 'رأس المال الاجتماعي' },
  { accountNumber: '1117', accountClass: 1, nameFr: 'Capital personnel', nameAr: 'رأس المال الفردي' },
  { accountNumber: '1191', accountClass: 1, nameFr: 'Résultat net de l\'exercice (solde créditeur)', nameAr: 'صافي نتيجة السنة المالية (دائن)' },
  { accountNumber: '1481', accountClass: 1, nameFr: 'Emprunts auprès des établissements de crédit', nameAr: 'قروض لدى مؤسسات الائتمان' },

  // Class 2: Actif Immobilisé
  { accountNumber: '2111', accountClass: 2, nameFr: 'Frais de constitution', nameAr: 'مصاريف التأسيس' },
  { accountNumber: '2230', accountClass: 2, nameFr: 'Fonds commercial', nameAr: 'الأصل التجاري' },
  { accountNumber: '2332', accountClass: 2, nameFr: 'Matériel et outillage', nameAr: 'معدات وأدوات' },
  { accountNumber: '2340', accountClass: 2, nameFr: 'Matériel de transport', nameAr: 'معدات النقل' },
  { accountNumber: '2351', accountClass: 2, nameFr: 'Mobilier de bureau', nameAr: 'أثاث المكتب' },
  { accountNumber: '2355', accountClass: 2, nameFr: 'Matériel informatique', nameAr: 'معدات الإعلاميات' },

  // Class 3: Actif Circulant (hors trésorerie)
  { accountNumber: '3111', accountClass: 3, nameFr: 'Marchandises', nameAr: 'بضائع' },
  { accountNumber: '3121', accountClass: 3, nameFr: 'Matières premières', nameAr: 'مواد أولية' },
  { accountNumber: '3421', accountClass: 3, nameFr: 'Clients', nameAr: 'الزبائن' },
  { accountNumber: '3455', accountClass: 3, nameFr: 'État, TVA récupérable sur charges', nameAr: 'الدولة، الضريبة على القيمة المضافة المسترجعة على التكاليف' },
  { accountNumber: '3456', accountClass: 3, nameFr: 'État, TVA récupérable sur immobilisations', nameAr: 'الدولة، الضريبة على القيمة المضافة المسترجعة على الأصول' },

  // Class 4: Passif Circulant (hors trésorerie)
  { accountNumber: '4411', accountClass: 4, nameFr: 'Fournisseurs', nameAr: 'الموردون' },
  { accountNumber: '4441', accountClass: 4, nameFr: 'CNSS', nameAr: 'الصندوق الوطني للضمان الاجتماعي' },
  { accountNumber: '4452', accountClass: 4, nameFr: 'État, impôts et taxes à payer', nameAr: 'الدولة، ضرائب ورسوم واجبة الأداء' },
  { accountNumber: '4455', accountClass: 4, nameFr: 'État, TVA facturée', nameAr: 'الدولة، الضريبة على القيمة المضافة المفوتورة' },

  // Class 5: Trésorerie
  { accountNumber: '5141', accountClass: 5, nameFr: 'Banques (solde débiteur)', nameAr: 'البنوك' },
  { accountNumber: '51611', accountClass: 5, nameFr: 'Caisse centrale', nameAr: 'الصندوق المركزي' },
  { accountNumber: '5111', accountClass: 5, nameFr: 'Chèques à encaisser', nameAr: 'شيكات للتحصيل' },

  // Class 6: Charges
  { accountNumber: '6111', accountClass: 6, nameFr: 'Achats de marchandises', nameAr: 'مشتريات البضائع' },
  { accountNumber: '6121', accountClass: 6, nameFr: 'Achats de matières premières', nameAr: 'مشتريات المواد الأولية' },
  { accountNumber: '6131', accountClass: 6, nameFr: 'Locations et charges locatives', nameAr: 'الكراء والتكاليف الكرائية' },
  { accountNumber: '6142', accountClass: 6, nameFr: 'Transports du personnel', nameAr: 'نقل المستخدمين' },
  { accountNumber: '6171', accountClass: 6, nameFr: 'Rémunérations du personnel', nameAr: 'أجور المستخدمين' },

  // Class 7: Produits
  { accountNumber: '7111', accountClass: 7, nameFr: 'Ventes de marchandises au Maroc', nameAr: 'مبيعات البضائع بالمغرب' },
  { accountNumber: '7113', accountClass: 7, nameFr: 'Ventes de marchandises à l\'étranger (Export)', nameAr: 'مبيعات البضائع بالخارج (تصدير)' },
  { accountNumber: '7121', accountClass: 7, nameFr: 'Ventes de biens produits au Maroc', nameAr: 'مبيعات المنتجات المصنعة بالمغرب' },
  { accountNumber: '7124', accountClass: 7, nameFr: 'Prestations de services au Maroc', nameAr: 'تقديم الخدمات بالمغرب' },
];

export const STANDARD_JOURNALS = [
  { code: 'VE', journalType: 'SALES', nameFr: 'Journal des Ventes', nameAr: 'دفتر المبيعات' },
  { code: 'AC', journalType: 'PURCHASE', nameFr: 'Journal des Achats', nameAr: 'دفتر المشتريات' },
  { code: 'BQ', journalType: 'BANK', nameFr: 'Journal de Banque', nameAr: 'دفتر البنك' },
  { code: 'CA', journalType: 'CASH', nameFr: 'Journal de Caisse', nameAr: 'دفتر الصندوق' },
  { code: 'OD', journalType: 'GENERAL', nameFr: 'Opérations Diverses', nameAr: 'دفتر العمليات المختلفة' },
];

export const SYSTEM_PERMISSIONS = [
  // Products
  { resource: 'products', action: 'view', description: 'View product catalog' },
  { resource: 'products', action: 'create', description: 'Create new products' },
  { resource: 'products', action: 'edit', description: 'Edit existing products' },
  { resource: 'products', action: 'archive', description: 'Archive products' },

  // Inventory & Warehouses
  { resource: 'inventory', action: 'view', description: 'View stock balances and movements' },
  { resource: 'inventory', action: 'create', description: 'Create stock movements' },
  { resource: 'inventory', action: 'reverse', description: 'Reverse stock movements' },
  { resource: 'inventory', action: 'adjust', description: 'Post inventory adjustment' },

  // Sales & Invoicing
  { resource: 'sales', action: 'view', description: 'View quotations and orders' },
  { resource: 'sales', action: 'create', description: 'Create quotations and orders' },
  { resource: 'invoices', action: 'view', description: 'View invoices' },
  { resource: 'invoices', action: 'create', description: 'Create invoices' },
  { resource: 'invoices', action: 'approve', description: 'Approve and post invoices' },

  // Accounting
  { resource: 'accounting', action: 'view', description: 'View general ledger and chart of accounts' },
  { resource: 'accounting', action: 'post', description: 'Post manual journal entries' },
  { resource: 'accounting', action: 'reverse', description: 'Reverse posted journal entries' },
  { resource: 'accounting', action: 'close_period', description: 'Close fiscal periods' },
];
