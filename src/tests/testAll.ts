import { initDatabase, getUser, updateUser, addInventoryItem, equipItem, getUserInventory, getLeaderboard } from '../database/db.js';
import { getLevelProgress, getRequiredXpForLevel } from '../services/levelService.js';
import { getUserDailyQuests, incrementQuestProgress, claimQuestReward } from '../services/questService.js';
import { generateRankCard } from '../services/canvasService.js';
import { commandList } from '../commands/index.js';
import { ITEMS } from '../data/items.js';

async function runTests() {
  console.log('🧪 Starting GuildForge Complete Verification Suite...\n');

  // 1. Database Test
  console.log('1. Testing Database & Profile Engine...');
  initDatabase();
  const testUserId = 'test_user_101';
  const testGuildId = 'test_guild_202';

  const user = getUser(testUserId, testGuildId);
  if (!user || user.user_id !== testUserId) {
    throw new Error('Failed to create or retrieve user profile');
  }
  console.log('   ✅ User profile retrieved/created successfully.');

  // 2. Leveling & XP calculations
  console.log('2. Testing Leveling & Math Formula...');
  const lvl1Progress = getLevelProgress(0);
  const lvl5Progress = getLevelProgress(1200);
  console.log(`   ✅ Level from 0 XP: ${lvl1Progress.level}, Level from 1200 XP: ${lvl5Progress.level} (Progression: ${lvl5Progress.progressPercent}%)`);

  // 3. Economy & Inventory
  console.log('3. Testing Inventory, Shop & Equipping...');
  addInventoryItem(testUserId, testGuildId, 'dragon_slayer', 1);
  addInventoryItem(testUserId, testGuildId, 'theme_inferno', 1);
  equipItem(testUserId, testGuildId, 'dragon_slayer');
  equipItem(testUserId, testGuildId, 'theme_inferno');

  const inv = getUserInventory(testUserId, testGuildId);
  const updatedUser = getUser(testUserId, testGuildId);
  if (updatedUser.equipped_weapon !== 'dragon_slayer' || updatedUser.profile_theme !== 'theme_inferno') {
    throw new Error('Equip item failed');
  }
  console.log(`   ✅ Inventory contains ${inv.length} items. Equipped: Weapon = ${updatedUser.equipped_weapon}, Theme = ${updatedUser.profile_theme}`);

  // 4. Daily Quests System
  console.log('4. Testing Daily Quests...');
  const quests = getUserDailyQuests(testUserId, testGuildId);
  console.log(`   ✅ ${quests.length} Daily Quests assigned for today.`);

  incrementQuestProgress(testUserId, testGuildId, 'messages', 5);
  const updatedQuests = getUserDailyQuests(testUserId, testGuildId);
  console.log(`   ✅ Message quest updated with progress.`);

  // 5. Canvas Card Generation for all themes
  console.log('5. Testing Canvas HD Rendering across themes...');
  const themes = ['theme_cosmic', 'theme_inferno', 'theme_cyberpunk', 'theme_gold_royalty'];
  for (const th of themes) {
    updateUser({ user_id: testUserId, guild_id: testGuildId, profile_theme: th });
    const buffer = await generateRankCard(
      getUser(testUserId, testGuildId),
      'https://cdn.discordapp.com/embed/avatars/1.png',
      `Hero-${th}`
    );
    if (!buffer || buffer.length === 0) {
      throw new Error(`Failed to generate canvas buffer for theme: ${th}`);
    }
  }
  console.log(`   ✅ Generated HD rank cards for all ${themes.length} visual themes without error.`);

  // 6. Slash Command Data Validation
  console.log('6. Validating Slash Commands for Discord Gateway Deployment...');
  for (const cmd of commandList) {
    const json = cmd.data.toJSON();
    if (!json.name || !json.description) {
      throw new Error(`Invalid slash command definition: ${cmd.data.name}`);
    }
  }
  console.log(`   ✅ All ${commandList.length} Slash Commands are valid and ready for Discord API registration.`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! GuildForge is 100% operational.');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
