// src/screens/SkillDetailScreen.js
// HobbyQuest — Skill Detail (structured hobby)
//
// Fixes vs previous version:
//  1. DATE BUG FIXED — date comparison now uses local calendar dates, not
//     raw millisecond diff, so "Today / Yesterday / Nd ago" is always correct
//     regardless of time-of-day or timezone offset.
//
//  2. COOLDOWN GUARD — Log Session button is disabled while skill.cooldownRemainingMs > 0.
//     A live countdown ticks every second and is shown in the button label.
//     The button re-enables the moment the cooldown expires.
//
//  3. ROADMAP COMPLETION TRIGGER — after a successful session log, if the
//     server response carries levelJustCompleted === true AND
//     completedLevel === 'Mastery', we navigate to RoadmapCompletionScreen
//     with the stats the server returned.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, text, card, empty } from '../styles';
import VibePickerModal from './VibePickerModal';
import api from '../services/api';
import CelebrationPopup from '../components/CelebrationPopup';

// Remove the old XPBanner function and xb StyleSheet entirely.
// ─────────────────────────────────────────────────────────────────────────────
// Vibe display config (matches backend enum values exactly)
const VIBE_CFG = {
  NAILED_IT:              { emoji: '🎯', label: 'Nailed it',     color: C.teal,        border: C.teal },
  GETTING_THE_HANG_OF_IT: { emoji: '🙂', label: 'Making progress', color: '#E67E22',     border: '#E67E22' },
  STRUGGLING:             { emoji: '😤', label: 'Struggled',     color: C.admin,       border: C.admin },
};

// Status badge config (matches backend enum values exactly — UPPERCASE)
const STATUS_CFG = {
  AVAILABLE:    { label: 'Available',    bg: C.secondaryFixed,   color: C.secondary,  emoji: '▶' },
  LEARNING:     { label: 'Learning',     bg: C.secondaryFixed,   color: C.secondary,  emoji: '📖' },
  ALMOST_THERE: { label: 'Almost there', bg: C.almostThereLight, color: '#78350F',    emoji: '⚡' },
  COMPLETED:    { label: 'Completed',    bg: C.tealLight,        color: C.teal,       emoji: '✓' },
};

// ─── Date helper ──────────────────────────────────────────────────────────────
// Returns "Today", "Yesterday", or "Nd ago" based on LOCAL calendar date
// comparison — immune to timezone/hour-of-day issues.
function dayLabel(isoString) {
  if (!isoString) return '';

  // Parse the timestamp into a local Date
  const logged = new Date(isoString);

  // Build local-date-only values (no UTC conversion)
  const loggedY = logged.getFullYear();
  const loggedM = logged.getMonth();
  const loggedD = logged.getDate();

  const now  = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth();
  const nowD = now.getDate();

  // Build plain Date objects representing midnight of each day (local)
  const loggedMidnight = new Date(loggedY, loggedM, loggedD);
  const todayMidnight  = new Date(nowY,    nowM,    nowD);

  const diffMs   = todayMidnight - loggedMidnight;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// ─── Cooldown helper ──────────────────────────────────────────────────────────
// Formats milliseconds → "M:SS" string for the countdown display
function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes      = Math.floor(totalSeconds / 60);
  const seconds      = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// ─── Session row ──────────────────────────────────────────────────────────────
function SessionRow({ session }) {
  const cfg = VIBE_CFG[session.vibe] || VIBE_CFG.STRUGGLING;
  const total = (session.xpEarned || 0) + (session.bonusXp || 0);
  return (
    <View style={[sr.row, { borderLeftColor: cfg.border }]}>
      <Text style={sr.emoji}>{cfg.emoji}</Text>
      <View style={sr.info}>
        <Text style={[sr.vibe, { color: cfg.color }]}>{cfg.label}</Text>
        {session.note ? <Text style={sr.note}>{session.note}</Text> : <Text style={sr.noNote}>no note</Text>}
        {session.highlights ? <Text style={sr.highlights}>🎉 {session.highlights}</Text> : null}
      </View>
      <View style={sr.right}>
        <Text style={sr.date}>{dayLabel(session.loggedAt)}</Text>
        {total > 0 && <Text style={sr.xp}>+{total} XP</Text>}
      </View>
    </View>
  );
}

//Helper function to build the celebration lines based on the result object
function buildCelebrationLines(result) {
  return (result.xpBreakdown || []).map(item => ({
    emoji: iconForLabel(item.label),
    text: `${item.label} +${item.amount}`,
  }));
}

function iconForLabel(label) {
  if (label.includes('Nailed') || label.includes('zone')) return '🎯';
  if (label.includes('progress') || label.includes('rhythm') || label.includes('Struggled') || label.includes('anyway')) return '💪';
  if (label.includes('Daily bonus')) return '☀️';
  if (label.includes('Skill complete')) return '🎉';
  if (label.includes('level complete')) return '🏆';
  if (label.includes('Roadmap complete')) return '👑';
  if (label.includes('Streak')) return '🔥';
  if (label.includes('completed')) return '✍️';
  if (label.includes('Project complete')) return '🎊';
  return '✨';
}

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surfaceLowest, borderRadius: R.lg,
    padding: 12, marginBottom: 8, borderLeftWidth: 4,
    ...SHADOW.sm,
  },
  emoji:  { fontSize: 24 },
  info:   { flex: 1 },
  vibe:   { fontSize: F.sm, fontWeight: '700' },
  note:   { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  noNote: { fontSize: F.xs, color: C.outline, fontStyle: 'italic', marginTop: 2 },
  right:  { alignItems: 'flex-end', gap: 2 },
  date:   { fontSize: F.xs, color: C.outline },
  xp:     { fontSize: F.xs, fontWeight: '700', color: C.teal },
});

// ─── XP celebration banner ────────────────────────────────────────────────────
function XPBanner({ result, onDismiss }) {
  if (!result) return null;
  return (
    <TouchableOpacity onPress={onDismiss} style={xb.wrap} activeOpacity={0.9}>
      <View style={xb.inner}>
        <Text style={xb.main}>+{result.totalXpEarned} XP</Text>
        {result.skillJustCompleted && (
          <Text style={xb.sub}>🎉 Skill Complete! +{result.completionBonus} bonus</Text>
        )}
        {result.levelJustCompleted && (
          <Text style={xb.sub}>🏆 Level Complete! +{result.levelBonus} bonus</Text>
        )}
        {result.leveledUp && (
          <Text style={xb.sub}>⭐ Level Up! Now Level {result.newLevel}</Text>
        )}
        {result.dailyBonus > 0 && (
          <Text style={xb.sub}>☀️ First session today +{result.dailyBonus} bonus</Text>
        )}
        <Text style={xb.dismiss}>Tap to dismiss</Text>
      </View>
    </TouchableOpacity>
  );
}
const xb = StyleSheet.create({
  wrap:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: 16 },
  inner:   { backgroundColor: C.indigo, borderRadius: R.xl, padding: 16, alignItems: 'center', ...SHADOW.lg },
  main:    { fontSize: F.xxl, fontWeight: '800', color: C.white },
  sub:     { fontSize: F.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  dismiss: { fontSize: F.xs, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SkillDetailScreen({ route, navigation }) {
  const {
    skillId:    routeSkillId,
    skillName:  routeSkillName,
    hobbyId,
    hobbyName,
    skill:      initialSkill,
  } = route.params || {};

  const skillId          = routeSkillId || initialSkill?.id;
  const initialSkillName = routeSkillName || initialSkill?.name;

  const [skill,      setSkill]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [vibeOpen,   setVibeOpen]   = useState(false);
  const [upgrading,  setUpgrading]  = useState(false);
  const [xpResult,   setXpResult]   = useState(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  // Live cooldown countdown in milliseconds (0 = no cooldown)
  const [cooldownMs, setCooldownMs] = useState(0);
  const cooldownTimer = useRef(null);

  // ── Fetch skill detail ──────────────────────────────────────────────────────
  const fetchSkill = useCallback(async () => {
    if (!skillId) {
      setErrorMsg('Invalid skill selected.');
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/skills/${skillId}/detail`);
      setSkill(data);

      // Seed the live countdown from the server's cooldownRemainingMs field
      const remaining = data.cooldownRemainingMs ?? 0;
      setCooldownMs(Math.max(0, remaining));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not load skill detail.');
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  // ── Cooldown countdown ticker ───────────────────────────────────────────────
  // Decrements cooldownMs by 1000ms every second while > 0.
  // Clears automatically when it hits zero so the button re-enables.
  useEffect(() => {
    if (cooldownMs <= 0) {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }
    cooldownTimer.current = setInterval(() => {
      setCooldownMs(prev => {
        if (prev <= 1000) {
          clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(cooldownTimer.current);
  }, [cooldownMs]);

  // ── Session logged callback (from VibePickerModal) ─────────────────────────
  async function handleSessionLogged(result) {
    setVibeOpen(false);
    setXpResult(result);

    // Refresh to get updated status, attempt count, session history, new cooldown
    await fetchSkill();

    // ── ROADMAP COMPLETION TRIGGER ──────────────────────────────────────────
    // The backend sets levelJustCompleted=true + completedLevel='Mastery'
    // only when the user just completed the final skill in the Mastery level,
    // meaning the entire roadmap is now done.
    if (result?.levelJustCompleted && result?.completedLevel === 'Mastery') {
      // Small delay so the XP banner is visible briefly before navigating
      setTimeout(() => {
        setXpResult(null);
        navigation.navigate('RoadmapCompletion', {
          hobbyId,
          hobbyName:      hobbyName || initialSkillName,
          totalSkills:    result.totalSkills    ?? 0,
          daysTaken:      result.daysTaken      ?? 0,
          totalXpEarned:  result.totalXpEarned  ?? 0,
        });
      }, 2200);
    }
  }

  // ── Upgrade skill status ────────────────────────────────────────────────────
  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const { data } = await api.patch(`/user/skills/${skillId}/status`);
      await fetchSkill();
      Alert.alert(
        'Status updated ✅',
        data.message || 'Marked as Almost There! Log a Nailed It session to complete this skill.',
        [{ text: 'Got it' }]
      );
    } catch (err) {
      Alert.alert(
        'Cannot upgrade',
        err.response?.data?.message || 'Make sure you have at least 3 sessions logged.',
        [{ text: 'OK' }]
      );
    } finally {
      setUpgrading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo} />
        <ActivityIndicator size="large" color={C.indigo} />
        <Text style={[text.muted, { marginTop: 12 }]}>Loading skill…</Text>
      </SafeAreaView>
    );
  }

  if (!skill && errorMsg) {
    return (
      <SafeAreaView style={layout.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo} />
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>← Roadmap</Text>
          </TouchableOpacity>
        </View>
        <View style={layout.centered}>
          <Text style={empty.emoji}>😕</Text>
          <Text style={empty.title}>Could not load skill</Text>
          <Text style={empty.subtitle}>{errorMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg      = STATUS_CFG[skill.status] || STATUS_CFG.LEARNING;
  const isOnCooldown   = cooldownMs > 0;
  const countdownLabel = formatCountdown(cooldownMs);
  const showUpgrade    = skill.status === 'LEARNING'     && skill.attemptCount >= 3;
  const showCompleteHint = skill.status === 'ALMOST_THERE';

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.indigo} />

      {/* XP celebration overlay */}
      <CelebrationPopup
        visible={!!xpResult}
        xpEarned={xpResult?.totalXpEarned}
        accentColor={C.indigo}
        lines={xpResult ? buildCelebrationLines(xpResult) : []}
        onDismiss={() => setXpResult(null)}
      />

      {/* ── Indigo header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Roadmap</Text>
        </TouchableOpacity>

        <Text style={s.skillName}>{skill.name}</Text>

        <View style={s.headerMeta}>
          {/* Status pill */}
          <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Text style={s.statusPillEmoji}>{statusCfg.emoji}</Text>
            <Text style={[s.statusPillText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
          <Text style={s.attempts}>
            {skill.attemptCount} session{skill.attemptCount !== 1 ? 's' : ''} logged
          </Text>
        </View>
      </View>

      <ScrollView
        style={layout.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── About this skill ──────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>ABOUT THIS SKILL</Text>
        <View style={s.descCard}>
          <Text style={s.descText}>{skill.description}</Text>
        </View>

        {/* ── Tip / struggled tip ───────────────────────────────────────── */}
        {skill.tip && (
          skill.isStruggledTip ? (
            <View style={s.struggledBox}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.struggledTitle}>Struggling? Try this approach</Text>
                <Text style={s.struggledText}>{skill.tip}</Text>
              </View>
            </View>
          ) : (
            <View style={s.tipBox}>
              <Text style={{ fontSize: 18 }}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle}>Tip</Text>
                <Text style={s.tipText}>{skill.tip}</Text>
              </View>
            </View>
          )
        )}

        {/* ── Cooldown notice ─────────────────────────────────────────────
        {isOnCooldown && (
          <View style={s.cooldownBox}>
            <Text style={{ fontSize: 16 }}>⏳</Text>
            <Text style={s.cooldownText}>
              Next session available in{' '}
              <Text style={s.cooldownTimer}>{countdownLabel}</Text>
            </Text>
          </View>
        )} */}

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <View style={s.actionRow}>
          {/* Log Session — disabled during cooldown */}
          <TouchableOpacity
            onPress={() => !isOnCooldown && setVibeOpen(true)}
            disabled={isOnCooldown}
            style={[s.logBtn, isOnCooldown && s.logBtnDisabled]}
            activeOpacity={isOnCooldown ? 1 : 0.85}
          >
            <Text style={[s.logBtnText, isOnCooldown && s.logBtnTextDisabled]}>
              {isOnCooldown
                ? `⏳  ${countdownLabel}`
                : '📝  Log session'}
            </Text>
          </TouchableOpacity>

          {/* Upgrade / complete hint */}
          {(showUpgrade || showCompleteHint) && (
            <TouchableOpacity
              onPress={showUpgrade ? handleUpgrade : undefined}
              disabled={upgrading || showCompleteHint}
              style={[s.upgradeBtn, showCompleteHint && s.upgradeBtnHint]}
              activeOpacity={showCompleteHint ? 1 : 0.85}
            >
              {upgrading ? (
                <ActivityIndicator size="small" color={C.teal} />
              ) : (
                <Text style={s.upgradeBtnText}>
                  {showCompleteHint
                    ? '⬆️  Log Nailed It to complete'
                    : '⬆️  Mark Almost There'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {showCompleteHint && (
          <Text style={s.completeHint}>
            Log a "Nailed It" session to automatically complete this skill
          </Text>
        )}

        {/* ── Recent sessions ───────────────────────────────────────────── */}
        {skill.recentSessions?.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>RECENT SESSIONS</Text>
            {skill.recentSessions.map((session, i) => (
              <SessionRow key={i} session={session} />
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Vibe picker modal ────────────────────────────────────────────── */}
      <VibePickerModal
        visible={vibeOpen}
        skillId={skillId}
        skillName={skill?.name || initialSkillName}
        onClose={() => setVibeOpen(false)}
        onLogged={handleSessionLogged}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // Indigo header
  header: {
    backgroundColor: C.indigo,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 20,
  },
  backBtn:   { marginBottom: 10 },
  backText:  { color: 'rgba(255,255,255,0.75)', fontSize: F.base },
  skillName: { fontSize: F.xl, fontWeight: '800', color: C.white, marginBottom: 10 },
  headerMeta:{
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full,
  },
  statusPillEmoji: { fontSize: 13 },
  statusPillText:  { fontSize: F.sm, fontWeight: '700' },
  attempts:  { color: 'rgba(255,255,255,0.65)', fontSize: F.sm },

  scrollContent: { padding: 20 },

  sectionLabel: {
    fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },

  // Description
  descCard: {
    backgroundColor: C.surfaceLowest, borderRadius: R.xl,
    padding: 16, marginBottom: 16, ...SHADOW.sm,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  descText: { fontSize: F.base, color: C.onSurface, lineHeight: 22 },

  // Regular tip
  tipBox: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.indigoLight, borderRadius: R.xl,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: C.indigo + '30',
  },
  tipTitle: { fontSize: F.sm, fontWeight: '700', color: C.indigo, marginBottom: 4 },
  tipText:  { fontSize: F.sm, color: C.indigo, lineHeight: 18 },

  // Struggled tip
  struggledBox: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.almostThereLight, borderRadius: R.xl,
    padding: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: C.almostThere,
  },
  struggledTitle: { fontSize: F.sm, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  struggledText:  { fontSize: F.sm, color: '#92400E', lineHeight: 18 },

  // Cooldown notice
  cooldownBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surfaceContainerHigh, borderRadius: R.lg,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  cooldownText:  { fontSize: F.sm, color: C.onSurfaceVariant },
  cooldownTimer: { fontWeight: '800', color: C.onSurface, fontVariant: ['tabular-nums'] },

  // Action buttons
  actionRow:     { flexDirection: 'row', gap: 12, marginBottom: 8 },

  // Log session button
  logBtn: {
    flex: 1, height: 48,
    backgroundColor: C.indigo,
    borderRadius: R.lg,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  logBtnDisabled: {
    backgroundColor: C.surfaceContainer,
  },
  logBtnText: { color: C.white, fontSize: F.base, fontWeight: '700' },
  logBtnTextDisabled: { color: C.outline },

  // Upgrade button
  upgradeBtn: {
    flex: 1, height: 48,
    backgroundColor: C.tealLight,
    borderRadius: R.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.teal,
  },
  upgradeBtnHint: {
    backgroundColor: C.surfaceContainerHigh,
    borderColor: C.outlineVariant,
  },
  upgradeBtnText: {
    color: C.teal, fontSize: F.sm, fontWeight: '700',
    textAlign: 'center', paddingHorizontal: 8,
  },

  completeHint: {
    fontSize: F.xs, color: C.teal, fontStyle: 'italic',
    textAlign: 'center', marginBottom: 16,
  },
});