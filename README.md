# 🛡️ GuildForge RPG & Community Engine

> **Le bot Discord d'animation communautaire, leveling et RPG multijoueur ultime — 100% Gratuit à exploiter et prêt à commercialiser.**

---

## 🌟 Points Forts de GuildForge

* 🎮 **100% Gratuit à faire tourner :** Zéro API payante, base SQLite locale ultra-rapide et moteur graphique Canvas natif (`@napi-rs/canvas`).
* 🎨 **Cartes de Profil HD Sublimes (`/rank`) :** Rendu visuel dynamique en Glassmorphism avec barre d'XP, avatar Discord, statistiques (ATK, DEF, PV, Or, Série) et thèmes cosmétiques déblocables (*Cosmique, Inferno, Cyberpunk, Or Impérial*).
* 🐉 **Raids de Boss Multijoueurs en Direct (`/raid`) :** Événements de boss en temps réel dans les salons Discord avec boutons d'action interactifs (`[⚔️ Attaque]`, `[✨ Magie]`, `[🛡️ Défense]`, `[🧪 Potion]`), journal de combat et partage de butin légendaire.
* ⚔️ **Arène de Duels PvP (`/duel`) :** Défiez d'autres membres avec paris d'or en combat singulier au tour par tour.
* 📜 **Quêtes Quotidiennes Dynamiques (`/quests`) :** 3 quêtes journalières assignées chaque jour pour stimuler l'activité vocale et écrite.
* 🎰 **Casino & Mini-Jeux de Taverne (`/gamble`, `/trivia`) :** Coinflip, Lancer de dés, Blackjack interactif et Quiz de culture pop/gaming.
* 👑 **Rôles Récompenses & Multiplicateur XP (`/config`) :** Attribution automatique de rôles Discord aux niveaux franchis et personnalisation du serveur.

---

## 📋 Liste Complète des Commandes Slash

| Commande | Catégorie | Description |
| :--- | :---: | :--- |
| `/rank [membre]` | 🎨 Profil | Génère la carte graphique HD avec niveau, stats et thème actif |
| `/leaderboard` | 🏆 Profil | Classement interactif des meilleurs aventuriers du serveur |
| `/daily` | 🪙 Économie | Récompense quotidienne d'Or et d'XP avec multiplicateur de streak |
| `/balance [membre]` | 💼 Économie | Consulte la bourse d'or, le coffre-fort et les statistiques de combat |
| `/raid spawn` | 🐉 RPG | Invoque un Boss de Raid légendaire multijoueur *(Admin)* |
| `/raid status` | 🐉 RPG | Affiche l'état et la barre de vie du Boss en cours |
| `/duel <adversaire> <mise>` | ⚔️ RPG | Lance un duel PvP avec mise d'or et combat interactif |
| `/inventory` | 🎒 RPG | Consulte et équipe vos armes, armures et thèmes de cartes |
| `/shop [categorie]` | 🛒 RPG | Boutique interactive pour acheter équipements et cosmétiques |
| `/quests` | 📜 RPG | Affiche la progression des 3 quêtes du jour et réclame l'or |
| `/gamble coinflip / dice / blackjack` | 🎲 Jeux | Mini-jeux de hasard de la taverne pour parier de l'or |
| `/trivia` | 🧠 Jeux | Grand Quiz de culture générale et gaming avec gains d'or |
| `/config` | ⚙️ Admin | Configuration des salons, rôles récompenses et taux d'XP |

---

## 🚀 Guide de Démarrage Rapide

### 1. Prérequis
* **Node.js** version 20 ou supérieure (v24+ recommandé).
* Un compte Discord.

### 2. Créer l'application sur le Discord Developer Portal
1. Rendez-vous sur le [Discord Developer Portal](https://discord.com/developers/applications).
2. Cliquez sur **New Application** et donnez-lui un nom (ex: `GuildForge`).
3. Allez dans l'onglet **Bot** :
   * Cliquez sur **Reset Token** et copiez votre **Token**.
   * Activez impérativement les **Privileged Gateway Intents** :
     * ✅ **Presence Intent**
     * ✅ **Server Members Intent**
     * ✅ **Message Content Intent**
4. Allez dans l'onglet **OAuth2** :
   * Copiez le **Client ID** (Application ID).
   * Dans **OAuth2 URL Generator** :
     * Cochez `bot` et `applications.commands`.
     * Permissions du bot : `Administrator` (ou `Manage Roles`, `Send Messages`, `Embed Links`, `Attach Files`, `Use External Emojis`).
     * Utilisez le lien généré pour inviter le bot sur votre serveur de test.

### 3. Configurer l'environnement
Créez un fichier `.env` à la racine du projet (copiez `.env.example`) :

```env
DISCORD_TOKEN=votre_token_de_bot_ici
CLIENT_ID=votre_client_id_ici
DEV_GUILD_ID=id_de_votre_serveur_pour_deploiement_rapide (optionnel)
```

### 4. Enregistrer les Commandes Slash
Exécutez la commande suivante pour déployer instantanément toutes les commandes slash auprès de Discord :
```bash
npm run deploy-commands
```

### 5. Démarrer le Bot
* **En mode développement (rechargement automatique) :**
  ```bash
  npm run dev
  ```
* **En production :**
  ```bash
  npm run build
  npm start
  ```

---

## 💎 Stratégie de Commercialisation (Monétisation)

GuildForge est conçu pour être facilement monétisé via :
1. **Abonnements d'Applications Discord (Discord App Subscriptions) :**
   * Tiers VIP à 2.99€ ou 4.99€/mois offrant un multiplicateur d'XP permanent (+50%), des thèmes de cartes exclusifs (Or Impérial, Cyberpunk 2077) et des objets légendaires dans la boutique.
2. **Version Premium pour Serveurs (Guild Premium) :**
   * Multiplicateur d'XP x2 pour tout le serveur.
   * Boss de Raids personnalisés (nom, image et PV paramétrables par les gérants du serveur).
   * Salon de logs et statistiques d'activité communautaire détaillées.
3. **Packs Cosmétiques & Badges :**
   * Vente de badges de profil personnalisés et cosmétiques de cartes.

---

## 🎨 Identité Visuelle

* **Logo / Avatar (1:1) :** [assets/logo.jpg](file:///c:/Users/maxime/Desktop/Projet/Bot%20Discord/NewBot/assets/logo.jpg)
* **Bannière Officielle (680x240 - 17:6) :** [assets/banner.png](file:///c:/Users/maxime/Desktop/Projet/Bot%20Discord/NewBot/assets/banner.png)

