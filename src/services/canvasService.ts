import { createCanvas, loadImage, SKRSContext2D, Image } from '@napi-rs/canvas';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
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
  coin: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff07c"/>
        <stop offset="40%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <linearGradient id="goldInner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="16" fill="url(#goldGrad)" stroke="#78350f" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="12.5" fill="url(#goldInner)" stroke="#fde047" stroke-width="1.5"/>
    <text x="18" y="23" font-size="14" font-weight="900" font-family="Segoe UI, Arial, sans-serif" fill="#78350f" text-anchor="middle">G</text>
  </svg>`,

  sword: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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

  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#f43f5e" stroke="#fb7185" stroke-width="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,

  fire: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#f97316" stroke="#fbbf24" stroke-width="1.5">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>`,

  crown: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff3b0"/>
        <stop offset="35%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
    </defs>
    <path d="M2 7l4.5 8h11L22 7l-5 4-5-8-5 8-5-4z" fill="url(#crownGrad)" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M5 17.5h14v3H5v-3z" fill="url(#crownGrad)" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="12" cy="3" r="1.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>
    <circle cx="2" cy="7" r="1.4" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>
    <circle cx="22" cy="7" r="1.4" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>
    <circle cx="8.5" cy="19" r="1" fill="#ffffff"/>
    <circle cx="12" cy="19" r="1" fill="#ffffff"/>
    <circle cx="15.5" cy="19" r="1" fill="#ffffff"/>
  </svg>`,

  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffd700">
    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z"/>
  </svg>`,

  swordsSmall: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  const [coin, sword, shield, heart, fire, crown, sparkle, swordsSmall] = await Promise.all([
    loadImage(Buffer.from(SVG_ICONS.coin)),
    loadImage(Buffer.from(SVG_ICONS.sword)),
    loadImage(Buffer.from(SVG_ICONS.shield)),
    loadImage(Buffer.from(SVG_ICONS.heart)),
    loadImage(Buffer.from(SVG_ICONS.fire)),
    loadImage(Buffer.from(SVG_ICONS.crown)),
    loadImage(Buffer.from(SVG_ICONS.sparkle)),
    loadImage(Buffer.from(SVG_ICONS.swordsSmall))
  ]);
  cachedIcons = { coin, sword, shield, heart, fire, crown, sparkle, swordsSmall };
  return cachedIcons;
}

const FONT_FAMILY = '"Segoe UI", "SF Pro Display", -apple-system, Roboto, Arial, sans-serif';

interface ThemeColors {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  primary: string;
  secondary: string;
  accent: string;
}

function getThemeColors(themeId: string): ThemeColors {
  if (themeId === 'theme_inferno') {
    return {
      bgStart: '#1f0707',
      bgMid: '#380e0e',
      bgEnd: '#140303',
      primary: '#ff4b4b',
      secondary: '#ff8a00',
      accent: '#ffd700'
    };
  } else if (themeId === 'theme_cyberpunk') {
    return {
      bgStart: '#080a1e',
      bgMid: '#1a0d33',
      bgEnd: '#041324',
      primary: '#00f2fe',
      secondary: '#ff007f',
      accent: '#00ffcc'
    };
  } else if (themeId === 'theme_gold_royalty') {
    return {
      bgStart: '#1c1503',
      bgMid: '#362706',
      bgEnd: '#120d01',
      primary: '#ffd700',
      secondary: '#f59e0b',
      accent: '#ffffff'
    };
  }
  // Default Cosmic Astral
  return {
    bgStart: '#0b0a1d',
    bgMid: '#1b123d',
    bgEnd: '#080817',
    primary: '#a855f7',
    secondary: '#00f0ff',
    accent: '#ffd700'
  };
}

// Particle cache for seamless VIP looping
const VIP_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: 50 + (i * 53) % 900,
  baseY: 40 + (i * 27) % 420,
  size: 1.5 + (i % 3) * 1.2,
  speed: 40 + (i % 4) * 20,
  opacity: 0.3 + (i % 5) * 0.14
}));

function drawCardFrame(
  ctx: SKRSContext2D,
  width: number,
  height: number,
  colors: ThemeColors,
  animTime: number,
  isVip: boolean,
  icons: Record<string, Image>
) {
  // 1. Deep Layered Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, colors.bgStart);
  bgGrad.addColorStop(0.5, colors.bgMid);
  bgGrad.addColorStop(1, colors.bgEnd);
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // 2. High-Tech Hexagonal / Micro-Grid Texture
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1.2;
  const step = 36;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Ambient Glowing Nebula Orbs
  ctx.save();
  ctx.filter = 'blur(65px)';
  const pulse = Math.sin(animTime * Math.PI * 2);
  const orb1Alpha = isVip ? 0.35 + 0.1 * pulse : 0.3;
  const orb2Alpha = isVip ? 0.3 + 0.1 * pulse : 0.25;

  ctx.fillStyle = colors.primary + Math.round(orb1Alpha * 255).toString(16).padStart(2, '0');
  ctx.beginPath();
  ctx.arc(160, 140, 160, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.secondary + Math.round(orb2Alpha * 255).toString(16).padStart(2, '0');
  ctx.beginPath();
  ctx.arc(840, 110, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Floating Gold Particles for VIP
  if (isVip) {
    ctx.save();
    for (const p of VIP_PARTICLES) {
      const curY = (p.baseY - animTime * p.speed + 500) % 500;
      const alpha = Math.sin(((curY / 500) * Math.PI)) * p.opacity;
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.drawImage(icons.sparkle, p.x, curY, p.size * 5, p.size * 5);
    }
    ctx.restore();
  }

  // 5. Card Glowing Cyber Rim & Outer Border
  ctx.save();
  const borderGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isVip) {
    borderGrad.addColorStop(0, '#ffd700');
    borderGrad.addColorStop(0.5, colors.secondary);
    borderGrad.addColorStop(1, '#ffd700');
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14 + 6 * Math.sin(animTime * Math.PI * 2);
  } else {
    borderGrad.addColorStop(0, colors.primary);
    borderGrad.addColorStop(0.5, colors.secondary);
    borderGrad.addColorStop(1, colors.primary);
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVip ? 3.5 : 2.5;
  roundRect(ctx, 8, 8, width - 16, height - 16, 24);
  ctx.stroke();
  ctx.restore();

  // 6. Precision Corner Tech Brackets
  ctx.save();
  ctx.strokeStyle = isVip ? '#ffd700' : colors.secondary;
  ctx.lineWidth = 2.5;
  const bLen = 18;
  // Top-Left
  ctx.beginPath();
  ctx.moveTo(18, 18 + bLen); ctx.lineTo(18, 18); ctx.lineTo(18 + bLen, 18);
  ctx.stroke();
  // Top-Right
  ctx.beginPath();
  ctx.moveTo(width - 18 - bLen, 18); ctx.lineTo(width - 18, 18); ctx.lineTo(width - 18, 18 + bLen);
  ctx.stroke();
  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(18, height - 18 - bLen); ctx.lineTo(18, height - 18); ctx.lineTo(18 + bLen, height - 18);
  ctx.stroke();
  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(width - 18 - bLen, height - 18); ctx.lineTo(width - 18, height - 18); ctx.lineTo(width - 18, height - 18 - bLen);
  ctx.stroke();
  ctx.restore();
}

async function renderCardCanvas(
  user: UserProfile,
  avatarImg: Image | null,
  username: string,
  animTime: number = 0
): Promise<SKRSContext2D> {
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
  const colors = getThemeColors(theme.id);
  const isVip = user.is_premium === 1;

  // 1. Draw Frame & Background
  drawCardFrame(ctx, width, height, colors, animTime, isVip, icons);

  // ==========================================
  // TOP SECTION: AVATAR + LEVEL EMBED
  // ==========================================
  const avatarCenterX = 122;
  const avatarCenterY = 120;
  const avatarRadius = 76;

  // Outer Glowing Aura Ring
  ctx.save();
  const auraPulse = isVip ? 4 * Math.sin(animTime * Math.PI * 2) : 0;
  ctx.shadowColor = isVip ? '#ffd700' : colors.primary;
  ctx.shadowBlur = 18 + auraPulse;
  ctx.strokeStyle = isVip ? '#ffd700' : colors.primary;
  ctx.lineWidth = isVip ? 4.5 : 3.5;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner Metallic Ring
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw Avatar Image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius - 1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(
      avatarImg,
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } else {
    ctx.fillStyle = '#1c1b33';
    ctx.fill();
  }
  ctx.restore();

  // Level Badge embedded under Avatar
  const levelBadgeW = 118;
  const levelBadgeH = 34;
  const levelBadgeX = avatarCenterX - levelBadgeW / 2;
  const levelBadgeY = avatarCenterY + avatarRadius - 16;

  ctx.save();
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 12;
  const lvlBgGrad = ctx.createLinearGradient(levelBadgeX, levelBadgeY, levelBadgeX, levelBadgeY + levelBadgeH);
  lvlBgGrad.addColorStop(0, '#15122e');
  lvlBgGrad.addColorStop(1, '#080614');
  ctx.fillStyle = lvlBgGrad;
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 17);
  ctx.fill();

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 8;
  roundRect(ctx, levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 17);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 17px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`NIV. ${levelInfo.level}`, avatarCenterX, levelBadgeY + levelBadgeH / 2);
  ctx.restore();

  // ==========================================
  // IDENTITY: USERNAME + VIP BADGE + CLASS PILL
  // ==========================================
  const headerTextX = 230;
  const usernameY = 82;
  const rankBoxX = 685;
  const vipBadgeW = 94;
  const vipBadgeH = 32;
  const maxRightBound = rankBoxX - 25;

  ctx.save();
  ctx.font = `900 36px ${FONT_FAMILY}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 10;
  ctx.textBaseline = 'middle';

  // Smart truncation
  const maxNameW = isVip ? (maxRightBound - headerTextX - vipBadgeW - 16) : (maxRightBound - headerTextX);
  let cleanUsername = username.toUpperCase();
  while (ctx.measureText(cleanUsername).width > maxNameW && cleanUsername.length > 3) {
    cleanUsername = cleanUsername.slice(0, -1);
  }
  if (cleanUsername !== username.toUpperCase()) {
    cleanUsername = cleanUsername.slice(0, -2) + '...';
  }

  ctx.fillText(cleanUsername, headerTextX, usernameY);
  const nameWidth = ctx.measureText(cleanUsername).width;

  // VIP Royal Golden Badge
  if (isVip) {
    const vipX = headerTextX + nameWidth + 16;
    const vipY = usernameY - vipBadgeH / 2;

    ctx.save();
    // Shiny Gold Pill Gradient
    const vipGrad = ctx.createLinearGradient(vipX, vipY, vipX + vipBadgeW, vipY + vipBadgeH);
    vipGrad.addColorStop(0, '#ffe066');
    vipGrad.addColorStop(0.3, '#d97706');
    vipGrad.addColorStop(0.8, '#b45309');
    vipGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = vipGrad;
    roundRect(ctx, vipX, vipY, vipBadgeW, vipBadgeH, 16);
    ctx.fill();

    // Golden Neon Border
    ctx.strokeStyle = '#fff4a3';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12 + 4 * Math.sin(animTime * Math.PI * 2);
    roundRect(ctx, vipX, vipY, vipBadgeW, vipBadgeH, 16);
    ctx.stroke();

    // Shimmer specular sheen for VIP GIF
    if (animTime > 0) {
      ctx.save();
      roundRect(ctx, vipX, vipY, vipBadgeW, vipBadgeH, 16);
      ctx.clip();
      const sheenX = vipX - 40 + animTime * (vipBadgeW + 80);
      const sheenGrad = ctx.createLinearGradient(sheenX, vipY, sheenX + 30, vipY + vipBadgeH);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.75)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(vipX, vipY, vipBadgeW, vipBadgeH);
      ctx.restore();
    }

    // Crown Icon + VIP Text
    ctx.shadowBlur = 0;
    ctx.drawImage(icons.crown, vipX + 10, vipY + (vipBadgeH - 22) / 2, 22, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 17px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;
    ctx.fillText('VIP', vipX + 38, vipY + vipBadgeH / 2 + 1);
    ctx.restore();
  }
  ctx.restore();

  // Class Pill (Frosted Glass Container)
  ctx.save();
  const classNameText = classData.name.toUpperCase();
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  const classTextW = ctx.measureText(classNameText).width;
  const classPillW = Math.max(136, classTextW + 56);
  const classPillH = 34;
  const classPillY = 118;

  const classGrad = ctx.createLinearGradient(headerTextX, classPillY, headerTextX + classPillW, classPillY);
  classGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  classGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = classGrad;
  roundRect(ctx, headerTextX, classPillY, classPillW, classPillH, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, headerTextX, classPillY, classPillW, classPillH, 12);
  ctx.stroke();

  const classContentW = 20 + 8 + classTextW;
  const classStartX = headerTextX + (classPillW - classContentW) / 2;
  ctx.drawImage(icons.shield, classStartX, classPillY + (classPillH - 20) / 2, 20, 20);

  ctx.fillStyle = '#f3f4f6';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(classNameText, classStartX + 28, classPillY + classPillH / 2);
  ctx.restore();

  // ==========================================
  // TOP RIGHT: RANK & LEVEL HUD BOXES
  // ==========================================
  const levelBoxX = 830;
  const rankBoxY = 40;
  const boxW = 130;
  const boxH = 92;

  // 1. Level Box
  ctx.save();
  const lvlBoxGrad = ctx.createLinearGradient(levelBoxX, rankBoxY, levelBoxX, rankBoxY + boxH);
  lvlBoxGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  lvlBoxGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
  ctx.fillStyle = lvlBoxGrad;
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();

  ctx.strokeStyle = colors.accent + 'aa';
  ctx.lineWidth = 2;
  roundRect(ctx, levelBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NIVEAU', levelBoxX + boxW / 2, rankBoxY + 28);

  ctx.fillStyle = colors.accent;
  ctx.font = `900 36px ${FONT_FAMILY}`;
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 8;
  ctx.fillText(`${levelInfo.level}`, levelBoxX + boxW / 2, rankBoxY + 63);
  ctx.restore();

  // 2. Rank Box
  const isTopRank = rankPos === 1;
  ctx.save();
  const rankBoxGrad = ctx.createLinearGradient(rankBoxX, rankBoxY, rankBoxX, rankBoxY + boxH);
  rankBoxGrad.addColorStop(0, isTopRank ? 'rgba(255, 215, 0, 0.18)' : 'rgba(255, 255, 255, 0.12)');
  rankBoxGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
  ctx.fillStyle = rankBoxGrad;
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.fill();

  ctx.strokeStyle = isTopRank ? '#ffd700' : colors.primary + 'bb';
  ctx.lineWidth = 2;
  if (isTopRank) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14 + (isVip ? 4 * Math.sin(animTime * Math.PI * 2) : 0);
  }
  roundRect(ctx, rankBoxX, rankBoxY, boxW, boxH, 18);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RANG', rankBoxX + boxW / 2, rankBoxY + 28);

  ctx.fillStyle = isTopRank ? '#ffd700' : colors.secondary;
  ctx.font = `900 36px ${FONT_FAMILY}`;
  ctx.shadowColor = isTopRank ? '#ffd700' : colors.secondary;
  ctx.shadowBlur = 8;
  ctx.fillText(`#${rankPos}`, rankBoxX + boxW / 2, rankBoxY + 63);
  ctx.restore();

  // ==========================================
  // MIDDLE SECTION: 3 HIGH-CONTRAST STATS HUD CARDS
  // ==========================================
  const statsY = 224;
  const statsH = 82;

  // 1. Fortune (Gold) Pill
  const goldPillW = 250;
  ctx.save();
  const goldPillGrad = ctx.createLinearGradient(40, statsY, 40 + goldPillW, statsY + statsH);
  goldPillGrad.addColorStop(0, 'rgba(255, 215, 0, 0.18)');
  goldPillGrad.addColorStop(1, 'rgba(217, 119, 6, 0.08)');
  ctx.fillStyle = goldPillGrad;
  roundRect(ctx, 40, statsY, goldPillW, statsH, 18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, statsY, goldPillW, statsH, 18);
  ctx.stroke();

  const goldText = `${user.gold.toLocaleString()} OR`;
  ctx.font = `900 24px ${FONT_FAMILY}`;
  const goldTextW = ctx.measureText(goldText).width;
  const goldContentW = 34 + 12 + goldTextW;
  const goldStartX = 40 + (goldPillW - goldContentW) / 2;

  ctx.drawImage(icons.coin, goldStartX, statsY + (statsH - 34) / 2, 34, 34);
  ctx.fillStyle = '#ffd700';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(goldText, goldStartX + 46, statsY + statsH / 2);
  ctx.restore();

  // 2. Combat HUD Panel (ATK | DEF | PV)
  const combatPillX = 310;
  const combatPillW = 420;
  ctx.save();
  const combatGrad = ctx.createLinearGradient(combatPillX, statsY, combatPillX + combatPillW, statsY + statsH);
  combatGrad.addColorStop(0, 'rgba(255, 255, 255, 0.11)');
  combatGrad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
  ctx.fillStyle = combatGrad;
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  roundRect(ctx, combatPillX, statsY, combatPillW, statsH, 18);
  ctx.stroke();

  // Column Dividers
  const colW = combatPillW / 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(combatPillX + colW, statsY + 14);
  ctx.lineTo(combatPillX + colW, statsY + statsH - 14);
  ctx.moveTo(combatPillX + colW * 2, statsY + 14);
  ctx.lineTo(combatPillX + colW * 2, statsY + statsH - 14);
  ctx.stroke();

  ctx.font = `bold 19px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // ATK (Col 1)
  const atkText = `${stats.atk} ATK`;
  const atkW = 24 + 8 + ctx.measureText(atkText).width;
  const atkStartX = combatPillX + (colW - atkW) / 2;
  ctx.drawImage(icons.sword, atkStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(atkText, atkStartX + 32, statsY + statsH / 2);

  // DEF (Col 2)
  const defText = `${stats.def} DEF`;
  const defW = 24 + 8 + ctx.measureText(defText).width;
  const defStartX = combatPillX + colW + (colW - defW) / 2;
  ctx.drawImage(icons.shield, defStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillStyle = '#bae6fd';
  ctx.fillText(defText, defStartX + 32, statsY + statsH / 2);

  // HP (Col 3)
  const hpText = `${stats.maxHp} PV`;
  const hpW = 24 + 8 + ctx.measureText(hpText).width;
  const hpStartX = combatPillX + colW * 2 + (colW - hpW) / 2;
  ctx.drawImage(icons.heart, hpStartX, statsY + (statsH - 24) / 2, 24, 24);
  ctx.fillStyle = '#fecdd3';
  ctx.fillText(hpText, hpStartX + 32, statsY + statsH / 2);
  ctx.restore();

  // 3. Streak (Série) Pill
  const streakPillX = 750;
  const streakPillW = 210;
  ctx.save();
  const streakGrad = ctx.createLinearGradient(streakPillX, statsY, streakPillX + streakPillW, statsY + statsH);
  streakGrad.addColorStop(0, 'rgba(255, 107, 74, 0.22)');
  streakGrad.addColorStop(1, 'rgba(234, 88, 12, 0.08)');
  ctx.fillStyle = streakGrad;
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 107, 74, 0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, streakPillX, statsY, streakPillW, statsH, 18);
  ctx.stroke();

  const streakText = `${user.daily_streak} J. SÉRIE`;
  ctx.font = `900 21px ${FONT_FAMILY}`;
  const streakTextW = ctx.measureText(streakText).width;
  const streakContentW = 28 + 10 + streakTextW;
  const streakStartX = streakPillX + (streakPillW - streakContentW) / 2;

  ctx.drawImage(icons.fire, streakStartX, statsY + (statsH - 28) / 2, 28, 28);
  ctx.fillStyle = '#ff7a59';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(streakText, streakStartX + 38, statsY + statsH / 2);
  ctx.restore();

  // ==========================================
  // BOTTOM SECTION: XP PROGRESS BAR HUD
  // ==========================================
  const barX = 40;
  const barY = 370;
  const barW = width - 80;
  const barH = 38;

  // XP Labels
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 18px ${FONT_FAMILY}`;
  ctx.fillText('EXPÉRIENCE DU NIVEAU', barX, barY - 14);

  const xpText = `${levelInfo.currentLevelXp.toLocaleString()} / ${levelInfo.nextLevelXp.toLocaleString()} XP  (${levelInfo.progressPercent}%)`;
  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = colors.secondary;
  ctx.fillText(xpText, barX + barW, barY - 14);
  ctx.restore();

  // Recessed Progress Bar Track
  ctx.save();
  ctx.fillStyle = 'rgba(6, 4, 18, 0.9)';
  roundRect(ctx, barX, barY, barW, barH, 19);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  roundRect(ctx, barX, barY, barW, barH, 19);
  ctx.stroke();

  // Progress Fill
  if (levelInfo.progressPercent > 0) {
    const fillWidth = Math.min(barW, (barW * Math.min(100, levelInfo.progressPercent)) / 100);
    ctx.save();
    roundRect(ctx, barX, barY, barW, barH, 19);
    ctx.clip();

    const xpBarGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    xpBarGrad.addColorStop(0, colors.primary);
    xpBarGrad.addColorStop(0.6, colors.secondary);
    xpBarGrad.addColorStop(1, colors.accent);
    ctx.fillStyle = xpBarGrad;
    ctx.fillRect(barX, barY, fillWidth, barH);

    // Flowing animated light wave for VIP
    if (isVip && animTime > 0) {
      const waveX = barX - 60 + animTime * (fillWidth + 120);
      const waveGrad = ctx.createLinearGradient(waveX, barY, waveX + 50, barY);
      waveGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      waveGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
      waveGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(barX, barY, fillWidth, barH);
    }

    // Glass Sheen Reflection
    const sheenGrad = ctx.createLinearGradient(0, barY, 0, barY + barH / 2);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(barX, barY, fillWidth, barH / 2);

    // Glowing Pulse Head Orb
    if (fillWidth > 32 && fillWidth < barW - 12) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(barX + fillWidth - 6, barY + barH / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // ==========================================
  // FOOTER: ENGINE & THEME SIGNATURE
  // ==========================================
  ctx.save();
  ctx.drawImage(icons.swordsSmall, barX, height - 37, 18, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('GUILDFORGE RPG ENGINE', barX + 26, height - 28);

  ctx.textAlign = 'right';
  ctx.fillText(`THÈME : ${theme.name.toUpperCase()}`, barX + barW, height - 28);
  ctx.restore();

  return ctx;
}

/**
 * Generate animated VIP Rank Card as a smooth GIF (18 frames, ~18 fps)
 */
export async function generateAnimatedVipRankCard(
  user: UserProfile,
  avatarUrl: string,
  username: string
): Promise<Buffer> {
  const width = 1000;
  const height = 500;

  let avatarImg: Image | null = null;
  try {
    avatarImg = await loadImage(avatarUrl);
  } catch {
    avatarImg = null;
  }

  const gif = GIFEncoder();
  const totalFrames = 18;
  const frameDelay = 55; // 55ms = ~18.2 fps

  for (let f = 0; f < totalFrames; f++) {
    const animTime = f / totalFrames;
    const ctx = await renderCardCanvas(user, avatarImg, username, animTime);
    const imgData = ctx.getImageData(0, 0, width, height);
    const palette = quantize(imgData.data, 256);
    const index = applyPalette(imgData.data, palette);
    gif.writeFrame(index, width, height, { palette, delay: frameDelay });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

/**
 * Generate standard high-resolution Static Rank Card (PNG)
 */
export async function generateStaticRankCard(
  user: UserProfile,
  avatarUrl: string,
  username: string
): Promise<Buffer> {
  let avatarImg: Image | null = null;
  try {
    avatarImg = await loadImage(avatarUrl);
  } catch {
    avatarImg = null;
  }

  const ctx = await renderCardCanvas(user, avatarImg, username, 0);
  return ctx.canvas.toBuffer('image/png');
}

export interface RankCardResult {
  buffer: Buffer;
  isGif: boolean;
  filename: string;
}

/**
 * Main unified entry point:
 * Returns animated GIF if user is VIP (is_premium === 1), or crisp PNG if standard.
 */
export async function generateRankCard(
  user: UserProfile,
  avatarUrl: string,
  username: string
): Promise<Buffer & { isGif?: boolean; filename?: string }> {
  const isVip = user.is_premium === 1;

  if (isVip) {
    const gifBuffer = await generateAnimatedVipRankCard(user, avatarUrl, username);
    (gifBuffer as any).isGif = true;
    (gifBuffer as any).filename = `rank-${user.user_id}.gif`;
    return gifBuffer;
  } else {
    const pngBuffer = await generateStaticRankCard(user, avatarUrl, username);
    (pngBuffer as any).isGif = false;
    (pngBuffer as any).filename = `rank-${user.user_id}.png`;
    return pngBuffer;
  }
}

