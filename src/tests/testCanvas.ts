import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, getUser, updateUser } from '../database/db.js';
import { generateRankCard } from '../services/canvasService.js';

async function main() {
  initDatabase();

  const user = getUser('123456789', '987654321');
  updateUser({
    user_id: '123456789',
    guild_id: '987654321',
    xp: 2850,
    level: 7,
    gold: 3450,
    bank: 1000,
    character_class: 'warrior',
    hp: 120,
    max_hp: 120,
    mana: 40,
    max_mana: 40,
    atk: 35,
    def: 22,
    equipped_weapon: 'iron_blade',
    equipped_armor: 'chainmail_armor',
    profile_theme: 'theme_cosmic',
    daily_streak: 5,
    last_daily: Date.now(),
    reputation: 15,
    total_raids_won: 3,
    total_duels_won: 8
  });

  const updatedUser = getUser('123456789', '987654321');
  const buffer = await generateRankCard(
    updatedUser,
    'https://cdn.discordapp.com/embed/avatars/0.png',
    'maxelkiroi'
  );

  const outDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'test_rank.png');
  fs.writeFileSync(outPath, buffer);

  console.log('✅ Rank card generated successfully at:', outPath);
}

main().catch(console.error);
