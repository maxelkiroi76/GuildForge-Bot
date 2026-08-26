import http from 'node:http';
import querystring from 'node:querystring';
import { Client, EmbedBuilder } from 'discord.js';
import { db, getUser, updateUser } from '../database/db.js';

export interface KofiPayload {
  verification_token?: string;
  message_id: string;
  timestamp: string;
  type: 'Donation' | 'Subscription' | 'Shop Order';
  is_public: boolean;
  from_name: string;
  message: string;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items?: Array<{ direct_link_code: string }>;
}

export function startKofiWebhookServer(client: Client, port = Number(process.env.PORT) || 3000): http.Server {
  const expectedToken = process.env.KOFI_VERIFICATION_TOKEN;
  const ownerId = process.env.BOT_OWNER_ID || '799194986507534336';

  const server = http.createServer(async (req, res) => {
    // Health check endpoint
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'GuildForge Ko-fi Webhook' }));
      return;
    }

    // Webhook endpoint
    if (req.method === 'POST' && (req.url === '/api/kofi-webhook' || req.url === '/kofi')) {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const parsed = querystring.parse(body);
          if (!parsed.data || typeof parsed.data !== 'string') {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request: Missing data parameter');
            return;
          }

          const kofiData = JSON.parse(parsed.data) as KofiPayload;

          // Verify token if configured
          if (expectedToken && kofiData.verification_token !== expectedToken) {
            console.warn('⚠️ Ko-fi Webhook Token Mismatch !');
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Unauthorized');
            return;
          }

          console.log(`\n💰 NOUVEAU PAIEMENT KO-FI REÇU !`);
          console.log(`   - Type : ${kofiData.type}`);
          console.log(`   - Montant : ${kofiData.amount} ${kofiData.currency}`);
          console.log(`   - De : ${kofiData.from_name} (${kofiData.email})`);
          console.log(`   - Message : ${kofiData.message || '(Aucun)'}`);

          // Attempt to find user on Discord
          let foundUserId: string | null = null;
          const searchKey = (kofiData.message || kofiData.from_name || '').trim();

          // 1. If user provided a numeric Discord ID (17-19 digits)
          const idMatch = searchKey.match(/\b\d{17,19}\b/);
          if (idMatch) {
            foundUserId = idMatch[0];
          } else {
            // 2. Search in bot's cached users by username
            const matchingUser = client.users.cache.find(u =>
              u.username.toLowerCase() === searchKey.toLowerCase() ||
              u.tag.toLowerCase() === searchKey.toLowerCase()
            );
            if (matchingUser) {
              foundUserId = matchingUser.id;
            }
          }

          let activationStatus = '⚠️ Utilisateur non identifié automatiquement (attribution manuelle requise)';

          if (foundUserId) {
            // Activate VIP for 30 days across all servers
            const durationDays = 30;
            const expires = Date.now() + durationDays * 24 * 60 * 60 * 1000;

            db.prepare(`
              UPDATE users 
              SET is_premium = 1, premium_until = ?
              WHERE user_id = ?
            `).run(expires, foundUserId);

            activationStatus = `✅ **VIP Activé avec succès pour <@${foundUserId}> (30 jours)**`;

            // Send thank you DM to buyer
            try {
              const discordUser = await client.users.fetch(foundUserId);
              if (discordUser) {
                const dmEmbed = new EmbedBuilder()
                  .setColor('#ffd700')
                  .setTitle('👑 MERCI POUR VOTRE ACHAT DU PASS VIP !')
                  .setDescription(
                    `Votre paiement de **${kofiData.amount} ${kofiData.currency}** sur Ko-fi a bien été validé !\n\n` +
                    `✨ **Votre Pass VIP GuildForge de 30 jours est désormais ACTIF !**\n\n` +
                    `• Boost permanent de **+50% d'XP & d'Or (x1.5)**\n` +
                    `• Couronne dorée **👑 VIP** sur votre \`/rank\`\n` +
                    `• Tribut journalier \`/daily\` doublé\n\n` +
                    `*Merci infiniment pour votre soutien au projet GuildForge !*`
                  )
                  .setFooter({ text: 'GuildForge VIP Engine' })
                  .setTimestamp();

                await discordUser.send({ embeds: [dmEmbed] }).catch(() => {});
              }
            } catch (err) {
              console.error('Impossible d\'envoyer le MP de remerciement :', err);
            }
          }

          // Notify Bot Owner
          try {
            const owner = await client.users.fetch(ownerId).catch(() => null);
            if (owner) {
              const ownerAlert = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('🎉 NOUVELLE VENTE KO-FI ENCAISSÉE !')
                .setDescription(
                  `💰 **Montant reçu :** \`${kofiData.amount} ${kofiData.currency}\`\n` +
                  `👤 **Acheteur :** \`${kofiData.from_name}\` (${kofiData.email})\n` +
                  `💬 **Message / Note :** \`${kofiData.message || 'Aucun'}\`\n\n` +
                  `📊 **Statut :** ${activationStatus}`
                )
                .setFooter({ text: 'Ko-fi Instant Webhook Handler' })
                .setTimestamp();

              await owner.send({ embeds: [ownerAlert] }).catch(() => {});
            }
          } catch (err) {
            console.error('Erreur notification propriétaire :', err);
          }

          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Webhook processed successfully');
        } catch (error) {
          console.error('Erreur traitement webhook Ko-fi :', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`🌐 Serveur Webhook Ko-fi actif sur le port ${port} (Route: /api/kofi-webhook)`);
  });

  return server;
}
