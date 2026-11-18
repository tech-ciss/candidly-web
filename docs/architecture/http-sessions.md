# Client HTTP et sessions — CAND-016A

`NEXT_PUBLIC_API_URL` est l'unique base publique, avec préfixe `/api/v1`.
Configuration locale : voir `.env.example`. URL absolue HTTP(S), sans identifiants,
query ni fragment ; HTTPS obligatoire en production. Une valeur manquante ou
invalide produit une erreur explicite avant fetch, sans repli localhost. La
variable publique Next.js est intégrée au build : la définir pour chaque
construction de déploiement. Aucun secret ne doit y figurer.

## Requêtes

`createApiClient()` valide et fige la base ; conserver une instance dans la future
couche d'authentification navigateur. `client.request<T>(path, options)` accepte
GET/POST/PATCH/DELETE et les options fetch ordinaires. Le chemin commence par `/`,
est relatif au préfixe, sans origine, remontée de répertoire, query ou fragment.
La query passe par `options.query: URLSearchParams` (pagination, recherche, dates).
Le corps est transmis sans transformation : JSON.stringify et Content-Type
restent à la charge de l'appelant. UUID et dates ISO restent des chaînes.

```ts
const client = createApiClient();
await client.request('/tasks', {
  method: 'GET',
  query: new URLSearchParams({ page: '1', limit: '20' }),
  headers: { Authorization: `Bearer ${accessTokenEnMemoire}` },
});
```

Credentials include, cache no-store, mode cors et redirect error sont imposés,
même si un appelant JavaScript fournit des options contraires. Les redirections
sont refusées pour ne pas transmettre cookies ou Authorization vers une autre
origine. Les chemins externes sont refusés avant réseau ; aucune modification
globale de fetch. Huit secondes maximum, signal d'annulation appelant combiné.

204/205 et succès sans corps donnent undefined ; succès JSON donne le payload
sans enveloppement. JSON illisible : ApiError INVALID_RESPONSE. Le générique T
n'est pas une validation runtime : les futurs services vérifieront leurs contrats.
`apiRequest<T>` reste disponible pour les appels simples, mais crée une instance
par appel ; utiliser l'instance conservée pour les opérations de session.

## Erreurs contrôlées

ApiError contient status (null pour réseau), code, message, requestId UUID si
présent et retryAfter optionnel. Les codes HTTP normalisés connus sont conservés
seulement si la structure `{success:false,error:{code,message}}` est valide et le
code concorde avec le statut. Les messages affichables sont les messages français
contrôlés du contrat API, jamais un texte arbitraire du serveur. Un futur code
métier doit être ajouté explicitement à ce contrat avant d'être présenté.

Erreur non JSON, vide ou malformée : statut conservé, HTTP_ERROR et message
générique. Réseau/annulation/timeout/lecture interrompue : NETWORK_ERROR, aucun
détail brut. Aucun log de corps, cookie ou token. RequestId vient du header
X-Request-Id, ou d'un champ requestId UUID si présent dans le JSON. Retry-After
conserve une durée décimale ou une date HTTP valide, sans attendre ni rejouer
automatiquement. L'API expose ces deux headers via CORS.

## Cookie et CSRF

`client.sessionRequest('login', body)`, `client.refresh()` et
`client.sessionRequest('logout')` centralisent les POST `/auth/*` avec
X-Candidly-CSRF: 1 et credentials include. Login sérialise le JSON ; refresh et
logout n'ont pas besoin d'un corps. L'Origin est produit par le navigateur,
jamais forgé par le client. Le backend exige Origin = FRONTEND_URL exactement,
plus le header de valeur 1, y compris au login/logout sans cookie. Aucun retrait
du contrôle CSRF. Les appels ordinaires n'ajoutent pas automatiquement ce header.

Le refresh est un cookie HttpOnly, host-only (sans Domain), Path=/api/v1/auth,
SameSite Strict, Secure en production. JavaScript ne lit ni Cookie ni Set-Cookie.
Le login doit utiliser include pour accepter Set-Cookie ; refresh/logout pour
transmettre le cookie. Le navigateur applique aussi Path et SameSite : include
ne contourne aucune de ces restrictions. Les ressources CRM utilisent le Bearer
fourni par la future couche d'authentification, qui gardera l'access token en
mémoire. Aucun localStorage/sessionStorage, cookie JS ou persistance de JWT.

## Refresh partagé

`client.refresh()` retourne exactement la même Promise à tous les demandeurs tant
qu'elle est active. `sessionRequest('refresh')` passe par ce même mécanisme. Le
résultat minimal accessToken/tokenType/expiresIn est validé ; aucun token n'est
conservé dans le client après livraison. Finally libère la Promise après succès,
échec HTTP, réseau ou JSON invalide ; tous les dépendants partagent le même
résultat/échec. Un nouvel appel explicite peut ensuite tenter une opération.

Aucun renouvellement sur 401 automatique, aucun rejeu GET/mutation, aucune boucle.
Ne pas appeler manuellement request('/auth/refresh') : ce niveau bas contournerait
la coordination. La future couche CAND-016B décidera de la reprise explicite des
requêtes rejouables, de l'effacement mémoire et de la reconnexion. Aucun écran ni
système de session UI n'est créé ici.

Une instance = un contexte mémoire. Aucun verrou entre onglets, workers, instances
ou appareils. La rotation serveur révoque une session en cas de réutilisation ;
une course entre onglets ou une réponse perdue peut donc exiger une reconnexion.
Ne pas partager de client authentifié entre utilisateurs côté serveur. Fetch
Node ne transmet pas spontanément les cookies du navigateur : un éventuel proxy
SSR de sessions exige un contrat distinct, il n'est pas implémenté.

## Déploiement et origin/site

Origin = schéma + hôte + port. Site = schéma et domaine enregistrable, les ports
ne définissent pas le site. Deux sous-domaines HTTPS du même site peuvent avoir
des origines distinctes : app.example.com et api.example.com sont des exemples
conceptuels, jamais des valeurs ajoutées à la configuration.

Pour ce modèle, configurer NEXT_PUBLIC_API_URL sur l'API HTTPS `/api/v1`,
FRONTEND_URL sur l'origine frontend exacte et CORS_ORIGIN avec cette origine
explicite ; credentials true, aucun wildcard. Le cookie reste host-only sur
l'API, Secure/HttpOnly/Strict inchangés. Le proxy doit conserver Origin et masquer
Authorization, Cookie et Set-Cookie dans ses logs. HTTPS doit couvrir les deux
origines. En local, employer le même hostname et le même schéma des deux côtés,
avec ports différents ; ne pas mélanger localhost et 127.0.0.1.

Un déploiement sur deux sites différents est incompatible avec Strict. Une
évolution ultérieure demanderait une décision explicite (éventuel SameSite None
avec Secure, restrictions des cookies tiers, CSRF/Origin, confiance des domaines,
proxy même site et prévention XSS). Aucun passage à None, Domain partagé,
exception CORS ou assouplissement CSRF dans ce ticket.

## Périmètre

Aucune page login/register, donnée de dashboard, règle CRM, service CRM complet,
cache privé ou service worker modifié. La démonstration reste publique et fictive.
Les conditions inter-onglets et la couche d'authentification UI restent à traiter
avant CAND-016B. Voir le [rapport](../development/cand-016a-validation.md).
