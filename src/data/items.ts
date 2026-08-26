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
  'bloodthirsty_axe': {
    id: 'bloodthirsty_axe',
    name: 'Hache de Guerre Sanglante',
    description: 'Une hache lourde qui inflige des plaies ouvertes dévastatrices.',
    type: 'weapon',
    price: 1800,
    bonus_atk: 45,
    bonus_def: 0,
    bonus_hp: 35,
    icon: '🪓',
    rarity: 'epic'
  },
  'storm_staff': {
    id: 'storm_staff',
    name: 'Bâton des Tempêtes',
    description: 'Canalise les éclairs célestes sur vos ennemis.',
    type: 'weapon',
    price: 2400,
    bonus_atk: 55,
    bonus_def: 5,
    bonus_hp: 30,
    icon: '🪄',
    rarity: 'epic'
  },
  'cursed_katana': {
    id: 'cursed_katana',
    name: 'Katana Muramasa Maudit',
    description: 'Une lame légendaire assoiffée de sang aux coups critiques mortels.',
    type: 'weapon',
    price: 3200,
    bonus_atk: 62,
    bonus_def: 4,
    bonus_hp: 40,
    icon: '⚔️',
    rarity: 'legendary'
  },
  'dragon_slayer': {
    id: 'dragon_slayer',
    name: 'Pourfendeur de Dragon',
    description: 'Une épée colossale forgée dans le sang d\'un dragon ancien.',
    type: 'weapon',
    price: 4500,
    bonus_atk: 75,
    bonus_def: 12,
    bonus_hp: 90,
    icon: '🐉',
    rarity: 'legendary'
  },
  'titan_hammer': {
    id: 'titan_hammer',
    name: 'Marteau du Titan Tellurique',
    description: 'Fait trembler la terre à chaque impact dévastateur.',
    type: 'weapon',
    price: 6000,
    bonus_atk: 95,
    bonus_def: 20,
    bonus_hp: 120,
    icon: '🔨',
    rarity: 'legendary'
  },
  'excalibur_divine': {
    id: 'excalibur_divine',
    name: 'Excalibur Sacrée',
    description: 'L\'épée des rois bénie par la lumière divine.',
    type: 'weapon',
    price: 8500,
    bonus_atk: 110,
    bonus_def: 25,
    bonus_hp: 180,
    icon: '✨',
    rarity: 'mythic'
  },
  'aegis_blade_mythic': {
    id: 'aegis_blade_mythic',
    name: 'Lame Céleste d\'Aegis',
    description: 'Une relique primordiale défiant les lois de la mortalité.',
    type: 'weapon',
    price: 12000,
    bonus_atk: 140,
    bonus_def: 35,
    bonus_hp: 300,
    icon: '🌌',
    rarity: 'mythic'
  },

  // --- ARMORS ---
  'leather_tunic': {
    id: 'leather_tunic',
    name: 'Tunique de Cuir',
    description: 'Offre une protection basique contre les égratignures.',
    type: 'armor',
    price: 80,
    bonus_atk: 0,
    bonus_def: 4,
    bonus_hp: 20,
    icon: '🥋',
    rarity: 'common'
  },
  'chainmail_armor': {
    id: 'chainmail_armor',
    name: 'Cotte de Mailles Lourde',
    description: 'Mailles d\'acier entrelacées protégeant le torse.',
    type: 'armor',
    price: 400,
    bonus_atk: 0,
    bonus_def: 12,
    bonus_hp: 60,
    icon: '🛡️',
    rarity: 'rare'
  },
  'mithril_plate': {
    id: 'mithril_plate',
    name: 'Plastron en Mithril',
    description: 'Léger comme une plume et dur comme le diamant.',
    type: 'armor',
    price: 1100,
    bonus_atk: 0,
    bonus_def: 24,
    bonus_hp: 120,
    icon: '🛡️',
    rarity: 'epic'
  },
  'wyvern_scale_armor': {
    id: 'wyvern_scale_armor',
    name: 'Armure d\'Écailles de Wyverne',
    description: 'Écailles écarlates impénétrables aux flammes et aux lames.',
    type: 'armor',
    price: 2200,
    bonus_atk: 10,
    bonus_def: 38,
    bonus_hp: 190,
    icon: '🐉',
    rarity: 'epic'
  },
  'dragon_scale_armor': {
    id: 'dragon_scale_armor',
    name: 'Cuirasse Draconique Ancestrale',
    description: 'Forgée à partir d\'écailles de dragon primordiaux.',
    type: 'armor',
    price: 4800,
    bonus_atk: 15,
    bonus_def: 55,
    bonus_hp: 280,
    icon: '🐲',
    rarity: 'legendary'
  },
  'obsidian_colossus_plate': {
    id: 'obsidian_colossus_plate',
    name: 'Plastron du Colosse d\'Obsidienne',
    description: 'Une armure titanesque absorbant les chocs les plus violents.',
    type: 'armor',
    price: 7500,
    bonus_atk: 20,
    bonus_def: 75,
    bonus_hp: 400,
    icon: '🖤',
    rarity: 'legendary'
  },
  'immortal_celestial_robe': {
    id: 'immortal_celestial_robe',
    name: 'Voile Spectral d\'Immortalité',
    description: 'Tissé dans l\'éther divin, rend son porteur quasi invincible.',
    type: 'armor',
    price: 11500,
    bonus_atk: 30,
    bonus_def: 95,
    bonus_hp: 550,
    icon: '✨',
    rarity: 'mythic'
  },

  // --- CONSUMABLES & MYSTERY CHESTS ---
  'potion_minor_heal': {
    id: 'potion_minor_heal',
    name: 'Potion de Soin Mineure',
    description: 'Rend 40 PV lors des raids de boss.',
    type: 'consumable',
    price: 50,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 40,
    icon: '🧪',
    rarity: 'common'
  },
  'potion_major_heal': {
    id: 'potion_major_heal',
    name: 'Potion de Soin Majeure',
    description: 'Rend 120 PV lors des raids de boss.',
    type: 'consumable',
    price: 150,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 120,
    icon: '🍷',
    rarity: 'rare'
  },
  'elixir_berserk': {
    id: 'elixir_berserk',
    name: 'Élixir de Furie Berserker',
    description: 'Confère +35 ATK bonus pour vos combats de Raid.',
    type: 'consumable',
    price: 250,
    bonus_atk: 35,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🔥',
    rarity: 'epic'
  },
  'lucky_charm': {
    id: 'lucky_charm',
    name: 'Talisman Porte-Bonheur',
    description: 'Une amulette enchantée augmentant la chance au casino et aux loots.',
    type: 'consumable',
    price: 350,
    bonus_atk: 5,
    bonus_def: 5,
    bonus_hp: 20,
    icon: '🍀',
    rarity: 'rare'
  },
  'phoenix_feather': {
    id: 'phoenix_feather',
    name: 'Plume de Phénix Sacrée',
    description: 'Ressuscite automatiquement avec 50% de vos PV si vous tombez à 0.',
    type: 'consumable',
    price: 600,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 150,
    icon: '🪶',
    rarity: 'legendary'
  },

  // --- MYSTERY LOOTBOXES (Procedural Items) ---
  'chest_silver': {
    id: 'chest_silver',
    name: 'Coffre d\'Argent Mystère',
    description: 'Ouvrez pour recevoir un équipement procédural aléatoire (Rare ou Épique) !',
    type: 'consumable',
    price: 500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '📦',
    rarity: 'rare'
  },
  'chest_gold': {
    id: 'chest_gold',
    name: 'Coffre Royal en Or',
    description: 'Ouvrez pour recevoir un équipement procédural puissant (Épique ou Légendaire) !',
    type: 'consumable',
    price: 1500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🧰',
    rarity: 'legendary'
  },
  'chest_mythic': {
    id: 'chest_mythic',
    name: 'Coffre Ancestral Mythique',
    description: 'Ouvrez pour forger une arme ou armure divine procédurale (Légendaire ou Mythique) !',
    type: 'consumable',
    price: 4500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '👑',
    rarity: 'mythic'
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
  'theme_emerald': {
    id: 'theme_emerald',
    name: 'Thème Forêt d\'Émeraude',
    description: 'Arrière-plan végétal mystique aux lueurs sylvestres.',
    type: 'theme',
    price: 800,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🌲',
    rarity: 'rare',
    theme_color: '#00cc66'
  },
  'theme_inferno': {
    id: 'theme_inferno',
    name: 'Thème Inferno Magma',
    description: 'Arrière-plan ardent avec braises incandescentes.',
    type: 'theme',
    price: 1200,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🔥',
    rarity: 'epic',
    theme_color: '#ff4500'
  },
  'theme_cyberpunk': {
    id: 'theme_cyberpunk',
    name: 'Thème Cyberpunk Synthwave',
    description: 'Style néon cyan et rose rétro-futuriste 2077.',
    type: 'theme',
    price: 1800,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🌆',
    rarity: 'epic',
    theme_color: '#00ffff'
  },
  'theme_void': {
    id: 'theme_void',
    name: 'Thème Néant Obscur & Trou Noir',
    description: 'Une aura sombre et ténébreuse aux reflets pourpres.',
    type: 'theme',
    price: 2500,
    bonus_atk: 0,
    bonus_def: 0,
    bonus_hp: 0,
    icon: '🖤',
    rarity: 'legendary',
    theme_color: '#4b0082'
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
