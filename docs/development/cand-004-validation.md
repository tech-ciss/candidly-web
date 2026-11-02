# CAND-004 — Rapport de validation

Statut : **terminé, prêt pour validation**. Aucun travail CAND-005 commencé.

## Résultat

Socle Next.js App Router, React et TypeScript strict, Tailwind et primitives
shadcn/ui adaptées, design system Candidly, accueil, dashboard de démonstration,
configuration HTTP centralisée, fondation PWA, métadonnées et tests techniques.
Le dashboard est temporairement public, explicitement fictif et non indexable.
Il devra être protégé lors du ticket d'authentification frontend.

## Versions

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

Les versions npm sont exactes dans le manifeste et le lockfile. Le runtime Node
24 utilisé pour les vérifications est temporaire ; le Node global de la machine
n'a pas été modifié. Le projet déclare Node 24 dans `.nvmrc` et `engines`.

## Commandes et résultats réels

| Vérification                                              | Résultat                                          |
| --------------------------------------------------------- | ------------------------------------------------- |
| `npm run lint`                                            | Succès                                            |
| `npm run typecheck`                                       | Succès                                            |
| `npm run test`                                            | 12 tests réussis, 3 fichiers                      |
| `npm run format:check`                                    | Succès                                            |
| `git diff --check`                                        | Succès                                            |
| `npm run build`                                           | Succès, toutes les routes pré-rendues             |
| `npm run dev -- --port 3100`                              | Démarrage et réponses HTTP vérifiés               |
| Validation HTTP des pages, manifest, robots et Open Graph | HTTP 200 et contenu conforme                      |
| Dimensions PNG                                            | 192×192, 512×512, maskable 512×512, Apple 180×180 |

Le build Turbopack est resté bloqué dans le sandbox ; relancé hors sandbox,
il compile en 7,4 secondes puis termine le typecheck et le pré-rendu normalement.
Les coupures réseau npm ont été résolues par reprise depuis le cache avec deux
connexions simultanées. Aucun contournement de peer dependency n'est conservé.

## Vérification navigateur

Navigateur intégré, routes `/` et `/dashboard`, avec captures de contrôle :

| Largeur nominale | Largeur utile / scrollWidth, accueil | Largeur utile / scrollWidth, dashboard |
| ---------------- | ------------------------------------ | -------------------------------------- |
| 375 px           | 360 / 360 px                         | 360 / 360 px                           |
| 768 px           | 753 / 753 px                         | 753 / 753 px                           |
| 1280 px          | 1265 / 1265 px                       | 1265 / 1265 px                         |

La différence de 15 px correspond à la barre de défilement verticale.
Aucun débordement horizontal sur ces six cas. Cartes et listes lisibles ; sidebar
sur desktop, navigation par disclosure sur mobile/tablette. Menus ouverts au
clavier avec Entrée, destinations de navigation vérifiées, focus visible.
Recherche fictive : passage à zéro résultat puis retour à la liste.
États erreur et réussite : bascule et bouton de reprise vérifiés.
Console navigateur : aucune erreur ni alerte observée pendant ces contrôles.
Le dashboard émet bien `noindex, nofollow` dans son HTML.

## PWA et limites

Manifest valide servi par Next.js, scope et start_url `/`, thème Navy, icônes
standard et maskable, métadonnées Apple. Aucun service worker ni synchronisation
hors ligne. Aucun token, donnée privée ou réponse API n'est mis en cache.
La présence du manifest a été vérifiée ; l'installation effective sur appareil
et les critères propres aux différents navigateurs restent à tester.
Ne pas présenter cette fondation comme une PWA intégralement installable.

L'Open Graph utilise une base localhost à adapter avant un futur déploiement.
Le client HTTP est typé à la compilation ; les schémas runtime seront ajoutés
avec les futurs contrats API. Aucune page actuelle n'appelle un endpoint métier.
ESLint 9 est conservé pour les peer dependencies des plugins Next installés ;
le registre le signale comme non maintenu. Voir le guide de développement.

## Sécurité et périmètre

Aucun secret réel ajouté. `.env.example` et `.nvmrc` conservés.
`AGENTS.md` est identique à l'original (SHA-256
`34a3024c20edf441cf315d02ff49d7a534950398eb43fefb767b743876e62709`).
La génération automatique Next de ce fichier est désactivée.
Aucun changement du backend, de Docker ou de PostgreSQL. Aucun déploiement,
push, authentification fictive ou fonctionnalité métier réelle.

## Fichiers modifiés

- `README.md`
- `docs/architecture/README.md`
- `docs/development/README.md`

## Fichiers créés

- `.prettierignore`
- `.prettierrc.json`
- `components.json`
- `docs/development/cand-004-validation.md`
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `public/icons/apple-touch-icon.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-512.png`
- `src/app/(auth)/.gitkeep`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/layout.tsx`
- `src/app/manifest.ts`
- `src/app/not-found.tsx`
- `src/app/opengraph-image.tsx`
- `src/app/robots.ts`
- `src/components/layout/brand.tsx`
- `src/components/layout/dashboard-nav.tsx`
- `src/components/layout/public-header.tsx`
- `src/components/shared/demo-applications.tsx`
- `src/components/shared/demo-data.ts`
- `src/components/shared/interface-state.tsx`
- `src/components/shared/product-preview.tsx`
- `src/components/shared/state-demo.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/skeleton.tsx`
- `src/features/.gitkeep`
- `src/hooks/.gitkeep`
- `src/lib/api/client.ts`
- `src/lib/api/config.ts`
- `src/lib/utils/index.ts`
- `src/lib/validations/.gitkeep`
- `src/styles/globals.css`
- `src/types/api.ts`
- `test/api.test.ts`
- `test/metadata.test.ts`
- `test/pages.test.tsx`
- `test/setup.ts`
- `tsconfig.json`
- `vitest.config.mts`

## Arborescence finale à versionner

Les dépendances, `.next` et fichiers de cache TypeScript sont exclus.

```text
candidly-web/
  .editorconfig
  .env.example
  .gitattributes
  .gitignore
  .nvmrc
  .prettierignore
  .prettierrc.json
  AGENTS.md
  README.md
  components.json
  docs/adr/README.md
  docs/architecture/README.md
  docs/development/README.md
  docs/development/cand-004-validation.md
  eslint.config.mjs
  next-env.d.ts
  next.config.ts
  package-lock.json
  package.json
  postcss.config.mjs
  public/icons/apple-touch-icon.png
  public/icons/icon-192.png
  public/icons/icon-512.png
  public/icons/maskable-512.png
  src/app/(auth)/.gitkeep
  src/app/(dashboard)/dashboard/page.tsx
  src/app/(dashboard)/layout.tsx
  src/app/(public)/layout.tsx
  src/app/(public)/page.tsx
  src/app/layout.tsx
  src/app/manifest.ts
  src/app/not-found.tsx
  src/app/opengraph-image.tsx
  src/app/robots.ts
  src/components/layout/brand.tsx
  src/components/layout/dashboard-nav.tsx
  src/components/layout/public-header.tsx
  src/components/shared/demo-applications.tsx
  src/components/shared/demo-data.ts
  src/components/shared/interface-state.tsx
  src/components/shared/product-preview.tsx
  src/components/shared/state-demo.tsx
  src/components/ui/badge.tsx
  src/components/ui/button.tsx
  src/components/ui/card.tsx
  src/components/ui/input.tsx
  src/components/ui/separator.tsx
  src/components/ui/skeleton.tsx
  src/features/.gitkeep
  src/hooks/.gitkeep
  src/lib/api/client.ts
  src/lib/api/config.ts
  src/lib/utils/index.ts
  src/lib/validations/.gitkeep
  src/styles/globals.css
  src/types/api.ts
  test/api.test.ts
  test/metadata.test.ts
  test/pages.test.tsx
  test/setup.ts
  tsconfig.json
  vitest.config.mts
```
