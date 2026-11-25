# CAND-016SEC — Sécurité des dépendances et builds

Date : 25 novembre 2026. Contrôles terminés ; GO pour poursuivre le développement avec les réserves de dépendances de développement détaillées ci-dessous. Aucun commit autorisé ou créé.

## Protection du travail existant

Lecture d’AGENTS.md, inventaire Git, diff stat et fichiers non suivis effectués avant modification. Le frontend comportait déjà 30 fichiers suivis modifiés et les fichiers non suivis des tickets UI/CRM précédents. Leur état est conservé par empreintes SHA-256 de 133 fichiers versionnés ou candidats au versionnement, stockées localement dans `.hallmark/cand016sec/before-sha256.json`.

`.env`, `.env.*`, node_modules, .next, journaux et .hallmark sont ignorés ; seul `.env.example` est candidat. Scan heuristique des signatures de clés privées, AWS, GitHub et npm : aucune correspondance à haute confiance. Les mots de passe des tests sont fictifs. Ce scan n’est pas une garantie exhaustive d’absence de secret. Aucun contenu d’environnement réel n’a été imprimé ou ajouté au rapport.

Le backend est hors périmètre de modification. Aucun reset, clean, checkout destructif, commit, push ou déploiement.

## Inventaire initial

| Élément                 | Version constatée | Décision                     |
| ----------------------- | ----------------- | ---------------------------- |
| Node.js                 | 24.22.3           | conservé, engines `>=24 <25` |
| npm                     | 11.19.1           | conservé                     |
| Next.js                 | 16.4.4            | correctif ciblé 16.4.5       |
| eslint-config-next      | 16.4.4            | aligné sur 16.4.5            |
| React / React DOM       | 19.3.1 / 19.3.1   | conservés                    |
| Types React / React DOM | 19.3.0 / 19.3.0   | conservés                    |
| TypeScript              | 6.0.3             | conservé                     |
| ESLint                  | 9.39.5            | conservé                     |

`npm ls --depth=0` signalait aussi deux modules optionnels extraneous (`@emnapi/runtime` et `@img/sharp-wasm32`). L’installation reproductible doit remettre l’arbre en cohérence. Next est configuré avec `poweredByHeader: false, agentRules: false`, sans Cache Components, middleware, runtime Edge ni proxy API Next. TypeScript strict et ESLint flat config Next sont conservés.

## Cause confirmée de SecurityFatalError

L’incident a été reproduit avec `npm run build` en 16.4.4 : compilation, typage, génération des pages et affichage des routes aboutissent ; le CLI termine ensuite avec code 1 et `Error [SecurityFatalError]`.

Le code réellement installé apporte l’explication :

- `next/dist/server/config-shared.js` définit la politique par défaut `experimental.agentUpgrade: 'security'`.
- `next/dist/lib/upgrade/prepare-upgrade.js` interroge en POST `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`, avec les versions Next, puis les métadonnées officielles npm pour une cible.
- `next/dist/lib/upgrade/nudge.js`, `nudgeUpgradeForAgent`, crée explicitement une Error nommée `SecurityFatalError`, avec `exitCode: 1`, si un avis affecte la version et qu’un agent est détecté.
- `allowNudgeRetry` écrit un reçu sous `.next/cache/next-agentic-upgrade-retries`, indexé par chemin réel, version, commande et type de rappel. Sa durée est cinq minutes. Une relance consomme ce reçu et poursuit avec avertissement : ce mécanisme explique l’intermittence.
- Une panne de récupération d’avis est traitée séparément par un avertissement de contrôle indisponible ; elle n’est pas la cause du message reproduit.

Le journal complet avant correction et des copies des modules de diagnostic sont conservés dans `.hallmark/cand016sec/`. La trace du CLI masque ses frames (`ignore-listed frames`) ; aucune frame cachée n’est inventée. Le fait que la compilation réussisse n’invalide pas l’alerte : sept avis npm concernent réellement la plage de version installée. Aucune CVE unique n’est arbitrairement attribuée à ce rappel agrégé.

Aucun réglage de sécurité, variable CI/agent ou mécanisme de rappel n’est désactivé pour obtenir un code 0.

## Avis officiels et applicabilité

Sources : [publication Next.js de novembre](https://nextjs.org/blog/november-2026-security-release), [avis Next.js](https://github.com/vercel/next.js/security/advisories), [avis React](https://github.com/react/react/security/advisories?state=published), registre npm via `npm audit` et `npm view`, [release 16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5), [release 16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6).

Les sept avis ci-dessous sont modérés dans les fiches GHSA et npm audit. Le titre de section du billet Next qualifie le premier de High ; le rapport conserve la classification de la fiche détaillée et de l’audit, et signale cette divergence.

Tous concernent la dépendance directe de production Next.js 16.4.4 et sont corrigés en 16.4.5.

| GHSA                                                                                        | Plage affectée de la branche 16 | Risque                                                | Applicabilité observée                                                                       |
| ------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h) | >=16.3.0 <=16.4.4               | fuite cache entre root params avec unstable_cache     | pas de Cache Components, use cache ou unstable_cache                                         |
| [vc7v-qv4w-wrv8](https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8) | >=16.2.0 <=16.4.4               | fuite cache imbriqué et métadonnées différées         | pas de ces caches                                                                            |
| [rhh4-g77r-r9qj](https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj) | >=16.0.0 <=16.4.4               | collision des arguments binaires du cache             | pas de use cache                                                                             |
| [vvgp-ww4w-46vf](https://github.com/vercel/next.js/security/advisories/GHSA-vvgp-ww4w-46vf) | >=16.4.0 <=16.4.4               | empoisonnement de shell fallback partagé              | Cache Components non activé                                                                  |
| [pc58-hwjq-p385](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385) | >=16.0.0 <=16.4.4               | désynchronisation de réponses derrière proxy HTTP/1.1 | aucun Route Handler renvoyant une Response distante inchangée ; fetch applicatif côté client |
| [f3mh-rxg3-f5g2](https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2) | >=16.0.0 <=16.4.4               | exposition de cookie HttpOnly en route Edge           | cookies gérés par NestJS ; pas de NextResponse.cookies en Edge                               |
| [7qx7-33qx-rqx2](https://github.com/vercel/next.js/security/advisories/GHSA-7qx7-33qx-rqx2) | >=16.0.0 <=16.4.4               | contournement du rejet SVG dans l’optimiseur image    | aucun next/image ou source d’image utilisateur dans le code actuel                           |

Cette analyse porte sur le code et la configuration présents ; elle ne garantit pas une future configuration ou un déploiement différent. Le correctif est appliqué même lorsque les préconditions d’exploitation ne sont pas présentes.

Autres vérifications :

- [GHSA-xqc2-xf4c-x3h3](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3), critique, concerne les paquets react-server-dom jusqu’à 19.3.0, corrigés en 19.3.1. Pas d’alerte React correspondante dans l’audit ; ne pas confondre react/react-dom directs avec les bundles RSC maintenus par Next.
- [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j), critique next/og, corrigé en 16.3.6 ; 16.4.4 était déjà hors plage. L’Open Graph du projet est statique, sans entrée utilisateur.
- [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), critique Image Optimization, corrigé en 16.4.1 ; 16.4.4 était déjà hors plage.
- [CVE-2026-118764 / GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), minimatch >=7 <11.0.1, corrigé en 11.0.1, modéré. Dépendance transitive de développement via TypeScript ESLint et shadcn/ts-morph. Le risque est un déni de service à partir de motifs glob malveillants ; aucun motif utilisateur n’est évalué par ce code dans l’application de production.

## Stratégie

Seuls Next.js et sa configuration ESLint passent de 16.4.4 à 16.4.5, avec versions exactes et lockfile conservé. 16.4.6 est disponible, mais 16.4.5 est le premier correctif suffisant pour les sept plages vérifiées. React/React DOM et leurs types sont déjà compatibles avec les peerDependencies publiées. Pas de nouvelle architecture, dépendance canary, fork, audit fix --force ou override.

Les résultats finaux figurent ci-dessous.

## Audit initial et dépendances de développement

`npm audit --json` : code 1, 11 dépendances affectées, toutes modérées (0 haute, 0 critique). Il s’agit de 8 avis distincts : sept Next et un minimatch, propagés aux paquets parents. `npm audit --omit=dev --json` : code 1, Next seul affecté, sévérité modérée. Les JSON complets sont conservés localement.

`npm outdated --json` : code 1, 16 entrées obsolètes (les versions exactes déclarées sont néanmoins respectées). Les versions majeures TypeScript 7, ESLint 10, jsdom 31 et Testing Library Jest DOM 8 ne sont pas adoptées. Pas de mise à jour générale de Tailwind, icônes, formatter ou outils de test.

La résolution ciblée `npm update typescript-eslint --package-lock-only` conserve les plages de dépendances du parent eslint-config-next et porte sa chaîne 8.72.1 à 8.74.0, avec minimatch 11.0.9 dans typescript-estree. Elle n’ajoute aucune dépendance directe ou override. Les changements annexes ignore et semver appartiennent exclusivement à cette sous-arborescence.

La copie minimatch 10.2.6 de shadcn/ts-morph reste distincte. Aucun correctif compatible de ce générateur n’était proposé par npm outdated ; npm audit suggérait un retour majeur à shadcn 1.0.0. Cette proposition automatique n’est pas appliquée. L’outil est une dépendance de développement, absente du runtime applicatif. Son usage sur des motifs ou projets non fiables reste un risque résiduel ; ne pas le présenter comme une dépendance corrigée. Une migration du générateur constitue un travail séparé à faire approuver, sans raison de modifier l’architecture ou les composants actuels pour ce ticket.

## Proposition de sauvegarde Git locale

Aucun fichier n’est stagé et aucun commit n’est créé. Une archive locale ignorée `.hallmark/cand016sec/workspace-backup.tar.gz`, limitée aux fichiers suivis et non ignorés, et un patch binaire `working-tree.patch` protègent le travail. Les copies de package.json et package-lock avant correction et les empreintes initiales sont conservées à côté. Aucun environnement réel, node_modules ou cache Next n’entre dans l’archive.

Après accord explicite du propriétaire, proposition de deux commits locaux, à vérifier par diff avant staging :

1. `feat(web): finalize visual foundation and companies contacts CRM` : modifications préexistantes UI/UI-F/CRM, pages, composants, styles, tests et rapports CAND-016UI/016UI-F/016C. L’inventaire complet des candidats figure dans `backup-files.json` et l’état Git initial. Exclure package.json/package-lock et le rapport SEC de ce premier commit. Les ajouts précédents de l’index documentaire se sélectionnent par hunk.
2. `fix(web): patch Next.js security advisories and stabilize builds` : package.json, package-lock.json, docs/development/cand-016sec-validation.md et le seul ajout SEC à docs/development/README.md.

Ne pas committer `.hallmark`, `.agents`, les environnements, secrets, caches ou fixtures. Aucun push ni déploiement n’est proposé dans cette autorisation de sauvegarde locale.

## Installation reproductible et audits après correction

`npm install` limité aux versions exactes Next/eslint-config-next : code 0. `npm update typescript-eslint --package-lock-only` : code 0. `npm ci` : code 0, 629 paquets installés, 630 audités, sans régénération arbitraire du lockfile. `npm ls --depth=0` après installation : code 0, versions directes conformes et disparition des deux entrées extraneous initiales.

Le lockfile change pour 27 chemins de paquets : Next, @next/env, plugin ESLint et binaires SWC assortis selon les plateformes, chaîne @typescript-eslint 8.74.0, sa copie minimatch 11.0.9 et auxiliaires de cette chaîne. Les valeurs exactes et intégrités sont conservées dans package-lock.json ; aucun override. Les dépendances runtime hors famille Next conservent leurs versions.

| Audit        | Avant                                 | Après                                |
| ------------ | ------------------------------------- | ------------------------------------ |
| complet      | code 1, 11 modérées, 0 haute/critique | code 1, 4 modérées, 0 haute/critique |
| `--omit=dev` | code 1, 1 modérée (Next)              | code 0, 0 vulnérabilité              |

Les quatre entrées restantes sont minimatch 10.2.6, @ts-morph/common 0.27.0, ts-morph 26.0.0 et shadcn 4.23.0 ; elles relèvent toutes du même GHSA-g3hv-75wg-m249 de développement, pas de quatre failles runtime distinctes. Le générateur est conservé, limité aux projets et motifs de confiance. Pas de vulnérabilité haute ou critique connue laissée sans traitement dans cet audit.

`npm ci` émet également un avertissement de dépréciation d’ESLint 9.39.5. La [politique officielle ESLint](https://eslint.org/version-support/) classe la branche 9 EOL depuis le 6 août 2026. Aucune vulnérabilité ESLint directe n’est signalée par l’audit actuel, mais l’absence de futurs correctifs est un risque de maintenance. La migration majeure ESLint 10 n’est pas entreprise sans autorisation distincte. Ce risque n’est pas effacé par le succès du lint.

## Quatre compilations après correction

Chaque ligne correspond à un processus CLI distinct et à son code de sortie réel, sans boucle de retry après erreur. L’installation `npm ci` précède ces quatre exécutions. Aucun nettoyage de cache n’a été nécessaire après correction. Les compilations répétées bénéficient des caches normaux du compilateur ; elles régénèrent leurs routes et ne consomment pas un reçu autorisant une version vulnérable.

| Commande                     | Exécution   | Code | Compilation | Résultat |
| ---------------------------- | ----------- | ---- | ----------- | -------- |
| `npm run build`              | Turbopack 1 | 0    | 11,5 s      | réussie  |
| `npm run build`              | Turbopack 2 | 0    | 590 ms      | réussie  |
| `npm run build -- --webpack` | Webpack 1   | 0    | 23,7 s      | réussie  |
| `npm run build -- --webpack` | Webpack 2   | 0    | 5,7 s       | réussie  |

Les durées indiquées sont celles de la phase « Compiled successfully », pas des durées totales de commande. Chacune termine le typage, la génération de pages et l’optimisation. Les 21 routes listées comprennent les huit pages CRM (quatre dynamiques de fiche/édition), le profil, l’authentification, la landing et la démonstration. Aucun `SecurityFatalError`, avertissement de vulnérabilité Next, ou échec de vérification d’avis dans ces quatre journaux. Les reçus de retry n’ont été ni supprimés pour contourner un contrôle ni falsifiés. Pas de variable CI ou agentUpgrade désactivant la sécurité.

Journaux : `.hallmark/cand016sec/build-{turbo,webpack}-{1,2}.log`, codes dans `build-exits.tsv`. L’échec avant correction reste dans `build-before.log`.

## Tests de non-régression

| Commande            | Résultat                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `npm run lint`      | code 0, aucune erreur                                                                         |
| `npm run typecheck` | code 0, aucune erreur                                                                         |
| `npm run test`      | code 0 ; 77 réussis, 0 échoué, 2 live conditionnels ignorés ; 9 fichiers réussis et 2 ignorés |
| `git diff --check`  | code 0 dans les deux dépôts                                                                   |

Les tests de session, refresh single-flight, GET rejoué une fois, mutations non rejouées, ownership, purge au logout, changement de compte et réponses tardives restent inchangés, de même que les tests de formulaires, listes, recherche, pagination et navigation. Aucun code de sécurité ou contrat API modifié.

### Intégration réelle séparée

Infrastructure dédiée préexistante : PostgreSQL `127.0.0.1:55447`, base `candidly_test`, Redis `127.0.0.1:56394`, projet Compose `candidly-cand016b-check`. Jamais la base de développement `candidly-local`. Compteur de fixtures avant scénario : 0.

Le harnais backend existant est lancé via `node /tmp/cand016c/start-api.mjs`, avec environnement test, port 13018, origines frontend 13017 et clé éphémère générée en mémoire. Aucune modification de source backend. Une instance neuve, avec un namespace de rate limiting distinct, est utilisée pour chaque scénario. Le préfixe `cand016b-cand016c` est conservé parce que le test CRM existant l’exige explicitement.

Commandes, depuis candidly-web après `nvm use 24` :

```bash
CAND016B_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-cand016c \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-cand016c \
npx vitest run test/auth-live.test.ts

CAND016C_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-cand016c \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-cand016c \
npx vitest run test/crm-live.test.ts
```

- Auth isolée : **code 0, 1 test réussi**, durée 3,44 s. Inscription, vérification, connexion, rechargement/renouvellement, profil, reset, révocation et rotation concurrente.
- CRM : **code 0, 1 test réussi**, durée 4,17 s. Deux comptes A/B vérifiés ; CRUD, recherche, pagination, contacts associés, 409 relationnel, archivage/restauration, isolation, refus 404 étrangers, reconnexion et persistance, suppressions permises.
- Total des trois exécutions : **79 tests réussis**, sans attribuer les deux succès live au seul `npm run test` sans environnement.

Incident conservé : le premier essai auth, lancé en parallèle des compilations, échoue en erreur réseau pendant readUser (durée 17,45 s). La charge concomitante est une hypothèse d’environnement, pas une cause démontrée. Le harnais de cet essai a été arrêté et sa fixture nettoyée ; le test inchangé réussit ensuite isolément. Aucun timeout, assertion ou mécanisme applicatif n’a été modifié pour le faire passer. Les journaux de l’essai et du succès sont distincts (`auth-live.log`, `auth-live-isolated.log`).

## Navigateur

Instance réelle du frontend Next.js 16.4.5 démarrée sur un port libre :

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:13018/api/v1 npm run dev -- --port 13017
```

Aucun serveur utilisateur sur les ports concernés n’était actif lors du contrôle initial ; aucun serveur utilisateur arrêté. Parcours confirmés par l’interface : connexion du compte A, navigation Entreprises, création entreprise, fiche avec confirmation, ajout d’un contact à cette entreprise, fiche avec confirmation, rechargement de page, retour compte, déconnexion avec redirection login, reconnexion, ouverture du même contact et de son entreprise persistants.

Contrôle de la fiche Contact :

| Viewport | scrollWidth | Débordements d’éléments de main |
| -------- | ----------- | ------------------------------- |
| 375 px   | 360 px      | aucun                           |
| 1280 px  | 1265 px     | aucun                           |

Captures et mesures conservées dans `.hallmark/cand016sec/browser-375.png`, `browser-1280.png`, `browser-persistence.png` et `browser-measures.json`. Viewport rétabli après contrôle. Le navigateur ne signale aucune erreur JavaScript bloquante ni erreur d’hydratation sur ce parcours (`browser-errors.json` vide). Landing, démonstration et profil également ouverts et confirmés par leurs titres réels ; console error vide.

Un premier sélecteur de contrôle des titres utilisait une option `level` non prise en charge par l’outil navigateur, générant une erreur de sélecteur ; inspection corrigée sur le h1 unique. Cette erreur d’automatisation n’était pas une erreur de l’application.

Nettoyage final transactionnel limité aux comptes fictifs de ce préfixe dans `candidly_test` : **2 contacts, 2 entreprises, 2 comptes supprimés, 0 compte restant**. Audits conservés. Harnais API et frontend de test créés par l’agent arrêtés. Les services et volumes Docker déjà actifs restent en place. Emails et JSON temporaires de fixtures supprimés. Aucun changement backend, schéma, migration, logger, contrat ou règle métier.

## Risques résiduels et décision

**GO pour poursuivre le développement** : runtime corrigé, audit production vierge, quatre builds indépendants réussis, non-régression automatisée et navigateur confirmée. Ce GO ne signifie pas que l’audit complet est à zéro ou qu’un audit d’intrusion a été effectué.

Réserves explicites :

- Une vulnérabilité minimatch modérée reste propagée à quatre dépendances de développement du générateur shadcn. Limiter cet outil aux projets et motifs fiables ; sa migration reste à approuver séparément.
- ESLint 9 est en fin de support ; planifier sa migration majeure distincte, sans l’imposer ici.
- L’audit npm dépend de l’état des avis publiés au moment de l’interrogation ; il n’est pas une preuve d’absence de faille inconnue.
- La stabilité constatée couvre Node 24.22.3 et la plateforme Linux locale, avec réseau npm disponible, pas toutes les plateformes ou pannes de registre.
- Le premier essai auth concomitant a échoué ; le succès isolé n’est pas présenté comme une disparition de tous les risques de latence sous charge.

Aucun changement visuel ou de logique auth/CRM nécessaire. Ne pas commencer les tickets UI-CRM, LOG ou 016D. Aucun commit, push ou déploiement.

## Préservation et état Git final

Contrôle SHA-256 final des 133 fichiers initiaux : aucun supprimé ; seules les empreintes de package.json, package-lock.json et docs/development/README.md changent. Tous les autres fichiers préexistants, dont le code, les styles et les tests UI/CRM/auth, sont identiques. next-env.d.ts, régénéré par les builds/dev, a été rétabli à son état exact initial. Le nouveau rapport SEC est le seul fichier non ignoré ajouté par ce ticket.

Fichiers propres à CAND-016SEC :

- package.json : deux versions directes corrigées.
- package-lock.json : familles Next et TypeScript ESLint ciblées, sans override.
- docs/development/cand-016sec-validation.md : rapport créé.
- docs/development/README.md : lien ajouté.

Archive finale locale ignorée : `.hallmark/cand016sec/workspace-backup-final.tar.gz`. L’intégrité Next du lockfile correspond aux métadonnées officielles npm consultées. Les journaux, audits et captures restent dans ce même dossier ignoré.

`candidly-web` : branche main, HEAD 5b0233b ; `candidly-api` : branche main, HEAD 0f19111, arbre propre. Aucun staging ni commit effectué ; les autres modifications ci-dessous étaient préexistantes.

```text
 M .gitignore
 M .prettierignore
 M README.md
 M docs/architecture/README.md
 M docs/development/README.md
 M eslint.config.mjs
 M next-env.d.ts
 M package-lock.json
 M package.json
 M src/app/(auth)/layout.tsx
 M src/app/(dashboard)/dashboard/page.tsx
 M src/app/(dashboard)/layout.tsx
 M src/app/(private)/account/layout.tsx
 M src/app/(public)/layout.tsx
 M src/app/(public)/page.tsx
 M src/app/not-found.tsx
 M src/components/layout/dashboard-nav.tsx
 M src/components/layout/public-header.tsx
 M src/components/shared/demo-applications.tsx
 M src/components/shared/interface-state.tsx
 M src/components/shared/product-preview.tsx
 M src/components/shared/state-demo.tsx
 M src/components/ui/button.tsx
 M src/components/ui/card.tsx
 M src/components/ui/input.tsx
 M src/components/ui/skeleton.tsx
 M src/features/auth/account.tsx
 M src/features/auth/forms.tsx
 M src/features/auth/private-route.tsx
 M src/features/auth/session.ts
 M src/styles/globals.css
 M test/pages.test.tsx
?? docs/architecture/crm-frontend.md
?? docs/design/
?? docs/development/cand-016c-validation.md
?? docs/development/cand-016sec-validation.md
?? docs/development/cand-016ui-f-validation.md
?? docs/development/cand-016ui-validation.md
?? skills-lock.json
?? src/app/(private)/account/companies/
?? src/app/(private)/account/contacts/
?? src/components/layout/active-link.tsx
?? src/components/ui/feedback.tsx
?? src/components/ui/form-field.tsx
?? src/components/ui/status-badge.tsx
?? src/features/companies/
?? src/features/contacts/
?? src/features/crm/
?? src/styles/crm.css
?? src/styles/tokens.css
?? test/crm-live.test.ts
?? test/crm.test.tsx
?? test/public-header.test.tsx
```
