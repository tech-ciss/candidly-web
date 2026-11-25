# CAND-016C — Validation de l’intégration CRM

Reprise des contrôles le 25 novembre 2026. Direction : **Le fil professionnel**.
Ce rapport distingue les validations confirmées des incidents rencontrés. Le périmètre est livré et les contrôles techniques ci-dessous sont réussis, avec les limites de rendu Hallmark précisées.

## Périmètre livré

Huit pages privées :

- `/account/companies`, `/account/companies/new`, `/account/companies/[id]`, `/account/companies/[id]/edit`.
- `/account/contacts`, `/account/contacts/new`, `/account/contacts/[id]`, `/account/contacts/[id]/edit`.

Navigation Vue d’ensemble / Entreprises / Contacts / Profil. Le compte, le profil et la démonstration publique sont conservés. Données réelles exclusivement dans le CRM. Pas d’historique, de statistiques ou de prochaine action inventés.

Entreprises : liste paginée, recherche, filtres secteur/pays/ville/statut, tri, création, lecture, PATCH minimal, archivage/restauration, suppression confirmée avec conflit relationnel. Fiche avec les contacts réellement associés et leur pagination.

Contacts : liste paginée, recherche et filtres entreprise/fonction/service, tri, création, lecture, modification et suppression confirmée. Sélecteur d’entreprise avec recherche, pagination et états actif/archivé. Une entreprise proposée par URL est vérifiée par l’API.

La [matrice complète des contrats et l’architecture](../architecture/crm-frontend.md) détaille les 13 combinaisons méthode/route utilisées, les DTO, réponses, erreurs et choix de cache.

## Session et sécurité

Le seul changement du gestionnaire CAND-016B est l’extension de l’union TypeScript des chemins acceptés par `request`. Comportements conservés : access token en mémoire, refresh HttpOnly, single-flight, GET rejoué une fois après renouvellement autorisé, mutations dispatchées jamais rejouées automatiquement, CSRF et cookies existants.

Cache CRM par identité, mémoire uniquement, déduplication des lectures en cours, AbortController, révisions de lecture et époque de session. Logout, erreur de session et changement de compte purgent les réponses et brouillons. Réponses tardives ignorées. Aucun propriétaire transmis. Aucun appel PostgreSQL depuis le frontend applicatif.

Les erreurs 400, 401, 403, 404, 409, 429, serveur et réseau ont des messages contrôlés. Une mutation sans réponse confirmée invite à vérifier le dossier avant de recommencer.

## Tests frontend

Commande `npm run test` : **77 réussis, 0 échoué, 2 ignorés**, 9 fichiers réussis, 2 ignorés. Les deux tests réels sont conditionnés à leurs variables de harnais et se lancent séparément.

Les 26 tests CRM couvrent les contrats, normalisations et limites, champs facultatifs effacés, PATCH minimal, liste/recherche/pagination, création/modification, conflits, confirmation, sélection d’entreprise, contacts, navigation, cache, concurrence, réponse tardive, logout, changement de compte, renouvellement GET et non-rejeu de mutation. Les tests de composants utilisent StrictMode et le véritable éditeur de page pour la régression de redirection.

`npm run lint` et `npm run typecheck` : réussis lors de la reprise. Les journaux locaux sont conservés sous `.hallmark/cand016c/` (ignoré par Git).

## Inspection navigateur et Hallmark

Hallmark v2.0.0 explicitement utilisé, scope **app**, direction verrouillée du projet. Tokens existants, Inter, navy et pétrole sur fond grège. Aucun framework ni bibliothèque ajouté.

Lors de l’implémentation précédente : six gabarits (listes, formulaires, fiches des deux modules) capturés et mesurés à **320, 375, 768, 1024, 1280 et 1440 px**, soit 36 contrôles. Aucun élément de `main` au-delà du bord droit ; scrollWidth respectivement 305, 360, 753, 1009, 1265 et 1425 px, inférieur à innerWidth. Les captures temporaires de cette exécution ont disparu avant la reprise ; ces observations restent celles de la session précédente, pas de nouvelles captures du 25 novembre.

Parcours navigateur confirmés : connexion A, création entreprise puis fiche avec « Dossier créé », création contact associé puis fiche, modification et « Modifications enregistrées », recherche donnant zéro résultat, confirmation en ligne puis annulation. Focus d’erreur sur `crm-name`, association `crm-name-error`, outline 3 px. Confirmation : focus initial Annuler ; Shift+Tab vers Confirmer avec focus-visible et anneau 3 px. Texte long de dossier lisible sur mobile ; le nom sélectionné est également affiché intégralement au-dessus du select natif.

Contrastes calculés sur les tokens : navy/blanc **14,69:1**, pétrole/blanc **6,30:1**, texte secondaire/blanc **6,21:1**, bordure de champ/blanc **3,71:1**, focus/blanc **6,32:1**, statut actif sur sa surface **5,40:1**. Statuts exprimés par du texte. Aucun mouvement décoratif ajouté ; règles reduced-motion existantes conservées.

Le précédent passage sloplint a donné **0 FAIL, 0 REFLEX, 0 WARN**, après ajout des états actifs et de text-wrap. Le moteur de capture Hallmark n’était pas disponible (`puppeteer-core` absent) : inspection navigateur utilisée en complément, sans prétendre à une exécution du rendu automatisé. La revue est effectuée dans ce chat, sans sous-agent.

## Incidents rencontrés

- Invalidation trop précoce après mutation : démontage du formulaire avant son callback de navigation. Corrigé en déclenchant le callback confirmé avant invalidation, avec test de régression de page réelle.
- Abonnement du cache pendant le montage strict React : installé en layout effect avant les effets de chargement des enfants ; tests StrictMode réussis.
- Serveur utilisateur déjà actif : conservé. Les contrôles navigateur précédents utilisaient une copie temporaire identique avec son propre répertoire Next.
- Premier build Turbopack en sandbox : refus de bind local dans le worker CSS. Le cache d’échec généré avait été isolé avant une reconstruction hors sandbox.
- Le CLI Next.js 16.4.4 affiche un avertissement de sécurité et peut arrêter la première invocation après compilation (`SecurityFatalError`). Les relances identiques réussies sont distinguées des échecs. Aucune mise à jour de dépendance entreprise dans ce ticket.
- Exécution simultanée des tests réels : retours 400 de consommation de token ; essais suivants : rate limiting 429 partagé par le harnais. Les tests existants n’ont pas été affaiblis. Les reprises utilisent une instance propre de harnais par scénario. Le cas 400 a ensuite été confirmé : le transport de fixture écrit l’email avant le commit PostgreSQL. Le même token B a été accepté plus tard en HTTP 200. Le nouveau test CRM attend cette disponibilité avec au plus 30 tentatives espacées de 100 ms, uniquement sur 400 ; tout autre statut échoue immédiatement. Le succès HTTP 200 reste exigé. Aucun changement du test CAND-016B ni de la politique de rejeu applicative.
- Arrêt du harnais existant : son nettoyage de User seul ne suffit pas aux relations CRM RESTRICT. Nettoyage ciblé Contact, Company, puis User nécessaire. Aucun changement backend pour contourner ces contraintes.
- Le nettoyage précédent avait été bloqué avant exécution par une panne de revue automatique d’autorisation liée à une limite d’usage. À la reprise, nettoyage confirmé : 7 comptes, 6 entreprises, 3 contacts supprimés dans `candidly_test`, aucun compte du préfixe restant. Aucune purge globale.

## Limites

La validation serveur reste l’autorité pour les formats complexes d’email et URL, les relations et l’ownership. Les messages de validation serveur sont volontairement contrôlés et ne ventilent pas les erreurs internes brutes dans les champs. Les dates des fiches utilisent le fuseau du navigateur. Les modifications faites dans un autre onglet nécessitent une actualisation. Le cache ne persiste jamais au logout ou au rechargement. Pas de promesse de mode hors ligne.

## Fichiers du ticket

Créés :

- `src/features/companies/{api.ts,types.ts,validation.ts,components/list.tsx,components/form.tsx,components/detail.tsx,components/picker.tsx}`.
- `src/features/contacts/{api.ts,types.ts,validation.ts,components/list.tsx,components/form.tsx,components/detail.tsx}`.
- `src/features/crm/{contracts.ts,validation.ts,store.ts,provider.tsx,shared.tsx,form.tsx,account-shell.tsx}`.
- Huit `page.tsx` sous les routes privées Entreprises et Contacts listées ci-dessus.
- `src/styles/crm.css`, `test/crm.test.tsx`, `test/crm-live.test.ts`.
- `docs/architecture/crm-frontend.md`, ce rapport.

Modifiés dans ce ticket : `src/features/auth/session.ts`, `src/features/auth/account.tsx`, `src/app/(private)/account/layout.tsx`, `src/components/layout/active-link.tsx`, `src/styles/globals.css` (import CRM), `docs/architecture/README.md`, `docs/development/README.md`.

Les autres modifications présentes avant ce ticket (CAND-016UI et CAND-016UI-F notamment) sont conservées. Le lien actif existait déjà comme fichier non suivi ; il a été étendu aux sous-routes CRM.

Backend : aucun fichier source ou contrat modifié, aucune migration. Harnais existant réutilisé sans modification de sa logique de production. Aucun commit, push, déploiement ou commencement de CAND-016D.

## Commandes et résultats de la reprise

Node **v24.22.3**, npm du projet, branche `main`. Commandes depuis `candidly-web`, après chargement de nvm et `nvm use 24`.

| Commande                             | Résultat                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `npm run lint`                       | code 0, aucune erreur ni avertissement                                                                      |
| `npm run typecheck`                  | code 0, aucune erreur TypeScript                                                                            |
| `npm run format:check`               | code 0, `All matched files use Prettier code style!`                                                        |
| `npm run test`                       | code 0, 77 réussis / 0 échoué / 2 ignorés ; 9 fichiers réussis / 2 ignorés                                  |
| `npm run build`                      | première invocation code 1 (`SecurityFatalError` du rappel CLI après compilation), relance identique code 0 |
| `npm run build -- --webpack`         | code 0 dès la première invocation de la reprise                                                             |
| `git diff --check` dans chaque dépôt | code 0, aucune sortie                                                                                       |

Les deux builds produisent les huit routes CRM, dont les quatre routes dynamiques de fiche/édition. Le premier arrêt Turbopack est conservé comme incident, pas présenté comme un succès. La relance aboutit à la génération et à l’optimisation des routes.

Commande Hallmark réellement exécutée :

```bash
node .agents/skills/hallmark/scripts/sloplint.mjs \
  src/features/crm src/features/companies src/features/contacts src/styles/crm.css \
  --genre modern-minimal --scope app --render \
  --url http://127.0.0.1:13017/account/companies
```

Résultat code 0 : `sloplint: clean. 0 FAIL, 0 REFLEX, 0 WARN across 12 file(s) and 1 URL(s).` Rendu non exécuté : `no puppeteer-core found locally, globally or via HALLMARK_PUPPETEER`. Le comptage du script est son périmètre de fichiers reconnus ; il ne constitue pas un audit exhaustif de tout le dépôt.

## Intégration réelle PostgreSQL / Redis

Infrastructure exclusivement dédiée : projet Compose `candidly-cand016b-check`, PostgreSQL `127.0.0.1:55447`, base `candidly_test`, Redis `127.0.0.1:56394`. Les conteneurs `candidly-local` et leurs données de développement n’ont pas servi aux tests et n’ont pas été modifiés. Pas de migration supplémentaire.

Harnais existant `.test-dist/test/support/web-auth-server.js`, port 13018, démarré via `node /tmp/cand016c/start-api.mjs` depuis `candidly-api`. Ce wrapper temporaire configure l’environnement de test, génère sa clé JWT en mémoire et transmet les signaux d’arrêt. Identifiants fictifs uniquement, emails capturés localement sous `/tmp/cand016b-cand016c`. Aucune clé réelle ni aucun token dans le rapport.

Scénario CAND-016B, instance propre, commande :

```bash
CAND016B_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-cand016c \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-cand016c \
npx vitest run test/auth-live.test.ts
```

**Code 0 : 1 test réussi, 0 échoué**, durée 2,66 s. Inscription, vérification, session, profil, reset, révocation et rotation concurrente. Avant la confirmation d’état prêt du serveur, un essai avait échoué en erreur réseau ; ce journal est conservé séparément. Le scénario confirmé est exécuté après HTTP 200 du healthcheck.

Scénario CRM, autre instance propre, commande :

```bash
CAND016C_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-cand016c \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-cand016c \
npx vitest run test/crm-live.test.ts
```

**Code 0 : 1 test réussi, 0 échoué**, durée 2,04 s. Deux comptes A et B inscrits et vérifiés. Création entreprise/contact A, fiches, recherche et pagination, modifications, refus 409 de suppression relationnelle, archivage et restauration, renouvellement de session, déconnexion. B ne voit aucune donnée A ; accès direct, mutations et rattachement étrangers refusés 404. Reconnexion A : ville et notes persistées. Suppressions 204 d’un contact et d’une entreprise temporaires sans relation, puis lecture 404.

Ce test a d’abord échoué sur la visibilité de l’email avant commit ; le résultat final ci-dessus suit la correction bornée du helper de test décrite dans les incidents. Les deux réussites réelles s’ajoutent aux 77 tests frontend : **79 tests réussis au total sur ces trois exécutions**, et non 79 dans le seul `npm run test` sans variables.

### Nettoyage et état des services

Nettoyage transactionnel limité aux identifiants des comptes dont l’email commence par `cand016b-cand016c-` et finit par `@example.com`, avec garde `current_database() = 'candidly_test'`. Ordre : Contact, Company, User. Les audits de sécurité sont conservés selon les contraintes existantes, sans purge.

- Nettoyage de reprise : 7 comptes, 6 entreprises, 3 contacts ; 0 compte restant.
- Nettoyage après les nouveaux essais et le succès final : 4 comptes, 2 entreprises, 2 contacts ; 0 compte restant.
- Harnais API créé par cette reprise arrêté ; emails temporaires supprimés par son arrêt. Aucun serveur utilisateur arrêté.
- Les conteneurs de test, déjà actifs au début de la reprise, restent disponibles ; leurs volumes ne sont pas supprimés.

## État Git final

Aucun commit, push ou déploiement par cet agent. Les modifications préexistantes sont conservées. `candidly-api` : branche `main`, HEAD `0f19111`, arbre propre. `candidly-web` : branche `main`, HEAD `5b0233b`, travail non committé ci-dessous. Les journaux `.hallmark/cand016c/` sont ignorés et ne modifient pas cet état.

```text
 M .gitignore
 M .prettierignore
 M README.md
 M docs/architecture/README.md
 M docs/development/README.md
 M eslint.config.mjs
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
