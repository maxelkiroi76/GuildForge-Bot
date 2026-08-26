import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { 
  UserProfile, 
  GuildConfig, 
  RoleReward, 
  InventoryItem, 
  UserQuest,
  CharacterClass 
} from '../types/index.js';
import { ITEMS, CLASS_BONUSES } from '../data/items.js';

// Ensure data folder exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'guildforge.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      gold INTEGER DEFAULT 100,
      bank INTEGER DEFAULT 0,
      character_class TEXT DEFAULT 'warrior',
      hp INTEGER DEFAULT 100,
      max_hp INTEGER DEFAULT 100,
      mana INTEGER DEFAULT 50,
      max_mana INTEGER DEFAULT 50,
      atk INTEGER DEFAULT 15,
      def INTEGER DEFAULT 10,
      equipped_weapon TEXT DEFAULT NULL,
      equipped_armor TEXT DEFAULT NULL,
      profile_theme TEXT DEFAULT 'theme_cosmic',
      daily_streak INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT NULL,
      last_message_xp INTEGER DEFAULT 0,
      voice_joined_at INTEGER DEFAULT NULL,
      reputation INTEGER DEFAULT 0,
      total_raids_won INTEGER DEFAULT 0,
      total_duels_won INTEGER DEFAULT 0,
      is_premium INTEGER DEFAULT 0,
      premium_until INTEGER DEFAULT NULL,
      PRIMARY KEY (user_id, guild_id)
    );
  `);

  // Guild configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
      guild_id TEXT PRIMARY KEY,
      levelup_channel_id TEXT DEFAULT NULL,
      levelup_message TEXT DEFAULT '🎉 Bravo {user} ! Tu as atteint le **Niveau {level}** !',
      xp_rate REAL DEFAULT 1.0,
      raid_channel_id TEXT DEFAULT NULL,
      roles_rewards_enabled INTEGER DEFAULT 1,
      is_premium INTEGER DEFAULT 0,
      premium_until INTEGER DEFAULT NULL
    );
  `);

  // Safe migrations for existing SQLite databases
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN premium_until INTEGER DEFAULT NULL;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE guilds ADD COLUMN is_premium INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE guilds ADD COLUMN premium_until INTEGER DEFAULT NULL;`);
  } catch {}

  // Role rewards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      UNIQUE(guild_id, level)
    );
  `);

  // User inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      equipped INTEGER DEFAULT 0,
      UNIQUE(user_id, guild_id, item_id)
    );
  `);

  // User daily quests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      claimed INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      UNIQUE(user_id, guild_id, quest_id, date)
    );
  `);

  console.log('✅ SQLite Database initialized successfully at:', dbPath);
}

// ---------------- USER OPERATIONS ----------------

export function getUser(userId: string, guildId: string): UserProfile {
  const row = db.prepare(`
    SELECT * FROM users WHERE user_id = ? AND guild_id = ?
  `).get(userId, guildId) as UserProfile | undefined;

  if (row) return row;

  // Create default user profile
  const defaultClass: CharacterClass = 'warrior';
  const stats = CLASS_BONUSES[defaultClass];

  const insert = db.prepare(`
    INSERT INTO users (
      user_id, guild_id, xp, level, gold, bank, character_class,
      hp, max_hp, mana, max_mana, atk, def,
      equipped_weapon, equipped_armor, profile_theme,
      daily_streak, last_daily, last_message_xp, voice_joined_at,
      reputation, total_raids_won, total_duels_won
    ) VALUES (
      ?, ?, 0, 1, 150, 0, ?,
      ?, ?, ?, ?, ?, ?,
      NULL, NULL, 'theme_cosmic',
      0, NULL, 0, NULL,
      0, 0, 0
    )
  `);

  insert.run(
    userId, guildId, defaultClass,
    stats.hp, stats.hp, stats.mana, stats.mana, stats.atk, stats.def
  );

  return db.prepare(`
    SELECT * FROM users WHERE user_id = ? AND guild_id = ?
  `).get(userId, guildId) as UserProfile;
}

export function updateUser(profile: Partial<UserProfile> & { user_id: string; guild_id: string }): void {
  const fields = Object.keys(profile).filter(k => k !== 'user_id' && k !== 'guild_id');
  if (fields.length === 0) return;

  const setClause = fields.map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE user_id = @user_id AND guild_id = @guild_id`);
  stmt.run(profile);
}

export function calculateEffectiveStats(user: UserProfile) {
  let effectiveAtk = user.atk;
  let effectiveDef = user.def;
  let effectiveMaxHp = user.max_hp;

  if (user.equipped_weapon && ITEMS[user.equipped_weapon]) {
    const weapon = ITEMS[user.equipped_weapon];
    effectiveAtk += weapon.bonus_atk;
    effectiveDef += weapon.bonus_def;
    effectiveMaxHp += weapon.bonus_hp;
  }

  if (user.equipped_armor && ITEMS[user.equipped_armor]) {
    const armor = ITEMS[user.equipped_armor];
    effectiveAtk += armor.bonus_atk;
    effectiveDef += armor.bonus_def;
    effectiveMaxHp += armor.bonus_hp;
  }

  return {
    atk: effectiveAtk,
    def: effectiveDef,
    maxHp: effectiveMaxHp
  };
}

export function getLeaderboard(guildId: string, limit = 10, offset = 0): UserProfile[] {
  return db.prepare(`
    SELECT * FROM users 
    WHERE guild_id = ? 
    ORDER BY level DESC, xp DESC 
    LIMIT ? OFFSET ?
  `).all(guildId, limit, offset) as UserProfile[];
}

export function getUserRankPosition(userId: string, guildId: string): number {
  const result = db.prepare(`
    SELECT COUNT(*) as rank_pos FROM users
    WHERE guild_id = ? AND (level > (SELECT level FROM users WHERE user_id = ? AND guild_id = ?)
      OR (level = (SELECT level FROM users WHERE user_id = ? AND guild_id = ?) 
          AND xp >= (SELECT xp FROM users WHERE user_id = ? AND guild_id = ?)))
  `).get(guildId, userId, guildId, userId, guildId, userId, guildId) as { rank_pos: number };

  return result ? result.rank_pos : 1;
}

// ---------------- GUILD OPERATIONS ----------------

export function getGuildConfig(guildId: string): GuildConfig {
  let config = db.prepare(`SELECT * FROM guilds WHERE guild_id = ?`).get(guildId) as GuildConfig | undefined;
  if (!config) {
    db.prepare(`INSERT INTO guilds (guild_id) VALUES (?)`).run(guildId);
    config = db.prepare(`SELECT * FROM guilds WHERE guild_id = ?`).get(guildId) as GuildConfig;
  }
  return config;
}

export function updateGuildConfig(guildId: string, fields: Partial<GuildConfig>): void {
  const keys = Object.keys(fields).filter(k => k !== 'guild_id');
  if (keys.length === 0) return;

  const setClause = keys.map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE guilds SET ${setClause} WHERE guild_id = @guild_id`);
  stmt.run({ ...fields, guild_id: guildId });
}

export function getRoleRewards(guildId: string): RoleReward[] {
  return db.prepare(`SELECT * FROM role_rewards WHERE guild_id = ? ORDER BY level ASC`).all(guildId) as RoleReward[];
}

export function setRoleReward(guildId: string, level: number, roleId: string): void {
  db.prepare(`
    INSERT INTO role_rewards (guild_id, level, role_id)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, level) DO UPDATE SET role_id = excluded.role_id
  `).run(guildId, level, roleId);
}

export function removeRoleReward(guildId: string, level: number): void {
  db.prepare(`DELETE FROM role_rewards WHERE guild_id = ? AND level = ?`).run(guildId, level);
}

// ---------------- INVENTORY OPERATIONS ----------------

export function getUserInventory(userId: string, guildId: string): InventoryItem[] {
  return db.prepare(`
    SELECT * FROM inventory 
    WHERE user_id = ? AND guild_id = ? AND quantity > 0
  `).all(userId, guildId) as InventoryItem[];
}

export function addInventoryItem(userId: string, guildId: string, itemId: string, quantity = 1): void {
  db.prepare(`
    INSERT INTO inventory (user_id, guild_id, item_id, quantity, equipped)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, guild_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(userId, guildId, itemId, quantity);
}

export function removeInventoryItem(userId: string, guildId: string, itemId: string, quantity = 1): boolean {
  const current = db.prepare(`
    SELECT quantity FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ?
  `).get(userId, guildId, itemId) as { quantity: number } | undefined;

  if (!current || current.quantity < quantity) return false;

  if (current.quantity === quantity) {
    db.prepare(`
      DELETE FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ?
    `).run(userId, guildId, itemId);
  } else {
    db.prepare(`
      UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND guild_id = ? AND item_id = ?
    `).run(quantity, userId, guildId, itemId);
  }
  return true;
}

export function equipItem(userId: string, guildId: string, itemId: string): boolean {
  const item = ITEMS[itemId];
  if (!item) return false;

  const inv = db.prepare(`
    SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ?
  `).get(userId, guildId, itemId) as InventoryItem | undefined;

  if (!inv || inv.quantity <= 0) return false;

  const user = getUser(userId, guildId);

  if (item.type === 'weapon') {
    updateUser({ user_id: userId, guild_id: guildId, equipped_weapon: itemId });
    return true;
  } else if (item.type === 'armor') {
    updateUser({ user_id: userId, guild_id: guildId, equipped_armor: itemId });
    return true;
  } else if (item.type === 'theme') {
    updateUser({ user_id: userId, guild_id: guildId, profile_theme: itemId });
    return true;
  }

  return false;
}
