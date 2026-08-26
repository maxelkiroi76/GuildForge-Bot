import { Interaction, Events, GuildMember } from 'discord.js';
import { commands } from '../commands/index.js';
import { handleRaidButton } from '../services/raidService.js';
import { handleDuelInteraction } from '../services/duelService.js';
import { claimQuestReward } from '../services/questService.js';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) {
      console.warn(`Commande inconnue exécutée : ${interaction.commandName}`);
      return;
    }

    // Permission verification
    if (command.userPermissions && interaction.member instanceof GuildMember) {
      for (const perm of command.userPermissions) {
        if (!interaction.member.permissions.has(perm)) {
          await interaction.reply({
            content: '❌ Vous n\'avez pas les permissions nécessaires pour exécuter cette commande.',
            ephemeral: true
          });
          return;
        }
      }
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
      const errorMessage = {
        content: '⚠️ Une erreur inattendue est survenue lors de l\'exécution de cette commande.',
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
    return;
  }

  // 2. Handle Button Interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // Raid Buttons
    if (customId.startsWith('raid_')) {
      await handleRaidButton(interaction);
      return;
    }

    // Duel Buttons
    if (customId.startsWith('duel_')) {
      await handleDuelInteraction(interaction);
      return;
    }

    // Premium Info Button
    if (customId === 'premium_info') {
      await interaction.reply({
        content: `👑 **À propos du Pass VIP GuildForge :**\n` +
                 `• **Multiplicateur +50% XP & Or :** Actif en permanence sur toutes vos actions.\n` +
                 `• **Badge Doré 👑 VIP :** Brille à côté de votre pseudo sur votre carte \`/rank\`.\n` +
                 `• **Activation :** Les administrateurs peuvent également vous offrir le Pass avec \`/config gift-premium @vous [jours]\`.`,
        ephemeral: true
      });
      return;
    }

    // Quest Claim Buttons
    if (customId.startsWith('claim_quest_')) {
      const parts = customId.split('_');
      // Format: claim_quest_[questId]_[userId]
      const questId = parts[2];
      const targetUserId = parts[3];

      if (interaction.user.id !== targetUserId) {
        await interaction.reply({ content: '❌ Tu ne peux pas réclamer les récompenses d\'un autre aventurier !', ephemeral: true });
        return;
      }

      const res = claimQuestReward(interaction.user.id, interaction.guildId!, questId);
      await interaction.reply({ content: res.message, ephemeral: true });
      return;
    }
  }
}
