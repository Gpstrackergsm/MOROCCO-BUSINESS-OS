'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Receipt,
  BookOpen,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Boxes,
  TrendingUp,
  LogOut,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Edit2,
  Languages
} from 'lucide-react';
import { calculateWAC } from '../lib/validators';

export interface CompanyProfile {
  name: string;
  legalForm: string;
  ice?: string;
  city?: string;
  phone?: string;
}

export interface UserAccount {
  email: string;
  password: string;
  fullName: string;
  role: string;
  company: CompanyProfile;
}

export interface ProductItem {
  id: string;
  sku: string;
  nameAr: string;
  category: string;
  onHand: number;
  reserved: number;
  wac: number;
  sellingPrice: number;
  tvaRate: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerIce: string;
  date: string;
  subtotalHt: number;
  tvaAmount: number;
  totalTtc: number;
  lines: { productName: string; quantity: number; unitPrice: number; total: number }[];
}

export interface JournalEntryItem {
  id: string;
  number: string;
  date: string;
  journal: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
}

const STORAGE_ACCOUNTS = 'morocco_os_accounts_v2';
const STORAGE_CURRENT_USER = 'morocco_os_current_user_v2';
const STORAGE_DATA_PREFIX = 'morocco_os_data_';
const STORAGE_LANG = 'morocco_os_lang';

const DEFAULT_SYSTEM_ACCOUNTS: UserAccount[] = [
  {
    email: 'ltdukone@gmail.com',
    password: '33103310Mm@@',
    fullName: 'Test Administrator',
    role: 'SUPER_ADMIN',
    company: {
      name: 'SAUNERAS SARL',
      legalForm: 'SARL',
      ice: '003154879000045',
      city: 'Casablanca',
      phone: '0522001122',
    },
  },
];

type Language = 'fr' | 'ar';

const DEFAULT_CATEGORIES: Record<Language, string[]> = {
  fr: [
    'Général',
    'Plomberie & Sanitaire',
    'Pompes & Piscines',
    'Énergie Solaire',
    'Matériel Électrique',
  ],
  ar: [
    'عام',
    'السباكة والتجهيزات الصحية',
    'المضخات والمسابح',
    'الطاقة الشمسية',
    'المعدات الكهربائية',
  ],
};

const DICT = {
  fr: {
    appTitle: "Sauneras",
    appSubtitle: "Système de Gestion Commerciale pour Entreprises Marocaines",
    createAccountTab: "Créer un compte",
    loginTab: "Connexion",
    companyNameLabel: "Raison Sociale de l'entreprise *",
    companyNamePlaceholder: "Ex: ATLAS COMMERCE SARL",
    adminFullNameLabel: "Nom complet du gérant *",
    adminFullNamePlaceholder: "Nom et Prénom",
    emailLabel: "Adresse e-mail professionnelle *",
    emailPlaceholder: "contact@entreprise.ma",
    passwordLabel: "Mot de passe *",
    passwordPlaceholder: "Mot de passe sécurisé (min. 6 caractères)",
    cityLabel: "Ville du siège",
    cityPlaceholder: "Marrakech, Casablanca...",
    phoneLabel: "Numéro de téléphone",
    phonePlaceholder: "0524000000",
    iceLabel: "Numéro ICE marocain",
    icePlaceholder: "15 chiffres",
    submitRegister: "Créer le compte entreprise & Démarrer",
    submitLogin: "Accéder à l'espace de travail",
    loginEmailLabel: "Adresse e-mail *",
    loginPasswordLabel: "Mot de passe *",
    passwordNotice: "* Vérification stricte du mot de passe enregistré.",

    activeBadge: "Compte Sécurisé",
    headquarters: "Siège Principal",
    editCompanyTitle: "Modifier la Raison Sociale",
    saveName: "Enregistrer",
    cancel: "Annuler",
    logout: "Déconnexion",

    tabDashboard: "Tableau de Bord",
    tabInventory: "Stock & Articles",
    tabSales: "Ventes & Facturation",
    tabAccounting: "Comptabilité PCGE",

    kpiSalesHt: "Chiffre d'Affaires HT",
    kpiInvoicesCount: "factures validées",
    kpiStockVal: "Valeur du Stock",
    kpiPumpDesc: "Coût Moyen Unitaire Pondéré (CMUP)",
    kpiCatalogCount: "Articles au Catalogue",
    kpiInWarehouse: "en stock",
    kpiAccountingEntries: "Écritures Comptables",
    kpiPcgeBalanced: "Équilibrées (Débit = Crédit)",
    currency: "DH",

    welcomeTitle: "Bienvenue dans l'espace de gestion de",
    welcomeDesc: "Votre espace entreprise est opérationnel et sécurisé. Aucun produit fictif. Commencez par ajouter vos articles au catalogue ou créer votre première facture.",
    addFirstProductBtn: "+ Ajouter un premier article au catalogue",

    searchProduct: "Rechercher par article ou référence...",
    addProductBtn: "+ Nouvel Article",
    stockMovementBtn: "Mouvement de Stock",
    noProductsYet: "Aucun article dans le catalogue",
    noProductsDesc: "Le stock est actuellement vide. Cliquez sur '+ Nouvel Article' pour ajouter vos premières références.",
    tableDesignation: "Article & Désignation",
    tableCategory: "Catégorie",
    tableSku: "Référence",
    tableOnHand: "Stock Réel",
    tableReserved: "Réservé",
    tableAvailable: "Disponible",
    tableCostWac: "Coût d'achat (CMUP)",
    tableSellingPrice: "Prix Vente HT",

    modalAddProductTitle: "Ajouter un article au catalogue",
    productNameLabel: "Désignation de l'article *",
    productNamePlaceholder: "Ex: Robinet mitigeur chromé, Pompe immergée 2CV...",
    productSkuLabel: "Référence interne *",
    productCategoryLabel: "Catégorie *",
    addNewCategory: "+ Nouvelle catégorie",
    initialQtyLabel: "Quantité initiale",
    costPriceLabel: "Prix d'achat unitaire HT (DH)",
    sellingPriceLabel: "Prix de vente unitaire HT (DH) *",
    saveProductBtn: "Enregistrer l'article",

    modalMovementTitle: "Enregistrer un mouvement de stock",
    selectProduct: "Sélectionner l'article *",
    movementType: "Type de mouvement *",
    typeIn: "Entrée en stock",
    typeOut: "Sortie de stock",
    quantity: "Quantité *",
    purchaseCost: "Coût unitaire d'achat (DH)",
    confirmMovement: "Valider le mouvement",

    salesTitle: "Historique des Factures de Vente",
    salesSubtitle: "Facturation séquentielle conforme au Code Général des Impôts (CGI)",
    newInvoiceBtn: "+ Nouvelle Facture",
    noInvoicesYet: "Aucune facture enregistrée pour le moment",
    noInvoicesDesc: "Créez votre première facture de vente avec calcul automatique de la TVA (20%) et mise à jour du stock.",
    invTableNumber: "N° Facture",
    invTableCustomer: "Client",
    invTableIce: "ICE Client",
    invTableDate: "Date",
    invTableSubtotal: "Total HT",
    invTableTva: "TVA 20%",
    invTableTotalTtc: "Total TTC",
    invTableActions: "Actions",
    printInvoice: "Aperçu & Impression",

    modalNewInvoiceTitle: "Créer une Facture de Vente",
    customerNameLabel: "Nom du Client ou Entreprise *",
    customerIceLabel: "Numéro ICE du Client (15 chiffres) *",
    selectProductLabel: "Article vendu *",
    invoiceQtyLabel: "Quantité vendue *",
    totalHtLabel: "Montant Net Hors Taxes :",
    tvaLabel: "TVA (20%) :",
    totalTtcLabel: "Net à Payer (TTC) :",
    saveInvoiceBtn: "Valider la facture & Déduire le stock",

    previewFactureTitle: "FACTURE DE VENTE",
    clientInfoTitle: "INFORMATIONS DU CLIENT",
    previewInvoiceDate: "Date d'émission :",
    tableColDesignation: "Désignation",
    tableColQty: "Quantité",
    tableColUnitPrice: "Prix Unitaire HT",
    tableColTotalHt: "Total HT",
    legalFooterNotice: "Facture établie conformément aux dispositions du Code Général des Impôts marocain.",
    printBtn: "Imprimer la facture",
    closeBtn: "Fermer",

    accountingTitle: "Journal des Ventes (PCGE)",
    accountingSubtitle: "Génération automatique d'écritures en partie double équilibrées",
    balancedBadge: "Équilibré : Total Débit = Total Crédit",
    journalEmpty: "Le journal comptable est vide",
    journalEmptyDesc: "Les écritures se génèrent automatiquement à chaque validation de facture de vente.",
    journalEntryNum: "N° Pièce",
    journalDate: "Date",
    journalCode: "Journal",
    journalAccount: "Compte PCGE",
    journalLibelle: "Libellé de l'opération",
    journalDebit: "Débit",
    journalCredit: "Crédit",

    stockNegativeError: "Quantité insuffisante ! Disponible à la vente : ",
    iceError15: "Erreur légale : Le numéro ICE doit comporter exactement 15 chiffres.",
    reqClientFields: "Veuillez renseigner le nom du client et son numéro ICE.",
    reqLoginFields: "Veuillez renseigner votre email et mot de passe.",
    accountNotFound: "Compte introuvable. Veuillez vérifier l'adresse email.",
    wrongPassword: "Mot de passe incorrect.",
    loginSuccess: "Connexion réussie !",
    accountCreatedSuccess: "Compte entreprise créé avec succès !",
  },
  ar: {
    appTitle: "Sauneras",
    appSubtitle: "نظام تشغيل وإدارة الأعمال السحابي للشركات المغربية",
    createAccountTab: "إنشاء حساب جديد",
    loginTab: "تسجيل الدخول",
    companyNameLabel: "اسم الشركة أو النشاط التجاري *",
    companyNamePlaceholder: "مثال: اسم الشركة أو المؤسسة التجارية",
    adminFullNameLabel: "الاسم الكامل للمسؤول *",
    adminFullNamePlaceholder: "الاسم العائلي والشخصي",
    emailLabel: "البريد الإلكتروني المهني *",
    emailPlaceholder: "contact@entreprise.ma",
    passwordLabel: "كلمة المرور *",
    passwordPlaceholder: "أدخل كلمة مرور قوية (6 أحرف فأكثر)",
    cityLabel: "المدينة",
    cityPlaceholder: "مراكش، الدار البيضاء، الرباط...",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "0524000000",
    iceLabel: "رقم التعريف الموحد للمقاولة (ICE)",
    icePlaceholder: "15 رقماً إن توفر",
    submitRegister: "تأسيس حساب الشركة وبدء العمل الفعلي",
    submitLogin: "دخول إلى مساحة العمل",
    loginEmailLabel: "البريد الإلكتروني المسجل *",
    loginPasswordLabel: "كلمة المرور *",
    passwordNotice: "* يتم التحقق الدقيق من مطابقة كلمة المرور المسجلة عند إنشاء الحساب.",

    activeBadge: "حساب نشط ومؤمّن",
    headquarters: "المقر الرئيسي",
    editCompanyTitle: "تعديل اسم الشركة",
    saveName: "حفظ الاسم",
    cancel: "إلغاء",
    logout: "خروج",

    tabDashboard: "لوحة القيادة والمؤشرات",
    tabInventory: "المخزون والمنتجات",
    tabSales: "المبيعات والفواتير",
    tabAccounting: "المحاسبة المغربية العامة",

    kpiSalesHt: "إجمالي المبيعات الصافية",
    kpiInvoicesCount: "فواتير مسجلة",
    kpiStockVal: "قيمة المخزون الإجمالية",
    kpiPumpDesc: "متوسط التكلفة المرجح",
    kpiCatalogCount: "أصناف الكتالوج",
    kpiInWarehouse: "في المستودع",
    kpiAccountingEntries: "القيود المحاسبية",
    kpiPcgeBalanced: "متوازنة وفق المخطط المحاسبي المغربي",
    currency: "د.م",

    welcomeTitle: "مرحباً بك في مساحة عمل شركة",
    welcomeDesc: "حساب شركتك جاهز ونظيف وخالٍ من أي بيانات وهمية. ابدأ الآن بإضافة أول صنف إلى كتالوجك للبدء في إدارة مبيعاتك ومخزونك.",
    addFirstProductBtn: "+ إضافة أول صنف إلى الكتالوج",

    searchProduct: "بحث في المنتجات بالاسم أو الرمز المرجعي...",
    addProductBtn: "إضافة منتج للكتالوج",
    stockMovementBtn: "حركة مخزون",
    noProductsYet: "لا توجد منتجات مسجلة حتى الآن",
    noProductsDesc: "المستودع فارغ حالياً. اضغط على زر 'إضافة منتج للكتالوج' لإدخال أول صنف تبدأ في بيعه أو شرائه.",
    tableDesignation: "المنتج والمواصفات",
    tableCategory: "القسم",
    tableSku: "الرمز المرجعي",
    tableOnHand: "المتوفر الفعلي",
    tableReserved: "المحجوز",
    tableAvailable: "المتاح للبيع",
    tableCostWac: "سعر التكلفة المرجح",
    tableSellingPrice: "سعر البيع الصافي",

    modalAddProductTitle: "إضافة صنف جديد لكتالوج",
    productNameLabel: "اسم المنتج أو السلعة *",
    productNamePlaceholder: "اسم الصنف أو السلعة",
    productSkuLabel: "الرمز المرجعي للصنف *",
    productCategoryLabel: "القسم أو الفئة *",
    addNewCategory: "+ إضافة فئة جديدة",
    initialQtyLabel: "الكمية الأولية",
    costPriceLabel: "سعر الشراء دون ضريبة (د.م)",
    sellingPriceLabel: "سعر البيع دون ضريبة (د.م) *",
    saveProductBtn: "حفظ الصنف في الكتالوج",

    modalMovementTitle: "تسجيل حركة مخزون",
    selectProduct: "اختر الصنف *",
    movementType: "نوع الحركة *",
    typeIn: "وارد / استلام مخزون",
    typeOut: "صادر / استهلاك مخزون",
    quantity: "الكمية *",
    purchaseCost: "سعر الشراء الفعلي (د.م)",
    confirmMovement: "تأكيد الحركة",

    salesTitle: "سجل فواتير مبيعات شركة",
    salesSubtitle: "فواتير مرقمة تسلسلياً مطابقة للمدونة العامة للضرائب",
    newInvoiceBtn: "تحرير فاتورة بيع جديدة",
    noInvoicesYet: "لا توجد فواتير مبيعات حتى الآن",
    noInvoicesDesc: "يمكنك الآن تحرير أول فاتورة بيع لزبون واحتساب الضريبة وخصم المخزون آلياً.",
    invTableNumber: "رقم الفاتورة",
    invTableCustomer: "الزبون أو الشركة",
    invTableIce: "رقم التعريف الموحد (ICE)",
    invTableDate: "التاريخ",
    invTableSubtotal: "المبلغ دون احتساب الضريبة",
    invTableTva: "ضريبة القيمة المضافة 20%",
    invTableTotalTtc: "المبلغ الإجمالي للتأدية",
    invTableActions: "إجراءات",
    printInvoice: "معاينة وطباعة",

    modalNewInvoiceTitle: "تحرير فاتورة مبيعات لشركة",
    customerNameLabel: "اسم الزبون أو الشركة *",
    customerIceLabel: "رقم التعريف الموحد للزبون (15 رقماً) *",
    selectProductLabel: "المنتج *",
    invoiceQtyLabel: "الكمية *",
    totalHtLabel: "المجموع الصافي دون ضريبة:",
    tvaLabel: "الضريبة على القيمة المضافة 20%:",
    totalTtcLabel: "المبلغ الإجمالي للتأدية:",
    saveInvoiceBtn: "اعتماد الفاتورة وخصم المخزون",

    previewFactureTitle: "فاتورة بيع رسمية",
    clientInfoTitle: "معلومات وبيانات الزبون",
    previewInvoiceDate: "تاريخ الإصدار:",
    tableColDesignation: "البيان والسلعة",
    tableColQty: "الكمية",
    tableColUnitPrice: "سعر الوحدة الصافي",
    tableColTotalHt: "المجموع دون ضريبة",
    legalFooterNotice: "وثيقة قانونية رسمية مطابقة لمقتضيات المدونة العامة للضرائب بالمغرب",
    printBtn: "طباعة الفاتورة",
    closeBtn: "إغلاق",

    accountingTitle: "دفتر اليومية للمبيعات والمحاسبة المغربية",
    accountingSubtitle: "توليد آلي مباشر للقيود المحاسبية المتوازنة مع كل عملية بيع أو شراء",
    balancedBadge: "القيود متوازنة: مجموع المدين = مجموع الدائن",
    journalEmpty: "دفتر اليومية فارغ حتى الآن",
    journalEmptyDesc: "بمجرد تحرير أول فاتورة بيع، سيقوم النظام تلقائياً بإنشاء وترحيل القيود المحاسبية بدقة.",
    journalEntryNum: "رقم القيد",
    journalDate: "التاريخ",
    journalCode: "الدفتر",
    journalAccount: "الحساب المحاسبي",
    journalLibelle: "بيان العملية",
    journalDebit: "مدين",
    journalCredit: "دائن",

    stockNegativeError: "كمية غير كافية! المتوفر للبيع: ",
    iceError15: "خطأ قانوني: رقم ICE يجب أن يتكون من 15 رقماً بالضبط.",
    reqClientFields: "يرجى إدخال اسم الزبون ورقم ICE القانوني.",
    reqLoginFields: "يرجى ملء جميع الحقول المطلوبة.",
    accountNotFound: "الحساب غير مسجل. يرجى التأكد من البريد الإلكتروني.",
    wrongPassword: "كلمة المرور غير صحيحة.",
    loginSuccess: "تم تسجيل الدخول بنجاح !",
    accountCreatedSuccess: "تم إنشاء حساب الشركة وبدء مساحة العمل بنجاح !",
  }
};

function SaunerasLogo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const dims = size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-11 w-11 rounded-xl';
  const svgDims = size === 'lg' ? 40 : 28;
  return (
    <div
      className={`inline-flex ${dims} bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#D97706] p-[2px] shadow-xl shadow-emerald-900/20 shrink-0`}
    >
      <div className="h-full w-full rounded-[inherit] bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#115E59] flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-amber-400/25 blur-md" />
        <div className="absolute -bottom-3 -left-3 h-8 w-8 rounded-full bg-emerald-300/20 blur-md" />
        <svg
          width={svgDims}
          height={svgDims}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-sm"
        >
          <defs>
            <linearGradient id="saunerasGold" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="saunerasMint" x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          <path
            d="M24 4L40 13.2V34.8L24 44L8 34.8V13.2L24 4Z"
            stroke="url(#saunerasGold)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.03)"
          />
          <path
            d="M29.5 15.5C29.5 15.5 26.5 13 22.5 13C18.5 13 16 15.2 16 18C16 23.5 32 21.5 32 28.5C32 32.2 28.5 35 23.5 35C19 35 16 32.2 16 32.2"
            stroke="url(#saunerasGold)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M24 9.5L34.5 15.5V32.5L24 38.5L13.5 32.5V15.5L24 9.5Z"
            stroke="url(#saunerasMint)"
            strokeWidth="1.2"
            strokeOpacity="0.55"
            strokeDasharray="3 2"
          />
          <circle cx="24" cy="9" r="2" fill="#FDE68A" />
        </svg>
      </div>
    </div>
  );
}

export default function AuthenticPlatform() {
  const [lang, setLang] = useState<Language>('fr');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regAdminEmail, setRegAdminEmail] = useState('');
  const [regAdminPassword, setRegAdminPassword] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regLegalForm, setRegLegalForm] = useState('SARL');
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regIce, setRegIce] = useState('');

  // App Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'accounting'>('dashboard');

  // Real Business Data for Active User's Company
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryItem[]>([]);

  // Modals & UI States
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockMovement, setShowStockMovement] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editedCompanyName, setEditedCompanyName] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Categories
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES['fr']);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCat, setNewProdCat] = useState('Général');
  const [newProdQty, setNewProdQty] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');

  const [selectedMovementProd, setSelectedMovementProd] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementQty, setMovementQty] = useState('');
  const [movementCost, setMovementCost] = useState('');

  const [invCustomer, setInvCustomer] = useState('');
  const [invCustomerIce, setInvCustomerIce] = useState('');
  const [invSelectedProduct, setInvSelectedProduct] = useState('');
  const [invQuantity, setInvQuantity] = useState('1');

  const t = DICT[lang];
  const isRtl = lang === 'ar';

  // Synchronize document dir and lang with current application language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang, isRtl]);

  const triggerNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_LANG, newLang);
    } catch {}
    // If current selected category is default, update default to match new language
    if (!customCategoryInput) {
      setCategories(DEFAULT_CATEGORIES[newLang]);
      setNewProdCat(DEFAULT_CATEGORIES[newLang][0] || '');
    }
  };

  // Load Session and Language on start
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_LANG) as Language;
      if (savedLang === 'fr' || savedLang === 'ar') {
        setLang(savedLang);
        setCategories(DEFAULT_CATEGORIES[savedLang]);
        setNewProdCat(DEFAULT_CATEGORIES[savedLang][0] || '');
      }

      // Purge deleted system accounts from browser cache
      try {
        localStorage.removeItem(`${STORAGE_DATA_PREFIX}contact@aquared.ma`);
      } catch {}

      let currentAccounts: UserAccount[] = [];
      const storedAccounts = localStorage.getItem(STORAGE_ACCOUNTS);
      if (storedAccounts) {
        try {
          currentAccounts = JSON.parse(storedAccounts);
        } catch {}
      }
      currentAccounts = currentAccounts.filter((a) => a.email.toLowerCase() !== 'contact@aquared.ma');
      DEFAULT_SYSTEM_ACCOUNTS.forEach((def) => {
        const idx = currentAccounts.findIndex((a) => a.email.toLowerCase() === def.email.toLowerCase());
        if (idx === -1) {
          currentAccounts.push(def);
        } else {
          currentAccounts[idx] = def;
        }
      });
      try {
        localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(currentAccounts));
      } catch {}

      const activeSession = localStorage.getItem(STORAGE_CURRENT_USER);
      if (activeSession) {
        try {
          const user: UserAccount = JSON.parse(activeSession);
          if (user.email.toLowerCase() === 'contact@aquared.ma') {
            localStorage.removeItem(STORAGE_CURRENT_USER);
            setCurrentUser(null);
          } else {
            setCurrentUser(user);
            loadUserData(user.email);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  }, []);

  const loadUserData = (email: string) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_DATA_PREFIX}${email}`);
      if (raw) {
        const data = JSON.parse(raw);
        setProducts(data.products || []);
        setInvoices(data.invoices || []);
        setJournalEntries(data.journalEntries || []);
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } else {
        setProducts([]);
        setInvoices([]);
        setJournalEntries([]);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const saveUserData = (
    userEmail: string,
    updatedProducts: ProductItem[],
    updatedInvoices: InvoiceItem[],
    updatedJournals: JournalEntryItem[],
    updatedCategories: string[] = categories
  ) => {
    try {
      localStorage.setItem(
        `${STORAGE_DATA_PREFIX}${userEmail}`,
        JSON.stringify({
          products: updatedProducts,
          invoices: updatedInvoices,
          journalEntries: updatedJournals,
          categories: updatedCategories,
        })
      );
    } catch (err) {
      console.error('Error saving user data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      saveUserData(currentUser.email, products, invoices, journalEntries, categories);
    }
  }, [products, invoices, journalEntries, categories]);

  // Auth: Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regCompanyName.trim() || !regFullName.trim() || !regAdminEmail.trim() || !regAdminPassword.trim()) {
      triggerNotification(t.reqLoginFields, 'error');
      return;
    }

    if (regIce && regIce.trim().length !== 15) {
      triggerNotification(t.iceError15, 'error');
      return;
    }

    const newUser: UserAccount = {
      email: regAdminEmail.trim().toLowerCase(),
      password: regAdminPassword,
      fullName: regFullName.trim(),
      role: 'SUPER_ADMIN',
      company: {
        name: regCompanyName.trim(),
        legalForm: regLegalForm,
        ice: regIce.trim() || undefined,
        city: regCity.trim() || undefined,
        phone: regPhone.trim() || undefined,
      },
    };

    let existingAccounts: UserAccount[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_ACCOUNTS);
      if (stored) existingAccounts = JSON.parse(stored);
    } catch {}

    const index = existingAccounts.findIndex((a) => a.email === newUser.email);
    if (index >= 0) {
      existingAccounts[index] = newUser;
    } else {
      existingAccounts.push(newUser);
    }

    try {
      localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(existingAccounts));
      localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(newUser));
    } catch {}

    setCurrentUser(newUser);
    setProducts([]);
    setInvoices([]);
    setJournalEntries([]);

    triggerNotification(t.accountCreatedSuccess, 'success');
  };

  // Auth: Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      triggerNotification(t.reqLoginFields, 'error');
      return;
    }

    let accounts: UserAccount[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_ACCOUNTS);
      if (stored) accounts = JSON.parse(stored);
    } catch {}

    DEFAULT_SYSTEM_ACCOUNTS.forEach((def) => {
      const idx = accounts.findIndex((a) => a.email.toLowerCase() === def.email.toLowerCase());
      if (idx === -1) {
        accounts.push(def);
      } else {
        accounts[idx] = def;
      }
    });

    accounts = accounts.filter((a) => a.email.toLowerCase() !== 'contact@aquared.ma');

    let found = accounts.find((a) => a.email.trim().toLowerCase() === cleanEmail);
    if (!found) {
      found = DEFAULT_SYSTEM_ACCOUNTS.find((d) => d.email.trim().toLowerCase() === cleanEmail);
    }

    if (!found) {
      triggerNotification(t.accountNotFound, 'error');
      return;
    }

    if (found.password.trim() !== cleanPassword) {
      triggerNotification(t.wrongPassword, 'error');
      return;
    }

    try {
      localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(found));
    } catch {}

    setCurrentUser(found);
    loadUserData(found.email);
    triggerNotification(t.loginSuccess, 'success');
  };

  // Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER);
    } catch {}
    setCurrentUser(null);
    setLoginPassword('');
  };

  // Update Company Name
  const handleSaveCompanyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editedCompanyName.trim()) return;

    const updatedUser: UserAccount = {
      ...currentUser,
      company: {
        ...currentUser.company,
        name: editedCompanyName.trim(),
      },
    };

    let accounts: UserAccount[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_ACCOUNTS);
      if (stored) accounts = JSON.parse(stored);
      const idx = accounts.findIndex((a) => a.email === updatedUser.email);
      if (idx >= 0) accounts[idx] = updatedUser;
      localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(updatedUser));
    } catch {}

    setCurrentUser(updatedUser);
    setShowEditCompany(false);
    triggerNotification(lang === 'fr' ? 'Raison sociale mise à jour !' : 'تم تعديل اسم الشركة بنجاح !', 'success');
  };

  // Add Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSku.trim() || !newProdPrice) return;

    const qty = parseFloat(newProdQty) || 0;
    const cost = parseFloat(newProdCost) || 0;
    const price = parseFloat(newProdPrice);

    const newProduct: ProductItem = {
      id: `prod_${Date.now()}`,
      sku: newProdSku.trim().toUpperCase(),
      nameAr: newProdName.trim(),
      category: newProdCat,
      onHand: qty,
      reserved: 0,
      wac: cost,
      sellingPrice: price,
      tvaRate: 0.20,
    };

    setProducts([newProduct, ...products]);
    setShowAddProduct(false);

    setNewProdName('');
    setNewProdSku('');
    setNewProdQty('');
    setNewProdCost('');
    setNewProdPrice('');

    triggerNotification(
      lang === 'fr' ? `Article "${newProduct.nameAr}" ajouté avec succès au catalogue !` : `تمت إضافة الصنف "${newProduct.nameAr}" بنجاح إلى الكتالوج !`,
      'success'
    );
  };

  // Stock Movement
  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(movementQty);
    if (!selectedMovementProd || !qty || qty <= 0) return;

    const targetIndex = products.findIndex((p) => p.id === selectedMovementProd);
    if (targetIndex === -1) return;

    const target = products[targetIndex]!;

    if (movementType === 'OUT') {
      const available = target.onHand - target.reserved;
      if (qty > available) {
        triggerNotification(`${t.stockNegativeError} ${available}`, 'error');
        return;
      }

      const updated = [...products];
      updated[targetIndex] = { ...target, onHand: target.onHand - qty };
      setProducts(updated);
      triggerNotification(
        lang === 'fr' ? `Sortie de ${qty} unités de "${target.nameAr}" enregistrée.` : `تم صرف ${qty} وحدة من "${target.nameAr}" وتسجيلها في دفتر الحركات.`,
        'success'
      );
    } else {
      const cost = parseFloat(movementCost) || target.wac;
      const newWac = calculateWAC(target.onHand, target.wac, qty, cost);
      const updated = [...products];
      updated[targetIndex] = { ...target, onHand: target.onHand + qty, wac: newWac };
      setProducts(updated);
      triggerNotification(
        lang === 'fr'
          ? `Réception de ${qty} unités. CMUP actualisé : ${newWac.toFixed(2)} DH.`
          : `تم استلام ${qty} وحدة وتحديث رصيد الصنف وتكلفة الشراء إلى ${newWac.toFixed(2)} د.م`,
        'success'
      );
    }

    setShowStockMovement(false);
    setMovementQty('');
    setMovementCost('');
  };

  // Create Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invCustomer.trim() || !invCustomerIce.trim()) {
      triggerNotification(t.reqClientFields, 'error');
      return;
    }

    if (invCustomerIce.trim().length !== 15) {
      triggerNotification(t.iceError15, 'error');
      return;
    }

    const qty = parseFloat(invQuantity);
    const targetIndex = products.findIndex((p) => p.id === invSelectedProduct);
    if (targetIndex === -1) return;

    const target = products[targetIndex]!;
    const available = target.onHand - target.reserved;

    if (qty > available) {
      triggerNotification(`${t.stockNegativeError} ${available}`, 'error');
      return;
    }

    const subtotalHt = qty * target.sellingPrice;
    const tvaAmount = subtotalHt * target.tvaRate;
    const totalTtc = subtotalHt + tvaAmount;
    const nextInvNumber = `FAC-2026-000${invoices.length + 1}`;

    const newInvoice: InvoiceItem = {
      id: `inv_${Date.now()}`,
      invoiceNumber: nextInvNumber,
      customerName: invCustomer.trim(),
      customerIce: invCustomerIce.trim(),
      date: new Date().toISOString().split('T')[0]!,
      subtotalHt,
      tvaAmount,
      totalTtc,
      lines: [
        {
          productName: target.nameAr,
          quantity: qty,
          unitPrice: target.sellingPrice,
          total: subtotalHt,
        },
      ],
    };

    const updatedProducts = [...products];
    updatedProducts[targetIndex] = { ...target, onHand: target.onHand - qty };
    setProducts(updatedProducts);
    setInvoices([newInvoice, ...invoices]);

    const isFr = lang === 'fr';
    const newEntries: JournalEntryItem[] = [
      {
        id: `je_${Date.now()}_1`,
        number: `VE-2026-00${invoices.length + 1}`,
        date: newInvoice.date,
        journal: isFr ? 'Journal des Ventes' : 'دفتر المبيعات',
        account: isFr ? `3421 (Clients - ${invCustomer.trim()})` : `3421 (الزبناء - ${invCustomer.trim()})`,
        description: isFr ? `Facture de Vente ${nextInvNumber}` : `فاتورة بيع ${nextInvNumber}`,
        debit: totalTtc,
        credit: 0,
      },
      {
        id: `je_${Date.now()}_2`,
        number: `VE-2026-00${invoices.length + 1}`,
        date: newInvoice.date,
        journal: isFr ? 'Journal des Ventes' : 'دفتر المبيعات',
        account: isFr ? '7111 (Ventes de marchandises au Maroc)' : '7111 (مبيعات البضائع بالمغرب)',
        description: isFr ? `Chiffre d'Affaires HT ${nextInvNumber}` : `المبيعات الصافية دون ضريبة ${nextInvNumber}`,
        debit: 0,
        credit: subtotalHt,
      },
      {
        id: `je_${Date.now()}_3`,
        number: `VE-2026-00${invoices.length + 1}`,
        date: newInvoice.date,
        journal: isFr ? 'Journal des Ventes' : 'دفتر المبيعات',
        account: isFr ? '4455 (État, TVA facturée à 20%)' : '4455 (الدولة، ضريبة القيمة المضافة المفوتورة 20%)',
        description: isFr ? `TVA 20% Facturée ${nextInvNumber}` : `ضريبة القيمة المضافة 20% ${nextInvNumber}`,
        debit: 0,
        credit: tvaAmount,
      },
    ];
    setJournalEntries([...newEntries, ...journalEntries]);

    setShowNewInvoice(false);
    setInvCustomer('');
    setInvCustomerIce('');
    setInvQuantity('1');

    triggerNotification(
      lang === 'fr'
        ? `Facture ${nextInvNumber} validée, stock déduit et écritures comptables enregistrées !`
        : `تم تحرير الفاتورة ${nextInvNumber} وخصم المخزون وإنشاء القيد المحاسبي المتوازن !`,
      'success'
    );
  };

  const totalStockValuation = products.reduce((acc, p) => acc + p.onHand * p.wac, 0);
  const totalSalesValuation = invoices.reduce((acc, inv) => acc + inv.subtotalHt, 0);

  // =========================================================================
  // VIEW A: NOT LOGGED IN (AUTH)
  // =========================================================================
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-[#FAF6F0] via-[#F4EDE2] to-[#E8F1EC] text-stone-800 flex flex-col justify-center items-center p-4 selection:bg-emerald-600 selection:text-white w-full max-w-full overflow-x-hidden relative ${
          isRtl ? 'font-arabic' : 'font-sans'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Decorative Warm & Emerald Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-600/15 blur-3xl" />

        {notification && (
          <div
            className={`fixed top-4 end-4 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Clean Language Selector */}
        <div className="absolute top-4 end-4 flex items-center bg-white/90 border border-stone-200/90 p-1 rounded-xl shadow-md backdrop-blur-sm z-40">
          <Languages className="h-4 w-4 text-amber-600 ms-2 me-1" />
          <button
            type="button"
            onClick={() => changeLanguage('fr')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'fr'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'ar'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            العربية
          </button>
        </div>

        <div className="max-w-md w-full space-y-6 pt-12 sm:pt-0 my-auto relative z-10">
          <div className="text-center space-y-2.5">
            <SaunerasLogo size="lg" />
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-900 via-teal-800 to-amber-700 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <p className="text-xs text-stone-600 font-medium max-w-sm mx-auto">{t.appSubtitle}</p>
          </div>

          <div className="bg-white/95 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(28,25,23,0.10)] backdrop-blur-md">
            {/* Clean Tabs without repeated translations */}
            <div className="grid grid-cols-2 p-1 bg-[#F5F0E8] rounded-xl mb-6 border border-stone-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthView('LOGIN')}
                className={`py-2 rounded-lg transition ${
                  authView === 'LOGIN'
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t.loginTab}
              </button>
              <button
                type="button"
                onClick={() => setAuthView('REGISTER')}
                className={`py-2 rounded-lg transition ${
                  authView === 'REGISTER'
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t.createAccountTab}
              </button>
            </div>

            {/* TAB: LOGIN */}
            {authView === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">{t.loginEmailLabel}</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute start-3 top-3 text-amber-600" />
                    <input
                      type="email"
                      required
                      placeholder="nom@entreprise.ma"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl py-2.5 ps-9 pe-3 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono text-base sm:text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">{t.loginPasswordLabel}</label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute start-3 top-3 text-amber-600" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl py-2.5 ps-9 pe-3 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono text-base sm:text-xs transition"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1.5">{t.passwordNotice}</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 hover:from-emerald-800 hover:via-teal-700 hover:to-amber-700 text-white font-black rounded-xl shadow-lg shadow-emerald-800/20 transition text-sm flex items-center justify-center gap-2 mt-2"
                >
                  <span>{t.submitLogin}</span>
                  <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </form>
            )}

            {/* TAB: CREATE ACCOUNT */}
            {authView === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pe-1">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">{t.companyNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.companyNamePlaceholder}
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white text-base sm:text-xs transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">{t.adminFullNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.adminFullNamePlaceholder}
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white text-base sm:text-xs transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={regAdminEmail}
                    onChange={(e) => setRegAdminEmail(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono text-base sm:text-xs transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">{t.passwordLabel}</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder={t.passwordPlaceholder}
                    value={regAdminPassword}
                    onChange={(e) => setRegAdminPassword(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono text-base sm:text-xs transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">{t.cityLabel}</label>
                    <input
                      type="text"
                      placeholder={t.cityPlaceholder}
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white text-base sm:text-xs transition"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">{t.phoneLabel}</label>
                    <input
                      type="text"
                      placeholder={t.phonePlaceholder}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono text-base sm:text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">{t.iceLabel}</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder={t.icePlaceholder}
                    value={regIce}
                    onChange={(e) => setRegIce(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-600 focus:bg-white font-mono tracking-widest text-base sm:text-xs transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 hover:from-emerald-800 hover:via-teal-700 hover:to-amber-700 text-white font-black rounded-xl shadow-lg shadow-emerald-800/20 transition text-sm flex items-center justify-center gap-2 pt-3"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t.submitRegister}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED PLATFORM
  // =========================================================================
  return (
    <div
      className={`min-h-screen bg-[#FAF8F5] text-stone-900 pb-20 w-full max-w-full overflow-x-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {notification && (
        <div
          className={`fixed top-4 end-4 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="border-b border-stone-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <SaunerasLogo size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base text-stone-900 truncate max-w-[180px] sm:max-w-none">{currentUser.company.name}</span>
                  <button
                    onClick={() => {
                      setEditedCompanyName(currentUser.company.name);
                      setShowEditCompany(true);
                    }}
                    className="p-1 text-stone-400 hover:text-emerald-700 transition shrink-0"
                    title={t.editCompanyTitle}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t.activeBadge}</span>
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 flex items-center gap-1 font-medium mt-0.5 flex-wrap">
                  <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>{currentUser.company.city ? `${currentUser.company.city} — ` : ''}{t.headquarters}</span>
                  {currentUser.company.ice && (
                    <span className="text-[10px] text-stone-400 font-mono ms-1">ICE: {currentUser.company.ice}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
            {/* Language Selector */}
            <div className="flex items-center bg-[#F5F0E8] p-0.5 sm:p-1 rounded-xl border border-stone-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => changeLanguage('fr')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition flex items-center gap-1 text-xs ${
                  lang === 'fr'
                    ? 'bg-white text-emerald-800 shadow-sm font-black'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>Français</span>
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ar')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition flex items-center gap-1 text-xs ${
                  lang === 'ar'
                    ? 'bg-white text-emerald-800 shadow-sm font-black'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>العربية</span>
              </button>
            </div>

            <div className="hidden lg:flex flex-col text-xs text-end bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-stone-200">
              <span className="font-bold text-stone-800">{currentUser.fullName}</span>
              <span className="text-stone-500 font-mono text-[11px]">{currentUser.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition shrink-0"
              title={t.logout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 rtl:space-x-reverse border-t border-stone-100 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'dashboard', label: t.tabDashboard, icon: TrendingUp },
            { id: 'inventory', label: t.tabInventory, icon: Package },
            { id: 'sales', label: t.tabSales, icon: Receipt },
            { id: 'accounting', label: t.tabAccounting, icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{t.kpiSalesHt}</span>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-slate-900">{totalSalesValuation.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-bold">{t.currency}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                  {invoices.length} {t.kpiInvoicesCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-500 uppercase">{t.kpiStockVal}</span>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-stone-900">{totalStockValuation.toFixed(2)}</span>
                  <span className="text-xs text-stone-500 font-bold">{t.currency}</span>
                </div>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {t.kpiPumpDesc}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-500 uppercase">{t.kpiCatalogCount}</span>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-stone-900">{products.length}</span>
                  <span className="text-xs text-stone-500 font-bold">{lang === 'fr' ? 'articles' : 'صنف'}</span>
                </div>
                <span className="text-[11px] text-stone-400 font-semibold mt-1 block">
                  {t.kpiInWarehouse}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-500 uppercase">{t.kpiAccountingEntries}</span>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-emerald-600">{journalEntries.length}</span>
                  <span className="text-xs text-stone-500 font-bold">{lang === 'fr' ? 'lignes' : 'سطر قيد'}</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  {t.kpiPcgeBalanced}
                </span>
              </div>
            </div>

            {/* Clean Initial State */}
            {products.length === 0 && invoices.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-8 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200/60">
                  <Boxes className="h-8 w-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">
                    {t.welcomeTitle} "{currentUser.company.name}"
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {t.welcomeDesc}
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => { setActiveTab('inventory'); setShowAddProduct(true); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.addFirstProductBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-2">
                <h3 className="font-extrabold text-sm text-stone-800">
                  {lang === 'fr' ? `Activité de l'entreprise ${currentUser.company.name}` : `نشاط شركة ${currentUser.company.name}`}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'fr'
                    ? `${products.length} article(s) enregistré(s) en stock, et ${invoices.length} facture(s) de vente validée(s) et reportée(s) au journal comptable.`
                    : `تم تسجيل ${products.length} صنف في المخزون، و${invoices.length} فواتير بيع معتمدة ومرحلة إلى دفتر اليومية المحاسبي.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY & PRODUCTS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder={t.searchProduct}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full text-xs bg-[#FAF8F5] border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addProductBtn}</span>
                </button>
                {products.length > 0 && (
                  <button
                    onClick={() => { setSelectedMovementProd(products[0]?.id || ''); setShowStockMovement(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F0E8] hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg border border-stone-300 transition"
                  >
                    <Boxes className="h-4 w-4 text-emerald-600" />
                    <span>{t.stockMovementBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
                <Package className="h-10 w-10 text-stone-300 mx-auto" />
                <h4 className="font-bold text-sm text-stone-800">{t.noProductsYet}</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {t.noProductsDesc}
                </p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 text-white text-xs font-bold rounded-lg shadow"
                >
                  {t.addProductBtn}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-3.5 px-4 text-start">{t.tableDesignation}</th>
                        <th className="py-3.5 px-3 text-start">{t.tableCategory}</th>
                        <th className="py-3.5 px-3 text-start">{t.tableSku}</th>
                        <th className="py-3.5 px-3 text-end">{t.tableOnHand}</th>
                        <th className="py-3.5 px-3 text-end">{t.tableReserved}</th>
                        <th className="py-3.5 px-3 text-end">{t.tableAvailable}</th>
                        <th className="py-3.5 px-3 text-end">{t.tableCostWac}</th>
                        <th className="py-3.5 px-4 text-end">{t.tableSellingPrice}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {products
                        .filter((p) => p.nameAr.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-sans font-bold text-slate-900">{p.nameAr}</td>
                            <td className="py-3 px-3 font-sans text-slate-500 text-[11px]">{p.category}</td>
                            <td className="py-3 px-3 text-slate-600 font-bold">{p.sku}</td>
                            <td className="py-3 px-3 text-end font-bold text-slate-900">{p.onHand}</td>
                            <td className="py-3 px-3 text-end font-bold text-amber-600">{p.reserved}</td>
                            <td className="py-3 px-3 text-end font-black text-emerald-700">{p.onHand - p.reserved}</td>
                            <td className="py-3 px-3 text-end text-slate-700 font-semibold">{p.wac.toFixed(2)} {t.currency}</td>
                            <td className="py-3 px-4 text-end text-emerald-800 font-extrabold">{p.sellingPrice.toFixed(2)} {t.currency}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SALES & INVOICES */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  {t.salesTitle} {currentUser.company.name}
                </h3>
                <p className="text-[11px] text-stone-500">{t.salesSubtitle}</p>
              </div>

              {products.length > 0 && (
                <button
                  onClick={() => { setInvSelectedProduct(products[0]?.id || ''); setShowNewInvoice(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.newInvoiceBtn}</span>
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
                <Receipt className="h-10 w-10 text-stone-300 mx-auto" />
                <h4 className="font-bold text-sm text-stone-800">{t.noInvoicesYet}</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {products.length === 0
                    ? (lang === 'fr' ? 'Veuillez d\'abord ajouter des articles au catalogue avant de facturer.' : 'يرجى أولاً إضافة أصناف إلى الكتالوج لتتمكن من إنشاء فواتير البيع.')
                    : t.noInvoicesDesc}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={() => { setInvSelectedProduct(products[0]?.id || ''); setShowNewInvoice(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 text-white text-xs font-bold rounded-lg shadow"
                  >
                    {t.newInvoiceBtn}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[700px] text-xs text-start">
                    <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-700 font-bold">
                      <tr>
                        <th className="py-3 px-4 text-start">{t.invTableNumber}</th>
                        <th className="py-3 px-4 text-start">{t.invTableCustomer}</th>
                        <th className="py-3 px-3 text-start">{t.invTableIce}</th>
                        <th className="py-3 px-3 text-start">{t.invTableDate}</th>
                        <th className="py-3 px-3 text-end">{t.invTableSubtotal}</th>
                        <th className="py-3 px-3 text-end">{t.invTableTva}</th>
                        <th className="py-3 px-3 text-end">{t.invTableTotalTtc}</th>
                        <th className="py-3 px-4 text-center">{t.invTableActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-stone-50 transition">
                          <td className="py-3.5 px-4 font-black text-emerald-800">{inv.invoiceNumber}</td>
                          <td className="py-3.5 px-4 font-sans font-bold text-stone-900">{inv.customerName}</td>
                          <td className="py-3.5 px-3 text-stone-500 text-[11px]">{inv.customerIce}</td>
                          <td className="py-3.5 px-3 text-stone-600">{inv.date}</td>
                          <td className="py-3.5 px-3 text-end text-stone-800 font-semibold">{inv.subtotalHt.toFixed(2)} {t.currency}</td>
                          <td className="py-3.5 px-3 text-end text-stone-600">{inv.tvaAmount.toFixed(2)} {t.currency}</td>
                          <td className="py-3.5 px-3 text-end text-emerald-700 font-black">{inv.totalTtc.toFixed(2)} {t.currency}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              className="px-2.5 py-1 bg-[#F5F0E8] hover:bg-stone-200 text-stone-700 text-[11px] font-bold rounded flex items-center gap-1 mx-auto transition"
                            >
                              <Printer className="h-3 w-3" />
                              <span>{t.printInvoice}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PCGE ACCOUNTING */}
        {activeTab === 'accounting' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">{t.accountingTitle}</h3>
                <p className="text-[11px] text-stone-500">{t.accountingSubtitle}</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                {t.balancedBadge}
              </span>
            </div>

            {journalEntries.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-stone-300 mx-auto" />
                <h4 className="font-bold text-sm text-stone-800">{t.journalEmpty}</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {t.journalEmptyDesc}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[700px] text-xs text-start">
                    <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-700 font-bold">
                      <tr>
                        <th className="py-3 px-4 text-start">{t.journalEntryNum}</th>
                        <th className="py-3 px-3 text-start">{t.journalDate}</th>
                        <th className="py-3 px-3 text-start">{t.journalCode}</th>
                        <th className="py-3 px-4 text-start">{t.journalAccount}</th>
                        <th className="py-3 px-4 text-start">{t.journalLibelle}</th>
                        <th className="py-3 px-4 text-end">{t.journalDebit}</th>
                        <th className="py-3 px-4 text-end">{t.journalCredit}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {journalEntries.map((j) => (
                        <tr key={j.id} className="hover:bg-stone-50 transition">
                          <td className="py-2.5 px-4 font-bold text-stone-800">{j.number}</td>
                          <td className="py-2.5 px-3 text-stone-500">{j.date}</td>
                          <td className="py-2.5 px-3 text-amber-700 font-semibold">{j.journal}</td>
                          <td className="py-2.5 px-4 font-sans font-bold text-stone-900">{j.account}</td>
                          <td className="py-2.5 px-4 font-sans text-stone-600">{j.description}</td>
                          <td className="py-2.5 px-4 text-end text-emerald-700 font-bold">
                            {j.debit > 0 ? `${j.debit.toFixed(2)} ${t.currency}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-end text-amber-700 font-bold">
                            {j.credit > 0 ? `${j.credit.toFixed(2)} ${t.currency}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT COMPANY MODAL */}
      {showEditCompany && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900">{t.editCompanyTitle}</h3>
              <button onClick={() => setShowEditCompany(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCompanyName} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.companyNameLabel}</label>
                <input
                  type="text"
                  required
                  value={editedCompanyName}
                  onChange={(e) => setEditedCompanyName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-bold"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditCompany(false)}
                  className="px-3 py-2 border rounded-lg hover:bg-stone-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-bold rounded-lg shadow"
                >
                  {t.saveName}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PRODUCT */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                {t.modalAddProductTitle} ({currentUser.company.name})
              </h3>
              <button onClick={() => setShowAddProduct(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.productNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.productNamePlaceholder}
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.productSkuLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="ART-001"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-stone-700">{t.productCategoryLabel}</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      {isAddingNewCat ? t.cancel : t.addNewCategory}
                    </button>
                  </div>

                  {isAddingNewCat ? (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder={lang === 'fr' ? 'Nouvelle catégorie...' : 'اسم الفئة الجديدة...'}
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-emerald-600 rounded-lg p-2 outline-none font-bold text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customCategoryInput.trim()) {
                            const trimmed = customCategoryInput.trim();
                            if (!categories.includes(trimmed)) {
                              setCategories([...categories, trimmed]);
                            }
                            setNewProdCat(trimmed);
                            setCustomCategoryInput('');
                            setIsAddingNewCat(false);
                            triggerNotification(
                              lang === 'fr' ? `Catégorie "${trimmed}" ajoutée !` : `تمت إضافة فئة "${trimmed}" بنجاح !`,
                              'success'
                            );
                          }
                        }}
                        className="px-3 py-2 bg-emerald-700 text-white rounded-lg font-bold text-xs hover:bg-emerald-800 whitespace-nowrap shadow"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newProdCat}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingNewCat(true);
                        } else {
                          setNewProdCat(e.target.value);
                        }
                      }}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="text-emerald-700 font-bold">
                        {t.addNewCategory}
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.initialQtyLabel}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newProdQty}
                    onChange={(e) => setNewProdQty(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.costPriceLabel}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.sellingPriceLabel}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-stone-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-bold rounded-lg shadow"
                >
                  {t.saveProductBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK MOVEMENT */}
      {showStockMovement && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900">{t.modalMovementTitle}</h3>
              <button onClick={() => setShowStockMovement(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.selectProduct}</label>
                <select
                  value={selectedMovementProd}
                  onChange={(e) => setSelectedMovementProd(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} ({lang === 'fr' ? 'Disponible :' : 'المتوفر :'} {p.onHand - p.reserved})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.movementType}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('IN')}
                    className={`py-2 text-center rounded-lg font-bold border transition ${
                      movementType === 'IN'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-600'
                    }`}
                  >
                    {t.typeIn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('OUT')}
                    className={`py-2 text-center rounded-lg font-bold border transition ${
                      movementType === 'OUT'
                        ? 'bg-red-50 border-red-600 text-red-700'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-600'
                    }`}
                  >
                    {t.typeOut}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.quantity}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1"
                    value={movementQty}
                    onChange={(e) => setMovementQty(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                {movementType === 'IN' && (
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t.purchaseCost}</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={movementCost}
                      onChange={(e) => setMovementCost(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockMovement(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-stone-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow"
                >
                  {t.confirmMovement}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW INVOICE */}
      {showNewInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900">
                {t.modalNewInvoiceTitle} ({currentUser.company.name})
              </h3>
              <button onClick={() => setShowNewInvoice(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.customerNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'fr' ? 'Ex: Société Travaux Maroc SARL' : 'اسم العميل أو المؤسسة'}
                  value={invCustomer}
                  onChange={(e) => setInvCustomer(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.customerIceLabel}</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="000000000000000"
                  value={invCustomerIce}
                  onChange={(e) => setInvCustomerIce(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.selectProductLabel}</label>
                  <select
                    value={invSelectedProduct}
                    onChange={(e) => setInvSelectedProduct(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} ({p.sellingPrice} {t.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t.invoiceQtyLabel}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              {(() => {
                const prod = products.find((p) => p.id === invSelectedProduct);
                const q = parseFloat(invQuantity) || 0;
                if (!prod) return null;
                const ht = q * prod.sellingPrice;
                const tva = ht * 0.20;
                const ttc = ht + tva;
                return (
                  <div className="bg-[#FAF8F5] p-3 rounded-lg border border-stone-200 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-sans text-stone-500">{t.totalHtLabel}</span>
                      <span className="font-bold">{ht.toFixed(2)} {t.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-stone-500">{t.tvaLabel}</span>
                      <span className="font-bold text-amber-700">{tva.toFixed(2)} {t.currency}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 text-xs">
                      <span className="font-sans font-bold text-stone-800">{t.totalTtcLabel}</span>
                      <span className="font-black text-emerald-700">{ttc.toFixed(2)} {t.currency}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoice(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-stone-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-bold rounded-lg shadow"
                >
                  {t.saveInvoiceBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE INVOICE VIEW */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border text-stone-900 font-sans my-8">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-xl font-black text-emerald-900">{currentUser.company.name}</h1>
                <p className="text-[11px] text-stone-600 mt-1">
                  {currentUser.company.city ? `${currentUser.company.city} — ` : ''}{t.headquarters}
                </p>
                {currentUser.company.ice && (
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                    ICE: {currentUser.company.ice}
                  </p>
                )}
              </div>

              <div className="text-end">
                <span className="bg-amber-100 text-amber-900 font-black px-3 py-1 rounded text-xs block">
                  {t.previewFactureTitle}
                </span>
                <span className="text-xs font-mono font-bold block mt-1">{previewInvoice.invoiceNumber}</span>
                <span className="text-[11px] text-stone-500 block">{t.previewInvoiceDate} {previewInvoice.date}</span>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-lg border border-stone-200 text-xs">
              <span className="font-bold text-stone-500 block text-[10px] uppercase">{t.clientInfoTitle}</span>
              <div className="font-bold text-sm text-stone-800 mt-0.5">{previewInvoice.customerName}</div>
              <div className="text-stone-600 font-mono mt-0.5">ICE: {previewInvoice.customerIce}</div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[450px] text-xs text-start border border-stone-200">
                <thead className="bg-[#F5F0E8] text-stone-800 font-bold border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-start">{t.tableColDesignation}</th>
                    <th className="py-2.5 px-2 text-center">{t.tableColQty}</th>
                    <th className="py-2.5 px-3 text-end">{t.tableColUnitPrice}</th>
                    <th className="py-2.5 px-3 text-end">{t.tableColTotalHt}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {previewInvoice.lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-sans font-medium text-stone-800">{l.productName}</td>
                      <td className="py-2.5 px-2 text-center">{l.quantity}</td>
                      <td className="py-2.5 px-3 text-end">{l.unitPrice.toFixed(2)} {t.currency}</td>
                      <td className="py-2.5 px-3 text-end font-bold">{l.total.toFixed(2)} {t.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end font-mono text-xs">
              <div className="w-72 space-y-1.5 border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">{t.totalHtLabel}</span>
                  <span className="font-bold">{previewInvoice.subtotalHt.toFixed(2)} {t.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">{t.tvaLabel}</span>
                  <span className="font-bold text-amber-700">{previewInvoice.tvaAmount.toFixed(2)} {t.currency}</span>
                </div>
                <div className="flex justify-between border-t border-stone-300 pt-1.5 text-sm font-black">
                  <span className="font-sans text-stone-900">{t.totalTtcLabel}</span>
                  <span className="text-emerald-700">{previewInvoice.totalTtc.toFixed(2)} {t.currency}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-[10px] text-stone-400">{t.legalFooterNotice}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>{t.printBtn}</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-stone-50"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
