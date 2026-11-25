# Design system Candidly : Le fil professionnel

Direction validée par le ticket CAND-016UI, phase 2. Référence commune des pages
publiques, de l’authentification et du futur CRM. Navy et Inter sont conservés.
Hallmark v2.0.0 a guidé la composition, la hiérarchie, les états et les contrôles ;
aucun thème de démonstration n’est reproduit. Tailwind v4 et shadcn restent le socle.

## Philosophie

Le dossier identifie une entreprise, une personne ou une candidature. Le fil rend
lisibles les échanges horodatés. La prochaine action dit quoi faire et quand.
Le statut décrit la situation ; il ne remplace jamais la prochaine action.
Une page commence par son objet, puis ses informations et son action principale.
La chaleur vient du fond grège, de la lisibilité et des espacements, sans texture,
faux navigateur, photographie générique, récompense artificielle ou métrique inventée.

## Tokens et couleurs

Source unique : `src/styles/tokens.css`, propriétés de rôle exportées dans
`@theme inline` avec les noms shadcn conservés. Les valeurs HEX correspondent
exactement à la palette validée ; pas de conversion approximative nécessaire.

| Token                                         | Valeur / rôle                                |
| --------------------------------------------- | -------------------------------------------- |
| `--background`                                | #F5F6F2, fond général                        |
| `--foreground`, `--primary`                   | #172554, texte principal et action dominante |
| `--card`, `--popover`, `--primary-foreground` | #FFFFFF, surfaces et texte sur Navy          |
| `--card-foreground`, `--popover-foreground`   | texte principal                              |
| `--primary-hover`                             | #24376D                                      |
| `--secondary` / `--secondary-foreground`      | #E9ECE6 / #34443F                            |
| `--muted` / `--muted-foreground`              | #EDF0EB / #55636A                            |
| `--accent` / `--accent-foreground`            | #E4F0EC / #176B66, sélection et liens actifs |
| `--accent-hover`                              | #D5E7E0, nuance disponible                   |
| `--destructive` / `--error-surface`           | #A12835 / #FFF0F1                            |
| `--success` / `--success-surface`             | #28603D / #EDF5DD                            |
| `--warning` / `--warning-surface`             | #82510D / #FFF3D6                            |
| `--info` / `--info-surface`                   | #294D82 / #EAF0FA                            |
| `--border`                                    | #CBD3CA, séparation de surfaces              |
| `--input`                                     | #7B887E, limite des champs                   |
| `--ring`                                      | #245CBB, focus instantané                    |
| `--blue`, `--green`                           | alias compatibles vers info et succès        |

Le pétrole indique une sélection ou une destination, jamais un succès générique.
Chaque statut porte un libellé textuel. Un statut existant de démonstration garde
sa signification ; ces couleurs n’introduisent aucune règle métier automatique.
Les traits de séparation ne sont pas des limites de champs : ils peuvent être
plus discrets. Les bordures de champs sont dessinées avec `--input`.

## Typographie

Inter locale. `--font-body` alimente `--font-sans`. Corps 16 px, interligne 1,6.
`--text-caption` 14 px pour labels et métadonnées ; `--text-body` 16 px ;
`--text-lead` 18 px ; `--text-title` 20 px ; `--text-section` 28 px.
Titres applicatifs généralement 28–32 px ; titre d’accueil 40–64 px.
Poids courants 400, 500 et 600. Titres en casse normale, sans mot isolé coloré.
Labels sans capitales espacées. Chiffres comparables en `tabular-nums`.
Un email long peut se répartir sur plusieurs lignes sans élargir le viewport.

## Espacements et géométrie

Échelle `--space-xs/sm/md/lg/xl/2xl/3xl/4xl` : 4, 8, 12, 16, 24, 32, 48, 64 px.
`gap` organise les éléments voisins. Rayons : `--radius-control` 8 px,
`--radius` 10 px, `--radius-panel` 12 px. Bordures de 1 px, sans changement
d’épaisseur au focus. `--shadow-floating` uniquement pour les menus flottants.
Pas d’ombre sur chaque carte. Surfaces plates, séparateurs et espaces avant
l’ajout d’un panneau. Conteneur public plafonné à 76 rem, compte à 40 rem.

## Primitives et états interactifs

Button et Input : cibles d’au moins 44 px, formulaires confortables à 48 px.
Le bouton principal reste Navy ; le secondaire est bordé ou typographique.
Survol par changement de surface, état pressé discret, focus immédiat de 3 px.
Disabled : attribut natif, opacité et curseur. Aucun focus animé.
Chargement : libellé explicite, `aria-busy`, double soumission toujours protégée
par les mécanismes CAND-016B. Durées disponibles : 120 et 220 ms.
Card sans ombre par défaut, Badge textuel, Separator natif Radix conservé,
Skeleton décoratif masqué aux aides techniques et animation réduite respectée.
FormField conserve les identifiants label/champ/erreur. Feedback distingue
alerte, information et réussite. StatusBadge reprend les tons sémantiques
existants sans déterminer le statut. Aucun composant n’appelle l’API.

## Navigation

Marque vers l’accueil. Navigation publique : Fonctionnalités vers /#approche,
Comment ça marche vers /#apercu. Les visiteurs voient Connexion et Créer mon espace ;
les utilisateurs authentifiés voient Mon espace vers /account, où reste la déconnexion.
Le header consomme exclusivement useAuth : état neutre pendant initialisation ou
refresh, accès au compte neutre si la session est incertaine après une panne.
Aucun état visiteur/authentifié n’est présumé côté serveur. Sous 60 rem, le menu
public remplace la navigation large et se ferme après activation d’un lien.
Le compte utilise ActiveLink avec `aria-current="page"` et soulignement renforcé.
La sidebar de démonstration se replie sous 60 rem. Pas de destination métier
inventée ni de lien Companies/Contacts connecté. Les menus reposent sur
`details/summary`, sans framework de menu supplémentaire.

## Formulaires et feedback

Labels persistants au-dessus du champ, autocomplete et types existants conservés.
Erreurs proches du champ, `aria-invalid` et `aria-describedby` inchangés.
Succès en zone `status`, erreur en zone `alert`, texte toujours explicite.
Les messages neutres de récupération et d’inscription restent neutres ; ne pas
révéler l’existence d’un compte. Les liens email restent de vrais liens d’action,
consommés en mémoire selon CAND-016B. Aucun formulaire ne simule un succès.
L’état de vérification de session n’est pas présenté comme un succès.

## Listes, recherche et futur CRM

La liste de candidatures fictives montre le dossier (entreprise/poste), son
statut et sa date ; le panneau voisin présente la prochaine action. La recherche
locale et l’état vide sont conservés. À faible largeur, les informations se
répartissent sur plusieurs lignes au lieu de disparaître ou de devenir minuscules.
Pour les futurs tableaux : en-têtes en casse normale, chiffres alignés, identité
de ligne et action accessibles sur téléphone, libellés contextuels aux valeurs.
Préférer une liste relationnelle quand les colonnes deviennent illisibles.
Filtres : labels explicites, sélection lisible autrement que par couleur,
réinitialisation et état sans résultat ; n’introduire la logique qu’au ticket CRM.

Le fil futur sera une liste chronologique sémantique avec date, type et contenu,
sans confondre événement manuel et événement système. La prochaine action aura
son verbe, son échéance et son état séparés du statut du dossier. Ni fil métier,
ni endpoints CRM, ni données réelles CRM ne sont implémentés dans ce ticket.

## États d’interface

Chaque région de données prévoit contenu, chargement, vide et erreur.
Skeleton uniquement lorsque la forme attendue est connue ; texte de chargement
pour la session. État vide : ce qui manque, pourquoi et action seulement si elle
existe réellement. Erreur : cause connue et possibilité de reprise existante.
Aucune modale ou bibliothèque de filtres inutilisée n’est ajoutée par anticipation.

## Responsive et accessibilité

Vérifier 320, 375, 768, 1024 et 1280 px, puis les grandes largeurs du marketing.
À 320 px : champs utilisables, boutons autorisant plusieurs lignes si nécessaire,
aucun texte principal tronqué, aucune donnée critique masquée. Les titres ne
forcent pas la largeur. Grilles `minmax(0, 1fr)` ; `overflow-x: clip` sur html/body
comme dernier garde-fou, sans remplacer les vérifications géométriques.
Focus visible, lien d’évitement, titres hiérarchisés, icônes décoratives masquées.
La sélection comporte un trait ou soulignement et un état sémantique.
Les préférences reduced motion désactivent animations et transitions.
La documentation de validation précise ce qui a réellement été contrôlé ; elle
ne prétend pas à une certification WCAG complète.

## Exceptions Hallmark

Palette et police validées priment sur les préférences du catalogue. HEX conservé
pour la fidélité exacte des couleurs. Le scaffold Hallmark a été généré dans /tmp ;
sa base générique `data-slot` n’est pas importée car elle traiterait les slots
shadcn comme des images et pourrait masquer leur contenu. Les principes de base
sont intégrés au CSS existant. Les pages d’application ne reçoivent ni budget
marketing de mots, ni animation de hero. Les traitements auth restent intacts.

## Espace privé CRM — CAND-016UI-CRM

`AccountShell` remplace le gabarit de compte étroit : sidebar de 224 px à partir
de 1024 px, rail de 88 px entre 768 et 1023 px, header compact et navigation
inférieure à trois destinations en dessous. La structure accepte cinq destinations
sans afficher de modules futurs. Le profil et la déconnexion sont accessibles par
l’avatar aux initiales réelles. La destination active combine libellé, trait et
`aria-current`. Le contenu est plafonné à 86 rem.

Les listes utilisent des tableaux à partir de 1024 px et des lignes compactes en
dessous. Chaque nom mène à sa fiche ; le menu d’actions reste un contrôle séparé.
La barre d’outils conserve recherche et filtres sur une ligne lorsque possible.
Les filtres et le sélecteur d’entreprise emploient un `dialog` natif, centré sur
desktop et présenté en panneau inférieur mobile : titre, fermeture, focus contenu,
Échap et restitution du focus. Les panneaux imbriqués se ferment indépendamment.

Les formulaires regroupent informations principales, localisation ou coordonnées,
puis compléments. Les sections facultatives utilisent `details`, sans démonter les
champs ; les sections renseignées s’ouvrent à l’édition. Une erreur ouvre sa section
et focalise le premier champ concerné. Deux colonnes dès 768 px, champs longs sur
la largeur, une colonne mobile. Les aides apparaissent en contexte et les limites
restent validées. Le pied d’actions reste visible au-dessus de la navigation.

Les fiches privilégient identité, actions rapides puis sections de dossier.
Les dates sont repliables ; les actions destructives sont séparées, confirmées en
ligne, avec les conflits métier existants. Les liens email, téléphone et LinkedIn
sont disponibles uniquement avec des coordonnées valides et ne déclenchent aucune
action automatiquement. Les compteurs d’accueil proviennent des totaux API.

Le header, la navigation et les panneaux tiennent compte des safe areas.
`visualViewport` adapte les panneaux et le pied de formulaire lorsque le clavier
réduit la zone visible ; la navigation inférieure s’efface dans ce cas. Ce mécanisme
reste à vérifier sur appareil réel et PWA installée. Focus visible et règles
`prefers-reduced-motion` existants sont conservés et complétés dans `workspace.css`.
La palette, Inter, Tailwind et les primitives shadcn restent inchangés.
