# Moodly

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tamagui-000?style=for-the-badge&logo=tamagui&logoColor=white" alt="Tamagui">
</p>

Une application mobile moderne pour le suivi de l'humeur en entreprise. Moodly permet aux employés de partager leur ressenti quotidien de manière simple et sécurisée, tout en offrant aux managers et aux RH une vue d'ensemble pour veiller au bien-être de leurs équipes.

---

## 📋 Table des matières

1.  [Technologies Utilisées](#-Technologies-Utilisées)
2.  [Démarrage Rapide](#️-démarrage-rapide)
3.  [Accédez au dossier du projet](#-Accédez-au-dossier-du-projet)

## 🚀 Technologies Utilisées

| Domaine              | Technologie                                                          | Description                                                        |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Framework Mobile** | [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) | Base du projet pour le développement mobile multiplateforme.       |
| **Backend (BaaS)**   | [Supabase](https://supabase.com/)                                    | Gestion de l'authentification et de la base de données PostgreSQL. |
| **Navigation**       | [Expo Router](https://docs.expo.dev/router/introduction/)            | Système de navigation                                              |
| **UI & Style**       | [Tamagui](https://tamagui.dev/)                                      | Bibliothèque de composants                                         |
| **Langage**          | [TypeScript](https://www.typescriptlang.org/)                        |

## 🛠️ Démarrage Rapide

Suivez ces étapes pour lancer le projet en local.

### 1. Prérequis

- [Node.js](https://nodejs.org/) (version 20.x ou supérieure)
- [npm](https://www.npmjs.com/) (`pnpm` ou `yarn` fonctionnent aussi)
- Un compte et un projet sur [Supabase](https://supabase.com/)

### 2. Installation

## Clonez ce dépôt

Avec https

```bash
git clone https://github.com/antilope63/Moodly.git
```

Avec SSH

```bash
git clone git@github.com:antilope63/Moodly.git
```

Avec GitHub CLI

```bash
gh repo clone antilope63/Moodly
```

## 📁 Accédez au dossier du projet

```bash
cd moodly
```

## Installez les dépendances

```bash
npm install
```

### 3. Configuration

Pour créer un fichier .env à la racine du projet, copiez la commande ci-dessous puis ajoutez vos clés d'environnement Supabase dans le fichier .env créé :

#### ⚠️ Sur mac OS et linux :

```bash
cat <<'EOF' > .env
EXPO_PUBLIC_SUPABASE_URL=VOTRE_URL_SUPABASE
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLÉ_ANON_SUPABASE
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLÉ_SERVICE_SUPABASE
EOF
echo ".env créé avec succès ✅"
```

#### ⚠️ Sur Windows :

```bash
"EXPO_PUBLIC_SUPABASE_URL=VOTRE_URL_SUPABASE
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLÉ_ANON_SUPABASE
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLÉ_SERVICE_SUPABASE" | Out-File -Encoding utf8 .env

Write-Host ".env créé avec succès ✅"
```

Vous trouverez ces informations dans les paramètres **API** de votre projet Supabase

### 4. Lancement de l'application

Une fois l'installation et la configuration terminées, lancez le serveur de développement Expo :

```bash
npx expo start
```

Scannez ensuite le QR code avec l'application Expo Go sur votre téléphone
