import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';
import { Command } from '../../types/index.js';
import { TRIVIA_QUESTIONS } from '../../data/trivia.js';
import { getUser, updateUser } from '../../database/db.js';

export const triviaCommand: Command = {
  category: 'games',
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Testez vos connaissances en gaming, pop-culture et gagnez de l\'or !'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const question = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];

    const rewardGold = 120;
    const rewardXp = 100;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      question.options.map((opt, idx) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${idx}_${userId}`)
          .setLabel(`${['A', 'B', 'C', 'D'][idx]}. ${opt}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setColor('#8a2be2')
      .setTitle(`🧠 GRAND QUIZ GUILDFORGE — ${question.category}`)
      .setDescription(
        `### ${question.question}\n\n` +
        question.options.map((opt, idx) => `**${['A', 'B', 'C', 'D'][idx]}.** ${opt}`).join('\n') +
        `\n\n🎁 **Récompenses :** 🪙 \`+${rewardGold} Or\` | ✨ \`+${rewardXp} XP\``
      )
      .setFooter({ text: 'Vous avez 30 secondes pour répondre !' })
      .setTimestamp();

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: (i) => i.user.id === userId
    });

    collector.on('collect', async (btn) => {
      const selectedIndex = parseInt(btn.customId.split('_')[1], 10);
      const isCorrect = selectedIndex === question.correctIndex;

      collector.stop('answered');

      const user = getUser(userId, guildId);

      if (isCorrect) {
        updateUser({
          user_id: userId,
          guild_id: guildId,
          gold: user.gold + rewardGold,
          xp: user.xp + rewardXp
        });

        const successEmbed = new EmbedBuilder()
          .setColor('#00ff88')
          .setTitle('🎉 BONNE RÉPONSE !')
          .setDescription(
            `Tu as choisi la bonne réponse : **${question.options[question.correctIndex]}** !\n\n` +
            `📖 *${question.explanation}*\n\n` +
            `💰 Tu remportes **+${rewardGold} Or** et **+${rewardXp} XP** !`
          );

        await btn.update({ embeds: [successEmbed], components: [] });
      } else {
        const failEmbed = new EmbedBuilder()
          .setColor('#ff3333')
          .setTitle('❌ MAUVAISE RÉPONSE !')
          .setDescription(
            `Tu avais choisi : *${question.options[selectedIndex]}*.\n` +
            `La bonne réponse était : **${question.options[question.correctIndex]}** !\n\n` +
            `📖 *${question.explanation}*`
          );

        await btn.update({ embeds: [failEmbed], components: [] });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = EmbedBuilder.from(embed)
          .setColor('#555555')
          .setFooter({ text: '⌛ Temps écoulé ! La question a expiré.' });
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
