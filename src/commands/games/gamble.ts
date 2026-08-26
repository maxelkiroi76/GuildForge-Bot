import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ButtonInteraction, 
  ComponentType 
} from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser, updateUser } from '../../database/db.js';
import { incrementQuestProgress } from '../../services/questService.js';

export const gambleCommand: Command = {
  category: 'games',
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Mini-jeux de hasard de la taverne pour parier votre or.')
    .addSubcommand(sub =>
      sub
        .setName('coinflip')
        .setDescription('Pile ou Face (x2 la mise)')
        .addStringOption(opt =>
          opt
            .setName('choix')
            .setDescription('Votre prédiction')
            .setRequired(true)
            .addChoices(
              { name: '🪙 Pile', value: 'pile' },
              { name: '👑 Face', value: 'face' }
            )
        )
        .addIntegerOption(opt =>
          opt
            .setName('mise')
            .setDescription('Montant d\'or à parier (min: 10)')
            .setRequired(true)
            .setMinValue(10)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('dice')
        .setDescription('Lancer de dés contre le tavernier (x2 la mise si supérieur)')
        .addIntegerOption(opt =>
          opt
            .setName('mise')
            .setDescription('Montant d\'or à parier (min: 10)')
            .setRequired(true)
            .setMinValue(10)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('blackjack')
        .setDescription('Partie de Blackjack interactive contre le croupier')
        .addIntegerOption(opt =>
          opt
            .setName('mise')
            .setDescription('Montant d\'or à parier (min: 10)')
            .setRequired(true)
            .setMinValue(10)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const bet = interaction.options.getInteger('mise', true);
    const user = getUser(userId, guildId);

    if (user.gold < bet) {
      await interaction.reply({
        content: `❌ Tu n'as pas assez d'or pour miser **${bet} Or** (Solde actuel : ${user.gold} 🪙).`,
        ephemeral: true
      });
      return;
    }

    // Increment gamble quest
    incrementQuestProgress(userId, guildId, 'gamble', 1);

    if (sub === 'coinflip') {
      const choice = interaction.options.getString('choix', true);
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? 'pile' : 'face';
      const won = choice === result;

      const newGold = won ? user.gold + bet : user.gold - bet;
      updateUser({ user_id: userId, guild_id: guildId, gold: newGold });

      const embed = new EmbedBuilder()
        .setColor(won ? '#00ff88' : '#ff3333')
        .setTitle(won ? '🎉 VICTOIRE AU PILE OU FACE !' : '💀 PERDU AU PILE OU FACE...')
        .setDescription(
          `🪙 La pièce tourbillonne et atterrit sur : **${result.toUpperCase()}** !\n\n` +
          (won
            ? `Tu avais choisi **${choice.toUpperCase()}** ! Tu remportes **+${bet} Or** !`
            : `Tu avais choisi **${choice.toUpperCase()}**... Tu perds ta mise de **-${bet} Or**.`) +
          `\n\nNouveau solde : 🪙 **${newGold.toLocaleString()} Or**`
        )
        .setFooter({ text: 'GuildForge Tavern Casino' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'dice') {
      const playerRoll1 = Math.floor(Math.random() * 6) + 1;
      const playerRoll2 = Math.floor(Math.random() * 6) + 1;
      const playerTotal = playerRoll1 + playerRoll2;

      const botRoll1 = Math.floor(Math.random() * 6) + 1;
      const botRoll2 = Math.floor(Math.random() * 6) + 1;
      const botTotal = botRoll1 + botRoll2;

      const won = playerTotal > botTotal;
      const tie = playerTotal === botTotal;

      let newGold = user.gold;
      if (won) newGold += bet;
      else if (!tie) newGold -= bet;

      updateUser({ user_id: userId, guild_id: guildId, gold: newGold });

      const embed = new EmbedBuilder()
        .setColor(won ? '#00ff88' : tie ? '#ffbb00' : '#ff3333')
        .setTitle(won ? '🎲 VICTOIRE AUX DÉS !' : tie ? '🎲 ÉGALITÉ AUX DÉS' : '💀 DÉFAITE AUX DÉS...')
        .setDescription(
          `🎲 **Tes dés :** [${playerRoll1}] + [${playerRoll2}] = **${playerTotal}**\n` +
          `🍺 **Le Tavernier :** [${botRoll1}] + [${botRoll2}] = **${botTotal}**\n\n` +
          (won
            ? `Tu as battu le tavernier et remportes **+${bet} Or** !`
            : tie
            ? `Match nul ! Ta mise de **${bet} Or** t'est restituée.`
            : `Le tavernier a été plus fort... Tu perds **-${bet} Or**.`) +
          `\n\nNouveau solde : 🪙 **${newGold.toLocaleString()} Or**`
        )
        .setFooter({ text: 'GuildForge Tavern Casino' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'blackjack') {
      // Blackjack Game
      const drawCard = () => {
        const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
        return cards[Math.floor(Math.random() * cards.length)];
      };

      const calculateScore = (hand: number[]) => {
        let score = hand.reduce((a, b) => a + b, 0);
        let aces = hand.filter(c => c === 11).length;
        while (score > 21 && aces > 0) {
          score -= 10;
          aces--;
        }
        return score;
      };

      let playerHand = [drawCard(), drawCard()];
      let dealerHand = [drawCard(), drawCard()];

      let playerScore = calculateScore(playerHand);
      let dealerVisibleScore = dealerHand[0];

      // Instant Natural Blackjack
      if (playerScore === 21) {
        const winAmount = Math.floor(bet * 1.5);
        updateUser({ user_id: userId, guild_id: guildId, gold: user.gold + winAmount });

        const bjEmbed = new EmbedBuilder()
          .setColor('#ffd700')
          .setTitle('🃏 BLACKJACK NATUREL (21) !')
          .setDescription(`Tu obtiens un 21 instantané !\nTu remportes **+${winAmount} Or** (3:2) !`);
        await interaction.reply({ embeds: [bjEmbed] });
        return;
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`bj_hit_${userId}`)
          .setLabel('Tirer une carte (Hit)')
          .setEmoji('🃏')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`bj_stand_${userId}`)
          .setLabel('Rester (Stand)')
          .setEmoji('🛑')
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor('#2b2d42')
        .setTitle('🃏 TABLE DE BLACKJACK DE LA GUILDE')
        .setDescription(
          `💰 **Mise en jeu :** \`${bet} Or\`\n\n` +
          `👤 **Ta main :** [${playerHand.join(', ')}] — Total : **${playerScore}**\n` +
          `🎩 **Croupier :** [${dealerHand[0]}, ❓] — Total visible : **${dealerVisibleScore}**\n\n` +
          `Que souhaites-tu faire ?`
        )
        .setFooter({ text: 'Clique sur un bouton dans les 60 secondes.' });

      const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => i.user.id === userId
      });

      collector.on('collect', async (btn) => {
        if (btn.customId.startsWith('bj_hit_')) {
          playerHand.push(drawCard());
          playerScore = calculateScore(playerHand);

          if (playerScore > 21) {
            // Bust
            collector.stop('bust');
            updateUser({ user_id: userId, guild_id: guildId, gold: user.gold - bet });

            const bustEmbed = new EmbedBuilder()
              .setColor('#ff3333')
              .setTitle('💥 BUST ! (Score > 21)')
              .setDescription(
                `👤 **Ta main :** [${playerHand.join(', ')}] — Total : **${playerScore}**\n` +
                `Tu as dépassé 21 ! Tu perds ta mise de **-${bet} Or**.\n\n` +
                `Nouveau solde : 🪙 **${(user.gold - bet).toLocaleString()} Or**`
              );
            await btn.update({ embeds: [bustEmbed], components: [] });
            return;
          }

          const hitEmbed = EmbedBuilder.from(embed).setDescription(
            `💰 **Mise en jeu :** \`${bet} Or\`\n\n` +
            `👤 **Ta main :** [${playerHand.join(', ')}] — Total : **${playerScore}**\n` +
            `🎩 **Croupier :** [${dealerHand[0]}, ❓] — Total visible : **${dealerVisibleScore}**\n\n` +
            `Que souhaites-tu faire ?`
          );

          await btn.update({ embeds: [hitEmbed], components: [row] });
        } else if (btn.customId.startsWith('bj_stand_')) {
          collector.stop('stand');

          // Dealer plays (hits until 17)
          let dealerScore = calculateScore(dealerHand);
          while (dealerScore < 17) {
            dealerHand.push(drawCard());
            dealerScore = calculateScore(dealerHand);
          }

          const dealerBust = dealerScore > 21;
          const playerWon = dealerBust || playerScore > dealerScore;
          const tie = playerScore === dealerScore;

          let finalGold = user.gold;
          if (playerWon) finalGold += bet;
          else if (!tie) finalGold -= bet;

          updateUser({ user_id: userId, guild_id: guildId, gold: finalGold });

          const finalEmbed = new EmbedBuilder()
            .setColor(playerWon ? '#00ff88' : tie ? '#ffbb00' : '#ff3333')
            .setTitle(playerWon ? '🎉 VICTOIRE AU BLACKJACK !' : tie ? '🤝 ÉGALITÉ AU BLACKJACK' : '💀 DÉFAITE AU BLACKJACK...')
            .setDescription(
              `👤 **Ta main :** [${playerHand.join(', ')}] — Total : **${playerScore}**\n` +
              `🎩 **Croupier :** [${dealerHand.join(', ')}] — Total : **${dealerScore}** ${dealerBust ? '*(Bust !)*' : ''}\n\n` +
              (playerWon
                ? `Tu bats le croupier et remportes **+${bet} Or** !`
                : tie
                ? `Égalité ! Ta mise de **${bet} Or** t'est restituée.`
                : `Le croupier l'emporte. Tu perds **-${bet} Or**.`) +
              `\n\nNouveau solde : 🪙 **${finalGold.toLocaleString()} Or**`
            );

          await btn.update({ embeds: [finalEmbed], components: [] });
        }
      });
    }
  }
};
