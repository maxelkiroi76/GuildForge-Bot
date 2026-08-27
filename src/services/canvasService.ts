import { createCanvas, loadImage, SKRSContext2D, Image } from '@napi-rs/canvas';
import { UserProfile } from '../types/index.js';
import { getLevelProgress } from './levelService.js';
import { calculateEffectiveStats, getUserRankPosition } from '../database/db.js';
import { ITEMS, CLASS_BONUSES } from '../data/items.js';

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

const SVG_ICONS = {
  coin: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#fde047" stroke-width="2"/>
    <circle cx="12" cy="12" r="7" stroke="#d97706" stroke-width="1.5" fill="#fbbf24"/>
    <text x="12" y="15.5" font-size="9" font-weight="900" font-family="Segoe UI, Arial, sans-serif" fill="#78350f" text-anchor="middle">G</text>
  </svg>`,

  sword: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
    <line x1="5" y1="19" x2="9.5" y2="14.5"/>
  </svg>`,

  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 22V2" stroke="#bae6fd" stroke-width="1.5"/>
  </svg>`,

  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#f87171" stroke-width="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,

  fire: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#f97316" stroke="#fbbf24" stroke-width="1.5">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>`,

  crown: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/>
  </svg>`,

  swordsSmall: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
    <line x1="5" y1="19" x2="9.5" y2="14.5"/>
  </svg>`
};

let cachedIcons: Record<string, Image> | null = null;
async function getIcons(): Promise<Record<string, Image>> {
  if (cachedIcons) return cachedIcons;
  const [coin, sword, shield, heart, fire, crown, swordsSmall] = await Promise.all([
    loadImage(Buffer.from(SVG_ICONS.coin)),
    loadImage(Buffer.from(SVG_ICONS.sword)),
    loadImage(Buffer.from(SVG_ICONS.shield)),
    loadImage(Buffer.from(SVG_ICONS.heart)),
    loadImage(Buffer.from(SVG_ICONS.fire)),
    loadImage(Buffer.from(SVG_ICONS.crown)),
    loadImage(Buffer.from(SVG_ICONS.swordsSmall))
  ]);
  cachedIcons = { coin, sword, shield, heart, fire, crown, swordsSmall };
  return cachedIcons;
}

export async function generateRankCard(
  user: UserProfile,
  avatarUrl: string,
  username: string
): Promise<Buffer> {
  const width = 1000;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const icons = await getIcons();

  const levelInfo = getLevelProgress(user.xp);
  const stats = calculateEffectiveStats(user);
  const rankPos = getUserRankPosition(user.user_id, user.guild_id);
  const classData = CLASS_BONUSES[user.character_class] || CLASS_BONUSES.warrior;
  const theme = ITEMS[user.profile_theme] || ITEMS.theme_cosmic;

  const FONT_FAMILY = '"Segoe UI", Arial, sans-serif';

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

  // Subtle Geometric Grid
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
  const avatarCenterX = 120;
  const avatarCenterY = 115;
  const avatarRadius = 75;

  // Outer Glowing Avatar Ring
  ctx.save();
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw Avatar Image
  try {
    const avatarImg = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      avatarImg,
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
    ctx.restore();
  } catch {
    ctx.save();
    ctx.fillStyle = '#22223b';
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Level Pill Badge anchored under Avatar
  const levelBadgeW = 110;
  const levelBadgeH = 32;
  const levelBadgeX = avatarCenterX - levelBadgeW / 2;
  const levelBadgeY = avatarCenterY + avatarRadius - 16;

  ctx.save();
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#100b24';
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 16);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 16);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 17px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`NIV. ${levelInfo.level}`, avatarCenterX, levelBadgeY + levelBadgeH / 2);
  ctx.restore();

  // --- USERNAME & CLASS ---
  const headerTextX = 225;

  // Big Username
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 38px ${FONT_FAMILY}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  const cleanUsername = username.length > 16 ? username.substring(0, 16) + '...' : username;
  ctx.fillText(cleanUsername.toUpperCase(), headerTextX, 90);

  // VIP Crown Badge
  if (user.is_premium === 1) {
    const nameWidth = ctx.measureText(cleanUsername.toUpperCase()).width;
    const vipX = headerTextX + nameWidth + 14;
    ctx.drawImage(icons.crown, vipX, 64, 26, 26);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.font = `900 22px ${FONT_FAMILY}`;
    ctx.fillText('VIP', vipX + 32, 85);
  }
  ctx.restore();

  // Class Pill (Dynamic Centered Content)
  ctx.save();
  const classNameText = classData.name.toUpperCase();
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  const classTextW = ctx.measureText(classNameText).width;
  const classPillW = Math.max(130, classTextW + 54);
  const classPillH = 36;
  const classPillY = 114;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  roundRect(ctx, headerTextX, classPillY, classPillW, classPillH, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, headerTextX, classPillY, classPillW, classPillH, 12);
  ctx.stroke();

  const classContentW = 20 + 8 + classTextW;
  const classStartX = headerTextX + (classPillW - classContentW) / 2;
  ctx.drawImage(icons.shield, classStartX, classPillY + (classPillH - 20) / 2, 20, 20);
  ctx.fillStyle = '#f5f5f5';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(classNameText, classStartX + 28, classPillY + classPillH / 2);
  ctx.restore();

  // --- TOP RIGHT RANK & LEVEL BADGES ---
  // Level Box
  const levelBoxX = 830;
  const rankBoxY = 40;
  const boxW = 130;
  const boxH = 90;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = accentColor + '99';
  ctx.lineWidth = 2;
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('NIVEAU', levelBoxX + boxW / 2, rankBoxY + 30);

  ctx.fillStyle = accentColor;
  ctx.font = `900 34px ${FONT_FAMILY}`;
  ctx.fillText(`${levelInfo.level}`, levelBoxX + boxW / 2, rankBoxY + 70);

  // Rank Box
  const rankBoxX = 685;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = primaryColor + '99';
  ctx.lineWidth = 2;
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.fillText('RANG', rankBoxX + boxW / 2, rankBoxY + 30);

  ctx.fillStyle = secondaryColor;
  ctx.font = `900 34px ${FONT_FAMILY}`;
  ctx.fillText(`#${rankPos}`, rankBoxX + boxW / 2, rankBoxY + 70);
  ctx.restore();

  // ==========================================
  // MIDDLE SECTION: 3 LARGE HIGH-CONTRAST STATS PILLS
  // ==========================================
  const statsY = 220;
  const statsH = 80;

  // 1. Gold Pill (Left - Perfectly Centered Content)
  const goldPillW = 250;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
  roundRect(ctx, 40, statsY, goldPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, statsY, goldPillW, statsH, 16);
  ctx.stroke();

  const goldText = `${user.gold.toLocaleString()} OR`;
  ctx.font = `900 24px ${FONT_FAMILY}`;
  const goldTextW = ctx.measureText(goldText).width;
  const goldContentW = 32 + 10 + goldTextW;
  const goldStartX = 40 + (goldPillW - goldContentW) / 2;

  ctx.drawImage(icons.coin, goldStartX, statsY + (statsH - 32) / 2, 32, 32);
  ctx.fillStyle = '#ffd700';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(goldText, goldStartX + 42, statsY + statsH / 2);
  ctx.restore();

  // 2. Combat Stats Pill (Middle - 3 Equal Balanced Columns)
  const combatPillX = 310;
  const combatPillW = 420;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 16);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 19px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const colW = combatPillW / 3;

  // ATK (Col 1)
  const atkText = `${stats.atk} ATK`;
  const atkW = 24 + 8 + ctx.measureText(atkText).width;
  const atkStartX = combatPillX + (colW - atkW) / 2;
  ctx.drawImage(icons.sword, atkStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillText(atkText, atkStartX + 32, statsY + statsH / 2);

  // DEF (Col 2)
  const defText = `${stats.def} DEF`;
  const defW = 24 + 8 + ctx.measureText(defText).width;
  const defStartX = combatPillX + colW + (colW - defW) / 2;
  ctx.drawImage(icons.shield, defStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillText(defText, defStartX + 32, statsY + statsH / 2);

  // HP (Col 3)
  const hpText = `${stats.maxHp} PV`;
  const hpW = 24 + 8 + ctx.measureText(hpText).width;
  const hpStartX = combatPillX + colW * 2 + (colW - hpW) / 2;
  ctx.drawImage(icons.heart, hpStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillText(hpText, hpStartX + 32, statsY + statsH / 2);
  ctx.restore();

  // 3. Streak Pill (Right - Centered Content)
  const streakPillX = 750;
  const streakPillW = 210;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 107, 74, 0.15)';
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 107, 74, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 16);
  ctx.stroke();

  const streakText = `${user.daily_streak} J. SÉRIE`;
  ctx.font = `900 21px ${FONT_FAMILY}`;
  const streakTextW = ctx.measureText(streakText).width;
  const streakContentW = 28 + 8 + streakTextW;
  const streakStartX = streakPillX + (streakPillW - streakContentW) / 2;

  ctx.drawImage(icons.fire, streakStartX, statsY + (statsH - 28) / 2, 28, 28);
  ctx.fillStyle = '#ff7a59';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(streakText, streakStartX + 36, statsY + statsH / 2);
  ctx.restore();

  // ==========================================
  // BOTTOM SECTION: XP PROGRESS BAR & LABELS
  // ==========================================
  const barX = 40;
  const barY = 368;
  const barW = width - 80;
  const barH = 38;

  // XP Text Labels
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 19px ${FONT_FAMILY}`;
  ctx.fillText('EXPÉRIENCE DU NIVEAU', barX, barY - 14);

  const xpText = `${levelInfo.currentLevelXp.toLocaleString()} / ${levelInfo.nextLevelXp.toLocaleString()} XP  (${levelInfo.progressPercent}%)`;
  ctx.font = `bold 19px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = secondaryColor;
  ctx.fillText(xpText, barX + barW, barY - 14);
  ctx.restore();

  // Bar Outer Track
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 20, 0.85)';
  roundRect(ctx, barX, barY, barW, barH, 19);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  roundRect(ctx, barX, barY, barW, barH, 19);
  ctx.stroke();

  // Bar Progress Fill (Smooth clipping, zero-percent clean)
  if (levelInfo.progressPercent > 0) {
    const fillWidth = Math.min(barW, (barW * Math.min(100, levelInfo.progressPercent)) / 100);
    ctx.save();
    roundRect(ctx, barX, barY, barW, barH, 19);
    ctx.clip();

    let xpBarGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    xpBarGrad.addColorStop(0, primaryColor);
    xpBarGrad.addColorStop(0.6, secondaryColor);
    xpBarGrad.addColorStop(1, accentColor);

    ctx.fillStyle = xpBarGrad;
    ctx.fillRect(barX, barY, fillWidth, barH);

    // Glass Sheen
    const sheenGrad = ctx.createLinearGradient(0, barY, 0, barY + barH / 2);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(barX, barY, fillWidth, barH / 2);

    // Glowing Head Pulse Indicator
    if (fillWidth > 35 && fillWidth < barW - 15) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(barX + fillWidth - 6, barY + barH / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // Footer Tagline
  ctx.save();
  ctx.drawImage(icons.swordsSmall, barX, height - 37, 18, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('GUILDFORGE RPG ENGINE', barX + 26, height - 28);

  ctx.textAlign = 'right';
  ctx.fillText(`THÈME : ${theme.name.toUpperCase()}`, barX + barW, height - 28);
  ctx.restore();

  return canvas.toBuffer('image/png');
}
