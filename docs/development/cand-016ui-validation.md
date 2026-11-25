# CAND-016UI — Validation de la phase 2

Date : 20 novembre 2026. Dépôt : candidly-web. Direction validée :
**Le fil professionnel**. Validation finale fonctionnelle à effectuer par le propriétaire.

## Réalisation et audit initial

Hallmark v2.0.0 utilisé explicitement dès le préflight, puis pendant la conception
et la revue. AGENTS.md, documentation, composants et audit initial relus avant
modification. Git initial : aucun changement CAND-016B non commité ; uniquement
`.agents/` et `skills-lock.json` non suivis, préservés. Backend propre.

Audit initial : typographie de démonstration très petite, couleurs hors tokens,
champs trop pâles, navigation intermédiaire encombrée, chrome de navigateur
factice, labels en capitales espacées et disparité accueil/authentification.
Conservés : Navy, Inter locale, Tailwind/shadcn, destinations, champs et traitements.

Tokens dans `src/styles/tokens.css`, CSS commun réorganisé, aperçu simplifié,
formulaires réels et compte harmonisés. Listes fictives et recherche conservées.
La signature dossier/fil/prochaine action est documentée pour le CRM, sans
connexion Companies/Contacts ni données CRM réelles. Le scaffold Hallmark brand
est généré dans /tmp puis adapté aux conventions du projet ; aucune dépendance ajoutée.

## Référence et composants

La [référence du design system](../design/design-system.md) donne la liste des
tokens de couleur, typographie, espacements, rayons, ombres et durées, ainsi que
les conventions responsive et CRM. Primitives harmonisées : Button, Input,
Card, Skeleton. Badge et Separator conservés et alimentés par les nouveaux tokens.
Nouveaux composants utilisés : FormField, Feedback, StatusBadge et ActiveLink.
Pas de catalogue de composants inutilisés ni de deuxième framework UI.

Pages : `/`, `/login`, `/register`, `/verify-email`, `/forgot-password`,
`/reset-password`, `/account`, `/account/profile`. Démonstration `/dashboard`
harmonisée par les styles partagés ; ses données restent fictives et inchangées.
404 harmonisée par les mêmes tokens.

## Préservation de CAND-016B

Aucun changement dans session.ts, api.ts, provider.tsx, types.ts, validation.ts,
lib/api, tests existants, backend, Prisma ou migrations. Les changements dans
forms.tsx/account.tsx/private-route.tsx concernent uniquement les composants de
présentation, les classes, aria-busy et le type explicite du bouton de vérification.
Handlers, appels, corps HTTP, messages, tokens d’action, doubles soumissions,
CSRF, Origin, rotation, cookie HttpOnly et ownership inchangés.

Les noms et identifiants des champs restent les mêmes. Les messages de feedback
conservent leurs rôles alert/status. L’état de session et de chargement ne reçoit
pas une apparence de succès. Ajout d’une navigation de compte active avec
aria-current et soulignement, à l’intérieur de PrivateRoute.

## Responsive et navigateur

Inspection de l’application réelle au navigateur intégré. Mesures de scrollWidth
et géométrie des champs/boutons, pas seulement masquage CSS du débordement.

| Écran                     | 320 | 375 | 768 | 1024 | 1280 |
| ------------------------- | --- | --- | --- | ---- | ---- |
| Accueil                   | OK  | OK  | OK  | OK   | OK   |
| Login                     | OK  | OK  | OK  | OK   | OK   |
| Register                  | OK  | OK  | OK  | OK   | OK   |
| Verify email sans jeton   | OK  | OK  | OK  | OK   | OK   |
| Forgot password           | OK  | OK  | OK  | OK   | OK   |
| Reset password sans jeton | OK  | OK  | OK  | OK   | OK   |
| Compte authentifié        | OK  | OK  | OK  | OK   | OK   |
| Profil authentifié        | OK  | OK  | OK  | OK   | OK   |
| Dashboard fictif          | OK  | OK  | OK  | OK   | OK   |

Aucun débordement horizontal mesuré ; aucun champ/bouton hors viewport dans
la matrice auth. À 1280 × 800, les actions de l’accueil finissent vers y=654,
donc titre, explication et CTA sont visibles. Navigation publique compacte sous
74 rem ; sidebar de démonstration repliée sous 60 rem. Les données de date
restent visibles sur mobile dans la liste fictive.

Parcours navigateur réel : compte fictif dédié créé et vérifié via API locale,
connexion dans le formulaire réel, compte, profil, changement de prénom,
préférence UTC, rechargement avec restauration de session et valeurs conservées,
puis déconnexion et retour au login. Aucune donnée personnelle réelle.
Validation locale vide du login contrôlée : erreurs associées aux champs,
Tab email vers mot de passe, contour de focus de 3 px.
Recherche fictive sans résultat et état d’erreur simulé contrôlés. Aucun message
console de niveau error lors de cette inspection. Ce constat ne constitue pas
un audit navigateur exhaustif sur tous les systèmes d’exploitation.

## Accessibilité

Contrastes calculés sur les paires déclarées (WCAG, luminance relative) :

| Paire                              | Ratio   |
| ---------------------------------- | ------- |
| Navy / blanc                       | 14,69:1 |
| Texte secondaire / blanc           | 6,21:1  |
| Bordure de champ / blanc           | 3,71:1  |
| Focus / blanc                      | 6,32:1  |
| Pétrole / sélection douce          | 5,40:1  |
| Erreur / fond erreur               | 6,61:1  |
| Succès / fond succès               | 6,61:1  |
| Avertissement / fond avertissement | 6,08:1  |
| Information / fond information     | 7,40:1  |

Focus instantané, champs nommés, erreurs décrites, disabled natif, texte explicite
sur les boutons, sélection active non limitée à la couleur. Cibles de 44 px
minimum, boutons de formulaire à 48 px. CSS reduced motion et Skeleton
motion-safe ; pas d’animation décorative de page. Pas de certification WCAG
complète revendiquée : lecteur d’écran réel et préférences système ne sont pas
contrôlés exhaustivement dans cette passe.

## Hallmark : baseline, conservation et exceptions

Le baseline de l’audit initial était dans /tmp/.hallmark, pas dans le dépôt.
Il a été réenregistré avant toute mutation (20 novembre, 04:06 UTC), même périmètre
src, scope app : 150 FAIL, 136 REFLEX, 10 WARN. Copie dans `.hallmark/before.json`
(ignorée par Git). Seul le préfixe des chemins a été rendu relatif pour permettre
la comparaison depuis le dépôt ; aucun inventaire, résultat ou contenu modifié.

Commandes :

```sh
# Avant modification, exécuté depuis /tmp avec le chemin absolu de src :
node <skill>/scripts/sloplint.mjs <repo>/src --genre modern-minimal --scope app --render --before
# Après, depuis le dépôt :
node .agents/skills/hallmark/scripts/sloplint.mjs src --genre modern-minimal --scope app --render --kept --url http://127.0.0.1:13017/login
```

Résultat statique après : **4 FAIL, 0 REFLEX, 4 WARN**. Conservation mécanique :
**14/14 liens, 1/1 champ statiquement inventorié, 10/10 handlers**. Le champ
statique unique ne signifie pas que les autres champs ont disparu : les champs
AuthForm sont calculés dans React, et leur couverture vient des tests et du navigateur.

Les quatre FAIL sont explicitement ouverts dans la sortie brute :

- Gate 34 sur app/layout.tsx : faux positif d’association du CSS entre dossiers.
  Le layout importe styles/globals.css ; html et body ont réellement overflow-x:
  clip dans cette feuille, contrôlée au navigateur et par les mesures de largeur.
- Gate 48, trois couleurs d’opengraph-image.tsx : source préexistante non modifiée.
  Le rendu ImageResponse n’utilise pas la cascade CSS du navigateur. Centraliser
  ces couleurs demanderait un export partagé distinct ; aucune régression UI.

WARN : trois bordures latérales intentionnelles identifient prochaine action
et feedback ; elles accompagnent un texte et un rôle, sans être le seul signal.
F6 sur state-demo h2 est un faux positif du nom du sélecteur : ce titre ne porte
pas de chiffre. Aucun PASS global Hallmark inventé et aucune sortie masquée.

Rendu automatique indisponible : puppeteer-core absent. Aucune dépendance lourde
installée. Inspection navigateur de remplacement autorisée par le ticket.
Préflight/log dans `.hallmark/`, journal brut dans /tmp/cand016ui-phase2.
Les captures avant proviennent du build de production antérieur existant,
servi temporairement sur 13019 et vérifié visuellement avant capture.

Exceptions de conception : Inter et palette HEX validées conservées, pas de
thème tiré au sort ; informations fonctionnelles et messages auth priment sur
le budget marketing. Base générique Hallmark data-slot non importée pour ne pas
masquer les primitives shadcn. Revue finale effectuée dans le fil principal,
sans sous-agent, conformément à la branche Codex du skill.

Retouches de contenu : libellés de section en casse normale ; badge introductif
remplacé par CRM personnel de carrière ; phrases décoratives Une démarche plus
sereine, L’avenir se prépare pas à pas, Chaque pas compte et Les détails qui
comptent retirées ; Votre prochain chapitre retiré du mini-aperçu. Séparateurs
méta remplacés par virgules ou deux-points. Faux boutons de fenêtre et initiales
redondantes de l’aperçu retirés. Chiffres fictifs et données métier conservés.
Aucun message d’erreur, succès ou récupération auth réécrit.

## Commandes de validation

Runtime temporaire : Node 24.22.2 dans /tmp/candidly-ui-runtime ; pas de changement
du Node global, de package.json ou package-lock.json applicatif.

Les commandes applicatives sont exécutées depuis candidly-web, avec Node 24.22.2.

| Commande                                                                       | Résultat                                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                 | code 0, aucun avertissement applicatif après exclusion du skill tiers                                             |
| `npm run typecheck`                                                            | code 0                                                                                                            |
| `npm run format`                                                               | code 0, sans modifier le skill ni AGENTS.md                                                                       |
| `npm run format:check`                                                         | vérification finale consignée en clôture                                                                          |
| `npm run test`                                                                 | code 0 : 45 réussis, 0 échoué, 1 live sauté sans configuration ; 7 fichiers réussis, 1 sauté ; 13,88 s            |
| Test live configuré                                                            | code 0 : 1 réussi, 0 échoué ; 3,39 s                                                                              |
| `NEXT_PUBLIC_API_URL=http://127.0.0.1:13018/api/v1 npm run build`              | premier cycle : code 1 SecurityFatalError, relance code 0 ; recompilation après retouche CSS consignée en clôture |
| `NEXT_PUBLIC_API_URL=http://127.0.0.1:13018/api/v1 npm run build -- --webpack` | premier cycle : code 1 SecurityFatalError, relance code 0 ; recompilation après retouche CSS consignée en clôture |
| `git diff --check`                                                             | code 0                                                                                                            |

Aucun test existant n’a été modifié. Les tests ne sont pas remplacés par des
assertions sur les nouvelles classes CSS. Les changements de structure gardent
les noms accessibles utilisés par les tests CAND-016B.

## Intégration réelle

Harnais CAND-016B existant, non modifié, exécuté séparément. Compose dédié
candidly-cand016b-check ; PostgreSQL 55447, Redis 56394, base candidly_test.
Volumes de test réutilisés, migrations existantes, aucune nouvelle migration.
Clé JWT éphémère générée en mémoire. Capture email privée /tmp/cand016b-ui-mail,
préfixe cand016b-ui ; aucun transport externe, aucun quota désactivé.

```sh
CAND016B_API_URL=http://127.0.0.1:13018/api/v1 \
CAND016B_EMAIL_PREFIX=cand016b-ui \
CAND016B_MAIL_DIRECTORY=/tmp/cand016b-ui-mail \
npm run test -- test/auth-live.test.ts
```

Résultat : **1 test réussi, 0 échoué**, durée totale 3,39 s. Le parcours couvre
inscription, email, refus non vérifié, connexion, refresh, profil/préférences,
restauration, logout, reset, révocation et concurrence de rotation stricte.
Le transport Node de test simule l’Origin et le cookie jar ; le parcours navigateur
complémentaire vérifie réellement la connexion et le profil sur même hostname HTTP.
La recette HTTPS multi-sous-domaines reste distincte.

## Incidents et risques résiduels

- Le premier build Turbopack compile puis le CLI Next quitte avec SecurityFatalError
  sur la recommandation de sécurité de la version préexistante. Relance normale
  réussie, sans contournement ni changement de dépendance. Même incident observé
  au démarrage dev. L’alerte nécessite une revue séparée avant déploiement.
- Une règle a hérité la couleur Navy sur les liens-boutons : détectée au navigateur,
  corrigée. Le border-color universel hors layer écrasait les tokens Input : déplacé
  en layer base, bordure réelle contrôlée rgb(123,136,126).
- Lint initial : huit avertissements dans le skill tiers installé. Format initial :
  écarts dans ce même skill. `.agents/` est désormais exclu des contrôles applicatifs,
  sans modifier son contenu. Caches et captures Hallmark exclus de Prettier.
- Le baseline statique n’est pas un test de tous les handlers dynamiques React.
  Il est complété par les tests CAND-016B et le navigateur, sans modification de tests.
- Aucun lecteur d’écran réel ou parcours multi-onglets HTTPS complet validé ici.

## Revue visuelle finale et preuves

Revue Hallmark réalisée dans le fil principal à partir des captures réelles avant
et après, puis inspection de la page complète à 1440 px. Verdict : corrections
ciblées, sans reconstruction supplémentaire. Couleur des CTA et bordure Input
corrigées lors de la première passe ; lien de reconnexion réseau placé sur sa
propre ligne lors de la passe de production mobile. Le premier écran montre
l’action et le dossier fictif ; le compte conserve sa hiérarchie de formulaire.
Le conteneur public mesure 1216 px à 1440 comme à 1920, sans étirement des colonnes.
L’ancienne version offrait un aperçu plus compact, mais au prix de textes trop
petits ; la nouvelle privilégie délibérément leur lecture. Aucun accès existant
retiré. La prochaine action doit rester distincte du statut dans les futurs écrans.

Contrôle public complémentaire, scope page (accueil, header, aperçu, CSS et tokens) :
**0 FAIL, 0 REFLEX, 4 WARN**, contre 143 FAIL, 136 REFLEX et 10 WARN dans l’audit
public initial. Les quatre WARN sont les mêmes sélecteurs partagés documentés
plus haut. Le scope app global est conservé séparément pour comparer le baseline.
Aucun rendu Puppeteer revendiqué dans l’un ou l’autre scope.

Captures locales : /tmp/cand016ui-phase2/before-home.jpg, before-login.jpg,
after-home.jpg, after-home-1440.jpg et after-login.jpg.
La capture réseau after-network-error.jpg précède la dernière retouche du lien.
Comparaison manuelle : /tmp/cand016ui-phase2/compare.html ; ce fichier n’est pas
une comparaison générée par le rendu automatique Hallmark indisponible.

## Nettoyage et limites de l’environnement

À l’arrêt via le lanceur temporaire, le processus du harnais était arrêté mais
son nettoyage n’avait pas été exécuté. Deux comptes fictifs appartenant au préfixe
cand016b-ui ont été sélectionnés par UUID dans une table temporaire, nombre attendu
vérifié (2), puis supprimés par ces seuls UUID. Aucun flush Redis ni purge globale.
Contrôle SQL après transaction : User=0, Session=0, EmailVerificationToken=0,
PasswordResetToken=0 ; AuditLog=57, conservés. Répertoire privé d’emails supprimé.
PostgreSQL/Redis dédiés arrêtés et conteneurs retirés ; volumes conservés.
Ce correctif de nettoyage est limité à cette base de test, sans modification backend.

La correction de disposition du lien de reconnexion est CSS seulement. Elle ne
change ni le message d’erreur ni le comportement de reprise. Les contrôles métier
réussis restent ceux du parcours live et du navigateur avant arrêt de l’API.

## Fichiers et état Git

Fichiers suivis modifiés par CAND-016UI :

```text
.prettierignore
README.md
docs/architecture/README.md
docs/development/README.md
eslint.config.mjs
src/app/(auth)/layout.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/layout.tsx
src/app/(private)/account/layout.tsx
src/app/(public)/layout.tsx
src/app/(public)/page.tsx
src/app/not-found.tsx
src/components/layout/dashboard-nav.tsx
src/components/layout/public-header.tsx
src/components/shared/demo-applications.tsx
src/components/shared/interface-state.tsx
src/components/shared/product-preview.tsx
src/components/shared/state-demo.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/skeleton.tsx
src/features/auth/account.tsx
src/features/auth/forms.tsx
src/features/auth/private-route.tsx
src/styles/globals.css
```

Fichiers créés par CAND-016UI :

```text
docs/design/README.md
docs/design/design-system.md
docs/development/cand-016ui-validation.md
src/components/layout/active-link.tsx
src/components/ui/feedback.tsx
src/components/ui/form-field.tsx
src/components/ui/status-badge.tsx
src/styles/tokens.css
```

Une modification externe de .gitignore est apparue pendant la passe (ajout de
.agents et .hallmark) ; elle est conservée sans réécriture. skills-lock.json reste
non suivi. Le contenu du skill installé n’a pas été modifié. Les fichiers locaux
.hallmark/preflight.json, log.json et le baseline sont présents mais ignorés par
la règle .hallmark observée pendant le travail. Le document de design versionnable
reste docs/design/design-system.md, indépendamment de ces caches.

API : aucun fichier créé ou modifié par ce ticket, état Git propre. Aucun schéma
ou migration modifié. Aucune dépendance applicative modifiée. Aucun commit,
push, déploiement ou CAND-016C. Tous les changements UI restent non indexés.

## Clôture technique

Après la dernière correction CSS du lien réseau :

- Build Turbopack : tentative 1 code 1 (SecurityFatalError du CLI), tentative 2
  code 0. Journaux final-turbo-1.log et final-turbo-2.log.
- Build Webpack : tentative 1 code 1 (même recommandation du CLI), tentative 2
  code 0. Journaux final-webpack-1.log et final-webpack-2.log.
- 14 pages statiques générées dans les deux compilations. Aucun script, flag
  de sécurité ou version modifié pour obtenir les relances.
- Format final : code 0, All matched files use Prettier code style.
- Lint final et typecheck final : code 0. Tests frontend : 45 réussis,
  0 échoué, 1 sauté ; le test live séparé réussit.
- git diff --check : code 0. Dépôt API propre, fichiers de sécurité et tests
  inchangés. Branche web main ; changements non indexés, aucun commit effectué.

Reduced motion est vérifié par inspection des règles CSS et motion-safe ;
aucune émulation de préférence système n’est revendiquée. La recette lecteur
d’écran et HTTPS multi-sous-domaines reste à effectuer séparément.

Implémentation prête pour revue fonctionnelle finale, avec exceptions Hallmark
et alerte Next documentées. Aucun déploiement autorisé ou effectué.

Dernier contrôle du build recompilé : à 375 px, le bouton de reprise finit à
y=280,17 ; le lien de reconnexion commence à y=288,17 et mesure 44 px de haut.
Il est donc sur sa propre ligne, avec un écart de 8 px. scrollWidth=375,
html/body overflow-x=clip. La recapture finale a été indisponible dans l’outil
navigateur ; la correction est confirmée par géométrie DOM et arbre accessible,
sans présenter la capture antérieure comme une preuve après correction.
