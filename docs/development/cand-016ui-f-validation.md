# CAND-016UI-F — Validation des finitions de la landing

Date : 20 novembre 2026. Dépôt : candidly-web. Hallmark v2.0.0 appliqué en
conception, implémentation et revue, dans la direction verrouillée
[Le fil professionnel](../design/design-system.md). Aucune refonte supplémentaire.

## Préparation et périmètre

AGENTS.md, skill Hallmark et protocole de redesign/finition, référence du design
et composants existants relus. L’arbre Git contenait déjà les changements non
commités de CAND-016UI phase 2 ; ils sont conservés. L’état initial et des copies
des fichiers concernés sont dans /tmp/cand016ui-f/before-source et git-before.txt.
Aucun reset, stash, commit, push ou déploiement. Le scope de cette passe porte
seulement sur présentation et navigation publiques ; aucun début de CAND-016C.

Inspection navigateur avant modification à 1280 × 800 et 375 × 812. Le titre
commençait à y=295,14 contre y=145 pour l’aperçu à 1280, confirmant le décalage.
Baseline Hallmark public enregistré avant mutation : **0 FAIL, 0 REFLEX, 4 WARN**.
Ce baseline succède à celui de la phase 2 ; son périmètre public est distinct
du contrôle global app de la phase 2. Le système existant est conservé, aucun
thème tiré au sort, nouveau framework, nouvelle police ou dépendance ajoutée.

## Les cinq améliorations

1. **Navigation.** Logo, Fonctionnalités et Comment ça marche. Visiteur : Connexion
   et Créer mon espace ; authentifié : Mon espace. La déconnexion reste dans
   /account, sans bouton de déconnexion dupliqué dans la navigation publique.
2. **Hero.** Alignement haut des deux colonnes et réduction du padding desktop
   de 64 à 48 px. La copie garde une respiration de 16 px, retirée sur téléphone.
   Pas de réduction artificielle de la taille des textes pour remplir l’écran.
3. **CTA.** Créer mon espace gratuitement vers /register. La création gratuite
   est prévue dans le modèle Freemium d’AGENTS.md et l’inscription existante
   ne déclenche aucun paiement. Aucune promesse d’essai, Premium, quota ou résultat.
   Le secondaire Comprendre l’approche reste vers #approche. La démo conserve
   son accès /dashboard, désormais libellé Explorer la démo sans inscription.
4. **Aperçu.** Un dossier Atelier Horizon (fixture existante), statut Entretien,
   deux échanges fictifs datés et une prochaine relance séparée du statut.
   Dates illustratives 18/19/24 novembre 2026. Badges et légende indiquent
   explicitement la fiction et le caractère de futur CRM. Les compteurs fictifs
   24/03 et +4 restent présents. Les autres dossiers restent dans la démo publique ;
   l’aperçu se concentre sur un dossier pour rendre son fil lisible, sans API CRM.
5. **Avantages.** Trois icônes Lucide existantes, titres directs, phrases plus courtes,
   séparateurs réguliers et suppression des numéros décoratifs. Pas de nouvelles
   cartes ou surfaces ; lecture verticale naturelle sous 44 rem.

## Session, rendu serveur et hydratation

PublicHeader est un Client Component utilisant exclusivement l’API publique
useAuth. Aucune lecture de cookie, de JWT, de localStorage ou de sessionStorage.
Aucun appel API propre au header : le gestionnaire unique CAND-016B reste responsable.

| État                              | Contrôles de compte visibles                  |
| --------------------------------- | --------------------------------------------- |
| initializing / refreshing         | Vérification du compte, état neutre           |
| unauthenticated                   | Connexion / Créer mon espace                  |
| authenticated, identité confirmée | Mon espace vers /account                      |
| error, session incertaine         | Accès au compte vers /account, libellé neutre |

Le slot desktop conserve une largeur minimale et une hauteur stable. Le SSR
utilise le snapshot neutre existant de useAuth, même avec un manager déjà
initialisé côté client. Le test hydrateRoot ne rapporte aucune erreur récupérable.
Un test diffère la réponse /me : Mon espace n’apparaît pas dès le seul refresh.
Aucune modification de provider.tsx, session.ts, validation, API ou protection de route.
L’inscription, connexion, démonstration, compte et formulaires réels restent accessibles.

## Liens et menu

Fonctionnalités pointe vers /#approche (trois avantages). Comment ça marche pointe
vers /#apercu (dossier, échanges, prochaine action). Aucune page inventée.
Le menu natif details/summary reste utilisable au clavier ; il se ferme après
activation d’un lien. L’ancre Fonctionnalités est contrôlée par navigation réelle
jusqu’à #approche, avec fermeture confirmée. La navigation desktop reste visible
à 1024 px ; sous 60 rem, elle laisse place au menu mobile. Les états de session
sont identiques dans les deux présentations.

## Responsive et accessibilité

Mesures sur le navigateur réel, pas seulement présence d’overflow-x:clip.
Rectangles des CTA, lignes de chronologie, aperçu et éléments de header contrôlés,
ainsi que scrollWidth/clientWidth. Aucune troncature de CTA ou débordement mesuré.

| Largeur | Navigation | Haut h1 | Bas des actions hero | Débordements |
| ------- | ---------- | ------- | -------------------- | ------------ |
| 320     | mobile     | 147     | 648                  | 0            |
| 375     | mobile     | 147     | 623                  | 0            |
| 768     | mobile     | 187     | 663                  | 0            |
| 1024    | desktop    | 187     | 604                  | 0            |
| 1280    | desktop    | 187     | 546                  | 0            |
| 1440    | desktop    | 187     | 561                  | 0            |

À 1280 × 800, titre, explication et CTA principal visibles sans scroll. À 320,
le CTA peut prendre deux lignes sans être tronqué. La chronologie conserve des
événements à 16 px et des dates à 14 px. Titres h1/h2/h3 cohérents, icônes décoratives
aria-hidden. Cibles du menu et des liens >=44 px. Focus visible de 3 px constaté
sur le summary. Le menu s’ouvre par Entrée. La sélection de session ne repose
pas sur une couleur ; les libellés correspondent aux états confirmés.

Couleurs inchangées : Navy, grège, pétrole et tokens existants. Les paires utiles
restent celles vérifiées dans CAND-016UI : Navy/blanc 14,69:1, texte secondaire/blanc
6,21:1, pétrole/sélection douce 5,40:1 et focus/blanc 6,32:1. Aucun texte de chronologie
minuscule ajouté. Aucun mouvement ajouté ; le fallback reduced motion existant
est conservé et vérifié en lecture CSS. Pas d’émulation système revendiquée.
Aucune erreur console de niveau error observée dans le navigateur.

## Tests

Nouveau test/public-header.test.tsx :

- Initialisation neutre, puis navigation visiteur après refus 401.
- Navigation authentifiée seulement après refresh et confirmation de l’identité,
  puis retour visiteur après logout du manager public.
- Erreur réseau conservant un accès neutre au compte, sans fausse déconnexion.
- Liens desktop/mobile vers les sections existantes et fermeture du disclosure.
- SSR neutre et hydratation d’un manager authentifié sans erreur récupérable.
- Aperçu dossier/fil/action explicitement fictif, aucune requête réseau.

Le test de CTA dans test/pages.test.tsx est adapté à la demande explicite :
ancien lien de démo remplacé par Créer mon espace gratuitement vers /register.
Le contrôle de la démo sans inscription reste présent. Aucun test CAND-016B
n’est modifié pour masquer une régression.

Résultat : **51 tests réussis, 0 échoué, 1 sauté** ; 8 fichiers réussis et 1 sauté,
17,53 s. Le test live CAND-016B est sauté sans configuration explicite de harnais.
Cette passe n’exécute pas de nouveau parcours complet PostgreSQL/Redis ; elle
vérifie le header avec le vrai SessionManager et des transports de test, plus
le navigateur visiteur contre l’API locale existante. L’état connecté et son
hydratation sont couverts par ces tests de composants, sans compte réel ajouté.

## Hallmark et revue finale

Commandes depuis candidly-web, mêmes fichiers avant/après :

```sh
node .agents/skills/hallmark/scripts/sloplint.mjs 'src/app/(public)' \
  src/components/layout/public-header.tsx src/components/shared/product-preview.tsx \
  src/styles/globals.css src/styles/tokens.css \
  --genre modern-minimal --render --before

node .agents/skills/hallmark/scripts/sloplint.mjs 'src/app/(public)' \
  src/components/layout/public-header.tsx src/components/shared/product-preview.tsx \
  src/styles/globals.css src/styles/tokens.css \
  --genre modern-minimal --render --kept --url http://localhost:3000/
```

| Périmètre public            | FAIL | REFLEX | WARN |
| --------------------------- | ---- | ------ | ---- |
| Fin CAND-016UI / baseline F | 0    | 0      | 4    |
| Après CAND-016UI-F          | 0    | 0      | 5    |

**Conservation : 7/7 destinations inventoriées.** Aucun formulaire dans ce scope.
Le nouveau handler ne fait que fermer details ; les interactions de session sont
vérifiées par les tests, au-delà de l’inventaire statique de liens.

WARN documentés : trois traits latéraux sémantiques de prochaine action et feedback
(préexistants dans le CSS partagé) ; F6 sur le nom state-demo h2, qui ne contient
aucun chiffre ; nouvelle mesure à 35ch des descriptions d’avantages. Cette dernière
est volontaire : une phrase courte par avantage, largeur adaptée à la colonne,
conforme à la demande de concision. Pas d’allongement artificiel pour effacer le WARN.

Rendu automatique indisponible : puppeteer-core absent. Aucune installation pour
contourner cette limite. Inspection navigateur avant/après et captures réelles en
remplacement. Revue finale dans le fil principal suivant review-finish.md : aucun
nouveau défaut visuel bloquant relevé ; comparaison desktop complet 1440 et mobile.
L’ancienne version montrait trois dossiers simultanément ; la nouvelle assume
un seul dossier pour expliquer ses relations et sa suite. La démo complète reste
accessible. À préserver : distinction entre statut de candidature et prochaine action.

Captures locales dans /tmp/cand016ui-f : before-desktop.jpg, before-mobile.jpg,
after-desktop.jpg, after-mobile.jpg, after-full-1440.jpg, after-features-mobile.jpg.
Le badge Next visible sur certaines captures appartient au mode développement.
Les captures n’ont pas été retouchées pour le masquer. Journaux bruts au même endroit.

## Fichiers de cette passe

Modifiés par rapport à l’état non commité de CAND-016UI :

- src/components/layout/public-header.tsx
- src/components/shared/product-preview.tsx
- src/app/(public)/page.tsx
- src/styles/globals.css
- test/pages.test.tsx
- docs/design/design-system.md : seule convention de navigation publique révisée
- docs/development/README.md : lien vers ce rapport

Créés : test/public-header.test.tsx et ce rapport.
Les caches .hallmark sont ignorés et mis à jour pour cette passe. Aucun fichier
supprimé, aucune dépendance ajoutée, aucun token existant remplacé.

## Contrôles techniques et Git

Runtime Node 24 via nvm. Lint et typecheck : code 0. Format:check : code 0.
Git diff --check : code 0. Résultats des builds consignés en clôture après exécution.
Le code de l’API, son schéma et ses migrations sont inchangés. Les services auth,
manager, provider, cookies, CSRF et ownership sont inchangés par ce ticket.
La configuration locale récemment préparée est conservée. L’API locale n’a servi
qu’aux contrôles de navigation visiteur ; aucun compte de test n’a été ajouté.

L’arbre Git global reste non propre comme avant le ticket ; il contient les
changements de phase 2. Le rapport distingue donc les neuf fichiers de cette
passe des modifications antérieures. Aucun changement existant n’a été écrasé.
Aucun commit, push, déploiement ni CAND-016C.

## Clôture : builds, limites et état final

| Commande                   | Résultat final                                                 |
| -------------------------- | -------------------------------------------------------------- |
| npm run lint               | code 0                                                         |
| npm run typecheck          | code 0                                                         |
| npm run format:check       | code 0                                                         |
| npm run test               | code 0, 51 réussis, 0 échoué, 1 sauté                          |
| npm run build              | tentative 1 code 1 SecurityFatalError ; relance normale code 0 |
| npm run build -- --webpack | tentative 1 code 1 SecurityFatalError ; relance normale code 0 |
| git diff --check           | code 0                                                         |

Les deux compilations ont généré les 14 pages statiques. Journaux et codes de
sortie : /tmp/cand016ui-f/build-turbo-1.log, build-turbo-2.log,
build-webpack-1.log, build-webpack-2.log et fichiers .exit associés.
Le CLI s’est également arrêté une fois au démarrage dev sur son alerte de sécurité.
Les relances normales utilisent les commandes inchangées, sans désactivation de
contrôle, flag de contournement, mise à jour ou modification de dépendance.
La recommandation de sécurité Next préexistante nécessite toujours une revue
séparée avant déploiement. Ne pas assimiler la compilation à un audit de sécurité.

Les serveurs frontend/API lancés pour l’inspection ont été arrêtés ; les services
Docker de développement existants n’ont pas été arrêtés. Aucun compte ou donnée
CRM créé. next-env.d.ts, régénéré par Next, est restauré octet pour octet dans
son état de début de ticket, y compris sa modification préexistante.

Limites : pas de rendu Puppeteer ; navigateur connecté couvert par tests de
composants/manager et hydratation, sans nouvelle connexion avec un compte de test
au navigateur ; reduced motion contrôlé en CSS ; pas de certification lecteur
d’écran ou recette HTTPS multi-sous-domaines. L’aperçu reste strictement fictif.

Prêt pour revue fonctionnelle finale avec ces limites documentées. Arbre web
non indexé, changements de phase 2 préservés. Dépôt API propre. Aucun commit,
push, déploiement ni CAND-016C.
