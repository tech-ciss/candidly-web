# Candidly web

**Chaque candidature compte.** Candidly est un CRM personnel de carrière pour
organiser les candidatures et entretenir les relations professionnelles.
Ce dépôt est indépendant de `candidly-api`. Lire [AGENTS.md](AGENTS.md) avant
chaque intervention.

## État actuel — CAND-016UI

Next.js App Router, React, TypeScript strict, Tailwind CSS et les primitives
shadcn/ui constituent le socle. L'accueil présente le produit ; `/dashboard`
reste une **démonstration publique**, avec des données entièrement fictives.
L'authentification réelle (inscription, email, login, récupération et sessions)
et le profil/préférences sont disponibles dans `/account`, espace privé séparé.
Aucun module CRM frontend ni abonnement n'est connecté. Les jetons d'accès
restent en mémoire, le refresh en cookie HttpOnly, sans proxy SSR inventé.
Voir [les contrats et l'architecture](docs/architecture/authentication.md) et
[le rapport CAND-016B](docs/development/cand-016b-validation.md).

## Versions vérifiées

| Outil                                  | Version installée |
| -------------------------------------- | ----------------- |
| Node.js utilisé pour les vérifications | 24.22.2           |
| `next`                                 | 16.4.4            |
| `react`                                | 19.3.1            |
| `typescript`                           | 6.0.3             |
| `tailwindcss`                          | 4.3.3             |
| `shadcn`                               | 4.23.0            |
| `vitest`                               | 5.0.5             |
| `eslint`                               | 9.39.5            |

## Installation et lancement

Prérequis : Node.js **24 LTS**, npm et Git. Aucun accès direct à PostgreSQL,
Redis ou Docker n'est nécessaire pour cette démonstration.

```bash
nvm install
nvm use
npm ci
cp -n .env.example .env.local
npm run dev
```

L'application écoute par défaut sur `http://localhost:3000`. Ne pas écraser un
fichier d'environnement existant. La variable publique requise par le client API :

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Elle est intégrée au bundle à la compilation ; ne jamais y placer de secret.
L'accueil et le dashboard ne font aucun appel au backend. Le client HTTP centralisé
est prêt pour les prochains tickets : erreurs normalisées, délai de huit secondes,
cache désactivé et authentification CAND-016B avec access token en mémoire
et cookie de refresh HttpOnly.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
npm run start
```

`npm run format` applique Prettier. `npm run start` nécessite le build préalable.
Les versions exactes sont verrouillées dans `package.json` et `package-lock.json`.

## Architecture et design system

Voir [l'architecture](docs/architecture/README.md) pour l'arborescence,
les responsabilités des composants et le client API.
Le design conserve Inter locale et Navy `#172554`, avec un fond grège
`#F5F6F2`, un accent pétrole `#176B66` et des rôles de feedback distincts.
Les tokens sont centralisés dans `src/styles/tokens.css`. Les primitives Button, Card, Input, Badge, Separator et Skeleton
sont installées localement selon les conventions manuelles shadcn/ui ; aucun
catalogue complet n'est chargé. La navigation utilise des liens et des disclosures
HTML natifs accessibles au clavier.

## PWA et SEO

Le manifest `/manifest.webmanifest`, les métadonnées, les icônes 192/512 px,
une icône maskable et l'icône Apple posent une **fondation PWA**.
Aucun service worker ni cache applicatif n'est enregistré : aucune synchronisation
ou disponibilité hors ligne n'est promise. L'installation réelle sur les appareils
reste à vérifier ; l'application n'est pas annoncée comme entièrement installable.

Le document est en français. Le dashboard déclare `noindex, nofollow` et est exclu
de `robots.txt`. L'Open Graph initial est local (`http://localhost:3000`) ; son URL
de base devra être adaptée lors d'un futur ticket de déploiement.

## Documentation et conventions

- [Développement](docs/development/README.md) : scripts, tests et environnement.
- [Architecture](docs/architecture/README.md) : organisation et frontières.
- [ADR](docs/adr/README.md) : procédure de décisions architecturales.

Conventional Commits, `main` stable, branches `feature/CAND-XXX-description` ou
`fix/CAND-XXX-description`. Aucun push ni déploiement sans autorisation explicite.
Le [rapport CAND-004](docs/development/cand-004-validation.md) contient les vérifications,
l’arborescence et la liste complète des fichiers.

CAND-016UI est soumis à validation ; ne pas commencer CAND-016C automatiquement.

## Identité visuelle — CAND-016UI

La direction validée **Le fil professionnel** conserve Navy et Inter, avec un
fond grège, une sélection pétrole et des couleurs de feedback distinctes.
Voir le [design system](docs/design/design-system.md) et le [rapport de validation](docs/development/cand-016ui-validation.md).
