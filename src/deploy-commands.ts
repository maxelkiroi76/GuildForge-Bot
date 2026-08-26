import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commandList } from './commands/index.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const devGuildId = process.env.DEV_GUILD_ID;

if (!token || token === 'your_bot_token_here') {
  console.error('❌ DISCORD_TOKEN manquant dans le fichier .env.');
  process.exit(1);
}

if (!clientId || clientId === 'your_client_id_here') {
  console.error('❌ CLIENT_ID manquant dans le fichier .env.');
  process.exit(1);
}

const commandsData = commandList.map(cmd => cmd.data.toJSON());
const rest = new REST({ version: '10' }).setToken(token);

async function deploy() {
  try {
    console.log(`⏳ Enregistrement de ${commandsData.length} commandes slash...`);

    if (devGuildId && devGuildId.trim() !== '') {
      // Fast guild-specific deployment for instant development updates
      console.log(`📌 Déploiement instantané sur le serveur de test : ${devGuildId}`);
      await rest.put(
        Routes.applicationGuildCommands(clientId!, devGuildId),
        { body: commandsData }
      );
      console.log('✅ Commandes enregistrées avec succès sur le serveur de test !');
    } else {
      // Global deployment for all servers
      console.log('🌐 Déploiement global sur tous les serveurs Discord...');
      await rest.put(
        Routes.applicationCommands(clientId!),
        { body: commandsData }
      );
      console.log('✅ Commandes enregistrées globalement avec succès ! (Peut prendre quelques minutes à se propager)');
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes :', error);
  }
}

deploy();
