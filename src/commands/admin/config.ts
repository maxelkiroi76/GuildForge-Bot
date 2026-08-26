import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ChannelType 
} from 'discord.js';
import { Command } from '../../types/index.js';
import { 
  getGuildConfig, 
  updateGuildConfig, 
  getRoleRewards, 
  setRoleReward, 
  removeRoleReward,
  getUser,
  updateUser
} from '../../database/db.js';

export const configCommand: Command = {
  category: 'admin',
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuration administrative de GuildForge pour votre serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('Affiche la configuration actuelle du serveur')
    )
    .addSubcommand(sub =>
      sub
        .setName('levelup-channel')
        .setDescription('Définit le salon des annonces de montée de niveau')
        .addChannelOption(opt =>
          opt
            .setName('salon')
            .setDescription('Le salon textuel cible')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('xp-rate')
        .setDescription('Définit le multiplicateur d\'XP global du serveur')
        .addNumberOption(opt =>
          opt
            .setName('multiplicateur')
            .setDescription('Ex: 1.0 (normal), 1.5 (boost x1.5), 2.0 (double XP)')
            .setRequired(true)
            .setMinValue(0.5)
            .setMaxValue(5.0)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add-role-reward')
        .setDescription('Associe un rôle automatique à un niveau')
        .addIntegerOption(opt =>
          opt
            .setName('niveau')
            .setDescription('Le niveau requis')
            .setRequired(true)
            .setMinValue(1)
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Le rôle à attribuer')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove-role-reward')
        .setDescription('Supprime la récompense de rôle pour un niveau')
        .addIntegerOption(opt =>
          opt
            .setName('niveau')
            .setDescription('Le niveau concerné')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list-role-rewards')
        .setDescription('Liste tous les rôles récompenses configurés')
    )
    .addSubcommand(sub =>
      sub
        .setName('gift-premium')
        .setDescription('Offre le statut VIP à un membre (pour tests ou récompenses)')
        .addUserOption(opt =>
          opt
            .setName('membre')
            .setDescription('Le membre à promouvoir VIP')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('jours')
            .setDescription('Durée en jours (défaut: 30)')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('revoke-premium')
        .setDescription('Retire le statut VIP d\'un membre')
        .addUserOption(opt =>
          opt
            .setName('membre')
            .setDescription('Le membre concerné')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: '❌ Cette commande ne peut être exécutée que sur un serveur.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const config = getGuildConfig(guildId);

    const ownerId = process.env.BOT_OWNER_ID || '799194986507534336';

    if (sub === 'gift-premium') {
      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: '❌ **Accès Refusé :** Seul le propriétaire / créateur officiel de GuildForge est autorisé à attribuer manuellement le statut VIP.',
          ephemeral: true
        });
        return;
      }

      const targetUser = interaction.options.getUser('membre', true);
      const days = interaction.options.getInteger('jours') || 30;
      const expires = Date.now() + days * 24 * 60 * 60 * 1000;

      const userProfile = getUser(targetUser.id, guildId);
      updateUser({
        user_id: targetUser.id,
        guild_id: guildId,
        is_premium: 1,
        premium_until: expires
      });

      await interaction.reply({
        content: `👑 Félicitations ! <@${targetUser.id}> a reçu le statut **VIP GuildForge** pour **${days} jours** ! (+50% XP/Or, Badge doré sur \`/rank\`).`,
        ephemeral: false
      });
      return;
    }

    if (sub === 'revoke-premium') {
      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: '❌ **Accès Refusé :** Seul le propriétaire / créateur officiel de GuildForge est autorisé à révoquer le statut VIP.',
          ephemeral: true
        });
        return;
      }

      const targetUser = interaction.options.getUser('membre', true);
      updateUser({
        user_id: targetUser.id,
        guild_id: guildId,
        is_premium: 0,
        premium_until: null
      });

      await interaction.reply({
        content: `⚪ Le statut VIP de <@${targetUser.id}> a été révoqué.`,
        ephemeral: true
      });
      return;
    }

    if (sub === 'view') {
      const rewards = getRoleRewards(guildId);
      const rewardsText = rewards.length > 0
        ? rewards.map(r => `• **Niveau ${r.level}** ➔ <@&${r.role_id}>`).join('\n')
        : '*Aucun rôle récompense configuré.*';

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle(`⚙️ CONFIGURATION GUILDFORGE — ${interaction.guild?.name}`)
        .addFields(
          { name: '📢 Salon Level-Up', value: config.levelup_channel_id ? `<#${config.levelup_channel_id}>` : '*Par défaut (messages de contexte ou MP)*', inline: true },
          { name: '⚡ Multiplicateur XP', value: `\`x${config.xp_rate}\``, inline: true },
          { name: '🎁 Rôles Récompenses Activés', value: config.roles_rewards_enabled === 1 ? '✅ Oui' : '❌ Non', inline: true },
          { name: '🎖️ Paliers de Rôles Récompenses', value: rewardsText, inline: false }
        )
        .setFooter({ text: 'GuildForge Admin System' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === 'levelup-channel') {
      const channel = interaction.options.getChannel('salon', true);
      updateGuildConfig(guildId, { levelup_channel_id: channel.id });

      await interaction.reply({
        content: `✅ Le salon des annonces de montée de niveau a été défini sur <#${channel.id}>.`,
        ephemeral: true
      });
    } else if (sub === 'xp-rate') {
      const rate = interaction.options.getNumber('multiplicateur', true);
      updateGuildConfig(guildId, { xp_rate: rate });

      await interaction.reply({
        content: `✅ Le multiplicateur d'XP global du serveur est désormais fixé à **x${rate}** !`,
        ephemeral: true
      });
    } else if (sub === 'add-role-reward') {
      const level = interaction.options.getInteger('niveau', true);
      const role = interaction.options.getRole('role', true);

      setRoleReward(guildId, level, role.id);

      await interaction.reply({
        content: `✅ Le rôle <@&${role.id}> sera désormais attribué automatiquement aux membres atteignant le **Niveau ${level}** !`,
        ephemeral: true
      });
    } else if (sub === 'remove-role-reward') {
      const level = interaction.options.getInteger('niveau', true);
      removeRoleReward(guildId, level);

      await interaction.reply({
        content: `✅ La récompense de rôle pour le niveau **${level}** a été supprimée.`,
        ephemeral: true
      });
    } else if (sub === 'list-role-rewards') {
      const rewards = getRoleRewards(guildId);
      if (rewards.length === 0) {
        await interaction.reply({ content: 'ℹ️ Aucun rôle récompense n\'est configuré sur ce serveur.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🎖️ PALIERS DE RÔLES RÉCOMPENSES')
        .setDescription(rewards.map(r => `• **Niveau ${r.level}** ➔ <@&${r.role_id}>`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
