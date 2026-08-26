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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const SLOT_SYMBOLS = [
  { symbol: '🍒', name: 'Cerises', multiplier: 2, weight: 35 },
  { symbol: '🍋', name: 'Citron', multiplier: 3, weight: 25 },
  { symbol: '🍇', name: 'Raisin', multiplier: 4, weight: 18 },
  { symbol: '🔔', name: 'Cloche', multiplier: 6, weight: 12 },
  { symbol: '💎', name: 'Diamant', multiplier: 10, weight: 7 },
  { symbol: '👑', name: 'Couronne Royale', multiplier: 25, weight: 3 }
];

function pickSlotSymbol() {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of SLOT_SYMBOLS) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return SLOT_SYMBOLS[0];
}

interface Card {
  suit: string;
  value: string;
  num: number;
}

function createDeck(): Card[] {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = [
    { v: 'A', n: 11 }, { v: '2', n: 2 }, { v: '3', n: 3 }, { v: '4', n: 4 },
    { v: '5', n: 5 }, { v: '6', n: 6 }, { v: '7', n: 7 }, { v: '8', n: 8 },
    { v: '9', n: 9 }, { v: '10', n: 10 }, { v: 'J', n: 10 }, { v: 'Q', n: 10 }, { v: 'K', n: 10 }
  ];

  const deck: Card[] = [];
  for (const s of suits) {
    for (const v of values) {
      deck.push({ suit: s, value: v.v, num: v.n });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function calculateHand(hand: Card[]): number {
  let total = hand.reduce((sum, c) => sum + c.num, 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function formatHand(hand: Card[], hideSecond = false): string {
  if (hideSecond && hand.length > 1) {
    return `\`[ ${hand[0].value}${hand[0].suit} ]\` \`[ 🂠 ?? ]\``;
  }
  return hand.map(c => `\`[ ${c.value}${c.suit} ]\``).join(' ');
}

export const gambleCommand: Command = {
  category: 'games',
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Mini-jeux de hasard de la taverne pour parier votre or.')
    .addSubcommand(sub =>
      sub
        .setName('slots')
        .setDescription('Machine à sous animée avec multiplicateurs jusqu\'à x25')
        .addIntegerOption(opt =>
          opt
            .setName('mise')
            .setDescription('Montant d\'or à miser (min: 10)')
            .setRequired(true)
            .setMinValue(10)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('coinflip')
        .setDescription('Pile ou Face animé (x2 la mise)')
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
        .setDescription('Lancer de dés 3D contre le tavernier (x2 la mise si supérieur)')
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
        content: `❌ Tu n'as pas assez d'or pour miser **${bet.toLocaleString()} Or** (Solde actuel : ${user.gold.toLocaleString()} 🪙).`,
        ephemeral: true
      });
      return;
    }

    // Increment gamble quest
    incrementQuestProgress(userId, guildId, 'gamble', 1);

    // ==========================================
    // 1. ANIMATED SLOTS MACHINE
    // ==========================================
    if (sub === 'slots') {
      const s1 = pickSlotSymbol();
      const s2 = pickSlotSymbol();
      const s3 = pickSlotSymbol();

      let multiplier = 0;
      let outcomeTitle = '';

      if (s1.symbol === s2.symbol && s2.symbol === s3.symbol) {
        multiplier = s1.multiplier;
        outcomeTitle = s1.symbol === '👑' ? '👑 ULTRA MEGA JACKPOT ROYAL (x25) !' : s1.symbol === '💎' ? '💎 GRAND JACKPOT DE DIAMANTS (x10) !' : `🎉 TRIPLE GAGNANT (${s1.name}) (x${multiplier}) !`;
      } else if (s1.symbol === s2.symbol || s2.symbol === s3.symbol || s1.symbol === s3.symbol) {
        multiplier = 1.5;
        outcomeTitle = '✨ DOUBLE COMBINAISON (x1.5) !';
      } else {
        multiplier = 0;
        outcomeTitle = '💀 PAS DE CHANCE... Vous perdez votre mise.';
      }

      const winAmount = Math.floor(bet * multiplier);
      const netGain = winAmount - bet;
      updateUser({ user_id: userId, guild_id: guildId, gold: user.gold + netGain });

      // Frame 1: Spinning reels
      await interaction.reply({
        content: `🎰 **MACHINE À SOUS DU CASINO GUILDFORGE**\n` +
                 `\`[ 🌀 | 🌀 | 🌀 ]\`\n` +
                 `⚡ *Les rouleaux tourbillonnent à toute vitesse...*`
      });

      await delay(700);

      // Frame 2: First reel stopped
      await interaction.editReply({
        content: `🎰 **MACHINE À SOUS DU CASINO GUILDFORGE**\n` +
                 `\`[ ${s1.symbol} | 🌀 | 🌀 ]\`\n` +
                 `🎲 *Premier rouleau fixé !*`
      });

      await delay(700);

      // Frame 3: Second reel stopped (Suspense)
      await interaction.editReply({
        content: `🎰 **MACHINE À SOUS DU CASINO GUILDFORGE**\n` +
                 `\`[ ${s1.symbol} | ${s2.symbol} | 🌀 ]\`\n` +
                 `🔥 *TENSION MAXIMALE... Dernier rouleau en décélération...*`
      });

      await delay(800);

      // Frame 4: Final Result Embed
      const resultEmbed = new EmbedBuilder()
        .setColor(multiplier >= 10 ? '#ffd700' : multiplier > 1 ? '#00ff88' : '#ff3366')
        .setTitle(`🎰 MACHINE À SOUS : ${outcomeTitle}`)
        .setDescription(
          `## \`╔═════════════════╗\`\n` +
          `## \`║  ${s1.symbol}  |  ${s2.symbol}  |  ${s3.symbol}  ║\`\n` +
          `## \`╚═════════════════╝\`\n\n` +
          `💰 **Mise :** \`${bet.toLocaleString()} Or\`\n` +
          (multiplier > 0 
            ? `🎉 **Gains remportés :** \`+${winAmount.toLocaleString()} Or\` *(Bénéfice net : +${netGain.toLocaleString()} Or)*`
            : `💸 **Pertes :** \`-${bet.toLocaleString()} Or\``) +
          `\n🪙 **Nouveau Solde :** \`${(user.gold + netGain).toLocaleString()} Or\``
        )
        .setFooter({ text: 'Rejouez avec /gamble slots !' })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [resultEmbed] });
      return;
    }

    // ==========================================
    // 2. ANIMATED COINFLIP
    // ==========================================
    if (sub === 'coinflip') {
      const choice = interaction.options.getString('choix', true);
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? 'pile' : 'face';
      const won = choice === result;

      const newGold = won ? user.gold + bet : user.gold - bet;
      updateUser({ user_id: userId, guild_id: guildId, gold: newGold });

      // Frame 1: Toss
      await interaction.reply({
        content: `🪙 **PILE OU FACE**\n` +
                 `🌀 *Vous propulsez la pièce dorée dans les airs d'un coup de pouce...*`
      });

      await delay(700);

      // Frame 2: Mid-air spin
      await interaction.editReply({
        content: `🪙 **PILE OU FACE**\n` +
                 `✨ *La pièce tournoie à grande vitesse au-dessus de la table de jeu...*`
      });

      await delay(750);

      // Frame 3: Final Landing
      const resultEmoji = result === 'pile' ? '🪙 PILE' : '👑 FACE';
      const embed = new EmbedBuilder()
        .setColor(won ? '#00ff88' : '#ff3366')
        .setTitle(won ? '🎉 VICTOIRE ! Vous avez deviné juste !' : '💀 DÉFAITE ! La pièce vous a trahi.')
        .setDescription(
          `🪙 **Résultat du tirage :** **${resultEmoji}**\n` +
          `🎯 **Votre choix :** \`${choice.toUpperCase()}\`\n\n` +
          (won
            ? `💰 **Gain :** \`+${(bet * 2).toLocaleString()} Or\` *(Bénéfice : +${bet.toLocaleString()} Or)*`
            : `💸 **Perte :** \`-${bet.toLocaleString()} Or\``) +
          `\n🪙 **Nouveau Solde :** \`${newGold.toLocaleString()} Or\``
        )
        .setFooter({ text: 'Taverne GuildForge' })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
      return;
    }

    // ==========================================
    // 3. ANIMATED 3D DICE ROLL
    // ==========================================
    if (sub === 'dice') {
      const p1 = Math.floor(Math.random() * 6) + 1;
      const p2 = Math.floor(Math.random() * 6) + 1;
      const playerTotal = p1 + p2;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const dealerTotal = d1 + d2;

      let won = playerTotal > dealerTotal;
      let tie = playerTotal === dealerTotal;

      let gain = 0;
      if (won) gain = bet;
      else if (!tie) gain = -bet;

      const newGold = user.gold + gain;
      updateUser({ user_id: userId, guild_id: guildId, gold: newGold });

      // Frame 1: Shaking dice cup
      await interaction.reply({
        content: `🎲 **LANCER DE DÉS DE LA TAVERNE**\n` +
                 `🍶 *Vous secouez énergiquement le cornet de dés en cuir...*`
      });

      await delay(700);

      // Frame 2: Rolling on table
      await interaction.editReply({
        content: `🎲 **LANCER DE DÉS DE LA TAVERNE**\n` +
                 `✨ *Les dés rebondissent sur le tapis feutré vert...*`
      });

      await delay(750);

      // Frame 3: Final Table Score
      const embed = new EmbedBuilder()
        .setColor(won ? '#00ff88' : tie ? '#ffa500' : '#ff3366')
        .setTitle(won ? '🏆 VICTOIRE ÉCLATANTE AUX DÉS !' : tie ? '🤝 ÉGALITÉ PARFAITE !' : '💀 LE TAVERNIER L\'EMPORTE !')
        .setDescription(
          `### 🎲 Vos Dés :\n` +
          `# ${DICE_EMOJIS[p1 - 1]}  +  ${DICE_EMOJIS[p2 - 1]}  =  \`${playerTotal}\`\n\n` +
          `### 🧙 Dés du Tavernier :\n` +
          `# ${DICE_EMOJIS[d1 - 1]}  +  ${DICE_EMOJIS[d2 - 1]}  =  \`${dealerTotal}\`\n\n` +
          (won
            ? `🎉 **Gains :** \`+${(bet * 2).toLocaleString()} Or\` *(Bénéfice : +${bet.toLocaleString()} Or)*`
            : tie
            ? `⚖️ **Égalité :** Votre mise de \`${bet.toLocaleString()} Or\` vous est remboursée.`
            : `💸 **Pertes :** \`-${bet.toLocaleString()} Or\``) +
          `\n🪙 **Nouveau Solde :** \`${newGold.toLocaleString()} Or\``
        )
        .setFooter({ text: 'Taverne GuildForge' })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
      return;
    }

    // ==========================================
    // 4. INTERACTIVE CASINO BLACKJACK
    // ==========================================
    if (sub === 'blackjack') {
      const deck = createDeck();
      const playerHand: Card[] = [deck.pop()!, deck.pop()!];
      const dealerHand: Card[] = [deck.pop()!, deck.pop()!];

      let currentBet = bet;
      let playerTotal = calculateHand(playerHand);
      let isGameOver = false;

      // Deduct bet initially
      updateUser({ user_id: userId, guild_id: guildId, gold: user.gold - currentBet });

      const buildBlackjackEmbed = (status: string, hideDealer = true, color = '#2b2d31') => {
        const dealerScoreText = hideDealer ? '??' : calculateHand(dealerHand).toString();
        return new EmbedBuilder()
          .setColor(color as any)
          .setTitle('🃏 TABLE DE BLACKJACK ÉLITE')
          .setDescription(
            `💰 **Mise en jeu :** \`${currentBet.toLocaleString()} Or\`\n\n` +
            `### 🤵 Croupier (Score : \`${dealerScoreText}\`)\n` +
            `${formatHand(dealerHand, hideDealer)}\n\n` +
            `### 👤 Votre Main (Score : \`${calculateHand(playerHand)}\`)\n` +
            `${formatHand(playerHand, false)}\n\n` +
            `**Statut :** ${status}`
          )
          .setFooter({ text: 'Blackjack paie 3:2 • Tapez vos actions ci-dessous' })
          .setTimestamp();
      };

      const buildButtons = (disabled = false, allowDouble = true) => {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`bj_hit_${userId}`)
            .setLabel('🃏 Tirer (Hit)')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
          new ButtonBuilder()
            .setCustomId(`bj_stand_${userId}`)
            .setLabel('✋ Rester (Stand)')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
        );

        if (allowDouble) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`bj_double_${userId}`)
              .setLabel('💰 Doubler (Double Down)')
              .setStyle(ButtonStyle.Success)
              .setDisabled(disabled || user.gold < currentBet * 2)
          );
        }

        return row;
      };

      // Check Natural Blackjack
      if (playerTotal === 21) {
        const winAmount = Math.floor(currentBet * 2.5);
        updateUser({ user_id: userId, guild_id: guildId, gold: user.gold - currentBet + winAmount });

        const embed = buildBlackjackEmbed('🎉 **BLACKJACK NATUREL !** Vous remportez 3:2 votre mise !', false, '#ffd700');
        await interaction.reply({ embeds: [embed], components: [buildButtons(true, false)] });
        return;
      }

      const initialEmbed = buildBlackjackEmbed('À vous de jouer : Tirez une carte ou Restez !');
      const response = await interaction.reply({ embeds: [initialEmbed], components: [buildButtons(false, true)], fetchReply: true });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 45000,
        filter: (i) => i.user.id === userId
      });

      collector.on('collect', async (btnInt: ButtonInteraction) => {
        if (btnInt.customId.startsWith('bj_hit_')) {
          playerHand.push(deck.pop()!);
          playerTotal = calculateHand(playerHand);

          if (playerTotal > 21) {
            // Bust
            isGameOver = true;
            collector.stop('bust');
            const bustEmbed = buildBlackjackEmbed(`💀 **BUST !** Vous avez dépassé 21 (${playerTotal}). Perte de \`${currentBet.toLocaleString()} Or\`.`, false, '#ff3366');
            await btnInt.update({ embeds: [bustEmbed], components: [buildButtons(true, false)] });
            return;
          }

          const hitEmbed = buildBlackjackEmbed('Vous avez tiré une carte. Que voulez-vous faire ?');
          await btnInt.update({ embeds: [hitEmbed], components: [buildButtons(false, false)] });
        } else if (btnInt.customId.startsWith('bj_double_')) {
          // Double Down
          updateUser({ user_id: userId, guild_id: guildId, gold: user.gold - (currentBet * 2) });
          currentBet *= 2;
          playerHand.push(deck.pop()!);
          playerTotal = calculateHand(playerHand);

          collector.stop('stand');

          if (playerTotal > 21) {
            const bustEmbed = buildBlackjackEmbed(`💀 **BUST APRÈS DOUBLE !** (${playerTotal}). Perte de \`${currentBet.toLocaleString()} Or\`.`, false, '#ff3366');
            await btnInt.update({ embeds: [bustEmbed], components: [buildButtons(true, false)] });
            return;
          }

          // Dealer plays
          while (calculateHand(dealerHand) < 17) {
            dealerHand.push(deck.pop()!);
          }
          const dealerFinal = calculateHand(dealerHand);

          let outcome = '';
          let won = false;
          let tie = false;

          if (dealerFinal > 21 || playerTotal > dealerFinal) {
            won = true;
            outcome = `🏆 **VICTOIRE DOUBLÉE !** Vous gagnez \`+${(currentBet * 2).toLocaleString()} Or\` !`;
          } else if (playerTotal === dealerFinal) {
            tie = true;
            outcome = `🤝 **ÉGALITÉ !** Votre mise doublée de \`${currentBet.toLocaleString()} Or\` vous est rendue.`;
          } else {
            outcome = `💀 **LE CROUPIER GAGNE !** Perte de \`${currentBet.toLocaleString()} Or\`.`;
          }

          if (won) {
            updateUser({ user_id: userId, guild_id: guildId, gold: user.gold - currentBet + (currentBet * 2) });
          } else if (tie) {
            updateUser({ user_id: userId, guild_id: guildId, gold: user.gold });
          }

          const endEmbed = buildBlackjackEmbed(outcome, false, won ? '#00ff88' : tie ? '#ffa500' : '#ff3366');
          await btnInt.update({ embeds: [endEmbed], components: [buildButtons(true, false)] });
        } else if (btnInt.customId.startsWith('bj_stand_')) {
          collector.stop('stand');

          // Dealer AI (must draw until 17 or higher)
          while (calculateHand(dealerHand) < 17) {
            dealerHand.push(deck.pop()!);
          }
          const dealerFinal = calculateHand(dealerHand);

          let outcome = '';
          let won = false;
          let tie = false;

          if (dealerFinal > 21) {
            won = true;
            outcome = `🎉 **LE CROUPIER BUST (${dealerFinal}) !** Vous remportez \`+${(currentBet * 2).toLocaleString()} Or\` !`;
          } else if (playerTotal > dealerFinal) {
            won = true;
            outcome = `🏆 **VICTOIRE !** ${playerTotal} bat ${dealerFinal}. Vous gagnez \`+${(currentBet * 2).toLocaleString()} Or\` !`;
          } else if (playerTotal === dealerFinal) {
            tie = true;
            outcome = `🤝 **ÉGALITÉ (${playerTotal} vs ${dealerFinal}) !** Votre mise vous est remboursée.`;
          } else {
            outcome = `💀 **LE CROUPIER L'EMPORTE (${dealerFinal} vs ${playerTotal}).**`;
          }

          if (won) {
            updateUser({ user_id: userId, guild_id: guildId, gold: user.gold + currentBet });
          } else if (tie) {
            updateUser({ user_id: userId, guild_id: guildId, gold: user.gold });
          }

          const endEmbed = buildBlackjackEmbed(outcome, false, won ? '#00ff88' : tie ? '#ffa500' : '#ff3366');
          await btnInt.update({ embeds: [endEmbed], components: [buildButtons(true, false)] });
        }
      });
    }
  }
};
