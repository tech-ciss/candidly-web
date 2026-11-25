# CRM frontend — CAND-016C

Contrats inspectés avant implémentation : controllers, DTO, services, repositories,
JwtAuthGuard, ownership et tests unitaires/HTTP/intégration Companies/Contacts.
Sources : candidly-api/src/modules/companies, src/modules/contacts,
src/common/dto/pagination.dto.ts et src/common/authorization/ownership.ts.
Aucun contrat ni code de production backend à modifier.

## Matrice réelle des endpoints

Préfixe /api/v1, Bearer JWT validé contre session active et utilisateur vérifié,
Cache-Control no-store. Ownership déterminé par l’acteur serveur, jamais un userId
transmis par le frontend. Ressource inconnue et étrangère : même 404.

| Méthode | Route                   | Entrée                                                                  | Réponse                         |
| ------- | ----------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| GET     | /companies              | page, limit, status, sortBy, sortOrder, search, industry, country, city | CompanyPage 200                 |
| POST    | /companies              | CreateCompany                                                           | Company 201                     |
| GET     | /companies/:id          | UUID                                                                    | Company 200                     |
| PATCH   | /companies/:id          | UpdateCompany non vide                                                  | Company 200                     |
| POST    | /companies/:id/archive  | aucun corps utile                                                       | Company 200, idempotent         |
| POST    | /companies/:id/restore  | aucun corps utile                                                       | Company 200, idempotent         |
| DELETE  | /companies/:id          | aucun corps utile                                                       | 204, relations bloquantes : 409 |
| GET     | /contacts               | page, limit, companyId, search, jobTitle, department, sortBy, sortOrder | ContactPage 200                 |
| POST    | /contacts               | CreateContact                                                           | Contact 201                     |
| GET     | /contacts/:id           | UUID                                                                    | Contact 200                     |
| PATCH   | /contacts/:id           | UpdateContact non vide                                                  | Contact 200                     |
| DELETE  | /contacts/:id           | UUID                                                                    | 204, relations bloquantes : 409 |
| GET     | /companies/:id/contacts | query Contacts, chemin prioritaire sur companyId                        | ContactPage 200                 |

## DTO et réponses

Company : id, name, industry, website, country, city, address, description, notes,
status ACTIVE/ARCHIVED, createdAt, updatedAt, archivedAt. Aucun contactCount.
Création : name requis, 1–150 caractères, NFC/trim/espaces Unicode regroupés.
Facultatifs nullable : industry/country/city 1–100, address 1–255,
website HTTP(S) absolu 1–2048 (pas de TLD obligatoire), description 1–2000,
notes 1–5000. PATCH : mêmes champs, partiels, nom jamais null, au moins un champ.
Le statut change exclusivement par archive/restore. Unicité du nom normalisé
par propriétaire, y compris parmi les archives : création/modification 409.

Contact : id, companyId, firstName, lastName, jobTitle, department, email, phone,
linkedinUrl, notes, createdAt, updatedAt et company={id,name,status}.
Création : companyId UUID, firstName et lastName requis 1–100 après trim.
Facultatifs nullable : jobTitle 1–150, department 1–100, email 1–254 (trim/minuscule),
notes 1–5000 ; phone international + puis 7–15 chiffres, premier chiffre non nul,
espaces/parenthèses/points/tirets retirés ; LinkedIn 1–2048, HTTPS, hôtes exacts
linkedin.com/www.linkedin.com, sans userinfo/port non standard/espace/backslash.
PATCH partiel non vide, champs requis non null. Entreprise accessible, même
archivée ; déplacement possible sauf associations/historique bloquants (409).
Doublons de contacts autorisés : aucune règle d’unicité frontend.

Les chaînes facultatives vides des formulaires deviennent null, pour effacer un
champ. Aucune propriété userId, createdAt, status ou company imbriquée n’est envoyée.
Validation locale de confort ; le backend reste l’autorité (notamment IsEmail/IsUrl).

## Pagination, recherche et filtres

Page={data,meta:{page,limit,total,totalPages}}, totalPages=ceil(total/limit), zéro
si aucune donnée. page 1–1000000, défaut 1 ; limit 1–100, défaut 20.
Companies : ACTIVE par défaut, tri name/createdAt/updatedAt, asc par défaut,
id en départage. Search 1–150 : nom/secteur/ville ; filtres exacts insensibles à la
casse industry/country/city 1–100. Contacts : tri lastName par défaut, également
firstName/createdAt/updatedAt ; search 1–200 sur noms/email/fonction et noms multi-mots ;
jobTitle exact 1–150, department exact 1–100, companyId UUID. Motifs SQL littéraux.
GET /contacts?companyId étranger/inconnu renvoie une liste vide ; la route imbriquée
contrôle l’entreprise et renvoie 404. Aucun filtre ALL des entreprises dans l’API.

## Erreurs

400 validation/UUID/PATCH vide ; 401 session ; 403 accès interdit ; 404 absent ou
inaccessible ; 409 doublon entreprise ou relation bloquante ; 429 quota ; 5xx ou
réseau indisponible. Le client HTTP existant n’expose pas les messages internes.
Le frontend formule les conflits selon l’opération, sans forcer les contraintes.
Une mutation avec réponse réseau inconnue invite à vérifier avant de la renvoyer.

## Architecture prévue

Fonctionnalités companies et contacts : API typée, DTO frontend, validation et
composants. Socle CRM partagé : cache mémoire par identité et durée de navigation
privée, déduplication des GET par clé de paramètres, annulation/invalidations et
protection des réponses tardives. Aucun stockage navigateur de données CRM.
Les routes /account restent sous PrivateRoute. La démo /dashboard reste publique.
SessionManager.request reçoit seulement une extension de son type de chemins ;
son fonctionnement CAND-016B (single-flight, génération, GET unique, non-rejeu des
mutations) reste identique. Le backend contrôle toujours l’ownership.

## Implémentation CAND-016C (socle)

Les huit pages sous `/account/companies` et `/account/contacts` sont des enveloppes App Router, avec Suspense pour les paramètres URL. Elles héritent de `PrivateRoute`, des métadonnées noindex et de la session CAND-016B. `/dashboard` conserve sa démonstration publique.

`AccountShell` fournit les quatre destinations (vue d’ensemble, entreprises, contacts, profil). Son gabarit initial a été remplacé par le shell responsive CAND-016UI-CRM décrit ci-dessous. Les fonctionnalités restent dans `features/companies` et `features/contacts`; `features/crm` contient uniquement leurs mécanismes communs (états de lecture, confirmation en ligne, pagination, erreurs, formulaire et cache).

### Données et concurrence

`companiesApi` et `contactsApi` passent exclusivement par `SessionManager.request` et le client HTTP existant. Seule l’union TypeScript des chemins autorisés dans ce gestionnaire est étendue. Aucun changement du renouvellement, des cookies, de CSRF ou du rejeu. Les réponses sont décodées à l’exécution, les identifiants vérifiés, les clés de requête filtrées. Le navigateur n’envoie jamais de propriétaire.

Un `CrmStore` appartient à une identité et à une instance du provider privé. Cache en mémoire, aucune persistance navigateur, aucun service worker privé. Chaque clé inclut les paramètres de lecture. Les demandes identiques en cours partagent une Promise. Chaque lecture reçoit un AbortSignal et une révision; une réponse invalidée ne peut plus remplir le cache. Les transitions de session purgent immédiatement les entrées et changent l’époque des enfants (effacement des brouillons), y compris lors d’une reconnexion rapide du même compte. L’abonnement est installé en layout effect avant le chargement des enfants, pour supporter StrictMode.

Après mutation confirmée, le callback de navigation est déclenché avant l’invalidation des lectures : la fiche d’édition peut être démontée par cette invalidation. Aucun succès anticipé, aucune suppression optimiste. Un conflit préserve la saisie et affiche un message contextualisé. Une réponse tardive après changement de session ne déclenche ni navigation ni réinsertion des données.

La protection privée existante démonte ses enfants pendant un renouvellement de session. Une lecture peut donc être annulée puis rechargée lors du remontage; c’est distinct du rejeu unique GET interne au gestionnaire. Les mutations déjà dispatchées ne sont jamais automatiquement répétées. En cas de perte de réponse, le message invite à consulter le dossier avant toute nouvelle tentative.

Les filtres et la pagination des listes principales vivent dans l’URL et sont appliqués explicitement. Le sélecteur d’entreprise parcourt les entreprises actives ou archivées, permet la recherche et ne propose que des réponses de l’API de l’utilisateur. Une entreprise transmise par URL est relue par son identifiant; une entreprise étrangère n’est jamais acceptée comme sélection. Les pages de contacts associés utilisent la route imbriquée réelle et son total. Aucun total de contacts n’est inventé dans la liste d’entreprises.

### Formulaires et limites de validation

Les primitives Button, Input, FormField et Feedback existantes sont conservées. Les champs facultatifs vides produisent `null`, les PATCH ne contiennent que les champs modifiés. Les erreurs locales ont un identifiant associé et le premier champ invalide reçoit le focus. Le serveur reste l’autorité pour IsEmail, IsURL, l’ownership, les doublons et les relations. La vérification locale d’email est indicative; elle ne réimplémente pas intégralement validator.js.

La confirmation destructive est un panneau en ligne avec Annuler et Confirmer, sans modal ni piège de focus. Les conflits de suppression ne contournent jamais les relations. Les dates utilisent le fuseau du navigateur pour ces fiches, comme les affichages existants; l’application du fuseau de préférence partout reste à harmoniser ultérieurement.

### Design

Hallmark v2.0.0 appliqué en scope app, direction validée « Le fil professionnel ». Dossier comme signature, navigation à quatre destinations, désormais adaptée par le shell responsive, listes verticales de dossiers sur mobile, surfaces sobres et tokens existants. Aucun historique ni prochaine action n’est affiché tant que leurs modules ne sont pas connectés. Pas de deuxième framework ou dépendance de cache. Le cache est invalidé après les mutations de cette instance; les mises à jour faites dans un autre onglet nécessitent une actualisation de la page.

## Présentation responsive — CAND-016UI-CRM

`AccountShell` conserve `CrmProvider` sous `PrivateRoute`. `AppFrame` assemble
sidebar, header, menu utilisateur et navigation mobile ; aucune nouvelle couche de
session. `records.tsx` partage les tables/lignes entre listes et contacts associés.
`DialogPanel`, `ListToolbar`, `FormSection` et `DetailSection` mutualisent uniquement
la présentation. Le sélecteur interroge les entreprises par pages de 20, avec
recherche différée et statut actif/archivé ; la sélection reste distincte des
résultats courants. Aucune bibliothèque ou dépendance supplémentaire.

La recherche attend 350 ms et remplace les paramètres URL en ramenant `page` à 1.
Les filtres appliqués naviguent avec les paramètres API existants. Le store et ses
révisions continuent de protéger des réponses obsolètes. Un `returnTo` local
transporte le contexte liste vers fiche/édition : seuls les chemins exacts de la
liste concernée et leurs paramètres sont acceptés, jamais une destination externe.
Aucune persistance du contexte ni des dossiers n’est ajoutée.

L’accueil lit deux pages `limit=1` et affiche uniquement leurs `meta.total` :
entreprises actives et ensemble des contacts. Les états de chargement et d’erreur
restent distincts de zéro. Aucun endpoint de dashboard ni agrégation fictive.

Contrats, décodeurs, validations métier, store, provider, gestionnaire de session,
client HTTP et protections sont conservés. Les formulaires gardent leurs charges
utiles, PATCH différentiels, confirmations serveur et verrou contre la double
soumission. Backend, Prisma et migrations ne changent pas dans ce ticket.
