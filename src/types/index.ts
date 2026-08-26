import { 
  SlashCommandBuilder, 
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction, 
  AutocompleteInteraction, 
  PermissionResolvable 
} from 'discord.js';

export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'paladin';

export interface UserProfile {
  user_id: string;
  guild_id: string;
  xp: number;
  level: number;
  gold: number;
  bank: number;
  character_class: CharacterClass;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  atk: number;
  def: number;
  equipped_weapon: string | null;
  equipped_armor: string | null;
  profile_theme: string;
  daily_streak: number;
  last_daily: number | null;
  last_message_xp: number;
  voice_joined_at: number | null;
  reputation: number;
  total_raids_won: number;
  total_duels_won: number;
  is_premium: number;
  premium_until: number | null;
}

export interface GuildConfig {
  guild_id: string;
  levelup_channel_id: string | null;
  levelup_message: string;
  xp_rate: number;
  raid_channel_id: string | null;
  roles_rewards_enabled: number;
  is_premium: number;
  premium_until: number | null;
}

export interface RoleReward {
  id: number;
  guild_id: string;
  level: number;
  role_id: string;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'weapon' | 'armor' | 'potion' | 'theme' | 'badge';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  price: number;
  bonus_atk: number;
  bonus_def: number;
  bonus_hp: number;
  icon: string;
  rarity: ItemRarity;
  theme_color?: string;
}

export interface InventoryItem {
  id: number;
  user_id: string;
  guild_id: string;
  item_id: string;
  quantity: number;
  equipped: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'messages' | 'voice' | 'raid_damage' | 'duel_win' | 'gamble';
  target: number;
  reward_xp: number;
  reward_gold: number;
}

export interface UserQuest {
  id: number;
  user_id: string;
  guild_id: string;
  quest_id: string;
  progress: number;
  completed: number;
  claimed: number;
  date: string;
}

export interface RaidParticipant {
  user_id: string;
  username: string;
  damage: number;
  last_action: number;
  hp: number;
  max_hp: number;
}

export interface ActiveRaid {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string;
  boss_name: string;
  boss_icon: string;
  boss_element: string;
  current_hp: number;
  max_hp: number;
  atk: number;
  def: number;
  reward_xp: number;
  reward_gold: number;
  participants: Map<string, RaidParticipant>;
  logs: string[];
  is_active: boolean;
  started_at: number;
  expires_at: number;
}

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  category: 'profile' | 'rpg' | 'economy' | 'games' | 'admin';
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldown?: number;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}
