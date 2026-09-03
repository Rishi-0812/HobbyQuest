// src/theme.js
// Single source of truth for ALL colors, spacing, typography, shadows.
// Every screen and styles.js imports from here.
// Color names are consistent — if it's used in styles.js it must exist here.

export const C = {
  // ── Core brand ────────────────────────────────────────────────────────────
  primary:           '#022448',   // Deep navy text
  primaryContainer:  '#1E3A5F',   // Navy — headers, primary buttons
  primaryFixed:      '#D5E3FF',   // Light navy tint
  primaryFixedDim:   '#ADC8F5',   // Medium navy tint

  secondary:         '#584FBC',   // Purple — XP, level badges, onboarding
  secondaryContainer:'#958DFF',
  secondaryFixed:    '#E3DFFF',   // Light purple tint

  // ── Structured hobby — Deep Indigo ────────────────────────────────────────
  indigo:            '#3730A3',
  indigoLight:       '#EEF2FF',

  // ── Passion hobby — Slate Teal ────────────────────────────────────────────
  passion:           '#0D7377',
  passionLight:      '#E0F4F4',

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin:             '#A32D2D',
  adminLight:        '#FCEBEB',

  // ── Success / completed ───────────────────────────────────────────────────
  teal:              '#0F6E56',
  tealLight:         '#E1F5EE',

  // ── Vibe colors ───────────────────────────────────────────────────────────
  nailed:            '#0F6E56',
  getting:           '#E67E22',
  struggled:         '#A32D2D',

  // ── Almost there (amber) ──────────────────────────────────────────────────
  almostThere:       '#F59E0B',
  almostThereLight:  '#FEF3C7',

  // ── Neutrals ──────────────────────────────────────────────────────────────
  background:        '#F4F5F9',
  surfaceLowest:     '#F7F8FC',
  surfaceContainer:  '#E8EBF4',
  surfaceContainerLow:  '#F3F5FA',
  surfaceContainerHigh: '#E3E8F1',
  outlineVariant:    '#D3D7E1',
  outline:           '#7A7F8C',
  border:            '#D1D6E2',
  card:              '#F7F8FC',
  bg:                '#F4F5F9',

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:       '#1F2937',
  textSecondary:     '#4B5563',
  textTertiary:      '#7C8490',
  onSurface:         '#1A1C1E',
  onSurfaceVariant:  '#43474E',

  // ── Accent helpers ─────────────────────────────────────────────────────────
  purpleLight:       '#EEE8FF',
  blue:              '#2563EB',
  red:               '#BE123C',
  navy:              '#022448',
  navyLight:         '#D5E3FF',
  locked:            '#6B7280',
  learning:          '#584FBC',
  completed:         '#0F6E56',
  orange:            '#F59E0B',
  redLight:          '#FDE8E9',

  // ── Error ─────────────────────────────────────────────────────────────────
  error:             '#BA1A1A',
  errorContainer:    '#FFDAD6',

  white:             '#FFFFFF',
  black:             '#000000',
};

export const F = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   20,
  xl:   24,
  xxl:  32,
};

export const R = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  20,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// XP level thresholds
function buildLevelThresholds(levelCount) {
  const thresholds = [0];
  for (let n = 1; n <= levelCount; n++) {
    thresholds.push(50 * n * (n + 1));
  }
  return thresholds;
}

const LEVEL_XP = buildLevelThresholds(50);
console.log('LEVEL_XP', LEVEL_XP);

export function getLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
  }
  return Math.min(level, 50);
}

export function getXPProgress(xp) {
  const level = getLevel(xp);
  const current = LEVEL_XP[level - 1] ?? 0;
  const next = LEVEL_XP[level];

  if (next === undefined) {
    return { level, progress: 1, xpToNext: 0 };
  }

  return {
    level,
    progress: Math.max(0, Math.min(1, (xp - current) / (next - current))),
    xpToNext: Math.max(0, next - xp),
  };
}