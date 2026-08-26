import { Client, ActivityType } from 'discord.js';

export function handleReady(client: Client): void {
  console.log(`\n=================================================`);
  console.log(`🛡️  GuildForge RPG Engine opérationnel !`);
  console.log(`🤖 Connecté en tant que : ${client.user?.tag}`);
  console.log(`🌐 Serveurs connectés : ${client.guilds.cache.size}`);
  console.log(`⚡ Prêt à gérer les Raids, Duels, Niveaux et Quêtes !`);
  console.log(`=================================================\n`);

  client.user?.setPresence({
    activities: [
      {
        name: '⚔️ /rank | Raids de Boss RPG',
        type: ActivityType.Custom
      }
    ],
    status: 'online'
  });
}
