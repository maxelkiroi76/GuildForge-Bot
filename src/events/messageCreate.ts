import { Message, GuildMember } from 'discord.js';
import { handleMessageActivity } from '../services/levelService.js';

export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore messages from bots or outside guilds
  if (message.author.bot || !message.guild || !message.member) return;

  try {
    await handleMessageActivity(
      message.author.id, 
      message.guild.id, 
      message.member as GuildMember, 
      message.client
    );
  } catch (error) {
    console.error('Erreur lors du traitement de l\'activité message XP:', error);
  }
}
