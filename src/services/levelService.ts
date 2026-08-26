import { Client, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { 
  getUser, 
  updateUser, 
  getGuildConfig, 
  getRoleRewards 
} from '../database/db.js';
import { incrementQuestProgress } from './questService.js';

// Calculate required XP to reach a given level
export function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.65));
}

// Calculate current level and remaining XP in the level
export function getLevelProgress(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  let level = 1;
  while (true) {
    const nextReq = getRequiredXpForLevel(level);
    if (xp < nextReq) {
      const prevReq = level === 1 ? 0 : getRequiredXpForLevel(level - 1);
      const currentLevelXp = xp - prevReq;
      const nextLevelXp = nextReq - prevReq;
      const progressPercent = Math.min(100, Math.max(0, Math.floor((currentLevelXp / nextLevelXp) * 100)));
      return { level, currentLevelXp, nextLevelXp, progressPercent };
    }
    level++;
  }
}

// Handle message activity and XP gain with cooldown
export async function handleMessageActivity(userId: string, guildId: string, member: GuildMember, client: Client): Promise<void> {
  const now = Date.now();
  const user = getUser(userId, guildId);

  // 60-second cooldown between XP gains
  if (now - user.last_message_xp < 60000) {
    return;
  }

  const config = getGuildConfig(guildId);
  const isVip = user.is_premium === 1;
  const vipMultiplier = isVip ? 1.5 : 1.0;

  const baseXp = Math.floor(Math.random() * 11) + 15; // 15 to 25 XP
  const earnedXp = Math.floor(baseXp * config.xp_rate * vipMultiplier);
  const earnedGold = Math.floor((Math.random() * 6 + 5) * vipMultiplier); // 5 to 10 Gold (boosted for VIP)

  const newTotalXp = user.xp + earnedXp;
  const newGold = user.gold + earnedGold;

  const currentLevelInfo = getLevelProgress(user.xp);
  const newLevelInfo = getLevelProgress(newTotalXp);

  updateUser({
    user_id: userId,
    guild_id: guildId,
    xp: newTotalXp,
    gold: newGold,
    level: newLevelInfo.level,
    last_message_xp: now
  });

  // Track quest progress
  incrementQuestProgress(userId, guildId, 'messages', 1);

  // Check if leveled up
  if (newLevelInfo.level > currentLevelInfo.level) {
    await handleLevelUp(userId, guildId, newLevelInfo.level, member, client, config);
  }
}

// Process Level Up event: notifications & role rewards
export async function handleLevelUp(
  userId: string, 
  guildId: string, 
  newLevel: number, 
  member: GuildMember, 
  client: Client,
  config = getGuildConfig(guildId)
): Promise<void> {
  // Check and grant role rewards
  if (config.roles_rewards_enabled === 1) {
    const rewards = getRoleRewards(guildId);
    for (const reward of rewards) {
      if (newLevel >= reward.level && !member.roles.cache.has(reward.role_id)) {
        try {
          await member.roles.add(reward.role_id, `GuildForge: Récompense Niveau ${reward.level}`);
        } catch (err) {
          console.error(`Impossible d'ajouter le rôle ${reward.role_id} au membre ${userId}:`, err);
        }
      }
    }
  }

  // Level up notification message
  const levelUpMsg = config.levelup_message
    .replace('{user}', `<@${userId}>`)
    .replace('{level}', newLevel.toString())
    .replace('{username}', member.user.username);

  const embed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle('🌟 NOUVEAU NIVEAU ATTEINT !')
    .setDescription(`${levelUpMsg}\n\n⚔️ **Statistiques augmentées !**\n🪙 **+${newLevel * 50} Or bonus** octroyé !`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: 'GuildForge RPG Engine', iconURL: client.user?.displayAvatarURL() })
    .setTimestamp();

  // Give level up gold bonus
  const user = getUser(userId, guildId);
  updateUser({
    user_id: userId,
    guild_id: guildId,
    gold: user.gold + (newLevel * 50),
    max_hp: user.max_hp + 5,
    atk: user.atk + 2,
    def: user.def + 1
  });

  // Send to designated channel or fallback
  if (config.levelup_channel_id) {
    const channel = client.channels.cache.get(config.levelup_channel_id) as TextChannel | undefined;
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] }).catch(() => {});
      return;
    }
  }

  // If no specific channel set, try sending in member's context or DM
  try {
    const dm = await member.createDM();
    await dm.send({ embeds: [embed] });
  } catch {
    // Ignore DM block
  }
}

// Handle voice channel join
export function handleVoiceJoin(userId: string, guildId: string): void {
  const now = Date.now();
  updateUser({
    user_id: userId,
    guild_id: guildId,
    voice_joined_at: now
  });
}

// Handle voice channel leave
export async function handleVoiceLeave(userId: string, guildId: string, member: GuildMember, client: Client): Promise<void> {
  const user = getUser(userId, guildId);
  if (!user.voice_joined_at) return;

  const now = Date.now();
  const timeSpentMs = now - user.voice_joined_at;
  const minutes = Math.floor(timeSpentMs / 60000);

  // Reset voice tracker
  updateUser({
    user_id: userId,
    guild_id: guildId,
    voice_joined_at: null
  });

  if (minutes < 1) return;

  // 10 XP & 4 Gold per minute in vocal (capped at 2 hours per session to prevent afk abuse)
  const effectiveMinutes = Math.min(minutes, 120);
  const config = getGuildConfig(guildId);
  const earnedXp = Math.floor(effectiveMinutes * 10 * config.xp_rate);
  const earnedGold = effectiveMinutes * 4;

  const currentLevelInfo = getLevelProgress(user.xp);
  const newTotalXp = user.xp + earnedXp;
  const newLevelInfo = getLevelProgress(newTotalXp);

  updateUser({
    user_id: userId,
    guild_id: guildId,
    xp: newTotalXp,
    gold: user.gold + earnedGold,
    level: newLevelInfo.level
  });

  // Increment voice quests
  incrementQuestProgress(userId, guildId, 'voice', effectiveMinutes);

  if (newLevelInfo.level > currentLevelInfo.level) {
    await handleLevelUp(userId, guildId, newLevelInfo.level, member, client, config);
  }
}
