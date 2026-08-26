import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ButtonInteraction 
} from 'discord.js';
import { Command } from '../../types/index.js';
import { getUserDailyQuests, claimQuestReward } from '../../services/questService.js';

export const questsCommand: Command = {
  category: 'rpg',
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('Consultez vos 3 quêtes du jour et récupérez vos récompenses d\'or et d\'XP.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const quests = getUserDailyQuests(userId, guildId);

    const embed = new EmbedBuilder()
      .setColor('#00d2ff')
      .setTitle(`📜 TABLEAU DES QUÊTES DU JOUR — ${interaction.user.displayName}`)
      .setDescription(
        `Accomplissez vos objectifs quotidiens pour remporter des récompenses exclusives !\n` +
        `*Les quêtes se réinitialisent chaque jour à minuit UTC.*\n`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'GuildForge Daily Quests' })
      .setTimestamp();

    const buttons: ButtonBuilder[] = [];

    for (const q of quests) {
      const percent = Math.min(100, Math.floor((q.progress / q.quest.target) * 100));
      const statusIcon = q.claimed ? '✅ Réclamée' : q.completed ? '🎉 Terminée !' : `⏳ En cours (${q.progress}/${q.quest.target})`;

      embed.addFields({
        name: `🗡️ ${q.quest.title} — ${statusIcon}`,
        value: `${q.quest.description}\n` +
               `**Progression :** \`${q.progress} / ${q.quest.target}\` (${percent}%)\n` +
               `**Récompenses :** ✨ +${q.quest.reward_xp} XP | 🪙 +${q.quest.reward_gold} Or`,
        inline: false
      });

      if (q.completed && !q.claimed) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`claim_quest_${q.quest.id}_${userId}`)
            .setLabel(`Récupérer: ${q.quest.title}`)
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Success)
        );
      }
    }

    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (buttons.length > 0) {
      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
    }

    await interaction.reply({ embeds: [embed], components });
  }
};
