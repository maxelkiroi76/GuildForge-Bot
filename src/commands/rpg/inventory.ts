import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser, getUserInventory, equipItem, calculateEffectiveStats } from '../../database/db.js';
import { ITEMS, CLASS_BONUSES } from '../../data/items.js';

export const inventoryCommand: Command = {
  category: 'rpg',
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Consultez votre inventaire d\'armes, armures, potions et thèmes visuels.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const user = getUser(userId, guildId);
    const invItems = getUserInventory(userId, guildId);
    const stats = calculateEffectiveStats(user);

    const weapon = user.equipped_weapon ? ITEMS[user.equipped_weapon] : null;
    const armor = user.equipped_armor ? ITEMS[user.equipped_armor] : null;
    const theme = ITEMS[user.profile_theme] || ITEMS.theme_cosmic;

    let invList = '';
    if (invItems.length === 0) {
      invList = '*Votre sacoche est actuellement vide. Visitez le `/shop` pour acheter des équipements !*';
    } else {
      invList = invItems.map(item => {
        const itemDef = ITEMS[item.item_id];
        if (!itemDef) return null;
        const isEquipped = user.equipped_weapon === item.item_id || user.equipped_armor === item.item_id || user.profile_theme === item.item_id;
        const tag = isEquipped ? ' `[ÉQUIPÉ]`' : '';
        return `${itemDef.icon} **${itemDef.name}** ×${item.quantity}${tag}\n*${itemDef.description}*`;
      }).filter(Boolean).join('\n\n');
    }

    const embed = new EmbedBuilder()
      .setColor('#8a2be2')
      .setTitle(`🎒 INVENTAIRE & ÉQUIPEMENT — ${interaction.user.displayName}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { 
          name: '⚔️ Équipement Actif', 
          value: `🗡️ **Arme :** ${weapon ? `${weapon.icon} ${weapon.name} (+${weapon.bonus_atk} ATK)` : '*(Aucune)*'}\n` +
                 `🛡️ **Armure :** ${armor ? `${armor.icon} ${armor.name} (+${armor.bonus_def} DEF)` : '*(Aucune)*'}\n` +
                 `🎨 **Thème Carte :** ${theme ? `${theme.icon} ${theme.name}` : '*(Défaut)*'}`
        },
        {
          name: '📊 Statistiques Effectives',
          value: `⚔️ **ATK :** \`${stats.atk}\` | 🛡️ **DEF :** \`${stats.def}\` | ❤️ **PV Max :** \`${stats.maxHp}\``
        },
        {
          name: '📦 Objets Possédés',
          value: invList
        }
      )
      .setFooter({ text: 'Sélectionnez un objet ci-dessous pour l\'équiper !' })
      .setTimestamp();

    // Generate Select Menu Options for equippable items
    const equippableItems = invItems.filter(i => {
      const def = ITEMS[i.item_id];
      return def && (def.type === 'weapon' || def.type === 'armor' || def.type === 'theme');
    });

    const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    if (equippableItems.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`equip_select_${userId}`)
        .setPlaceholder('Choisir un équipement ou thème à activer...')
        .addOptions(
          equippableItems.slice(0, 25).map(i => {
            const def = ITEMS[i.item_id];
            const isEquipped = user.equipped_weapon === i.item_id || user.equipped_armor === i.item_id || user.profile_theme === i.item_id;
            return new StringSelectMenuOptionBuilder()
              .setLabel(`${def.name}${isEquipped ? ' (Actif)' : ''}`)
              .setDescription(def.description.substring(0, 100))
              .setValue(i.item_id)
              .setEmoji(def.icon);
          })
        );

      components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
    }

    const response = await interaction.reply({ embeds: [embed], components, fetchReply: true });

    if (equippableItems.length > 0) {
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: (i) => i.user.id === userId
      });

      collector.on('collect', async (selectInteraction) => {
        const selectedItemId = selectInteraction.values[0];
        const success = equipItem(userId, guildId, selectedItemId);

        if (success) {
          const itemDef = ITEMS[selectedItemId];
          await selectInteraction.reply({
            content: `✅ Tu as équipé avec succès : ${itemDef.icon} **${itemDef.name}** !`,
            ephemeral: true
          });
        } else {
          await selectInteraction.reply({
            content: '❌ Impossible d\'équiper cet objet.',
            ephemeral: true
          });
        }
      });
    }
  }
};
