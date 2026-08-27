import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';
import { Command } from '../../types/index.js';
import { getUser, updateUser, addInventoryItem, saveCustomItem } from '../../database/db.js';
import { ITEMS } from '../../data/items.js';
import { generateRandomItem } from '../../services/itemGenerator.js';
import { Item } from '../../types/index.js';

function buildShopEmbed(category: string, userGold: number, items: Item[]) {
  const categoryNames: Record<string, string> = {
    all: '🌟 TOUS LES ARTICLES',
    weapon: '🗡️ ARMES & LAMES',
    armor: '🛡️ ARMURES & BOUCLIERS',
    potion: '🧪 POTIONS & ÉLIXIRS',
    theme: '🎨 THÈMES DE PROFIL /RANK',
    chest: '🎁 COFFRES AU TRÉSOR'
  };

  const embed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle(`🛒 BOUTIQUE DU FORGERON — ${categoryNames[category] || 'ARTICLES'}`)
    .setDescription(
      `🪙 **Votre solde :** \`${userGold.toLocaleString()} Or\`\n` +
      `📦 **Articles disponibles :** \`${items.length}\`\n\n` +
      `*Sélectionnez une catégorie avec les boutons ou achetez un article dans le menu ci-dessous.*`
    )
    .setFooter({ text: 'GuildForge RPG Shop • Achat instantané' })
    .setTimestamp();

  // Maximum 25 fields in Discord Embed
  const displayItems = items.slice(0, 25);
  for (const item of displayItems) {
    const rarityEmoji = item.rarity === 'mythic' ? '🌟' : item.rarity === 'legendary' ? '🟠' : item.rarity === 'epic' ? '🟣' : item.rarity === 'rare' ? '🔵' : '⚪';
    let statsText = '';
    if (item.bonus_atk && item.bonus_atk > 0) statsText += `+${item.bonus_atk} ATK `;
    if (item.bonus_def && item.bonus_def > 0) statsText += `+${item.bonus_def} DEF `;
    if (item.bonus_hp && item.bonus_hp > 0) statsText += `+${item.bonus_hp} PV `;

    embed.addFields({
      name: `${item.icon || '📦'} ${item.name} (${rarityEmoji} ${item.rarity.toUpperCase()}) — 🪙 ${item.price.toLocaleString()} Or`,
      value: `${item.description} ${statsText ? `\`[${statsText.trim()}]\`` : ''}`,
      inline: false
    });
  }

  return embed;
}

function buildCategoryRow(currentCategory: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('shop_cat_weapon')
      .setLabel('Armes')
      .setEmoji('🗡️')
      .setStyle(currentCategory === 'weapon' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shop_cat_armor')
      .setLabel('Armures')
      .setEmoji('🛡️')
      .setStyle(currentCategory === 'armor' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shop_cat_potion')
      .setLabel('Potions')
      .setEmoji('🧪')
      .setStyle(currentCategory === 'potion' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shop_cat_theme')
      .setLabel('Thèmes')
      .setEmoji('🎨')
      .setStyle(currentCategory === 'theme' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shop_cat_all')
      .setLabel('Tout')
      .setEmoji('🌟')
      .setStyle(currentCategory === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
}

function buildSelectMenu(userId: string, items: Item[]) {
  const displayItems = items.slice(0, 25);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`shop_buy_${userId}`)
    .setPlaceholder('Sélectionner un article à acheter...');

  if (displayItems.length === 0) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Aucun article disponible')
        .setValue('none')
        .setDescription('Revenez plus tard !')
    );
    selectMenu.setDisabled(true);
  } else {
    selectMenu.addOptions(
      displayItems.map(item => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(`${item.name} — ${item.price.toLocaleString()} Or`)
          .setDescription(item.description.substring(0, 95))
          .setValue(item.id);
        
        if (item.icon && item.icon.length <= 4) {
          try {
            option.setEmoji(item.icon);
          } catch {}
        }
        return option;
      })
    );
  }

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

export const shopCommand: Command = {
  category: 'rpg',
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Parcourez la boutique du forgeron pour acheter armes, armures, potions et thèmes.')
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('Filtrer par catégorie')
        .addChoices(
          { name: '🗡️ Armes', value: 'weapon' },
          { name: '🛡️ Armures', value: 'armor' },
          { name: '🧪 Potions', value: 'potion' },
          { name: '🎨 Thèmes de Carte /rank', value: 'theme' },
          { name: '🌟 Toutes les catégories', value: 'all' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let currentCategory = interaction.options.getString('categorie') || 'weapon';
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const user = getUser(userId, guildId);

    const getFilteredItems = (cat: string) => {
      return Object.values(ITEMS).filter(item => {
        if (cat === 'all') return true;
        return item.type === cat;
      });
    };

    let items = getFilteredItems(currentCategory);
    const embed = buildShopEmbed(currentCategory, user.gold, items);
    const buttonRow = buildCategoryRow(currentCategory);
    const selectRow = buildSelectMenu(userId, items);

    const response = await interaction.reply({
      embeds: [embed],
      components: [buttonRow, selectRow],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      time: 90000,
      filter: (i) => i.user.id === userId
    });

    collector.on('collect', async (i) => {
      // 1. Handling Category Buttons
      if (i.isButton()) {
        const selectedCat = i.customId.replace('shop_cat_', '');
        currentCategory = selectedCat;
        const freshUser = getUser(userId, guildId);
        items = getFilteredItems(currentCategory);

        const newEmbed = buildShopEmbed(currentCategory, freshUser.gold, items);
        const newButtonRow = buildCategoryRow(currentCategory);
        const newSelectRow = buildSelectMenu(userId, items);

        await i.update({
          embeds: [newEmbed],
          components: [newButtonRow, newSelectRow]
        });
        return;
      }

      // 2. Handling Purchase Select Menu
      if (i.isStringSelectMenu()) {
        const selectedItemId = i.values[0];
        if (selectedItemId === 'none') {
          await i.deferUpdate();
          return;
        }

        const itemToBuy = ITEMS[selectedItemId];
        if (!itemToBuy) {
          await i.reply({ content: '❌ Article introuvable.', ephemeral: true });
          return;
        }

        const freshUser = getUser(userId, guildId);
        if (freshUser.gold < itemToBuy.price) {
          await i.reply({
            content: `❌ Tu n'as pas assez d'or pour acheter **${itemToBuy.name}** (Prix: ${itemToBuy.price.toLocaleString()} 🪙, Solde: ${freshUser.gold.toLocaleString()} 🪙).`,
            ephemeral: true
          });
          return;
        }

        // Deduct gold
        updateUser({
          user_id: userId,
          guild_id: guildId,
          gold: freshUser.gold - itemToBuy.price
        });

        // Special handling for Mystery Lootbox Chests
        if (selectedItemId.startsWith('chest_')) {
          let forcedRarity: any = undefined;
          let luckBonus = 0;

          if (selectedItemId === 'chest_silver') {
            forcedRarity = Math.random() < 0.6 ? 'rare' : 'epic';
          } else if (selectedItemId === 'chest_gold') {
            forcedRarity = Math.random() < 0.7 ? 'epic' : 'legendary';
            luckBonus = 10;
          } else if (selectedItemId === 'chest_mythic') {
            forcedRarity = Math.random() < 0.75 ? 'legendary' : 'mythic';
            luckBonus = 25;
          }

          const generatedItem = generateRandomItem(freshUser.level, undefined, forcedRarity, luckBonus);
          saveCustomItem(generatedItem);
          addInventoryItem(userId, guildId, generatedItem.id, 1);

          const rarityEmoji = generatedItem.rarity === 'mythic' ? '🌟 MYTHIQUE' : generatedItem.rarity === 'legendary' ? '🟠 LÉGENDAIRE' : '🟣 ÉPIQUE';
          let statsSummary = '';
          if (generatedItem.bonus_atk) statsSummary += `🗡️ +${generatedItem.bonus_atk} ATK  `;
          if (generatedItem.bonus_def) statsSummary += `🛡️ +${generatedItem.bonus_def} DEF  `;
          if (generatedItem.bonus_hp) statsSummary += `❤️ +${generatedItem.bonus_hp} PV  `;

          await i.reply({
            content: `🎁 **OUVERTURE DU ${itemToBuy.name.toUpperCase()} !**\n\n` +
                     `✨ Une aura lumineuse s'échappe du coffre...\n` +
                     `🎉 **Vous obtenez :** ${generatedItem.icon} **${generatedItem.name}** (\`${rarityEmoji}\`) !\n` +
                     `📊 **Statistiques :** \`${statsSummary.trim()}\`\n` +
                     `📜 *${generatedItem.description}*\n\n` +
                     `👉 *Objet forgé et ajouté directement dans votre \`/inventory\` !*`,
            ephemeral: false
          });
        } else {
          addInventoryItem(userId, guildId, itemToBuy.id, 1);

          await i.reply({
            content: `🎉 Félicitations ! Tu as acheté ${itemToBuy.icon} **${itemToBuy.name}** pour **${itemToBuy.price.toLocaleString()} Or** ! (Retrouve-le dans \`/inventory\`)`,
            ephemeral: true
          });
        }

        // Update the main shop view with updated balance
        const updatedUser = getUser(userId, guildId);
        const updatedEmbed = buildShopEmbed(currentCategory, updatedUser.gold, items);
        await response.edit({
          embeds: [updatedEmbed],
          components: [buildCategoryRow(currentCategory), buildSelectMenu(userId, items)]
        }).catch(() => {});
      }
    });

    collector.on('end', async () => {
      await response.edit({
        components: []
      }).catch(() => {});
    });
  }
};
