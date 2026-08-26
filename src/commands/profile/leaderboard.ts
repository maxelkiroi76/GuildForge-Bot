import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { Command } from '../../types/index.js';
import { getLeaderboard } from '../../database/db.js';

export const leaderboardCommand: Command = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement des meilleurs aventuriers du serveur.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const topUsers = getLeaderboard(guildId, 10, 0);

    if (topUsers.length === 0) {
      await interaction.reply({ content: 'ℹ️ Aucun aventurier n\'est encore enregistré sur ce serveur.', ephemeral: true });
      return;
    }

    const guildName = interaction.guild?.name || 'Serveur';
    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle(`🏆 CLASSEMENT DES AVENTURIERS — ${guildName}`)
      .setDescription(
        topUsers.map((u, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;
          return `${medal} <@${u.user_id}> — **Niv. ${u.level}** (\`${u.xp.toLocaleString()} XP\`) | 🪙 \`${u.gold.toLocaleString()} Or\``;
        }).join('\n\n')
      )
      .setFooter({ text: 'GuildForge RPG Leaderboard • Top 10' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
