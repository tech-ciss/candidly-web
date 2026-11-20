# Validation CAND-016B — Authentification réelle

Date : 18 novembre 2026. Web principal ; API : un harnais de test uniquement,
aucun endpoint, guard, cookie, règle CRM ou schéma modifié.

## Réalisation

La [matrice de contrats inspectés](../architecture/authentication.md) documente
les routes réelles, payloads, réponses, auth, cookies/CSRF et erreurs avant
l'implémentation. Pages login/register/verify-email/forgot-password/reset-password,
espace privé account et profil/préférences connecté. Dashboard public toujours
fictif, données et composants de démonstration inchangés.

Gestionnaire unique par navigateur, access token uniquement en mémoire, refresh
HttpOnly, init refresh + me, coordination CAND-016A et opérations de session
sérialisées. Refus définitif distinct des pannes réseau. GET rejoué au plus une
fois après 401, mutation jamais rejouée. Génération de session et version de token
protègent des réponses tardives et des JWT identiques dans la même seconde.
Logout retire immédiatement le privé et révoque ensuite le serveur ; une panne
reste explicitement à confirmer. La limite multi-onglets est documentée.

Les deux jetons d'action arrivent par fragment selon les emails backend, sont
retirés de l'adresse et envoyés exclusivement par POST sur action explicite.
Messages regroupés pour invalide/expiré/consommé et login refusé/non vérifié,
conformément aux réponses indistinguables du backend. Aucun détail inventé.

## Tests locaux et reproductibilité

Runtime Node 24.22.2 temporaire sous /tmp, dépendances inchangées. Compose dédié
candidly-cand016b-check, PostgreSQL 55447, Redis 56394, base candidly_test.
Les neuf migrations existantes sont appliquées seulement pour initialiser cette
base locale vide ; aucune migration créée/modifiée.

Le harnais `candidly-api/test/support/web-auth-server.ts` n'est jamais importé
par AppModule. Il exige NODE_ENV=test, DB loopback suffixée _test, préfixe de
fixture cand016b-* et répertoire /tmp/cand016b-* privé. Il capture uniquement ses
emails, traite les demandes manuellement et garde les vrais quotas Redis, isolés
par exécution (aucun flush global, aucune limite désactivée). SIGTERM/SIGINT
nettoie les seuls UUID de comptes capturés et le répertoire créé ; audits conservés.

Après compilation test API (`npm run pretest`), configurer côté API :

```text
NODE_ENV=test
PORT=13018
DATABASE_URL=postgresql://candidly_ci:ci_only_password@127.0.0.1:55447/candidly_test
REDIS_HOST=127.0.0.1
REDIS_PORT=56394
FRONTEND_URL=http://127.0.0.1:13017
CORS_ORIGIN=http://127.0.0.1:13017
EMAIL_TRANSPORT=disabled
CAND016B_EMAIL_PREFIX=cand016b-example
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-example-mail
```

JWT_SIGNING_KEY doit être générée aléatoirement en mémoire, jamais affichée ou
versionnée. Lancer `node .test-dist/test/support/web-auth-server.js` depuis l'API.
Puis depuis le web :

```sh
CAND016B_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-example \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-example-mail \
npm run test -- test/auth-live.test.ts
```

Le test live est explicitement sauté dans la suite web ordinaire sans ces
variables : il ne prétend pas utiliser une base si aucun harnais n'est configuré.
Il utilise réellement les services web et le gestionnaire contre HTTP/NestJS,
PostgreSQL et Redis. Un adaptateur de transport **de test Node uniquement** simule
l'Origin et le cookie jar du navigateur, vérifie HttpOnly/Strict et ne fait jamais
partie du bundle. Ce test ne remplace pas une recette multi-sous-domaines HTTPS.

## Couverture

Session : init unique, login/me, refresh concurrent et refusé, réseau/429,
GET rejoué une fois, mutation non rejouée, renouvellement avant envoi, ancien
401 avec JWT identique, logout, réponse tardive et absence de persistance.
Formulaires : inscription succès/refus, double submit, validations, vérification,
renvoi, reset, forgot neutre, erreurs, absence d'open redirect. Routes privées :
chargement sans flash, redirection après init, retrait au logout, reprise réseau.
Profil : lecture réelle, noms modifiables seulement et fuseau conservé/modifié.

Parcours live : inscription, login non vérifié refusé, vérification puis réutilisation
refusée, mauvais identifiants, login valide, profil, refresh, modification des
noms/préférences, restauration avec un nouveau gestionnaire, logout, révocation,
forgot/reset, nouvelle connexion et deux refresh bruts concurrents donnant 200/401
puis refus de l'ancien JWT. Aucun affaiblissement de la rotation stricte.

## Incidents et limites

Une fixture de formulaire associait le même label au formulaire et à l'input :
le sélecteur de test cible maintenant l'input. Le test de profil fournit le router
Next et un adaptateur générique typé. Le harnais a nécessité une variable de
répertoire capturée avec type string. La seconde exécution réelle a confirmé la
persistance des quotas Redis : ajout d'un namespace d'exécution, quotas et TTL
inchangés, sans purge. Chaque inscription live utilise aussi une adresse fictive
unique, pour ne jamais dépendre d'un compte déjà vérifié d'une tentative précédente. Aucune augmentation des délais base/API.

L'initialisation lazy évite un appel de configuration API pendant le rendu serveur.
Le snapshot d'hydratation évite l'affichage privé avant validation. Inspection
navigateur locale : formulaire de connexion, aucune erreur console d'hydratation,
/account montre le chargement puis redirige vers /login sans contenu privé.

Le CLI Next a émis une recommandation de mise à jour de sécurité sur la version
préexistante. Aucune dépendance n'est mise à jour dans ce ticket ; cette alerte
nécessite une revue distincte. Le résultat des builds est consigné séparément.

## Fichiers

Web créés :

- `src/features/auth/types.ts`, `api.ts`, `session.ts`, `provider.tsx`.
- `src/features/auth/private-route.tsx`, `validation.ts`, `forms.tsx`, `account.tsx`.
- `src/app/(auth)/layout.tsx` et cinq pages login/register/verify-email/forgot-password/reset-password.
- `src/app/(private)/account/layout.tsx`, `page.tsx`, `profile/page.tsx`.
- `test/auth-session.test.ts`, `auth-forms.test.tsx`, `auth-profile.test.tsx`, `auth-live.test.ts`.
- `docs/architecture/authentication.md`, `docs/development/cand-016b-validation.md`.

Web modifiés : README, layout racine, robots.ts et son test metadata, public-header, globals.css, contrat HTTP/sessions et index de documentation.
API créé : `test/support/web-auth-server.ts`. Aucune source de production API modifiée.

Aucun module CRM connecté, proxy SSR, token persistant, commit, push, déploiement
ou CAND-016C.

## Résultats techniques

| Contrôle web                 | Résultat                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run lint`               | Succès                                                                 |
| `npm run typecheck`          | Succès                                                                 |
| `npm run format:check`       | Succès                                                                 |
| `npm run test`               | 45 tests réussis ; le test live est sauté sans configuration explicite |
| Test live configuré          | 1/1 réussi avec PostgreSQL/Redis réels                                 |
| `npm run build` (Turbopack)  | Succès, code 0 dans cette passe                                        |
| `npm run build -- --webpack` | Succès, code 0 après l'interruption initiale du CLI                    |
| `git diff --check`           | Succès                                                                 |

API : lint, typecheck, précompilation test, format:check, suite unitaire et build
Nest réussis. Aucun endpoint de production modifié ; le nouveau harnais est
compilé et exécuté séparément. Le runner unitaire API signale 13 fichiers réussis
pour cette passe, sans prétendre qu'il s'agit du décompte Vitest frontend.

Le build Webpack initial a compilé/généré les 14 routes, puis le CLI a quitté sur
sa recommandation de sécurité ; la relance normale réussit sans modification de
version, script ou configuration. Le build standard Turbopack réussit désormais,
contrairement à la limite d'environnement constatée dans CAND-016A. L'alerte de
sécurité Next reste à traiter dans un travail distinct, sans mise à jour automatique.

Le serveur du build final répond 200 sur login/register/verify-email/forgot-password/
reset-password/account/account/profile/dashboard. Les routes auth/compte sont
noindex ; les deux HTML privés ne contiennent que la coquille de chargement,
sans donnée de fixture. La démo conserve ses marqueurs fictifs. Serveur web arrêté.

Le premier arrêt du harnais a montré une concurrence avec les hooks Nest ; le
harnais retire désormais uniquement les listeners Nest ajoutés à SIGINT/SIGTERM
pour attendre son nettoyage avant app.close. La configuration de production
reste inchangée. Les fixtures de cette tentative ont été supprimées par leurs
UUID ciblés ; la dernière passe vérifie le nettoyage automatique.

## État final — 19 novembre 2026

Dernière vérification du harnais corrigé : parcours live 1/1 réussi, puis arrêt
avec nettoyage automatique confirmé par SQL : zéro User, Session,
EmailVerificationToken et PasswordResetToken ; 40 audits conservés. Répertoire
privé des emails supprimé. PostgreSQL/Redis dédiés arrêtés, volumes conservés.

CAND-016B prêt pour validation fonctionnelle. Web : 45 tests ordinaires réussis
et parcours live séparé réussi ; builds Webpack et Turbopack réussis. Aucune
modification des dépendances, migrations, données de démonstration ou sources de
production API. Alerte de sécurité du CLI Next sur la version préexistante à
examiner séparément avant déploiement. Aucun commit, push, déploiement ou CAND-016C.
