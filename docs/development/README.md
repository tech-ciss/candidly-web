# Conventions de développement

Lire [AGENTS.md](../../AGENTS.md) avant toute modification : ce fichier conserve
les règles permanentes du projet.

## Nommage

Le code est écrit en TypeScript strict avec des identifiants anglais :
`camelCase` pour variables et fonctions, `PascalCase` pour classes, interfaces
et composants React, `UPPER_SNAKE_CASE` pour constantes globales et valeurs
d'énumération. Utiliser `kebab-case` pour les fichiers lorsque les conventions
du framework le permettent. Les messages utilisateur sont initialement en français.
Les fichiers utilisent UTF-8, LF et deux espaces d'indentation.

## Tickets et branches

Traiter un ticket à la fois : lire son périmètre, examiner l'existant, présenter
un bref plan, implémenter uniquement les changements nécessaires, vérifier puis
soumettre à validation. Préserver les modifications existantes. Ne pas commencer
le ticket suivant avant validation.

`main` doit rester stable. Créer les branches de travail depuis `main` :

- `feature/CAND-XXX-description` pour les évolutions.
- `fix/CAND-XXX-description` pour les corrections.

Les deux dépôts ont des historiques indépendants. Un ticket transversal doit
identifier les changements et revues nécessaires dans chacun.

## Commits

Utiliser Conventional Commits, avec des messages explicites :

```text
feat: add application management
fix: prevent unauthorized document access
docs: initialize project documentation
chore: configure repository
test: add ownership validation tests
```

## Revue et validation

Présenter une demande de revue liée au ticket : problème traité, changements,
commandes réellement exécutées et résultats, impacts de sécurité, décisions et
limitations. Le reviewer vérifie le périmètre, les conventions, la documentation,
l'absence de secrets et, lorsque pertinent, les autorisations et l'isolation
des données. Corriger les observations avant intégration à `main`.

Pour CAND-001, contrôler les fichiers attendus, les règles d'exclusion, la cohérence
des configurations, puis exécuter `git status` et `git diff --check` dans chaque
dépôt. Les nouveaux fichiers non suivis doivent aussi être inspectés :
`git diff --check` seul ne les vérifie pas.

Les scripts de validation existent depuis CAND-004. Exécuter les commandes
ci-dessous et rapporter uniquement leurs résultats réels. Les tests métier,
d'autorisation et d'isolation seront ajoutés avec les fonctionnalités concernées.

## Configuration et sécurité

Node.js 24 LTS est la ligne commune déclarée dans `.nvmrc`. Avec nvm disponible,
`nvm install` puis `nvm use` sélectionnent la dernière version corrective 24.x.
Vérifier les versions exactes des frameworks et leur compatibilité lors de leur
installation dans les tickets suivants.

`.env.example` contient uniquement des exemples locaux. Les fichiers `.env` et
leurs variantes sont ignorés ; ne jamais y substituer des secrets dans le fichier
exemple. Les variables publiques du frontend sont visibles dans le navigateur.
Les variables d'authentification, stockage et intégrations seront définies dans
leurs tickets respectifs.

Aucun distant, protection GitHub ou pipeline n'est configuré par CAND-001.
Leur mise en place sera traitée séparément ; tout push exige une autorisation
explicite. Ne pas déployer ni exécuter de migration en production sans autorisation.

## Application locale — CAND-004

Node.js 24 LTS et npm sont requis. `npm ci` installe les versions verrouillées.
Copier `.env.example` vers `.env.local` sans écraser l'existant puis lancer
`npm run dev`. Le serveur écoute sur localhost:3000. Le dashboard est public et
fictif ; il n'a pas besoin du backend pour s'afficher. Aucune authentification
n'est simulée. La protection sera ajoutée au ticket frontend correspondant.

| Script         | Rôle                                    |
| -------------- | --------------------------------------- |
| `dev`          | serveur Next.js avec rechargement local |
| `build`        | compilation de production               |
| `start`        | serveur après compilation               |
| `lint`         | ESLint et règles Next/React/TypeScript  |
| `typecheck`    | TypeScript strict, sans émission        |
| `test`         | Vitest, Testing Library et DOM simulé   |
| `format`       | appliquer Prettier                      |
| `format:check` | vérifier le formatage                   |

Le typecheck peut s'exécuter avant le premier build. Les types de routes générés
sont découverts après démarrage/build. Inter et les icônes sont servies localement.
`NEXT_PUBLIC_API_URL` n'est jamais un secret et doit être définie avant compilation
pour les futurs appels API. Les pages de démonstration ne font aucune requête métier.

## Tests et revue visuelle

Les tests couvrent l'accueil, le dashboard, la recherche dans les exemples,
les états d'interface, les navigations, les boutons, la configuration API,
les erreurs réseau/HTTP/JSON, le manifest et le noindex du dashboard.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

Vérifier au navigateur les routes `/` et `/dashboard` aux largeurs 375, 768 et
1280 px : aucun débordement horizontal, navigation mobile utilisable, focus
visible, recherche et états d'interface fonctionnels, absence d'erreur console
critique. La démonstration ne sauvegarde aucune donnée.

Le manifest et les icônes constituent la fondation PWA, sans service worker.
Ne pas promettre de disponibilité hors ligne ou d'installation universelle avant
vérification sur appareil. L'URL Open Graph localhost devra être adaptée avant
un futur déploiement. CAND-004 n'ajoutait pas de pipeline ; CAND-005 ajoute la CI sans déploiement.

## Particularités des outils installés

Next.js 16.4.4 ajoute par défaut un bloc de règles dans `AGENTS.md` au lancement.
`agentRules: false` désactive cette écriture ; le fichier de référence est conservé
strictement à l'identique. Ne pas réactiver cette génération sans décision explicite.

ESLint 9.39.5 est conservé car les plugins import, React et accessibilité inclus
dans eslint-config-next 16.4.4 déclarent une compatibilité allant jusqu'à ESLint 9.
Le registre signale cette version ESLint comme non maintenue. La migration vers
ESLint 10 devra accompagner des versions compatibles des plugins, sans forcer
les peer dependencies. Les commandes lint passent dans la configuration retenue.

Voir le [rapport de validation CAND-004](cand-004-validation.md) pour les résultats
réels, les versions et les limites de la fondation PWA.

## Qualité et GitHub Actions — CAND-005

Chaque dépôt possède son workflow indépendant `.github/workflows/ci.yml`.
Il se déclenche sur les pull requests ciblant `main` et les push vers `main`,
avec un runner GitHub hébergé `ubuntu-24.04`, Node.js 24 et cache npm indexé sur
`package-lock.json`. Le cache contient les téléchargements npm, pas une copie
persistante de `node_modules` : `npm ci` reste exécuté à chaque run.
Les anciens runs d'une même branche sont annulés lorsqu'un nouveau run arrive.
Un job est limité à 25 minutes.

Les scripts communs conservent la même signification dans les deux dépôts :

| Script         | Contrôle                             |
| -------------- | ------------------------------------ |
| `lint`         | ESLint, sans correction automatique  |
| `typecheck`    | TypeScript strict, sans émission     |
| `format:check` | Prettier, sans modifier les fichiers |
| `test`         | tests unitaires/techniques du dépôt  |
| `build`        | compilation de production            |

Les frameworks de test existants sont conservés : Vitest pour le frontend et
le runner Node.js pour le backend. Les configurations de lint, formatage et
TypeScript ne sont pas remplacées. `npm ci` doit réussir avec le manifeste et
le lockfile versionnés ; ne pas remplacer cette étape par `npm install` en CI.

### Actions et permissions

- [actions/checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) : `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- [actions/setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) : `949feb2413d6458794dcd2491c4babbbce0c15c1`.

Ces releases stables officielles ont été vérifiées et sont épinglées par SHA de
commit immuable. Les commentaires des workflows indiquent la version lisible.
Lors d'une mise à jour, vérifier la release officielle, son runtime et son SHA ;
ne pas remplacer une référence immuable par une branche mobile.
Les actions utilisent Node 24 ; un éventuel runner auto-hébergé devra être
compatible avec leurs prérequis avant toute adaptation du workflow.

Permissions limitées à `contents: read`. Le checkout ne persiste pas ses
identifiants dans la configuration Git. Aucun PAT ni secret GitHub ajouté,
aucun événement `pull_request_target`, aucun accès à une infrastructure de production
et aucune publication ou étape de déploiement.

### Audit des dépendances

Après les contrôles bloquants, `npm audit --omit=dev` examine les dépendances de
production. **Seule cette étape est non bloquante**, avec `continue-on-error`.
En cas d'échec, un avertissement et un message dans le résumé GitHub demandent
une revue des résultats. Aucun lint, test, typecheck, installation ou build
n'est rendu facultatif ; aucun `|| true` n'est utilisé.

Une sortie non nulle peut indiquer des vulnérabilités ou une indisponibilité du
registre : examiner le détail, ne pas conclure automatiquement à une faille
exploitable. L'audit dépend des avis publiés, n'examine pas les dépendances de
développement avec cette option et ne remplace ni revue de code ni tests de
sécurité. Créer un ticket de remédiation selon le risque réel et vérifier les
mises à jour compatibles. Ne jamais lancer `npm audit fix --force` ni effectuer
une mise à jour majeure automatique.

### Pull requests et échecs CI

Créer une branche `feature/CAND-XXX-description` ou `fix/CAND-XXX-description`.
La pull request décrit le problème, le périmètre, les fichiers importants, les
commandes réellement exécutées et leurs résultats, les impacts de sécurité et
les limites. Lier le ticket et demander une revue avant intégration à `main`.
Pour un changement transversal, préparer une revue dans chacun des deux dépôts.
Aucune protection GitHub n'est configurée automatiquement par ce ticket.

En cas d'échec :

1. Identifier la première étape en échec et lire son journal.
2. Reproduire localement avec Node 24 et `npm ci`, puis la même commande et les
   variables de test documentées. Ne pas utiliser de base partagée/production.
3. Corriger la cause : aligner le lockfile si nécessaire sans mise à jour massive,
   traiter le lint/typecheck, appliquer `npm run format` si nécessaire, puis
   corriger les tests ou le build sans masquer leurs erreurs.
4. Pour une intégration en échec, vérifier les healthchecks et la cohérence des
   identifiants de la base de test, des ports et de l'environnement.
5. Rejouer les contrôles concernés, documenter le résultat et soumettre la correction
   à revue. Tout push reste soumis à une autorisation explicite.

Les validations locales et la validation YAML ne prouvent pas qu'un run GitHub
réussit. **Les workflows devront être réellement exécutés sur GitHub après
publication autorisée des dépôts.** Aucun run GitHub n'est déclenché par CAND-005.

### Ordre frontend et reproduction locale

```bash
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run build
npm audit --omit=dev
```

La CI fournit `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api/v1` comme exemple
public et désactive la télémétrie Next. Les pages actuelles ne nécessitent pas
de backend. Aucune base, Redis ou authentification n'est utilisée dans ces tests.
Le runtime local doit être Node 24 (`nvm install` puis `nvm use`).

### Résultat de l'audit local — 3 novembre 2026

`npm audit --omit=dev` s'est terminé avec le code 0 : aucune vulnérabilité connue
remontée pour les dépendances de production verrouillées à cette date. Ce résultat
est un instantané du registre, ne couvre pas les dépendances de développement et
ne constitue pas une garantie d'absence de faille. Aucune correction automatique
ni mise à jour majeure n'a été appliquée.

### Réparation du lockfile frontend

Le premier `npm ci` a révélé des métadonnées manquantes dans les dépendances WASM
optionnelles groupées de Tailwind. Le lockfile a été reconstruit dans une copie
isolée avec un correctif temporaire npm 11.21.1, sans modifier npm global.
Les entrées groupées `@emnapi/core` et `@emnapi/runtime` ont été restaurées et
les indicateurs de peer dependencies recalculés. Aucune version applicative ou
transitive déjà verrouillée n'a été changée. Le workflow conserve `npm ci` normal,
sans `--force` ni `--legacy-peer-deps`.

La chaîne locale CAND-005 réussit sous Node.js 24.22.2 avec npm 11.6.2 habituel :
`npm ci`, lint, typecheck, formatage, 12 tests techniques et build de production.
La syntaxe et les expressions des workflows sont validées avec actionlint 1.7.12.
Il s'agit de validations locales ; aucun run GitHub Actions n'a été exécuté.

- [Validation CAND-016A — compatibilité HTTP et sessions](cand-016a-validation.md).
