// HobbyQuest — Shared Components
// Import these into any screen rather than re-writing common elements.

import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet
} from 'react-native';
import { C, F, R, SHADOW } from '../theme';

// ─── Primary Button ────────────────────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading, disabled, style, color = C.primaryContainer }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[styles.primaryBtn, { backgroundColor: color }, disabled && styles.primaryBtnDisabled, style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.primaryBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── Secondary / Ghost Button ──────────────────────────────────────────────
export function GhostButton({ label, onPress, color = C.navy, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.ghostBtn, { borderColor: color }, style]}>
      <Text style={[styles.ghostBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Text Input ────────────────────────────────────────────────────────────
export function InputField({ label, error, ...props }) {
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={C.textTertiary}
        {...props}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge / Chip ──────────────────────────────────────────────────────────
export function Badge({ label, bg = C.navyLight, color = C.navy }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
export function ProgressBar({ progress, color = C.teal, height = 6, bg = C.border }) {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[styles.progressTrack, { height, backgroundColor: bg }]}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

// ─── Status Dot ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  locked:      { color: C.locked,     label: 'Locked' },
  learning:    { color: C.learning,   label: 'Learning' },
  almost_there:{ color: C.almostThere,label: 'Almost there' },
  completed:   { color: C.completed,  label: 'Completed' },
};
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.locked;
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.color + '20', borderColor: s.color }]}>    
      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ─── Error banner ───────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

// ─── Divider text ────────────────────────────────────────────────────────────
export function DividerText({ text }) {
  return (
    <View style={styles.dividerTextRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  // Buttons
  primaryBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: R.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.md,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
    backgroundColor: C.surfaceContainerHigh,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: F.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ghostBtn: {
    borderWidth: 1.5,
    borderRadius: R.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLowest,
    borderColor: C.border,
  },
  ghostBtnText: { fontSize: F.base, fontWeight: '600', color: C.textPrimary },

  // Input
  inputWrap: { marginBottom: 16 },
  inputLabel: {
    fontSize: F.sm,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.md,
    height: 50,
    paddingHorizontal: 14,
    fontSize: F.base,
    color: C.textPrimary,
    backgroundColor: C.card,
  },
  inputError: { borderColor: C.red },
  inputErrorText: { fontSize: F.xs, color: C.red, marginTop: 4 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  badgeText: { fontSize: F.xs, fontWeight: '600' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: F.md,
    fontWeight: '700',
    color: C.textPrimary,
  },
  sectionAction: {
    fontSize: F.sm,
    color: C.blue,
    fontWeight: '600',
  },

  // Progress bar
  progressTrack: { borderRadius: 99, overflow: 'hidden', width: '100%' },
  progressFill:  { borderRadius: 99 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: F.xs, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  emptySub:   { fontSize: F.sm, color: C.textSecondary, textAlign: 'center' },

  // Divider text
  dividerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: F.sm,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
});