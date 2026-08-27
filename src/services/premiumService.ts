import { Interaction, User, Guild } from 'discord.js';
import { getUser, updateUser, getGuildConfig, updateGuildConfig, saveVipBackup, removeVipBackup } from '../database/db.js';

export interface PremiumStatus {
  isPremium: boolean;
  tier: 'free' | 'vip_user' | 'vip_guild';
  xpMultiplier: number;
  goldMultiplier: number;
  badge: string;
  source: 'discord_subscription' | 'database_gift' | 'none';
  expiresAt: number | null;
}

export function isPermanentVip(userId: string): boolean {
  const ownerId = process.env.BOT_OWNER_ID || '799194986507534336';
  if (userId === ownerId) return true;

  const permVips = (process.env.PERMANENT_VIP_IDS?.split(',').map(s => s.trim()) || []).filter(Boolean);
  return permVips.includes(userId);
}

export function checkUserPremium(userId: string, guildId: string, interaction?: Interaction): PremiumStatus {
  // 0. Permanent VIP (Bot Owner & Whitelisted IDs)
  if (isPermanentVip(userId)) {
    return {
      isPremium: true,
      tier: 'vip_user',
      xpMultiplier: 1.5,
      goldMultiplier: 1.5,
      badge: '👑 VIP',
      source: 'database_gift',
      expiresAt: null
    };
  }

  const user = getUser(userId, guildId);
  const guildConfig = getGuildConfig(guildId);
  const now = Date.now();

  // 1. Check Discord Native Entitlements if interaction provided
  if (interaction && 'entitlements' in interaction && interaction.entitlements) {
    const userEntitlements = interaction.entitlements;
    if (userEntitlements.size > 0) {
      return {
        isPremium: true,
        tier: 'vip_user',
        xpMultiplier: 1.5,
        goldMultiplier: 1.5,
        badge: '👑 VIP',
        source: 'discord_subscription',
        expiresAt: null
      };
    }
  }

  // 2. Check Database User VIP Status
  if (user.is_premium === 1) {
    if (user.premium_until && user.premium_until < now) {
      // Expired
      updateUser({ user_id: userId, guild_id: guildId, is_premium: 0, premium_until: null });
      removeVipBackup(userId);
    } else {
      return {
        isPremium: true,
        tier: 'vip_user',
        xpMultiplier: 1.5,
        goldMultiplier: 1.5,
        badge: '👑 VIP',
        source: 'database_gift',
        expiresAt: user.premium_until
      };
    }
  }

  // 3. Check Database Guild VIP Status (Server-wide boost)
  if (guildConfig.is_premium === 1) {
    if (guildConfig.premium_until && guildConfig.premium_until < now) {
      updateGuildConfig(guildId, { is_premium: 0, premium_until: null });
    } else {
      return {
        isPremium: true,
        tier: 'vip_guild',
        xpMultiplier: 1.5,
        goldMultiplier: 1.5,
        badge: '⚡ GUILDE VIP',
        source: 'database_gift',
        expiresAt: guildConfig.premium_until
      };
    }
  }

  // Standard Free Tier
  return {
    isPremium: false,
    tier: 'free',
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    badge: '',
    source: 'none',
    expiresAt: null
  };
}

export function grantUserVip(userId: string, guildId: string, durationDays = 30): void {
  const expires = durationDays === -1 ? null : Date.now() + durationDays * 24 * 60 * 60 * 1000;
  updateUser({
    user_id: userId,
    guild_id: guildId,
    is_premium: 1,
    premium_until: expires
  });
  saveVipBackup(userId, 1, expires);
}

export function revokeUserVip(userId: string, guildId: string): void {
  updateUser({
    user_id: userId,
    guild_id: guildId,
    is_premium: 0,
    premium_until: null
  });
  removeVipBackup(userId);
}
