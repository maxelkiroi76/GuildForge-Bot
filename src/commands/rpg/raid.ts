import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { spawnRaid, activeRaids, createRaidEmbed, createRaidActionRow } from '../../services/raidService.js';

export const raidCommand: Command = {
  category: 'rpg',
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Gestion des raids de boss multijoueurs')
    .addSubcommand(sub =>
      sub
        .setName('spawn')
        .setDescription('Invoque immédiatement un Boss de Raid légendaire (Admin / Animateur)')
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Affiche l\'état du combat de Boss en cours')
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    const channel = interaction.channel as TextChannel;

    if (!guildId || !channel) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'spawn') {
      // Check admin or moderate permissions
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: '❌ Seuls les membres avec la permission `Gérer le serveur` peuvent invoquer manuellement un boss.', ephemeral: true });
        return;
      }

      if (activeRaids.has(guildId) && activeRaids.get(guildId)!.is_active) {
        await interaction.reply({ content: '⚠️ Un Boss de Raid est déjà actif sur ce serveur ! Rejoignez le combat existant.', ephemeral: true });
        return;
      }

      await interaction.reply({ content: '⚡ Invocations des forces obscures en cours...', ephemeral: true });
      await spawnRaid(channel);
    } else if (sub === 'status') {
      const currentRaid = activeRaids.get(guildId);
      if (!currentRaid || !currentRaid.is_active) {
        await interaction.reply({ content: 'ℹ️ Aucun Boss de Raid n\'est actuellement actif sur ce serveur.', ephemeral: true });
        return;
      }

      const embed = createRaidEmbed(currentRaid);
      const row = createRaidActionRow(false);

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }
};
