# Architecture frontend — CAND-004

Deux dépôts indépendants : `candidly-web` pour le web/PWA et `candidly-api` pour
l'API REST NestJS sous `/api/v1`. Le frontend ne se connecte jamais à PostgreSQL.
Le backend reste un monolithe modulaire ; PostgreSQL est la source de vérité,
Redis/BullMQ gère les traitements asynchrones et les documents professionnels
utiliseront un stockage objet privé compatible S3 avec URLs signées temporaires.
Ces responsabilités backend ne sont pas implémentées ici.

## Structure

```text
src/
  app/
    layout.tsx                    # langue, police locale, SEO et thème
    (public)/layout.tsx, page.tsx  # accueil et navigation publique
    (auth)/                       # emplacement réservé, aucune route fictive
    (dashboard)/layout.tsx
    (dashboard)/dashboard/page.tsx
    manifest.ts, robots.ts, opengraph-image.tsx, not-found.tsx
  components/
    ui/                           # primitives shadcn/ui adaptées
    layout/                       # marque, header, sidebar, navigation mobile
    shared/                       # démonstrations et états d'interface
  features/                       # réservé, aucun module métier anticipé
  hooks/                          # réservé, aucune abstraction artificielle
  lib/
    api/                          # configuration et requêtes HTTP centralisées
    utils/                        # fusion des classes Tailwind
    validations/                  # réservé aux schémas des prochains tickets
  types/                          # conventions de réponse API
  styles/globals.css              # tokens Candidly et styles responsive
public/icons/                     # assets PWA locaux
```

Les pages et layouts sont des Server Components. Les composants clients sont
limités à la recherche locale, au sélecteur d'états et aux primitives qui en ont
besoin. Les exemples sont dans `components/shared/demo-data.ts`, jamais dans la
couche API. Le dashboard reste une démo publique distincte ; le compte réel /account est
protégé par le gestionnaire d'authentification CAND-016B, sans intégration CRM.

## Client API

Le client utilise la base publique validée, les credentials vers l'API configurée,
les erreurs contrôlées, le CSRF de session et un refresh partagé par instance.
Aucune page actuelle n'appelle l'API. Voir le
[contrat HTTP/sessions CAND-016A](http-sessions.md).

## Design system et accessibilité

`components.json` déclare le style `new-york`, Tailwind v4, les aliases et les
variables CSS. Les primitives locales adaptées de shadcn/ui sont Button, Card,
Input, Badge, Separator et Skeleton. Les éléments interactifs principaux font
au moins 44 px ; les contrôles ont un focus visible et les formulaires ont un label.
Les navigations mobiles utilisent `details/summary`, sans dépendance de menu lourde.

Palette CAND-016UI : Navy `#172554`, fond grège `#F5F6F2`, pétrole `#176B66`,
sélection douce `#E4F0EC`, texte secondaire `#55636A` et feedback sémantique.
Inter est intégrée via `@fontsource/inter`, sans requête Google Fonts au build.
Les variantes de statuts emploient des textes plus sombres sur fonds pastel.
Loading, empty, error et success sont démontrables explicitement et sans backend.

## PWA et indexation

Manifest typé Next.js, icônes PNG standard 192/512 px, maskable avec zone sûre,
icône Apple et thème Navy. Aucun service worker, stockage de tokens, cache API
privé ou synchronisation offline. La présence du manifest n'est pas une preuve
d'installation sur appareil : cette validation reste distincte.
Le dashboard déclare `noindex, nofollow` et `robots.txt` le désautorise.
Les métadonnées Open Graph utilisent la base localhost pour ce ticket local.

## Sources

- [Installation Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Installation manuelle shadcn/ui](https://ui.shadcn.com/docs/installation/manual)
- [Tailwind pour Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)

- [Authentification réelle — CAND-016B](authentication.md).

## Identité visuelle — CAND-016UI

La direction validée **Le fil professionnel** conserve Navy et Inter, avec un
fond grège, une sélection pétrole et des couleurs de feedback distinctes.
Voir le [design system](../design/design-system.md) et le [rapport de validation](../development/cand-016ui-validation.md).

- [Intégration frontend CRM](crm-frontend.md)
