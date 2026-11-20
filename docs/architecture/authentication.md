# Authentification web — CAND-016B

## Matrice inspectée avant implémentation

Préfixe backend exact : `/api/v1`. Erreurs normalisées CAND-016A :
400 validation/lien invalide ; 401 identité/session refusée ; 403 CSRF/Origin ;
429 limite avec Retry-After ; réseau/503 panne temporaire.

| Fonctionnalité       | Route                     | Méthode/payload                        | Réponse                                                        | Auth/cookie/CSRF                                         | Écran                |
| -------------------- | ------------------------- | -------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- | -------------------- |
| Inscription          | /auth/register            | POST email,password,firstName,lastName | 202 success,message neutre ; pas de session                    | Public                                                   | /register            |
| Vérification         | /auth/verify-email        | POST token                             | 200 success,message ; pas de session                           | Public                                                   | /verify-email        |
| Renvoi               | /auth/resend-verification | POST email                             | 202 réponse neutre                                             | Public                                                   | /verify-email        |
| Connexion            | /auth/login               | POST email,password                    | 200 accessToken,tokenType Bearer,expiresIn,user                | Cookie HttpOnly posé ; Origin exacte + X-Candidly-CSRF:1 | /login               |
| Renouvellement       | /auth/refresh             | POST sans corps                        | 200 accessToken,tokenType,expiresIn                            | Cookie HttpOnly tournant ; Origin + CSRF                 | Gestionnaire mémoire |
| Déconnexion          | /auth/logout              | POST sans corps                        | 204, cookie effacé                                             | Cookie + Origin + CSRF                                   | /account             |
| Identité             | /auth/me                  | GET                                    | PublicUserDto                                                  | Bearer                                                   | Initialisation       |
| Profil               | /users/me                 | GET / PATCH firstName et/ou lastName   | PublicUserDto                                                  | Bearer                                                   | /account/profile     |
| Préférences          | /users/me/preferences     | GET / PATCH locale et/ou timezone      | locale,timezone,createdAt,updatedAt                            | Bearer                                                   | /account/profile     |
| Demande récupération | /auth/forgot-password     | POST email                             | 202 message neutre                                             | Public                                                   | /forgot-password     |
| Réinitialisation     | /auth/reset-password      | POST token,newPassword                 | 200 success,message ; révoque toutes sessions et efface cookie | Public, pas de CSRF exigé par ce contrôleur              | /reset-password      |

PublicUserDto : id,firstName,lastName,email,emailVerifiedAt,createdAt. Aucun état
interne. Login n'active pas un compte non vérifié : même 401 que mauvais mot de
passe. Vérification invalide/expirée/consommée : même 400, impossible à distinguer
sans changer le contrat, donc message regroupant les trois cas. Inscription,
renvoi et demande de récupération sont neutres contre l'énumération.

Email trim/lower, max254 ; noms trim 1–100 ; mots de passe 12–128 sans trim ni
règle de composition supplémentaire ; token opaque base64url 43 caractères.
Profil : prénom/nom seulement, jamais email/userId ; préférences locale fr et
fuseau IANA pris en charge par Node, plus UTC, max100. PATCH non vide et non null.
Les contrôleurs actuels ne fournissent pas d'erreur par champ : validation client
locale et erreur serveur générale, sans inventer de détail.

## Architecture et routes

`features/auth/api.ts` décrit les services publics et leurs réponses sélectionnées ;
`types.ts` expose User/Preferences sans credential. `session.ts` porte le cycle de
vie. AuthProvider conserve une seule instance navigateur, y compris sous Strict
Mode ; aucune instance authentifiée partagée sur le serveur. useAuth utilise
useSyncExternalStore, avec snapshot serveur initializing. Le client CAND-016A
reste la seule couche HTTP et contrôle origine, no-store, credentials et CSRF.

Le dashboard `/dashboard` reste une démonstration publique avec ses données
fictives inchangées. `/account` est le nouvel espace privé réel, et
`/account/profile` charge le profil et les préférences après validation de la
session. Ces routes n'affichent aucun CRM réel. L'utilisateur voit explicitement
la distinction et peut ouvrir la démo séparément.

Les routes privées servent uniquement une coquille/état de chargement en SSR.
PrivateRoute ne monte les composants de données que dans l'état authenticated,
redirige vers `/login` après unauthenticated, et affiche une reprise en cas
d'erreur temporaire. Aucune autorisation SSR inventée et aucun proxy de cookie.
Une protection client n'est pas un contrôle d'ownership : NestJS reste l'autorité.
Les pages compte/auth sont noindex et sans referrer. Les réponses privées passent
par no-store ; pas de service worker ou cache privé ajouté.

## Session et concurrence

Initialisation unique : refresh HttpOnly puis GET `/auth/me` avec le nouveau
Bearer, avant de publier authenticated. Un rechargement repart sans access token
et restaure la session par ce parcours. Le login lit également me avant de
confirmer l'identité. Les états sont initializing/authenticated/refreshing/
unauthenticated/error. Pas de redirection pendant initializing ou refreshing.

Token en mémoire privée du gestionnaire, jamais dans le snapshot React, l'URL,
localStorage/sessionStorage, cookie JS ou logs. Aucune lecture JavaScript du
refresh. L'expiration locale est calculée depuis expiresIn ; avant une requête
protégée, un token proche de l'échéance (5 secondes) est renouvelé avant tout
envoi de mutation. Aucun intervalle de refresh en arrière-plan.

Le single-flight CAND-016A est réutilisé et étendu au parcours refresh + me :
plusieurs composants attendent la même Promise. Les opérations login/refresh/
logout sont également sérialisées pour gérer l'ordre des Set-Cookie. Finally
libère le vol après succès ou erreur. Un GET privé 401 est rejoué **une fois**
après refresh. Un POST/PATCH/DELETE déjà envoyé n'est jamais rejoué : refus de
session, nettoyage et nouvelle connexion/soumission explicite. Actuellement le
gestionnaire n'autorise que les deux routes de profil/préférences ; aucun CRM.

Une version mémoire de token, distincte de la chaîne JWT, évite de renouveler
encore sur un ancien 401 reçu après une rotation terminée. Le JWT peut être
identique s'il est émis dans la même seconde ; la coordination ne dépend donc pas
de sa seule égalité. Le mécanisme ne s'appelle pas récursivement et ne boucle pas.

Un compteur de génération invalide les réponses en retard après logout,
changement de compte ou refus définitif. Logout retire immédiatement l'utilisateur
et le contenu privé, puis attend les opérations de session actives avant le POST
serveur : un Set-Cookie tardif ne peut ainsi rétablir la connexion locale. Les
réponses de profil ou login anciennes ne restaurent jamais l'ancien utilisateur.

Un 401 de refresh/me nettoie définitivement la session et autorise la reconnexion.
Réseau, 429 ou panne temporaire donnent error et une reprise explicite, sans
conclure à une révocation. Un échec réseau au logout retire les données locales
mais ne prétend pas avoir révoqué le serveur : message et bouton de confirmation
sur login. Une recharge ultérieure peut retrouver un cookie encore valide si la
révocation n'a pas atteint le serveur ; il faut alors réessayer le logout.

Une instance mémoire ne coordonne pas plusieurs onglets/workers. La rotation
stricte peut provoquer une révocation en cas de renouvellements inter-onglets ;
les onglets concernés demanderont une reconnexion au prochain refus. Aucun jeton
n'est partagé ou persisté pour contourner cette règle. Un stockage de synchronisation
inter-onglets ou proxy SSR n'est pas introduit dans ce ticket.

## Formulaires et jetons d'action

Labels, autocomplete, bornes, erreurs locales liées aux champs, état loading,
disabled et verrou de double soumission. Messages d'inscription/récupération et
renvoi neutres. Les 401 login restent communs ; 429 respecte Retry-After sans
boucle automatique. Les erreurs du serveur sont générales, puisqu'il n'expose
pas de détails par champ. Aucun returnUrl n'est utilisé : destinations fixes
/account et /login, donc aucune redirection ouverte.

Les emails backend utilisent `/verify-email#token=...` et
`/reset-password#token=...`, pas une query. Ces jetons d'action à usage unique
sont la seule exception transitoire liée au contrat de lien existant : lus depuis
le fragment côté client, vérifiés par regex, puis retirés immédiatement de
l'adresse avec replaceState. Query/fragment ambigu refusés, jamais stockés en
mémoire durable. Ni access token ni refresh token n'apparaissent dans une URL.
L'envoi du jeton se fait dans le corps POST, après action explicite ; Strict Mode
ne déclenche pas deux vérifications. Le jeton est effacé après succès.

Le reset révoque les sessions côté API, puis invalide l'état local ; aucun login
automatique. Le profil ne permet que prénom/nom. L'email est en lecture seule,
locale fr conservée et fuseau éditable parmi les valeurs IANA/UTC supportées.

## Développement et déploiement

En local, fournir NEXT_PUBLIC_API_URL vers l'API `/api/v1`, avec le même hostname
et schéma que FRONTEND_URL ; celle-ci doit figurer dans CORS_ORIGIN. Le client
central joint credentials include et le header X-Candidly-CSRF:1 pour les trois
POST session ; Origin est fourni par le navigateur. Les routes publiques de
vérification/récupération n'inventent pas d'exigence CSRF absente de leurs guards.

En production : frontend et API HTTPS sur le même site, cookie host-only API,
HttpOnly/Secure/SameSite Strict/Path=/api/v1/auth inchangés, origine CORS explicite.
Include ne contourne pas SameSite. Les sous-domaines de sites différents ne sont
pas supportés par cette politique ; aucune exception None ou désactivation CSRF.
Masquer Authorization, Cookie, Set-Cookie et les corps sensibles dans les proxies.

EMAIL_TRANSPORT=disabled ne produit aucun email. Pour un essai manuel autorisé,
utiliser le transport backend local et son répertoire privé EMAIL_LOCAL_DIRECTORY
(non versionné) : il prépare des JSON, n'envoie pas d'email externe. Ouvrir le
lien depuis ce fichier sans le publier dans des logs ou tickets. En test, le
harnais capture les messages dans un répertoire privé /tmp, traite explicitement
les demandes puis nettoie ses seuls comptes et fichiers. Aucun token de test
n'est ajouté au dépôt. Voir le
[rapport et les commandes reproductibles](../development/cand-016b-validation.md).
