# Validation CAND-016A — Compatibilité web/API

Date : 18 novembre 2026. Périmètre : CORS et client HTTP, sans règle CRM modifiée.

## Correctifs

DELETE ajouté aux méthodes CORS ; origines explicites, credentials et headers
Authorization/Content-Type/X-Candidly-CSRF conservés. Retry-After ajouté aux
headers exposés avec X-Request-Id pour rendre le délai de limitation accessible
au navigateur. Aucun wildcard, changement de cookie ni assouplissement CSRF.

Test préflight OPTIONS : DELETE avec authorization/content-type et POST avec
content-type/x-candidly-csrf, origine localhost:3000 autorisée, credentials true,
méthodes et headers vérifiés. Origine étrangère sans Allow-Origin exploitable.
Le test de corrélation vérifie désormais les deux headers exposés. Les tests
existants de session préservent Origin, CSRF, cookies Strict/Secure/HttpOnly,
rotation et révocation. Les routes CRM GET/POST/PATCH/DELETE restent inchangées.

Le dépôt web prépare createApiClient, les credentials vers sa seule base validée,
les erreurs normalisées, un helper CSRF des trois POST session et une Promise
refresh partagée par instance, sans refresh automatique ni rejeu de mutation.
Pas de stockage de token, de page auth ou de modification de la démo.

## Contrat de déploiement

NEXT_PUBLIC_API_URL est une URL absolue `/api/v1`, HTTPS en production.
FRONTEND_URL est l'origine frontend exacte, incluse dans CORS_ORIGIN. Frontend
et API doivent rester sur le même site HTTPS, éventuellement deux sous-domaines
ayant des origines distinctes. Aucun domaine exemple n'est ajouté à la config.

Le cookie refresh est host-only API, Path=/api/v1/auth, HttpOnly, Secure en
production, SameSite Strict. Include ne contourne pas SameSite. Origin décrit
schéma/hôte/port ; site décrit schéma/domaine enregistrable. Local : même hostname
et schéma, ports distincts ; ne pas mélanger localhost et 127.0.0.1.

Login/refresh/logout exigent toujours Origin exact ET X-Candidly-CSRF: 1. Le
navigateur fournit Origin, le helper central fournit le header CSRF. Aucun refresh
dans le JSON, aucun accès JavaScript au cookie. Access token destiné à la mémoire
de la future couche d'authentification, sans localStorage/sessionStorage.

Une architecture cross-site demanderait une décision séparée sur SameSite,
Secure, les cookies tiers, les domaines et le CSRF ; rien n'est implémenté dans
ce sens. Les reverse proxies devront masquer Authorization/Cookie/Set-Cookie.

## Validation locale

Node 24.22.2 temporaire, dépendances inchangées. PostgreSQL 17/Redis 7 dédiés au
projet candidly-cand016a-check, ports loopback 55446/56393, base candidly_test,
JWT éphémère, transport email désactivé. Les neuf migrations existantes sont
rejouées pour initialiser cette base vide ; aucune migration créée ou modifiée.
Les suites backend sont exécutées séquentiellement, délais du socle inchangés.

## Fichiers web

Modifiés : src/lib/api/client.ts, src/lib/api/config.ts, src/types/api.ts,
.env.example, test/api.test.ts, docs/architecture/README.md,
docs/development/README.md. Créés : test/api-session.test.ts,
docs/architecture/http-sessions.md, docs/development/cand-016a-validation.md.
Le [contrat détaillé](../architecture/http-sessions.md) décrit les options,
messages d'erreur, CSRF, cookies, configuration et limites du refresh.

## Incidents

Une fixture fetch réutilisait le même Response après lecture du corps ; elle
produit maintenant une réponse fraîche par appel. Le premier build Turbopack
sous sandbox a échoué sur l'ouverture d'un port interne (Operation not permitted).
Le build Turbopack reste bloqué après autorisation locale ; le build Webpack
standard réussit sans modification du projet. Aucune dépendance ajoutée.

## Risques résiduels et CAND-016B

Le single-flight est limité à une instance mémoire : les onglets indépendants
ne sont pas coordonnés. La rotation stricte peut alors imposer une reconnexion,
également après perte d'une réponse refresh. CAND-016B devra conserver une instance
navigateur, gérer l'access token en mémoire, la reconnexion et la politique de
rejeu explicite des seules requêtes rejouables. Aucun système d'authentification
UI, service CRM frontend complet ou proxy SSR de session n'est ajouté.

Pas de blocage identifié dans le contrat technique ; le déploiement devra fournir
les vraies origines HTTPS du même site. Aucun commit, push ou déploiement ;
CAND-016B n'est pas commencé.

## Résultats des commandes

API : lint, typecheck, format:check et build réussis ; tests unitaires 92/92,
e2e 56/56 et intégration 90/90. git diff --check réussi. Les neuf migrations
existantes ont été rejouées uniquement sur la nouvelle base de test ; aucun
fichier Prisma ni règle CRM modifié. Après tests : zéro utilisateur, tâche et
interaction résiduels, 366 audits conservés.

Web : lint, typecheck, format:check et 22/22 tests Vitest réussis (4 fichiers,
10 nouveaux tests session/compatibilité). `npm run build` avec Turbopack échoue
sur son port interne, y compris après autorisation d'exécution locale.
`npm run build -- --webpack` réussit, sans changement du script ni du bundler
configuré dans le dépôt. Le build de production a été servi sur loopback :
accueil, dashboard, manifest, robots et icône 192 répondent 200. Le serveur de
vérification a ensuite été arrêté. git diff --check réussi.

La première vérification du format API a signalé le nouveau test CORS ; le
formatage est corrigé et le contrôle final réussit. La fixture web de réponse
réutilisée est corrigée. Les délais de requête et de base sont inchangés.

Les services PostgreSQL/Redis dédiés sont arrêtés après vérification, volumes
conservés. Aucun secret, dépendance, page ou donnée de démonstration modifié.
Les captures Git confirment les fichiers AGENTS.md, lockfiles et migrations
inchangés. Aucun commit, push ou déploiement.

## Statut

CAND-016A implémenté et validé fonctionnellement ; build web vérifié avec
Webpack. Limite d'environnement à conserver dans la revue : le build Turbopack
standard ne réussit pas ici. Aucun blocage de contrat identifié pour préparer
CAND-016B ; celui-ci n'est pas commencé.
