import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/index.js';
import { initiateDuel } from '../../services/duelService.js';

export const duelCommand: Command = {
  category: 'rpg',
  data: new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Défiez un autre membre du serveur en duel avec mise d\'or.')
    .addUserOption(option =>
      option
        .setName('adversaire')
        .setDescription('L\'aventurier que vous souhaitez défier')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('mise')
        .setDescription('Montant d\'or misé par joueur (min: 10, max: 50000)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(50000)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('adversaire', true);
    const bet = interaction.options.getInteger('mise', true);

    await initiateDuel(interaction, targetUser, bet);
  }
};
