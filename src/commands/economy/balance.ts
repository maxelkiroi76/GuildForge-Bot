import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser, calculateEffectiveStats } from '../../database/db.js';
import { CLASS_BONUSES } from '../../data/items.js';

export const balanceCommand: Command = {
  category: 'economy',
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Consultez votre bourse d\'or, vos statistiques et votre statut.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à inspecter (optionnel)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const profile = getUser(targetUser.id, guildId);
    const stats = calculateEffectiveStats(profile);
    const classInfo = CLASS_BONUSES[profile.character_class] || CLASS_BONUSES.warrior;

    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle(`💼 BOURSE & STATISTIQUES — ${targetUser.displayName || targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '🪙 Portefeuille', value: `\`${profile.gold.toLocaleString()} Or\``, inline: true },
        { name: '🏦 Coffre-Fort', value: `\`${profile.bank.toLocaleString()} Or\``, inline: true },
        { name: '💎 Fortune Totale', value: `\`${(profile.gold + profile.bank).toLocaleString()} Or\``, inline: true },
        { name: '⚔️ Attaque Totale', value: `\`${stats.atk} ATK\``, inline: true },
        { name: '🛡️ Défense Totale', value: `\`${stats.def} DEF\``, inline: true },
        { name: '❤️ Points de Vie Max', value: `\`${stats.maxHp} PV\``, inline: true },
        { name: '🥋 Classe', value: `${classInfo.icon} **${classInfo.name}**`, inline: true },
        { name: '🔥 Série Journalière', value: `\`${profile.daily_streak} jours\``, inline: true },
        { name: '🏆 Victoires (Raids/Duels)', value: `\`${profile.total_raids_won} / ${profile.total_duels_won}\``, inline: true }
      )
      .setFooter({ text: 'GuildForge Economy & RPG' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
