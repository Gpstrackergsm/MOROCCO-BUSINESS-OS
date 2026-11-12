# 🇲🇦 MOROCCO BUSINESS OS

> **Système d'Exploitation & ERP Cloud Multi-Tenant Conforme aux Normes Fiscales et Comptables Marocaines (CGI, PCGE, Loi 09-08)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal.svg)](https://www.prisma.io/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-purple.svg)](https://railway.app/)

---

## 🌟 Présentation / Overview

**MOROCCO BUSINESS OS** est une plateforme SaaS ERP moderne conçue spécifiquement pour le tissu économique marocain (PME, SARL, distributeurs et négociants). Elle intègre nativement :

- **Conformité Fiscale Marocaine (CGI) :** Validation stricte de l'ICE à 15 chiffres, Identifiant Fiscal (IF), Registre de Commerce (RC) et Taxe Professionnelle (TP).
- **Facturation Légale :** Numérotation séquentielle inviolable, calcul automatique de la TVA marocaine (20%, 14%, 10%, 7%), montants HT et TTC.
- **Gestion de Stock & PUMP/CMUP :** Valorisation des stocks au Coût Moyen Unitaire Pondéré (CMUP / PUMP) après chaque entrée, blocage strict du stock négatif, traçabilité immuable (Append-Only ledger).
- **Comptabilité Marocaine (PCGE) :** Écritures en partie double automatiques (Classes 3, 4 et 7 du Plan Comptable Général Marocain) avec équilibre strict Débit = Crédit.
- **Bilingue Intégral :** Bascule instantanée entre **Français (LTR)** et **العربية (RTL)** avec zéro mélange de langues.

---

## 🏗️ Architecture du Monorepo

```
MOROCCO-BUSINESS-OS/
├── apps/
│   ├── web/          # Frontend Next.js 14 (App Router, Tailwind CSS, Lucide)
│   └── api/          # Backend NestJS (Architecture modulaire, JWT, RBAC)
├── packages/
│   ├── shared/       # Validateurs marocains (ICE, IF, PUMP, Équilibre Débit/Crédit)
│   └── database/     # Schémas Prisma (PostgreSQL / MySQL)
├── docs/             # Documentation complète (PRD, Architecture, Base de données, etc.)
├── railway.json      # Configuration de déploiement Railway
└── Dockerfile        # Image de production multi-stage
```

---

## 🚀 Déploiement sur Railway

### 1. Base de Données (MySQL sur Railway)
1. Dans votre tableau de bord [Railway](https://railway.app), cliquez sur **+ New** > **Database** > **Add MySQL**.
2. Récupérez la variable de connexion fournie automatiquement : `DATABASE_URL` (format `mysql://root:password@mysql.railway.internal:3306/railway`).

### 2. Déploiement de l'Application
1. Cliquez sur **+ New** > **GitHub Repo** et sélectionnez `MOROCCO-BUSINESS-OS`.
2. Définissez les variables d'environnement dans Railway :
   - `DATABASE_URL` : L'URL de votre instance MySQL Railway.
   - `PORT` : `3000` (ou géré par `$PORT`).
   - `NODE_ENV` : `production`.
3. Railway construira et déploiera automatiquement l'application via le fichier `railway.json` ou `Dockerfile`.

---

## 💻 Démarrage Local

```bash
# 1. Cloner le dépôt
git clone https://github.com/Gpstrackergsm/MOROCCO-BUSINESS-OS.git
cd MOROCCO-BUSINESS-OS

# 2. Installer les dépendances
npm install

# 3. Lancer l'interface web
npm run dev --workspace=@morocco-os/web
# Accessible sur http://localhost:3000
```

---

## 📄 Licence
Propriété sous licence d'utilisation professionnelle pour entreprises marocaines.
