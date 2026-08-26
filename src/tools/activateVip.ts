import { initDatabase, db, updateUser } from '../database/db.js';

initDatabase();

// Update maxelkiroi (user_id: 799194986507534336)
updateUser({
  user_id: '799194986507534336',
  guild_id: '1426383639234740296',
  is_premium: 1,
  premium_until: Date.now() + 365 * 24 * 60 * 60 * 1000
});

console.log('✅ VIP activé avec succès pour maxelkiroi !');
