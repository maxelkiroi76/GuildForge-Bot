import { Collection } from 'discord.js';
import { Command } from '../types/index.js';

import { rankCommand } from './profile/rank.js';
import { leaderboardCommand } from './profile/leaderboard.js';
import { dailyCommand } from './economy/daily.js';
import { balanceCommand } from './economy/balance.js';
import { raidCommand } from './rpg/raid.js';
import { duelCommand } from './rpg/duel.js';
import { inventoryCommand } from './rpg/inventory.js';
import { shopCommand } from './rpg/shop.js';
import { questsCommand } from './rpg/quests.js';
import { gambleCommand } from './games/gamble.js';
import { triviaCommand } from './games/trivia.js';
import { configCommand } from './admin/config.js';
import { premiumCommand } from './profile/premium.js';
import { voteCommand } from './profile/vote.js';

export const commands = new Collection<string, Command>();

const commandList: Command[] = [
  rankCommand,
  leaderboardCommand,
  premiumCommand,
  voteCommand,
  dailyCommand,
  balanceCommand,
  raidCommand,
  duelCommand,
  inventoryCommand,
  shopCommand,
  questsCommand,
  gambleCommand,
  triviaCommand,
  configCommand
];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}

export { commandList };
