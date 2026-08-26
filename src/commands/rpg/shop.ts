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
import { getUser, updateUser, addInventoryItem } from '../../database/db.js';
import { ITEMS } from '../../data/items.js';

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
          { name: 'Toutes les catégories', value: 'all' },
          { name: '🗡️ Armes', value: 'weapon' },
          { name: '🛡️ Armures', value: 'armor' },
          { name: '🧪 Potions', value: 'potion' },
          { name: '🎨 Thèmes de Carte /rank', value: 'theme' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const filter = interaction.options.getString('categorie') || 'all';
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const user = getUser(userId, guildId);

    const filteredItems = Object.values(ITEMS).filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
    });

    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🛒 BOUTIQUE DU FORGERON & MARCHAND AMBULANT')
      .setDescription(
        `Bienvenue dans l'échoppe de la Guilde !\n` +
        `Votre solde actuel : 🪙 **${user.gold.toLocaleString()} Or**\n\n` +
        `Utilisez le menu déroulant ci-dessous pour effectuer un achat direct.`
      )
      .setThumbnail('https://cdn.discordapp.com/embed/avatars/2.png')
      .setFooter({ text: 'GuildForge RPG Shop' })
      .setTimestamp();

    for (const item of filteredItems) {
      const rarityEmoji = item.rarity === 'mythic' ? '🌟' : item.rarity === 'legendary' ? '🟠' : item.rarity === 'epic' ? '🟣' : item.rarity === 'rare' ? '🔵' : '⚪';
      let statsText = '';
      if (item.bonus_atk > 0) statsText += `+${item.bonus_atk} ATK `;
      if (item.bonus_def > 0) statsText += `+${item.bonus_def} DEF `;
      if (item.bonus_hp > 0) statsText += `+${item.bonus_hp} PV `;

      embed.addFields({
        name: `${item.icon} ${item.name} (${rarityEmoji} ${item.rarity.toUpperCase()}) — 🪙 ${item.price.toLocaleString()} Or`,
        value: `${item.description} ${statsText ? `\`[${statsText.trim()}]\`` : ''}`,
        inline: false
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`shop_buy_${userId}`)
      .setPlaceholder('Sélectionner un article à acheter...')
      .addOptions(
        filteredItems.slice(0, 25).map(item =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${item.name} — ${item.price} Or`)
            .setDescription(item.description.substring(0, 100))
            .setValue(item.id)
            .setEmoji(item.icon)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
      filter: (i) => i.user.id === userId
    });

    collector.on('collect', async (selectInteraction) => {
      const selectedItemId = selectInteraction.values[0];
      const itemToBuy = ITEMS[selectedItemId];
      if (!itemToBuy) {
        await selectInteraction.reply({ content: '❌ Article introuvable.', ephemeral: true });
        return;
      }

      const freshUser = getUser(userId, guildId);
      if (freshUser.gold < itemToBuy.price) {
        await selectInteraction.reply({
          content: `❌ Tu n'as pas assez d'or pour acheter **${itemToBuy.name}** (Prix: ${itemToBuy.price} 🪙, Solde: ${freshUser.gold} 🪙).`,
          ephemeral: true
        });
        return;
      }

      // Deduct gold and add item
      updateUser({
        user_id: userId,
        guild_id: guildId,
        gold: freshUser.gold - itemToBuy.price
      });

      addInventoryItem(userId, guildId, itemToBuy.id, 1);

      await selectInteraction.reply({
        content: `🎉 Félicitations ! Tu as acheté ${itemToBuy.icon} **${itemToBuy.name}** pour **${itemToBuy.price} Or** ! (Retrouve-le dans \`/inventory\`)`,
        ephemeral: true
      });
    });
  }
};
