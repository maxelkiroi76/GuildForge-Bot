import { db, getUser, updateUser } from '../database/db.js';
import { DAILY_QUESTS_POOL } from '../data/quests.js';
import { UserQuest, Quest } from '../types/index.js';

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function getUserDailyQuests(userId: string, guildId: string): { quest: Quest; progress: number; completed: boolean; claimed: boolean; dbId: number }[] {
  const today = getTodayDateString();

  // Get existing quests for today
  let userQuests = db.prepare(`
    SELECT * FROM user_quests WHERE user_id = ? AND guild_id = ? AND date = ?
  `).all(userId, guildId, today) as UserQuest[];

  // If no quests assigned today, assign 3 random quests
  if (userQuests.length === 0) {
    const shuffled = [...DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
    const insert = db.prepare(`
      INSERT INTO user_quests (user_id, guild_id, quest_id, progress, completed, claimed, date)
      VALUES (?, ?, ?, 0, 0, 0, ?)
    `);

    for (const q of shuffled) {
      insert.run(userId, guildId, q.id, today);
    }

    userQuests = db.prepare(`
      SELECT * FROM user_quests WHERE user_id = ? AND guild_id = ? AND date = ?
    `).all(userId, guildId, today) as UserQuest[];
  }

  return userQuests.map(uq => {
    const def = DAILY_QUESTS_POOL.find(q => q.id === uq.quest_id) || {
      id: uq.quest_id,
      title: 'Quête mystérieuse',
      description: 'Objectif secret',
      type: 'messages',
      target: 10,
      reward_xp: 100,
      reward_gold: 50
    };

    return {
      quest: def,
      progress: uq.progress,
      completed: uq.completed === 1,
      claimed: uq.claimed === 1,
      dbId: uq.id
    };
  });
}

export function incrementQuestProgress(userId: string, guildId: string, type: 'messages' | 'voice' | 'raid_damage' | 'duel_win' | 'gamble', amount = 1): void {
  const today = getTodayDateString();
  const quests = getUserDailyQuests(userId, guildId);

  for (const q of quests) {
    if (q.quest.type === type && !q.completed) {
      const newProgress = Math.min(q.quest.target, q.progress + amount);
      const isCompleted = newProgress >= q.quest.target ? 1 : 0;

      db.prepare(`
        UPDATE user_quests 
        SET progress = ?, completed = ?
        WHERE id = ?
      `).run(newProgress, isCompleted, q.dbId);
    }
  }
}

export function claimQuestReward(userId: string, guildId: string, questId: string): { success: boolean; xp?: number; gold?: number; message: string } {
  const today = getTodayDateString();
  const uq = db.prepare(`
    SELECT * FROM user_quests 
    WHERE user_id = ? AND guild_id = ? AND quest_id = ? AND date = ?
  `).get(userId, guildId, questId, today) as UserQuest | undefined;

  if (!uq) {
    return { success: false, message: 'Quête introuvable pour aujourd\'hui.' };
  }

  if (uq.claimed === 1) {
    return { success: false, message: 'Tu as déjà récupéré la récompense pour cette quête !' };
  }

  const def = DAILY_QUESTS_POOL.find(q => q.id === questId);
  if (!def) {
    return { success: false, message: 'Définition de quête introuvable.' };
  }

  if (uq.progress < def.target) {
    return { success: false, message: `Cette quête n'est pas encore terminée (${uq.progress}/${def.target}).` };
  }

  // Mark as claimed
  db.prepare(`UPDATE user_quests SET claimed = 1, completed = 1 WHERE id = ?`).run(uq.id);

  // Give rewards
  const user = getUser(userId, guildId);
  updateUser({
    user_id: userId,
    guild_id: guildId,
    xp: user.xp + def.reward_xp,
    gold: user.gold + def.reward_gold
  });

  return {
    success: true,
    xp: def.reward_xp,
    gold: def.reward_gold,
    message: `Félicitations ! Tu as reçu **+${def.reward_xp} XP** et **+${def.reward_gold} Or** 🪙 !`
  };
}
