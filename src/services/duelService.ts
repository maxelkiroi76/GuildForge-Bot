import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ButtonInteraction, 
  ChatInputCommandInteraction, 
  User 
} from 'discord.js';
import { getUser, updateUser, calculateEffectiveStats } from '../database/db.js';
import { incrementQuestProgress } from './questService.js';

interface PendingDuel {
  id: string;
  challengerId: string;
  targetId: string;
  guildId: string;
  bet: number;
  messageId: string;
  expiresAt: number;
}

export const pendingDuels = new Map<string, PendingDuel>();

export async function initiateDuel(
  interaction: ChatInputCommandInteraction,
  targetUser: User,
  bet: number
): Promise<void> {
  const challenger = interaction.user;
  const guildId = interaction.guildId!;

  if (targetUser.id === challenger.id) {
    await interaction.reply({ content: '❌ Tu ne peux pas te défier toi-même en duel !', ephemeral: true });
    return;
  }

  if (targetUser.bot) {
    await interaction.reply({ content: '❌ Tu ne peux pas défier un bot !', ephemeral: true });
    return;
  }

  const challengerProfile = getUser(challenger.id, guildId);
  const targetProfile = getUser(targetUser.id, guildId);

  if (challengerProfile.gold < bet) {
    await interaction.reply({ 
      content: `❌ Tu n'as pas assez d'or pour miser **${bet} Or** (Solde actuel : ${challengerProfile.gold} 🪙).`, 
      ephemeral: true 
    });
    return;
  }

  if (targetProfile.gold < bet) {
    await interaction.reply({ 
      content: `❌ <@${targetUser.id}> n'a pas assez d'or pour suivre cette mise de **${bet} Or** (Solde actuel : ${targetProfile.gold} 🪙).`, 
      ephemeral: true 
    });
    return;
  }

  const duelId = `${challenger.id}_${targetUser.id}_${Date.now()}`;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`duel_accept_${duelId}`)
      .setLabel('Accepter le Duel')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`duel_decline_${duelId}`)
      .setLabel('Décliner')
      .setEmoji('🏳️')
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setColor('#ff4500')
    .setTitle('⚔️ DÉFI EN DUEL LANCÉ !')
    .setDescription(
      `🗡️ **${challenger.username}** défie **${targetUser.username}** en combat singulier !\n\n` +
      `💰 **Mise en jeu :** \`${bet} Or\` par participant (Pot total : **${bet * 2} Or**)\n\n` +
      `<@${targetUser.id}>, acceptes-tu d'entrer dans l'arène ?`
    )
    .setFooter({ text: 'Ce défi expire dans 60 secondes.' })
    .setTimestamp();

  const response = await interaction.reply({
    content: `<@${targetUser.id}>, tu as reçu un défi d'honneur !`,
    embeds: [embed],
    components: [row]
  });

  const message = await response.fetch();

  pendingDuels.set(duelId, {
    id: duelId,
    challengerId: challenger.id,
    targetId: targetUser.id,
    guildId,
    bet,
    messageId: message.id,
    expiresAt: Date.now() + 60000
  });

  // Timeout cleanup after 60s
  setTimeout(async () => {
    const duel = pendingDuels.get(duelId);
    if (duel) {
      pendingDuels.delete(duelId);
      const expiredEmbed = EmbedBuilder.from(embed)
        .setColor('#555555')
        .setDescription(`⌛ Le défi de duel entre **${challenger.username}** et **${targetUser.username}** a expiré sans réponse.`);
      await message.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
    }
  }, 60000);
}

export async function handleDuelInteraction(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;
  const isAccept = customId.startsWith('duel_accept_');
  const isDecline = customId.startsWith('duel_decline_');

  if (!isAccept && !isDecline) return;

  const duelId = isAccept ? customId.replace('duel_accept_', '') : customId.replace('duel_decline_', '');
  const duel = pendingDuels.get(duelId);

  if (!duel) {
    await interaction.reply({ content: '❌ Ce duel a expiré ou n\'est plus disponible.', ephemeral: true });
    return;
  }

  // Only the targeted user can respond
  if (interaction.user.id !== duel.targetId) {
    await interaction.reply({ content: '❌ Ce n\'est pas à toi d\'accepter ou décliner ce duel !', ephemeral: true });
    return;
  }

  pendingDuels.delete(duelId);

  if (isDecline) {
    const declineEmbed = new EmbedBuilder()
      .setColor('#888888')
      .setTitle('🏳️ Duel Décliné')
      .setDescription(`<@${duel.targetId}> a poliment refusé le défi de <@${duel.challengerId}>.`);
    await interaction.update({ embeds: [declineEmbed], components: [] });
    return;
  }

  // Run the Duel Fight Simulation
  await executeDuelBattle(interaction, duel);
}

async function executeDuelBattle(interaction: ButtonInteraction, duel: PendingDuel): Promise<void> {
  const guildId = duel.guildId;
  const p1Profile = getUser(duel.challengerId, guildId);
  const p2Profile = getUser(duel.targetId, guildId);

  // Check funds again
  if (p1Profile.gold < duel.bet || p2Profile.gold < duel.bet) {
    await interaction.update({ 
      content: '❌ L\'un des combattants n\'a plus les fonds nécessaires pour honorer la mise.', 
      embeds: [], 
      components: [] 
    });
    return;
  }

  // Deduct bets
  updateUser({ user_id: duel.challengerId, guild_id: guildId, gold: p1Profile.gold - duel.bet });
  updateUser({ user_id: duel.targetId, guild_id: guildId, gold: p2Profile.gold - duel.bet });

  const p1Stats = calculateEffectiveStats(p1Profile);
  const p2Stats = calculateEffectiveStats(p2Profile);

  let p1Hp = p1Stats.maxHp;
  let p2Hp = p2Stats.maxHp;

  const logs: string[] = [];
  let round = 1;

  while (p1Hp > 0 && p2Hp > 0 && round <= 10) {
    // P1 attacks P2
    const p1Dmg = Math.max(8, Math.floor((p1Stats.atk * 1.2 + Math.random() * 10) - p2Stats.def * 0.4));
    p2Hp -= p1Dmg;
    logs.push(`🗡️ **Tour ${round}** : <@${duel.challengerId}> frappe pour **${p1Dmg}** dégâts ! (PV restants P2: \`${Math.max(0, p2Hp)}\`)`);

    if (p2Hp <= 0) break;

    // P2 attacks P1
    const p2Dmg = Math.max(8, Math.floor((p2Stats.atk * 1.2 + Math.random() * 10) - p1Stats.def * 0.4));
    p1Hp -= p2Dmg;
    logs.push(`🛡️ **Tour ${round}** : <@${duel.targetId}> réplique pour **${p2Dmg}** dégâts ! (PV restants P1: \`${Math.max(0, p1Hp)}\`)`);

    round++;
  }

  const winnerId = p1Hp > 0 ? duel.challengerId : duel.targetId;
  const loserId = winnerId === duel.challengerId ? duel.targetId : duel.challengerId;
  const totalPrize = duel.bet * 2;
  const winnerXp = 200;

  // Award winner
  const winnerProfile = getUser(winnerId, guildId);
  updateUser({
    user_id: winnerId,
    guild_id: guildId,
    gold: winnerProfile.gold + totalPrize,
    xp: winnerProfile.xp + winnerXp,
    total_duels_won: winnerProfile.total_duels_won + 1
  });

  // Track Quest Progress
  incrementQuestProgress(winnerId, guildId, 'duel_win', 1);

  const resultEmbed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle('🏆 RÉSULTAT DU DUEL D\'HONNEUR')
    .setDescription(
      `### 👑 Victoire Éclatante de <@${winnerId}> !\n\n` +
      `💰 **Gain remporté :** \`+${totalPrize} Or\` (Pot total)\n` +
      `✨ **Expérience gagnée :** \`+${winnerXp} XP\`\n\n` +
      `### 📜 Récapitulatif du Combat :\n` +
      logs.slice(-5).join('\n')
    )
    .setFooter({ text: 'GuildForge PvP Arena' })
    .setTimestamp();

  await interaction.update({ embeds: [resultEmbed], components: [] });
}
