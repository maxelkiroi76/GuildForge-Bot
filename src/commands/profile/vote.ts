import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { Command } from '../../types/index.js';

export const voteCommand: Command = {
  category: 'profile',
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Votez pour GuildForge sur Top.gg et recevez de l\'Or et de l\'XP bonus !'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const clientId = interaction.client.user.id;
    const voteUrl = `https://top.gg/bot/${clientId}/vote`;

    const embed = new EmbedBuilder()
      .setColor('#ff3366')
      .setTitle('🗳️ SOUTENIR GUILDFORGE SUR TOP.GG')
      .setDescription(
        `Votez pour le bot sur **Top.gg** pour soutenir son développement et faire grandir la communauté !\n\n` +
        `### 🎁 Récompenses de Vote (toutes les 12h) :\n` +
        `• 🪙 **+500 Or** bonus\n` +
        `• ✨ **+300 XP** de niveau\n` +
        `• 🍷 **1x Potion de Soin Majeure** offerte\n` +
        `• 🔥 **Points doublés** le week-end sur Top.gg !`
      )
      .setFooter({ text: 'Vous pouvez voter 1 fois toutes les 12 heures sur Top.gg.' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Voter sur Top.gg (Lien Direct)')
        .setEmoji('🗳️')
        .setStyle(ButtonStyle.Link)
        .setURL(voteUrl),
      new ButtonBuilder()
        .setLabel('Inviter le Bot sur un autre serveur')
        .setEmoji('🔗')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
