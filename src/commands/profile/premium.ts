import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { Command } from '../../types/index.js';
import { checkUserPremium } from '../../services/premiumService.js';

export const premiumCommand: Command = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Découvrez et obtenez le Pass Aventurier VIP GuildForge !'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;
    const clientId = interaction.client.user.id;

    const premiumStatus = checkUserPremium(userId, guildId, interaction);
    const kofiUrl = process.env.KOFI_SHOP_URL || 'https://ko-fi.com/s/f0f1da22aa';
    const storeUrl = `https://discord.com/application-directory/${clientId}/store`;

    const embed = new EmbedBuilder()
      .setColor(premiumStatus.isPremium ? '#ffd700' : '#8a2be2')
      .setTitle('👑 PASS AVENTURIER VIP GUILDFORGE')
      .setDescription(
        `Propulsez votre aventure Discord au niveau supérieur avec le **Pass VIP** !\n\n` +
        `### 🌟 Votre Statut Actuel :\n` +
        (premiumStatus.isPremium
          ? `✅ **ABONNEMENT VIP ACTIF** 👑\n` +
            `• Multiplicateur d'XP : \`+50% (x1.5)\` ⚡\n` +
            `• Multiplicateur d'Or : \`+50% (x1.5)\` 🪙\n` +
            `• Couronne dorée \`👑 VIP\` sur votre \`/rank\` ✨\n` +
            `• Accès immédiat aux thèmes et cosmétiques légendaires !`
          : `⚪ **Compte Standard** (Aucun pass VIP actif)`) +
        `\n\n### 💎 Les Avantages Exclusifs du Pass VIP :`
      )
      .addFields(
        { name: '⚡ Boost permanent d\'XP & d\'Or (+50%)', value: 'Gagnez 1.5x plus d\'XP et d\'Or sur tous vos messages, vocal, raids et mini-jeux !', inline: false },
        { name: '👑 Badge Couronne VIP sur votre /rank', value: 'Votre carte de profil s\'illumine d\'une couronne dorée scintillante.', inline: false },
        { name: '🎁 Double Tribut Journalier', value: 'Récompense quotidienne `/daily` boostée avec bonus de streak exclusif.', inline: false },
        { name: '🐉 Butin Rare de Raid Augmenté', value: 'Taux de drop d\'objets rares et potions majeures multiplié.', inline: false },
        { name: '🎨 Accès aux Thèmes de Profil Mythiques', value: 'Débloquez immédiatement le prestigieux thème *Or Impérial & Diamant*.', inline: false }
      )
      .setFooter({ text: 'Paiement sécurisé directement géré par Discord In-App ou Ko-fi' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('S\'abonner sur Discord (In-App)')
        .setEmoji('👑')
        .setStyle(ButtonStyle.Link)
        .setURL(storeUrl),
      new ButtonBuilder()
        .setLabel('Payer sur Ko-fi (CB / PayPal)')
        .setEmoji('☕')
        .setStyle(ButtonStyle.Link)
        .setURL(kofiUrl),
      new ButtonBuilder()
        .setCustomId('premium_info')
        .setLabel('Aide & Infos')
        .setEmoji('ℹ️')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
