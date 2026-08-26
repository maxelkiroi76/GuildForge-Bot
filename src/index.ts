import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { initDatabase } from './database/db.js';
import { handleReady } from './events/ready.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate.js';
import { startKofiWebhookServer } from './services/kofiWebhook.js';

// 1. Initialize SQLite Database
initDatabase();

// 2. Instantiate Discord Client with required Intents & Partials
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

// 3. Register Event Listeners
client.once(Events.ClientReady, () => {
  handleReady(client);
  // Start automated Ko-fi webhook listener
  startKofiWebhookServer(client);
});
client.on(Events.InteractionCreate, (interaction) => handleInteractionCreate(interaction));
client.on(Events.MessageCreate, (message) => handleMessageCreate(message));
client.on(Events.VoiceStateUpdate, (oldState, newState) => handleVoiceStateUpdate(oldState, newState));

// 4. Error Handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promesse non gérée rejetée :', promise, 'raison :', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non interceptée :', error);
});

// 5. Connect to Discord Gateway
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'your_bot_token_here') {
  console.warn('⚠️ ATTENTION : La variable DISCORD_TOKEN n\'est pas encore configurée dans le fichier .env !');
  console.warn('👉 Créez un fichier .env basé sur .env.example et ajoutez votre Token de bot Discord.');
} else {
  client.login(token).catch((err) => {
    console.error('❌ Échec de la connexion à Discord Gateway :', err.message);
  });
}
