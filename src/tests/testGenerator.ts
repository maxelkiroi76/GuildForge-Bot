import { generateRandomItem, rollRarity } from '../services/itemGenerator.js';
import { initDatabase, saveCustomItem } from '../database/db.js';

initDatabase();

console.log('--- TEST DU GÉNÉRATEUR PROCÉDURAL D\'ITEMS ---');

for (let lvl = 1; lvl <= 10; lvl += 3) {
  const item = generateRandomItem(lvl);
  saveCustomItem(item);
  console.log(`[Lvl ${lvl}] [${item.rarity.toUpperCase()}] ${item.icon} ${item.name} -> ATK: +${item.bonus_atk}, DEF: +${item.bonus_def}, HP: +${item.bonus_hp} (${item.price} Or)`);
}

console.log('\n--- TEST DROPS DE COFFRES MYTHIQUES ---');
for (let i = 0; i < 3; i++) {
  const mythicItem = generateRandomItem(15, undefined, 'mythic');
  saveCustomItem(mythicItem);
  console.log(`👑 [MYTHIQUE] ${mythicItem.icon} ${mythicItem.name} -> ATK: +${mythicItem.bonus_atk}, DEF: +${mythicItem.bonus_def}, HP: +${mythicItem.bonus_hp} (${mythicItem.price} Or)`);
}

console.log('\n✅ Test du générateur procédural réussi avec succès !');
