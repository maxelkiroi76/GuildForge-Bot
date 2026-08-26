import { Item } from '../types/index.js';

export const ITEMS: Record<string, Item> = {
  // --- WEAPONS ---
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Épée en Bois',
    description: 'Une simple épée d\'entraînement pour débutant.',
    type: 'weapon',
    price: 100,
    bonus_atk: 5,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🗡️',
    rarity: 'common'
  },
  'iron_blade': {
    id: 'iron_blade',
    name: 'Lame de Fer Forgé',
    description: 'Une lame robuste équilibrée pour le combat rapproché.',
    type: 'weapon',
    price: 450,
    bonus_atk: 15,
    bonus_def: 2,
    bonus_hp: 0,
    icon: '⚔️',
    rarity: 'rare'
  },
  'shadow_daggers': {
    id: 'shadow_daggers',
    name: 'Dagues de l\'Ombre',
    description: 'Deux dagues effilées imprégnées de poison nocturne.',
    type: 'weapon',
    price: 1200,
    bonus_atk: 32,
    bonus_def: 0,
    bonus_hp: 20,
    icon: '🔪',
    rarity: 'epic'
  },
  'dragon_slayer': {
    id: 'dragon_slayer',
    name: 'Pourfendeur de Dragon',
    description: 'Une épée colossale forgée dans le sang d\'un dragon ancien.',
    type: 'weapon',
    price: 3500,
    bonus_atk: 65,
    bonus_def: 10,
    bonus_hp: 80,
    icon: '🐉',
    rarity: 'legendary'
  },
  'aegis_blade_mythic': {
    id: 'aegis_blade_mythic',
    name: 'Lame Céleste d\'Aegis',
    description: 'Une relique divine scintillant d\'une puissance infinie.',
    type: 'weapon',
    price: 10000,
    bonus_atk: 120,
    bonus_def: 30,
    bonus_hp: 250,
    icon: '✨',
    rarity: 'mythic'
  },

  // --- ARMORS ---
  'leather_tunic': {
    id: 'leather_tunic',
    name: 'Tunique de Cuir',
    description: 'Offre une protection basique contre les égratignures.',
    type: 'armor',
    price: 120,
    bonus_atk: 0,
    bonus_def: 6,
    bonus_hp: 25,
    icon: '🥋',
    rarity: 'common'
  },
  'chainmail_armor': {
    id: 'chainmail_armor',
    name: 'Cotte de Mailles Renforcée',
    description: 'Une armure métallique absorbant les impacts tranchants.',
    type: 'armor',
    price: 500,
    bonus_atk: 0,
    bonus_def: 18,
    bonus_hp: 75,
    icon: '🛡️',
    rarity: 'rare'
  },
  'obsidian_plate': {
    id: 'obsidian_plate',
    name: 'Armure de Plaques d\'Obsidienne',
    description: 'Forgée dans la roche volcanique, quasi impénétrable.',
    type: 'armor',
    price: 1400,
    bonus_atk: 5,
    bonus_def: 40,
    bonus_hp: 180,
    icon: '🪨',
    rarity: 'epic'
  },
  'valkyrie_wings': {
    id: 'valkyrie_wings',
    name: 'Armure de la Valkyrie',
    description: 'Plastron enchanté conférant grâce et invulnérabilité.',
    type: 'armor',
    price: 3800,
    bonus_atk: 15,
    bonus_def: 75,
    bonus_hp: 350,
    icon: '🪽',
    rarity: 'legendary'
  },

  // --- POTIONS & CONSUMABLES ---
  'health_potion_small': {
    id: 'health_potion_small',
    name: 'Potion de Soin Mineure',
    description: 'Restaure instantanément 50 PV.',
    type: 'potion',
    price: 40,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 50,
    icon: '🧪',
    rarity: 'common'
  },
  'health_potion_large': {
    id: 'health_potion_large',
    name: 'Potion de Soin Majeure',
    description: 'Restaure instantanément 150 PV.',
    type: 'potion',
    price: 120,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 150,
    icon: '🍷',
    rarity: 'rare'
  },
  'elixir_power': {
    id: 'elixir_power',
    name: 'Élixir de Puissance Éphémère',
    description: 'Booste l\'attaque de +25 pour le prochain combat.',
    type: 'potion',
    price: 200,
    bonus_atk: 25,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '⚡',
    rarity: 'epic'
  },

  // --- PROFILE THEMES (Canvas Card Cosmetics) ---
  'theme_cosmic': {
    id: 'theme_cosmic',
    name: 'Thème Cosmique Astral',
    description: 'Arrière-plan galactique violet et néon pour votre carte /rank.',
    type: 'theme',
    price: 500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🌌',
    rarity: 'rare',
    theme_color: '#8a2be2'
  },
  'theme_inferno': {
    id: 'theme_inferno',
    name: 'Thème Inferno Magma',
    description: 'Arrière-plan ardent avec braises incandescentes.',
    type: 'theme',
    price: 1000,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🔥',
    rarity: 'epic',
    theme_color: '#ff4500'
  },
  'theme_cyberpunk': {
    id: 'theme_cyberpunk',
    name: 'Thème Cyberpunk Néon 2077',
    description: 'Style néon cyan et rose futuriste rétro-vague.',
    type: 'theme',
    price: 1500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🌆',
    rarity: 'epic',
    theme_color: '#00ffff'
  },
  'theme_gold_royalty': {
    id: 'theme_gold_royalty',
    name: 'Thème Or Impérial & Diamant',
    description: 'Le summum du prestige : bordures dorées et reflets brillants.',
    type: 'theme',
    price: 5000,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '👑',
    rarity: 'mythic',
    theme_color: '#ffd700'
  }
};

export const CLASS_BONUSES = {
  warrior: { name: 'Guerrier', hp: 120, mana: 30, atk: 18, def: 12, icon: '🛡️', desc: 'Robuste avec une défense élevée et de gros points de vie.' },
  mage: { name: 'Mage', hp: 80, mana: 100, atk: 26, def: 5, icon: '🔮', desc: 'Puissance d\'attaque magique dévastatrice mais fragile.' },
  rogue: { name: 'Voleur', hp: 90, mana: 50, atk: 22, def: 8, icon: '🗡️', desc: 'Vitesse et taux de coups critiques accrus.' },
  paladin: { name: 'Paladin', hp: 110, mana: 60, atk: 16, def: 14, icon: '✨', desc: 'Équilibre parfait entre magie sacrée et robustesse.' }
};
