import { Quest } from '../types/index.js';

export const DAILY_QUESTS_POOL: Quest[] = [
  {
    id: 'msg_20',
    title: 'Bavardage Aventureux',
    description: 'Envoyer 20 messages actifs dans les salons textuels.',
    type: 'messages',
    target: 20,
    reward_xp: 150,
    reward_gold: 100
  },
  {
    id: 'voice_15',
    title: 'Conseil de Guerre',
    description: 'Passer au moins 15 minutes dans un salon vocal.',
    type: 'voice',
    target: 15,
    reward_xp: 200,
    reward_gold: 120
  },
  {
    id: 'raid_damage_300',
    title: 'Héros du Bastion',
    description: 'Infliger un total de 300 dégâts lors des Raids de Boss.',
    type: 'raid_damage',
    target: 300,
    reward_xp: 350,
    reward_gold: 250
  },
  {
    id: 'duel_win_1',
    title: 'Maître d\'Armes',
    description: 'Remporter 1 duel PvP contre un autre membre.',
    type: 'duel_win',
    target: 1,
    reward_xp: 250,
    reward_gold: 150
  },
  {
    id: 'gamble_3',
    title: 'Frisson du Hasard',
    description: 'Jouer 3 fois aux mini-jeux du casino (/gamble).',
    type: 'gamble',
    target: 3,
    reward_xp: 120,
    reward_gold: 80
  }
];
