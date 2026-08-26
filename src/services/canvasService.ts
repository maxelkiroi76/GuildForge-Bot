import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import { UserProfile } from '../types/index.js';
import { getLevelProgress } from './levelService.js';
import { calculateEffectiveStats, getUserRankPosition } from '../database/db.js';
import { ITEMS, CLASS_BONUSES } from '../data/items.js';

// Helper to draw smooth rounded rectangles
function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export async function generateRankCard(
  user: UserProfile,
  avatarUrl: string,
  username: string
): Promise<Buffer> {
  // Optimal Discord Chat Feed Dimensions (1000x500 - 2:1 Ratio)
  // Designed so every element, stat, and text is HUGE and crystal clear without clicking
  const width = 1000;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const levelInfo = getLevelProgress(user.xp);
  const stats = calculateEffectiveStats(user);
  const rankPos = getUserRankPosition(user.user_id, user.guild_id);
  const classData = CLASS_BONUSES[user.character_class] || CLASS_BONUSES.warrior;
  const theme = ITEMS[user.profile_theme] || ITEMS.theme_cosmic;

  const FONT_FAMILY = '"Segoe UI", "Segoe UI Emoji", "Apple Color Emoji", Arial, sans-serif';

  // 1. Theme Color Palette
  let bgGrad = ctx.createLinearGradient(0, 0, width, height);
  let primaryColor = '#9d4edd';
  let secondaryColor = '#00e5ff';
  let accentColor = '#ffd700';

  if (theme.id === 'theme_inferno') {
    bgGrad.addColorStop(0, '#220808');
    bgGrad.addColorStop(0.5, '#3b120a');
    bgGrad.addColorStop(1, '#180303');
    primaryColor = '#ff4500';
    secondaryColor = '#ffa500';
    accentColor = '#ffd700';
  } else if (theme.id === 'theme_cyberpunk') {
    bgGrad.addColorStop(0, '#0c102a');
    bgGrad.addColorStop(0.5, '#200d3d');
    bgGrad.addColorStop(1, '#071d2d');
    primaryColor = '#00f2fe';
    secondaryColor = '#ff007f';
    accentColor = '#00ffcc';
  } else if (theme.id === 'theme_gold_royalty') {
    bgGrad.addColorStop(0, '#241a05');
    bgGrad.addColorStop(0.5, '#402e09');
    bgGrad.addColorStop(1, '#1a1303');
    primaryColor = '#ffd700';
    secondaryColor = '#f39c12';
    accentColor = '#ffffff';
  } else {
    // Default Cosmic Astral
    bgGrad.addColorStop(0, '#0f0f26');
    bgGrad.addColorStop(0.5, '#1e1447');
    bgGrad.addColorStop(1, '#0d0a1f');
    primaryColor = '#9d4edd';
    secondaryColor = '#00e5ff';
    accentColor = '#ffd700';
  }

  // Base Background
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, width, height, 32);
  ctx.fill();

  // Subtle Geometric Background Grid
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1.5;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // Ambient Glow Orbs
  ctx.save();
  ctx.filter = 'blur(60px)';
  ctx.fillStyle = primaryColor + '50';
  ctx.beginPath();
  ctx.arc(150, 150, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = secondaryColor + '40';
  ctx.beginPath();
  ctx.arc(850, 100, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Card Outer Glowing Border
  ctx.save();
  let borderGrad = ctx.createLinearGradient(0, 0, width, height);
  borderGrad.addColorStop(0, primaryColor);
  borderGrad.addColorStop(0.5, secondaryColor);
  borderGrad.addColorStop(1, primaryColor);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 8, 8, width - 16, height - 16, 28);
  ctx.stroke();
  ctx.restore();

  // ==========================================
  // TOP SECTION: AVATAR + USERNAME + BADGES
  // ==========================================
  const avatarSize = 160;
  const avatarX = 40;
  const avatarY = 40;

  // Outer Glowing Avatar Ring
  ctx.save();
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw Avatar
  try {
    const avatarImg = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.fillStyle = '#22223b';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Level Pill Badge anchored under Avatar
  const levelBadgeW = 120;
  const levelBadgeH = 34;
  const levelBadgeX = avatarX + (avatarSize - levelBadgeW) / 2;
  const levelBadgeY = avatarY + avatarSize - 16;

  ctx.save();
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#100b24';
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 17);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 17);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 18px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`NIV. ${levelInfo.level}`, levelBadgeX + levelBadgeW / 2, levelBadgeY + levelBadgeH / 2);
  ctx.restore();

  // --- USERNAME & CLASS ---
  const headerTextX = 230;

  // Big Username
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 44px ${FONT_FAMILY}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  const cleanUsername = username.length > 16 ? username.substring(0, 16) + '...' : username;
  ctx.fillText(cleanUsername.toUpperCase(), headerTextX, 90);

  // VIP Badge if user is Premium
  if (user.is_premium === 1) {
    const nameWidth = ctx.measureText(cleanUsername.toUpperCase()).width;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillText(' 👑 VIP', headerTextX + nameWidth + 10, 88);
  }
  ctx.restore();

  // Class Pill
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  roundRect(ctx, headerTextX, 110, 170, 38, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, headerTextX, 110, 170, 38, 12);
  ctx.stroke();

  ctx.fillStyle = '#f5f5f5';
  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`🛡️ ${classData.name.toUpperCase()}`, headerTextX + 16, 129);
  ctx.restore();

  // --- TOP RIGHT RANK & LEVEL BADGES ---
  // Rank Box
  const rankBoxX = 720;
  const rankBoxY = 40;
  const boxW = 115;
  const boxH = 90;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = primaryColor + '99';
  ctx.lineWidth = 2;
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('RANG', rankBoxX + boxW / 2, rankBoxY + 30);

  ctx.fillStyle = secondaryColor;
  ctx.font = `900 36px ${FONT_FAMILY}`;
  ctx.fillText(`#${rankPos}`, rankBoxX + boxW / 2, rankBoxY + 72);

  // Level Box
  const levelBoxX = rankBoxX + boxW + 15;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = accentColor + '99';
  ctx.lineWidth = 2;
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('NIVEAU', levelBoxX + boxW / 2, rankBoxY + 30);

  ctx.fillStyle = accentColor;
  ctx.font = `900 36px ${FONT_FAMILY}`;
  ctx.fillText(`${levelInfo.level}`, levelBoxX + boxW / 2, rankBoxY + 72);
  ctx.restore();

  // ==========================================
  // MIDDLE SECTION: 3 LARGE HIGH-CONTRAST STATS PILLS
  // ==========================================
  const statsY = 215;
  const statsH = 75;

  // 1. Gold Pill (Left)
  const goldPillW = 250;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  roundRect(ctx, 40, statsY, goldPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, statsY, goldPillW, statsH, 16);
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = `900 28px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`🪙  ${user.gold.toLocaleString()} OR`, 60, statsY + statsH / 2);
  ctx.restore();

  // 2. Combat Stats Pill (Middle)
  const combatPillX = 40 + goldPillW + 18;
  const combatPillW = 410;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 16);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `⚔️ ${stats.atk} ATK    🛡️ ${stats.def} DEF    ❤️ ${stats.maxHp} PV`,
    combatPillX + 22,
    statsY + statsH / 2
  );
  ctx.restore();

  // 3. Streak Pill (Right)
  const streakPillX = combatPillX + combatPillW + 18;
  const streakPillW = width - 40 - streakPillX;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 107, 74, 0.18)';
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 107, 74, 0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 16);
  ctx.stroke();

  ctx.fillStyle = '#ff7a59';
  ctx.font = `900 24px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`🔥  ${user.daily_streak} J. SÉRIE`, streakPillX + 20, statsY + statsH / 2);
  ctx.restore();

  // ==========================================
  // BOTTOM SECTION: XP PROGRESS BAR & LABELS
  // ==========================================
  const barX = 40;
  const barY = 370;
  const barW = width - 80;
  const barH = 42;

  // XP Text Labels
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 22px ${FONT_FAMILY}`;
  ctx.fillText('EXPÉRIENCE DU NIVEAU', barX, barY - 15);

  const xpText = `${levelInfo.currentLevelXp.toLocaleString()} / ${levelInfo.nextLevelXp.toLocaleString()} XP  (${levelInfo.progressPercent}%)`;
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = secondaryColor;
  ctx.fillText(xpText, barX + barW, barY - 15);
  ctx.restore();

  // Bar Outer Track
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(ctx, barX, barY, barW, barH, 21);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  roundRect(ctx, barX, barY, barW, barH, 21);
  ctx.stroke();
  ctx.restore();

  // Bar Progress Fill
  const fillWidth = Math.max(20, Math.floor((barW * Math.max(2, levelInfo.progressPercent)) / 100));
  ctx.save();
  let xpBarGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  xpBarGrad.addColorStop(0, primaryColor);
  xpBarGrad.addColorStop(0.6, secondaryColor);
  xpBarGrad.addColorStop(1, accentColor);

  ctx.fillStyle = xpBarGrad;
  roundRect(ctx, barX, barY, fillWidth, barH, 21);
  ctx.fill();

  // Glass Sheen on Top of XP Bar
  const sheenGrad = ctx.createLinearGradient(0, barY, 0, barY + barH / 2);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = sheenGrad;
  roundRect(ctx, barX, barY, fillWidth, barH / 2, 10);
  ctx.fill();

  // Glowing Head Pulse Indicator
  if (fillWidth > 35 && fillWidth < barW - 10) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(barX + fillWidth - 10, barY + barH / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Footer Tagline
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillText('⚔️ GUILDFORGE RPG ENGINE', barX, height - 28);

  ctx.textAlign = 'right';
  ctx.fillText(`THÈME : ${theme.name.toUpperCase()}`, barX + barW, height - 28);
  ctx.restore();

  return canvas.toBuffer('image/png');
}
