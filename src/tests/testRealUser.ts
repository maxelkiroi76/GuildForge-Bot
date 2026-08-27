import { initDatabase, getUser } from '../database/db.js';
import { generateRankCard } from '../services/canvasService.js';
import fs from 'node:fs';

initDatabase();
const user = getUser('799194986507534336', '1426383639234740296');
console.log('Real User in DB:', user);

async function main() {
  const result = await generateRankCard(user, 'https://cdn.discordapp.com/embed/avatars/0.png', 'Maxelkiroi');
  console.log('Result isGif:', (result as any).isGif, 'length:', result.length);
  fs.writeFileSync('data/test_real_user.gif', result);
  console.log('✅ Saved to data/test_real_user.gif successfully!');
}

main().catch(console.error);
