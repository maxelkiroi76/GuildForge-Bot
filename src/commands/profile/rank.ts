import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser } from '../../database/db.js';
import { generateRankCard } from '../../services/canvasService.js';

export const rankCommand: Command = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche votre carte de profil RPG en haute définition.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre dont vous souhaitez voir le profil (optionnel)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    console.log('🚀 [NEW RANK COMMAND] Executing rank for user:', interaction.user.username, 'at', new Date().toISOString());
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.editReply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.' });
      return;
    }

    const userProfile = getUser(targetUser.id, guildId);
    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
    const username = targetUser.displayName || targetUser.username;

    try {
      const cardBuffer = await generateRankCard(userProfile, avatarUrl, username);
      const isGif = userProfile.is_premium === 1;
      const filename = `rank-${targetUser.id}.${isGif ? 'gif' : 'png'}`;
      const attachment = new AttachmentBuilder(cardBuffer, { name: filename });

      await interaction.editReply({
        files: [attachment]
      });
    } catch (err) {
      console.error('Erreur génération carte de rang:', err);
      await interaction.editReply({ content: '❌ Une erreur est survenue lors de la génération de la carte de profil.' });
    }
  }
};
