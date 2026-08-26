import { Item, ItemRarity, ItemType } from '../types/index.js';

// Prefixes based on elemental or magical affinity
const PREFIXES: Record<ItemRarity, string[]> = {
  common: ['Simple', 'Rustique', 'En Acier', 'Léger', 'Basique', 'Ébréché', 'Renforcé'],
  rare: ['Enflammé', 'Glacial', 'Foudroyant', 'Venimeux', 'Affûté', 'Runique', 'Nocturne'],
  epic: ['Spectre', 'Sanglant', 'Céleste', 'Ombral', 'Titanesque', 'Infernal', 'Tempétueux'],
  legendary: ['Ancestral', 'Draconique', 'Cosmique', 'Divin', 'Abyssal', 'Solaire', 'Éthéré'],
  mythic: ['Omnipotent', 'Primordial', 'Infini', 'Transcendant', 'Apocalyptique', 'Stellaire']
};

// Base Item Types
const WEAPON_BASES = [
  { name: 'Épée Bâtarde', icon: '🗡️', type: 'weapon' as ItemType },
  { name: 'Katana Sanglant', icon: '⚔️', type: 'weapon' as ItemType },
  { name: 'Hache de Guerre', icon: '🪓', type: 'weapon' as ItemType },
  { name: 'Faux Maudite', icon: '🔪', type: 'weapon' as ItemType },
  { name: 'Marteau Tellurique', icon: '🔨', type: 'weapon' as ItemType },
  { name: 'Bâton d\'Arcanes', icon: '🪄', type: 'weapon' as ItemType },
  { name: 'Dague d\'Assassin', icon: '🗡️', type: 'weapon' as ItemType },
  { name: 'Arc de l\'Ombre', icon: '🏹', type: 'weapon' as ItemType },
  { name: 'Lance de Duel', icon: '🔱', type: 'weapon' as ItemType }
];

const ARMOR_BASES = [
  { name: 'Plastron en Mithril', icon: '🛡️', type: 'armor' as ItemType },
  { name: 'Cuirasse Lourde', icon: '🛡️', type: 'armor' as ItemType },
  { name: 'Cotte de Mailles Runique', icon: '🥋', type: 'armor' as ItemType },
  { name: 'Manteau d\'Ombre', icon: '🧥', type: 'armor' as ItemType },
  { name: 'Robe de l\'Archimage', icon: '👘', type: 'armor' as ItemType },
  { name: 'Égide Draconique', icon: '🛡️', type: 'armor' as ItemType }
];

// Suffixes based on mythological origin
const SUFFIXES: Record<ItemRarity, string[]> = {
  common: ['du Novice', 'des Forges', 'du Voyageur', 'du Soldat', 'des Bois'],
  rare: ['du Loup des Neiges', 'du Vagabond', 'de la Vipère', 'du Guetteur', 'des Marées'],
  epic: ['du Roi Déchu', 'du Berserker', 'de l\'Ombre Éternelle', 'de la Gorgone', 'du Kraken'],
  legendary: ['du Dragon Ancien', 'du Phénix Immortel', 'des Abysses Noires', 'du Titan Oublié', 'de l\'Archange'],
  mythic: ['du Créateur Cosmique', 'de l\'Infini Primordial', 'du Fléau Divin', 'd\'Aegis Céleste', 'de la Singularité']
};

// Rarity multiplier constants
const RARITY_MULTIPLIERS: Record<ItemRarity, { statMultiplier: number; priceMultiplier: number; minBonus: number }> = {
  common: { statMultiplier: 1.0, priceMultiplier: 1.0, minBonus: 5 },
  rare: { statMultiplier: 1.8, priceMultiplier: 2.5, minBonus: 15 },
  epic: { statMultiplier: 3.0, priceMultiplier: 6.0, minBonus: 35 },
  legendary: { statMultiplier: 5.5, priceMultiplier: 15.0, minBonus: 70 },
  mythic: { statMultiplier: 10.0, priceMultiplier: 40.0, minBonus: 150 }
};

/**
 * Pick a random rarity based on weighted probabilities (luck optionally boosts tier)
 */
export function rollRarity(luckBonus = 0): ItemRarity {
  const roll = Math.random() * 100 + luckBonus;

  if (roll >= 99) return 'mythic';
  if (roll >= 95) return 'legendary';
  if (roll >= 82) return 'epic';
  if (roll >= 55) return 'rare';
  return 'common';
}

/**
 * Procedurally generates a unique item scaled to user level
 */
export function generateRandomItem(
  level = 1,
  forcedType?: 'weapon' | 'armor',
  forcedRarity?: ItemRarity,
  luckBonus = 0
): Item {
  const rarity: ItemRarity = forcedRarity || rollRarity(luckBonus);
  const isWeapon = forcedType ? forcedType === 'weapon' : Math.random() < 0.55;

  const baseList = isWeapon ? WEAPON_BASES : ARMOR_BASES;
  const baseItem = baseList[Math.floor(Math.random() * baseList.length)];

  const prefixList = PREFIXES[rarity];
  const suffixList = SUFFIXES[rarity];

  const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
  const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];

  const generatedName = `${prefix} ${baseItem.name} ${suffix}`;
  const id = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const config = RARITY_MULTIPLIERS[rarity];
  const levelScaling = 1 + (level - 1) * 0.15; // 15% boost per player level

  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusHp = 0;

  if (isWeapon) {
    bonusAtk = Math.max(5, Math.round(config.minBonus * levelScaling * (0.9 + Math.random() * 0.25)));
    if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
      bonusHp = Math.round(bonusAtk * 0.4);
      bonusDef = Math.round(bonusAtk * 0.2);
    }
  } else {
    bonusDef = Math.max(4, Math.round(config.minBonus * 0.8 * levelScaling * (0.9 + Math.random() * 0.25)));
    bonusHp = Math.max(15, Math.round(config.minBonus * 1.5 * levelScaling * (0.9 + Math.random() * 0.25)));
    if (rarity === 'legendary' || rarity === 'mythic') {
      bonusAtk = Math.round(bonusDef * 0.25);
    }
  }

  const basePrice = isWeapon ? 120 : 100;
  const calculatedPrice = Math.round(basePrice * config.priceMultiplier * levelScaling);

  const rarityDescriptions: Record<ItemRarity, string> = {
    common: 'Un équipement forgé avec soin par les artisans locaux.',
    rare: 'Imprégné d\'une faible aura élémentaire qui vibre au toucher.',
    epic: 'Forgé dans les flammes arcaniques, cet équipement pulse d\'énergie.',
    legendary: 'Une relique d\'une puissance terrifiante chantée dans les légendes anciennes.',
    mythic: 'Un artefact mythique défiant les lois de la réalité, irradiant d\'une puissance infinie.'
  };

  return {
    id,
    name: generatedName,
    description: `${rarityDescriptions[rarity]} (Niveau ${level})`,
    type: baseItem.type,
    price: calculatedPrice,
    bonus_atk: bonusAtk,
    bonus_def: bonusDef,
    bonus_hp: bonusHp,
    icon: baseItem.icon,
    rarity
  };
}
