import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  TextChannel, 
  Client, 
  ButtonInteraction 
} from 'discord.js';
import { ActiveRaid, RaidParticipant } from '../types/index.js';
import { getUser, updateUser, calculateEffectiveStats, addInventoryItem, saveCustomItem } from '../database/db.js';
import { incrementQuestProgress } from './questService.js';
import { generateRandomItem } from './itemGenerator.js';

// Map of active raids: guildId -> ActiveRaid
export const activeRaids = new Map<string, ActiveRaid>();

export const BOSS_PRESETS = [
  {
    name: 'Ignis, le Dragon Infernal',
    icon: '🐉',
    element: 'Feu 🌋',
    max_hp: 2500,
    atk: 35,
    def: 12,
    reward_xp: 800,
    reward_gold: 600,
    loot_drop: 'shadow_daggers'
  },
  {
    name: 'Ymir, le Titan des Tempêtes de Glace',
    icon: '❄️',
    element: 'Glace 🧊',
    max_hp: 3200,
    atk: 40,
    def: 18,
    reward_xp: 1200,
    reward_gold: 900,
    loot_drop: 'obsidian_plate'
  },
  {
    name: 'Malakor, le Seigneur Nécromancien',
    icon: '💀',
    element: 'Ombre 🌑',
    max_hp: 2000,
    atk: 48,
    def: 8,
    reward_xp: 950,
    reward_gold: 750,
    loot_drop: 'elixir_power'
  },
  {
    name: 'Aegis Prime, le Gardien Divin Corrompu',
    icon: '⚡',
    element: 'Foudre ⚡',
    max_hp: 4500,
    atk: 55,
    def: 25,
    reward_xp: 2000,
    reward_gold: 1500,
    loot_drop: 'dragon_slayer'
  }
];

export function createRaidEmbed(raid: ActiveRaid): EmbedBuilder {
  const hpPercent = Math.max(0, Math.floor((raid.current_hp / raid.max_hp) * 100));
  
  // HP Bar Visual
  const totalBars = 16;
  const filledBars = Math.ceil((hpPercent / 100) * totalBars);
  const hpBar = '🟥'.repeat(Math.max(0, filledBars)) + '⬛'.repeat(Math.max(0, totalBars - filledBars));

  // Top Damagers
  const participantsArray = Array.from(raid.participants.values()).sort((a, b) => b.damage - a.damage);
  const topText = participantsArray.length > 0
    ? participantsArray.slice(0, 5).map((p, i) => `${i + 1}. **${p.username}** — 💥 \`${p.damage.toLocaleString()} dégâts\``).join('\n')
    : '*Aucun héros n\'a encore frappé !*';

  // Combat Logs
  const logsText = raid.logs.length > 0
    ? raid.logs.slice(-4).join('\n')
    : '⚔️ *Le boss rugit et attend ses adversaires !*';

  const embed = new EmbedBuilder()
    .setColor(hpPercent > 50 ? '#ff4500' : hpPercent > 20 ? '#ff8c00' : '#8b0000')
    .setTitle(`${raid.boss_icon} RAID DE BOSS EN DIRECT : ${raid.boss_name}`)
    .setDescription(
      `**Élément :** ${raid.boss_element}\n` +
      `**Points de Vie :** \`${raid.current_hp.toLocaleString()} / ${raid.max_hp.toLocaleString()} PV\` (${hpPercent}%)\n` +
      `\`[${hpBar}]\`\n\n` +
      `### 🏆 Classement des Dégâts :\n${topText}\n\n` +
      `### 📜 Journal du Combat :\n${logsText}`
    )
    .addFields(
      { name: '🎁 Récompenses Globales', value: `✨ **+${raid.reward_xp} XP** | 🪙 **+${raid.reward_gold} Or** + Butin rare !`, inline: true },
      { name: '👥 Combattants', value: `\`${raid.participants.size} héros engagés\``, inline: true }
    )
    .setFooter({ text: 'Cliquez sur les boutons ci-dessous pour agir ! Cooldown : 6 sec.' })
    .setTimestamp();

  return embed;
}

export function createRaidActionRow(disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('raid_attack')
      .setLabel('Attaque Physique')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('raid_magic')
      .setLabel('Sort Magique')
      .setEmoji('✨')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('raid_defend')
      .setLabel('Poste Défensif')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('raid_heal')
      .setLabel('Potion de Soin')
      .setEmoji('🧪')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}

export async function spawnRaid(channel: TextChannel, bossIndex?: number): Promise<ActiveRaid> {
  const preset = (bossIndex !== undefined && BOSS_PRESETS[bossIndex])
    ? BOSS_PRESETS[bossIndex]
    : BOSS_PRESETS[Math.floor(Math.random() * BOSS_PRESETS.length)];

  const raidId = `${channel.guild.id}_${Date.now()}`;
  const newRaid: ActiveRaid = {
    id: raidId,
    guild_id: channel.guild.id,
    channel_id: channel.id,
    message_id: '',
    boss_name: preset.name,
    boss_icon: preset.icon,
    boss_element: preset.element,
    current_hp: preset.max_hp,
    max_hp: preset.max_hp,
    atk: preset.atk,
    def: preset.def,
    reward_xp: preset.reward_xp,
    reward_gold: preset.reward_gold,
    participants: new Map<string, RaidParticipant>(),
    logs: [],
    is_active: true,
    started_at: Date.now(),
    expires_at: Date.now() + (10 * 60 * 1000) // 10 minutes max
  };

  const embed = createRaidEmbed(newRaid);
  const row = createRaidActionRow(false);

  const sentMessage = await channel.send({
    content: `🚨 **ALERTE BOSS DE GUILDE !** ${newRaid.boss_icon} **${newRaid.boss_name}** a envahi le serveur ! Tous aux armes !`,
    embeds: [embed],
    components: [row]
  });

  newRaid.message_id = sentMessage.id;
  activeRaids.set(channel.guild.id, newRaid);

  return newRaid;
}

export async function handleRaidButton(interaction: ButtonInteraction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const raid = activeRaids.get(guildId);
  if (!raid || !raid.is_active) {
    await interaction.reply({ content: '❌ Ce raid est déjà terminé ou n\'existe plus.', ephemeral: true });
    return;
  }

  const userId = interaction.user.id;
  const user = getUser(userId, guildId);
  const stats = calculateEffectiveStats(user);
  const now = Date.now();

  let participant = raid.participants.get(userId);
  if (!participant) {
    participant = {
      user_id: userId,
      username: interaction.user.displayName || interaction.user.username,
      damage: 0,
      last_action: 0,
      hp: stats.maxHp,
      max_hp: stats.maxHp
    };
    raid.participants.set(userId, participant);
  }

  // Action Cooldown (5 seconds)
  if (now - participant.last_action < 5000) {
    const remaining = Math.ceil((5000 - (now - participant.last_action)) / 1000);
    await interaction.reply({ content: `⏳ Tu reprends ton souffle ! Attends encore **${remaining}s** avant ta prochaine action.`, ephemeral: true });
    return;
  }

  participant.last_action = now;
  let actionLog = '';
  let dealtDamage = 0;

  const action = interaction.customId;

  if (action === 'raid_attack') {
    const isCrit = Math.random() < 0.20;
    const baseDamage = Math.max(10, Math.floor(stats.atk * (0.9 + Math.random() * 0.3) - raid.def));
    dealtDamage = isCrit ? Math.floor(baseDamage * 1.8) : baseDamage;

    actionLog = isCrit
      ? `💥 **COUP CRITIQUE !** ${participant.username} assène un coup dévastateur de **${dealtDamage}** dégâts !`
      : `⚔️ ${participant.username} frappe pour **${dealtDamage}** dégâts !`;
  } else if (action === 'raid_magic') {
    const isOverload = Math.random() < 0.25;
    const magicDamage = Math.max(20, Math.floor((stats.atk * 1.4 + 15) * (0.85 + Math.random() * 0.4)));
    dealtDamage = isOverload ? Math.floor(magicDamage * 1.6) : magicDamage;

    actionLog = isOverload
      ? `✨ **SURCHARGE D'ÉNERGIE !** ${participant.username} lance un sort ardent infligeant **${dealtDamage}** dégâts magiques !`
      : `🔮 ${participant.username} projette une onde magique de **${dealtDamage}** dégâts !`;
  } else if (action === 'raid_defend') {
    const healed = 35;
    dealtDamage = Math.floor(stats.atk * 0.3);
    actionLog = `🛡️ ${participant.username} adopte une garde d'acier (+${healed} PV régénérés) et contre-attaque pour **${dealtDamage}** dégâts !`;
  } else if (action === 'raid_heal') {
    const healAmount = 70;
    dealtDamage = 5;
    actionLog = `🧪 ${participant.username} boit un élixir revigorant et regagne **${healAmount} PV** !`;
  }

  // Update Damage & HP
  participant.damage += dealtDamage;
  raid.current_hp = Math.max(0, raid.current_hp - dealtDamage);
  raid.logs.push(actionLog);

  // Update Daily Quest Progress
  incrementQuestProgress(userId, guildId, 'raid_damage', dealtDamage);

  // Check if Boss is Defeated
  if (raid.current_hp <= 0) {
    raid.is_active = false;
    await finishRaidVictory(interaction, raid);
    activeRaids.delete(guildId);
    return;
  }

  // Acknowledge interaction and update embed
  await interaction.deferUpdate().catch(() => {});
  const updatedEmbed = createRaidEmbed(raid);
  await interaction.message.edit({ embeds: [updatedEmbed] }).catch(() => {});
}

async function finishRaidVictory(interaction: ButtonInteraction, raid: ActiveRaid): Promise<void> {
  const channel = interaction.channel as TextChannel;
  const sortedParticipants = Array.from(raid.participants.values()).sort((a, b) => b.damage - a.damage);

  // Victory Embed
  const victoryEmbed = new EmbedBuilder()
    .setColor('#00ff88')
    .setTitle(`🎉 VICTOIRE ÉPIQUE ! ${raid.boss_name} A ÉTÉ TERRASSÉ !`)
    .setDescription(
      `Le Bastion est sauvé grâce au courage des héros !\n\n` +
      `### 🎖️ Podium des Héros :\n` +
      sortedParticipants.slice(0, 5).map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️';
        return `${medal} **${p.username}** — \`${p.damage.toLocaleString()} dégâts infligés\``;
      }).join('\n')
    )
    .setFooter({ text: 'Les récompenses (XP, Or et Butin) ont été distribuées à tous les participants !' })
    .setTimestamp();

  let mvpLootText = '';

  // Distribute rewards to all participants
  for (let i = 0; i < sortedParticipants.length; i++) {
    const p = sortedParticipants[i];
    const user = getUser(p.user_id, raid.guild_id);

    // Multiplier for top 3
    const rankMultiplier = i === 0 ? 1.5 : i === 1 ? 1.25 : i === 2 ? 1.1 : 1.0;
    const earnedXp = Math.floor(raid.reward_xp * rankMultiplier);
    const earnedGold = Math.floor(raid.reward_gold * rankMultiplier);

    updateUser({
      user_id: p.user_id,
      guild_id: raid.guild_id,
      xp: user.xp + earnedXp,
      gold: user.gold + earnedGold,
      total_raids_won: user.total_raids_won + 1
    });

    // MVP Guaranteed Procedural Legendary Drop
    if (i === 0) {
      const dropRarity = Math.random() < 0.25 ? 'mythic' : 'legendary';
      const legendaryDrop = generateRandomItem(user.level, undefined, dropRarity, 15);
      saveCustomItem(legendaryDrop);
      addInventoryItem(p.user_id, raid.guild_id, legendaryDrop.id, 1);
      mvpLootText = `\n\n✨ **BUTIN DU MVP (<@${p.user_id}>) :**\n🎁 ${legendaryDrop.icon} **${legendaryDrop.name}** (\`${legendaryDrop.rarity.toUpperCase()}\`)\n*${legendaryDrop.description}* (Retrouvez-le dans \`/inventory\`)`;
    }
  }

  if (mvpLootText) {
    victoryEmbed.setDescription((victoryEmbed.data.description || '') + mvpLootText);
  }

  const disabledRow = createRaidActionRow(true);
  await interaction.message.edit({
    content: `🎊 **LE BOSS EST VAINCU !** Bravo aux participants !`,
    embeds: [victoryEmbed],
    components: [disabledRow]
  }).catch(() => {});
}
