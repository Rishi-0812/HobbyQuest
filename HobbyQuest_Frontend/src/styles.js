// src/styles.js
// Shared StyleSheet objects used across multiple screens.
// Import what you need: import { layout, text, card, header } from '../styles';

import { StyleSheet, Platform } from 'react-native';
import { C, F, R, SHADOW } from './theme';

// ─── Layout ──────────────────────────────────────────────────────────────────
export const layout = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.background },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 20, paddingBottom: 40 },
  scrollContentPb:{ padding: 20, paddingBottom: 100 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row:            { flexDirection: 'row', alignItems: 'center' },
  rowBetween:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fill:           { flex: 1 },
  gap4:           { height: 4 },
  gap8:           { height: 8 },
  gap12:          { height: 12 },
  gap16:          { height: 16 },
  gap24:          { height: 24 },
  divider:        { height: 1, backgroundColor: C.outlineVariant, marginVertical: 12 },
});

// ─── Headers ─────────────────────────────────────────────────────────────────
export const header = StyleSheet.create({
  // Navy header — used on Dashboard, Browse, Community, Profile
  navy: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Purple header — used on Onboarding steps
  purple: {
    backgroundColor: C.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  // Indigo header — used on Roadmap, Skill Detail
  indigo: {
    backgroundColor: C.indigo,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 20,
  },
  // Passion header — used on Passion Home, Active Project
  passion: {
    backgroundColor: C.passion,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 20,
  },
  // Admin header
  admin: {
    backgroundColor: C.admin,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 20,
  },
  title:      { fontSize: F.xl, fontWeight: '800', color: C.white },
  titleLarge: { fontSize: F.xxl, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  subtitle:   { fontSize: F.base, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  backLink:   { color: 'rgba(255,255,255,0.75)', fontSize: F.base, marginBottom: 12 },
});

// ─── Typography ───────────────────────────────────────────────────────────────
export const text = StyleSheet.create({
  // Headings
  h1:       { fontSize: F.xxl, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  h2:       { fontSize: F.xl,  fontWeight: '700', color: C.onSurface },
  h3:       { fontSize: F.lg,  fontWeight: '700', color: C.onSurface },
  h4:       { fontSize: F.md,  fontWeight: '600', color: C.onSurface },

  // Body
  body:     { fontSize: F.base, color: C.onSurface,        lineHeight: 20 },
  bodyMd:   { fontSize: F.md,   color: C.onSurface,        lineHeight: 24 },
  muted:    { fontSize: F.base, color: C.onSurfaceVariant, lineHeight: 20 },
  small:    { fontSize: F.xs,   color: C.onSurfaceVariant },
  tiny:     { fontSize: 10,     color: C.outline },

  // Caps label (like Stitch LABEL-CAPS)
  capsLabel:{ fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase' },

  // White variants for use on coloured headers
  white:    { color: C.white },
  whiteMd:  { fontSize: F.base, color: 'rgba(255,255,255,0.75)' },

  // Pill label
  pill:     { fontSize: F.sm, fontWeight: '600' },

  // Links
  link:     { fontSize: F.base, color: '#2980B9', fontWeight: '500' },
});

// ─── Cards ────────────────────────────────────────────────────────────────────
export const card = StyleSheet.create({
  // Standard white card
  base: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...SHADOW.md,
  },
  // Compact card
  sm: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...SHADOW.sm,
  },
  // Hero card (recommendations, dashboard active hobby)
  hero: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.08)',
    ...SHADOW.lg,
  },
  // Info box — light tinted background
  infoNavy: {
    backgroundColor: C.primaryFixed,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.primaryFixedDim,
  },
  infoIndigo: {
    backgroundColor: C.indigoLight,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.indigo + '40',
  },
  infoPassion: {
    backgroundColor: C.passionLight,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.passion + '40',
  },
  infoAmber: {
    backgroundColor: C.almostThereLight,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: C.almostThere,
  },
});

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const btn = StyleSheet.create({
  // Base — applied by PrimaryButton component, but useful for inline custom buttons
  primary: {
    height: 48,
    borderRadius: R.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryContainer,
    ...SHADOW.sm,
  },
  primaryText: { color: C.white, fontSize: F.md, fontWeight: '700' },

  ghost: {
    height: 48,
    borderRadius: R.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: F.md, fontWeight: '700' },

  // Icon button (small circular)
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceContainerHigh,
  },
});

// ─── Badges / pills ───────────────────────────────────────────────────────────
export const badge = StyleSheet.create({
  base:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  text:     { fontSize: F.sm, fontWeight: '600' },

  // Preset badge colours
  navy:     { backgroundColor: C.primaryFixed },
  navyText: { color: C.primaryContainer },

  indigo:     { backgroundColor: C.indigoLight },
  indigoText: { color: C.indigo },

  passion:     { backgroundColor: C.passionLight },
  passionText: { color: C.passion },

  teal:     { backgroundColor: C.tealLight },
  tealText: { color: C.teal },

  amber:     { backgroundColor: C.almostThereLight },
  amberText: { color: '#78350F' },

  admin:     { backgroundColor: C.adminLight },
  adminText: { color: C.admin },
});

// ─── Section headers ──────────────────────────────────────────────────────────
export const section = StyleSheet.create({
  header:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title:   { fontSize: F.lg, fontWeight: '700', color: C.onSurface },
  action:  { fontSize: F.base, color: '#2980B9', fontWeight: '600' },
});

// ─── List items / hobby rows ──────────────────────────────────────────────────
export const listItem = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surfaceLowest,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginBottom: 8,
    ...SHADOW.sm,
  },
  iconWrap: {
    width: 44, height: 44,
    borderRadius: 10,
    backgroundColor: C.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText:  { fontSize: 22 },
  info:      { flex: 1 },
  title:     { fontSize: F.base, fontWeight: '700', color: C.onSurface },
  subtitle:  { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  arrow:     { fontSize: 22, color: C.outlineVariant },
});

// ─── Empty state ──────────────────────────────────────────────────────────────
export const empty = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emoji:    { fontSize: 40 },
  title:    { fontSize: F.lg, fontWeight: '700', color: C.onSurface },
  subtitle: { fontSize: F.base, color: C.onSurfaceVariant, textAlign: 'center' },
});

// ─── Footer (fixed bottom action bar) ────────────────────────────────────────
export const footer = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  barWhite: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    backgroundColor: C.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const avatar = StyleSheet.create({
  sm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  md: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  lg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  letter: { fontSize: F.base, fontWeight: '800', color: C.primaryContainer },
  letterLg: { fontSize: F.xl, fontWeight: '800', color: C.primaryContainer },
});

// ─── Activity heatmap ─────────────────────────────────────────────────────────
export const heatmap = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
  },
  col: {
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  legendText: {
    fontSize: F.xs,
    color: C.onSurfaceVariant,
    fontWeight: '500',
  },
});