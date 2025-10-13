# Moodly – Journal d'humeurs pour le RSE

Moodly est une application mobile moderne (Expo/React Native) associée à une base de données Supabase. Elle permet aux employés de loguer leur humeur, partager le contexte et donner de la visibilité à leur manager et à la RH tout en respectant l’anonymat. Côté manager, une vue unique présente les tendances des 30 derniers jours pour piloter le bien-être de l’équipe.

## Structure du repo

- `app`, `components`, `hooks`, `services`, `types`, `constants` – application Expo Router.
- `assets`, `scripts` – ressources partagées.

## Prérequis

- Node.js 20.x et npm 10.x (Expo 54 est aligné sur cette version).
- Expo CLI (`npm install -g expo` recommandé) pour le développement mobile.
- Supabase (compte gratuit) pour l’auth et la base.

## Variables d’environnement

Crée un fichier `.env` à la racine du projet Expo (même niveau que `package.json`). Exemple :

```bash
EXPO_PUBLIC_SUPABASE_URL=<url_supabase>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key_supabase>
```

> ⚠️ En dev, l’auth Supabase utilise l’email/mot de passe (ou magic link). Crée un utilisateur dans l’Auth de Supabase et configure si besoin `user_metadata.role` parmi `employee|manager|hr`.

```bash
APP_KEYS=appKey1,appKey2
API_TOKEN_SALT=apiTokenSalt
ADMIN_JWT_SECRET=adminJwtSecret
JWT_SECRET=jwtSecret
```

## Lancer les environnements

```bash
pnpm install
pnpm start

# 3. Démarrer l'app mobile (dans un autre terminal)
cd ..
npx expo start
```

## Modèle de données Supabase (suggestion)

`Mood entry`

- `moodValue` (1–5) et `moodLabel` (`awful` → `great`).
- `context` (`personal`, `professional`, `mixed`).
- `isAnonymous`, `reasonSummary`, `note`, `loggedAt`.
- Relations : `categories` (many-to-many), `loggedBy` (user), `team`, `additionalViewers`.
- Composant `privacy.visibility-settings` pour partager les raisons par population (collègues / manager / RH / custom).

`Mood category`

- Catégories préseedées (Charge de travail, Reconnaissance, Relations, Santé perso, Vie perso, Autre) avec emoji.

`Team`

- Nom + slug.
- Relations manager, membres, contacts RH.

### Bootstrap Strapi

Lors du démarrage, `src/index.ts` :

- Crée les rôles U&P `employee`, `manager`, `hr` si absents.
- Seed les catégories d’humeur par défaut.

Configure ensuite :

1. Permissions publiques/authentifiées pour les routes `mood-entries`, `mood-categories`, `teams` selon ton besoin.
2. Crée un token API ou implémente la connexion JWT (voir TODO).
3. Associe les utilisateurs aux rôles `employee`, `manager`, `hr`.

## Application mobile – parcours clés

- **Login (placeholder)** : permet de choisir un prénom et un rôle pour explorer les écrans.
- **Feed (`/(tabs)/index`)** : liste des humeurs partagées par l’équipe avec carte détaillée, badges de visibilité, refresh.
- **Log (`/(tabs)/log`)** : formulaire complet pour publier une humeur (sélecteur emojis, contexte, catégories, commentaire, anonymat et règles de visibilité).
- **Historique (`/(tabs)/history`)** : regroupe les logs par journée, calcule la moyenne et les jours positifs.
- **Manager (`/(tabs)/manager`)** : accès conditionnel (manager/HR) avec carte moyenne 30 jours, mini-graph barres et focus par collaborateur.

`services/mood.ts` encapsule les appels à Supabase (feed/historique, création de log). `hooks/use-mood-feed.ts`, `use-mood-history.ts`, `use-mood-categories.ts` gèrent la consommation côté client.

## Étapes suivantes suggérées

1. **Authentification Supabase** :
   - Connexion via email/mot de passe (`supabase.auth.signInWithPassword`).
   - Récupérer le JWT côté app (SecureStore) et l’injecter dans `apiFetch`.
   - Protéger `mood-entries` (create/update) pour `employee`, et exposer une route managériale filtrée.
2. **Règles de visibilité** :
   - Enforcer côté SQL/RLS (Row Level Security) dans Supabase avec policies par rôle.
   - Créer des vues ou RPC pour les agrégations (tendances).
3. **Notifications & rappels** :
   - Utiliser Expo Notifications pour le push (rappel quotidien à 15h par exemple).
   - Créer une CRON Strapi pour envoyer l’alerte si `mood` pas logué.
4. **Tests & CI** :
   - Ajouter des tests unitaires sur les services/hook.
   - Mettre en place ESLint + Prettier + Husky si besoin.
5. **UI polish** :
   - Connecter un design system (Tamagui, Restyle ou Tailwind) ou intégrer la charte Moodly.
   - Ajouter un mode sombre complet (les styles utilisent déjà des couleurs neutres).

## Ressources utiles

- [Expo Router](https://docs.expo.dev/router/introduction/) – navigation déclarative.
- [Supabase JS](https://supabase.com/docs/reference/javascript) – client JS officiel.
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) – stockage sécurisé si besoin.

---

N’hésite pas à me dire si tu veux que l’on branche l’auth complète, la notif globale ou des dashboards plus avancés.
