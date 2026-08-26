import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser, updateUser } from '../../database/db.js';

export const dailyCommand: Command = {
  category: 'economy',
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Récupérez votre récompense quotidienne d\'or et d\'XP avec bonus de série !'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const userId = interaction.user.id;
    const user = getUser(userId, guildId);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 48 * 60 * 60 * 1000;

    // Check if daily is already claimed
    if (user.last_daily && now - user.last_daily < oneDayMs) {
      const remainingMs = oneDayMs - (now - user.last_daily);
      const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
      const remainingMins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

      await interaction.reply({
        content: `⏳ Tu as déjà récupéré ton cadeau quotidien ! Reviens dans **${remainingHours}h ${remainingMins}min**.`,
        ephemeral: true
      });
      return;
    }

    // Calculate streak
    let streak = user.daily_streak;
    if (!user.last_daily || now - user.last_daily >= twoDaysMs) {
      // Streak broken
      streak = 1;
    } else {
      // Streak continued
      streak += 1;
    }

    // Base rewards + streak bonus (up to 5x for 30-day streak)
    const isVip = user.is_premium === 1;
    const vipMultiplier = isVip ? 1.5 : 1.0;

    const streakBonus = Math.min(30, streak) * 15;
    const baseRewardGold = 200 + streakBonus;
    const baseRewardXp = 150 + Math.floor(streakBonus * 0.8);

    const rewardGold = Math.floor(baseRewardGold * vipMultiplier);
    const rewardXp = Math.floor(baseRewardXp * vipMultiplier);

    updateUser({
      user_id: userId,
      guild_id: guildId,
      gold: user.gold + rewardGold,
      xp: user.xp + rewardXp,
      daily_streak: streak,
      last_daily: now
    });

    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🎁 RÉCOMPENSE QUOTIDIENNE COLLECTÉE !')
      .setDescription(
        `Tu as récupéré ton tribut d'aventurier du jour !\n\n` +
        `🪙 **+${rewardGold} Or**\n` +
        `✨ **+${rewardXp} XP**\n\n` +
        `🔥 **Série actuelle :** \`${streak} jour(s) consécutif(s)\` *(Bonus : +${streakBonus} Or)*\n\n` +
        `*Reviens demain pour maintenir ta série et débloquer de plus gros gains !*`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'GuildForge Economy System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
