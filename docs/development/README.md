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
un futur déploiement. Aucun pipeline ou déploiement n'est ajouté ici.

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
