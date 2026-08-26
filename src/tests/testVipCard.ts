import { initDatabase, db, getUser, updateUser } from '../database/db.js';
import { generateRankCard } from '../services/canvasService.js';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  initDatabase();

  const users = db.prepare('SELECT user_id, guild_id, is_premium, premium_until FROM users').all();
  console.log('Users in DB:', users);

  // Test VIP Card render with crown badge
  const user = getUser('test_vip_user', 'guild_1');
  updateUser({
    user_id: 'test_vip_user',
    guild_id: 'guild_1',
    is_premium: 1,
    premium_until: Date.now() + 30 * 86400000,
    gold: 5000,
    daily_streak: 7
  });

  const updatedUser = getUser('test_vip_user', 'guild_1');
  const buffer = await generateRankCard(
    updatedUser,
    'https://cdn.discordapp.com/embed/avatars/1.png',
    'Maxelkiroi'
  );

  const outPath = path.resolve(process.cwd(), 'data/test_vip_rank.png');
  fs.writeFileSync(outPath, buffer);
  console.log('✅ VIP Card generated at:', outPath);
}

main().catch(console.error);
