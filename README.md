# Eco-Presents – NDI 2025 / Numih France

Eco-Presents est notre réponse au défi « RSE by design » de la **NDI 2025** organisé avec **Numih France**, premier acteur public français spécialisé dans la transformation numérique des établissements de santé. L’objectif: démontrer qu’une plateforme de recommandations peut être éthique par conception, transparente sur l’impact et co-construite avec ses utilisateurs.

## Contexte du défi

- **Thème**: RSE, développement – « Après le privacy by design et le security by design, que serait le RSE by design ? »
- **Attendus**: dépôt Git public, plateforme accessible en ligne, livrables illustrant la démarche responsable.
- **Dotations**: 1er 1000 €, 2ème 700 €, 3ème 300 € en bons cadeaux.
- **Plateforme en production**: [www.eco-presents.com](https://www.eco-presents.com) – hébergée via Vercel + Neon et ouverte pour l’évaluation.

## RSE by design, concrètement

- **Sobriété numérique**: moteur de recommandation 100 % déterministe (filtres, scoring et reranking), aucune dépendance à un LLM externe pour réduire coûts, latence et empreinte carbone.
- **Transparence des critères**: chaque produit affiche ses labels, matériaux, origine, score éco et raison de la recommandation.
- **Curation responsable**: catalogue issu d’entreprises françaises ou européennes engagées (labels ADEME, EU Ecolabel, B-Corp, circuits courts). Aucune donnée n’est scrapée sans licence compatible.
- **Gouvernance & sécurité**: authentification stricte pour l’espace admin, chiffrement des secrets, hébergement HDS-ready (Vercel + Neon) permettant un relais futur avec les datacenters souverains de Numih France.
- **Participation utilisateur**: les visiteurs peuvent filtrer par budget, destinataire, intention responsable et alimentent la roadmap via leurs retours.

## Fonctionnalités clés

- Page publique FR-only avec narration pédagogique sur la consommation responsable.
- Formulaire d’intentions cadeaux → moteur `/api/recommend` qui mixe règles métiers, similarité et score éco.
- Tableau de bord admin (`/admin`) pour importer/éditer produits (via CSV ou interface) avec attributs RSE détaillés.
- Emails transactionnels via Nodemailer/SMTP (désactivable hors prod) pour les confirmations d’accès admin.
- Scripts d’analyse (`scripts/*.js|ts`) pour vérifier doublons, compter produits, comparer CSV vs base.
- Prisma + Postgres/SQLite pour tracer les évolutions et auditer la donnée produit.

## Architecture & stack

- **Frontend**: Next.js 15 (App Router, React 19, Tailwind CSS 4, framer-motion) avec middleware d’authentification.
- **Backend**: API routes Next.js, Prisma ORM, Postgres Neon (prod) ou SQLite (dev) et scripts Node pour l’ingestion.
- **Auth & sécurité**: bcrypt pour le hash des mots de passe, JWT pour les sessions côté API, cookies HTTPOnly via middleware.
- **Dev tooling**: TypeScript 5, ESLint 9, Turbopack, scripts Prisma.

## Sources de données & conformité

- Pipeline manuel depuis annuaires publics (ADEME, EU Ecolabel, B Lab, SIRENE) et partenariats boutiques responsables.
- Attribution systématique: chaque produit conserve URL source et label d’origine.
- Politique « no greenwashing »: aucune assertion n’est inventée; les champs reflètent uniquement les preuves disponibles.
- Respect RGPD: aucune donnée personnelle sensible, traces anonymisées et rotation de secrets via `.env`/Vercel.

## Accès en ligne

- **Production**: [www.eco-presents.com](https://www.eco-presents.com)
- **Observation**: version identique à la branche `main`. Les reviewers peuvent naviguer librement, consulter les API publiques et demander un accès admin sur simple email.

## Installation locale

```bash
git clone https://github.com/hugoretail/Your-Eco-Presents.git
cd Your-Eco-Presents/web
copy .env.example .env   # sous Windows (cmd)
# ou: cp .env.example .env
```

1. Éditer `.env` :
   - `DATABASE_URL` (ex. `file:./dev.db` ou URL Neon)
   - `SHADOW_DATABASE_URL` (requis si Postgres + migrations)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (comptes back-office)
   - `SESSION_SECRET` (32+ caractères aléatoires)
   - Optionnel: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_FROM_NAME`
2. Installer les dépendances : `npm install`
3. Synchroniser la base : `npx prisma migrate dev` (ou `npm run prisma:migrate`)
4. (Optionnel) peupler des exemples : `npm run db:seed` ou `npm run db:import:csv`
5. Lancer le serveur : `npm run dev`
6. Ouvrir [http://localhost:3000](http://localhost:3000). L’espace admin est accessible via l’email/mot de passe configurés.

## Scripts utiles (`web/package.json`)

- `npm run dev` : Next.js + Turbopack
- `npm run build` / `npm run start` : build et serveur de prod local
- `npm run lint` : ESLint 9
- `npm run prisma:generate` / `npm run prisma:migrate` / `npm run db:seed`
- `npm run db:import:csv[:ts]` : ingérer un catalogue CSV
- `npm run db:sync` : migrations + import + comptage
- `npm run email:test` : vérifier la configuration SMTP
- `npm run build:vercel` : commande utilisée sur Vercel (Prisma generate + migrate deploy + build)

## Déploiement (Vercel + Neon)

- Root directory: `web/`
- Install command: `npm ci`
- Build command: `npm run build:vercel`
- Runtime: Node.js 22.x
- Variables à définir sur Vercel (Prod & Preview):
  - `DATABASE_URL`, `SHADOW_DATABASE_URL`
  - `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - Secrets SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_FROM_NAME`)
  - Toute clé additionnelle (ex: `JWT_SECRET` si l’on externalise les tokens)
- DNS: `www.eco-presents.com` (CNAME vers `cname.vercel-dns.com`) + apex redirigé vers Vercel.

## Roadmap orientée NDI 2025

- [x] Mettre en ligne la plateforme et ouvrir le code source.
- [x] Implémenter un moteur de recommandation sobre et auditable.
- [ ] Étendre le catalogue à 300+ produits certifiés Nouvelle-Aquitaine.
- [ ] Ajouter un score climat contextuel (ADEME Base Carbone) + justification utilisateur.
- [ ] Publier des dashboards d’impact (usage, labels les plus consultés, retours utilisateurs) pour les jurés.
- [ ] Explorer une déclinaison santé/sociale en lien avec les établissements partenaires de Numih France.

## En savoir plus

- Numih France : [https://numihfrance.fr](https://numihfrance.fr)
- Page carrière Numih France : [https://careers.werecruit.io/fr/numih-france](https://careers.werecruit.io/fr/numih-france)
- Contact projet : `hello@eco-presents.com`

Les sources sont disponibles dans ce dépôt Git et la plateforme en ligne reflète la dernière version de `main`, satisfaisant ainsi les livrables demandés par le défi « RSE by design ».
