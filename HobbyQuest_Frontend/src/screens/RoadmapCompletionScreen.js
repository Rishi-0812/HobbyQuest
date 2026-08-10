// src/screens/RoadmapCompletionScreen.js
// HobbyQuest — Roadmap Completion (P-10)
//
// Shown when all skills across all levels of a structured hobby = COMPLETED.
// Stats received via route.params from SkillDetailScreen after a
// NAILED_IT session triggers levelJustCompleted=true + completedLevel='Mastery'.
//
// Layout:
//   • Navy full-bleed header with large trophy + hobby name
//   • Stats row — Total skills / Days taken / XP earned
//   • Share to community card (POST /community/posts)
//   • Primary action: Go to Dashboard

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  Animated, Alert, ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, text, card, footer } from '../styles';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import api from '../services/api';

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ emoji, value, label }) {
  return (
    <View style={st.tile}>
      <Text style={st.emoji}>{emoji}</Text>
      <Text style={st.value}>{value}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...SHADOW.sm,
  },
  emoji: { fontSize: 28, marginBottom: 4 },
  value: { fontSize: F.xl, fontWeight: '800', color: C.onSurface },
  label: { fontSize: F.xs, color: C.onSurfaceVariant, textAlign: 'center', marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RoadmapCompletionScreen({ route, navigation }) {
  const {
    hobbyId,
    hobbyName    = 'Your Hobby',
    totalSkills  = 0,
    daysTaken    = 0,
    totalXpEarned= 0,
  } = route.params || {};

  const hobbyEmoji = getHobbyEmoji(hobbyName);

  const [caption,   setCaption]   = useState('');
  const [sharing,   setSharing]   = useState(false);
  const [shared,    setShared]    = useState(false);

  // ── Trophy entrance animation ─────────────────────────────────────────────
  const trophyScale   = useRef(new Animated.Value(0)).current;
  const trophyOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: trophy pops in → stats fade in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(trophyScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(trophyOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Share to community ────────────────────────────────────────────────────
  async function handleShare() {
    if (sharing || shared) return;
    setSharing(true);
    try {
      await api.post('/community/posts', {
        hobbyId,
        postType: 'roadmap_completion',
        caption:  caption.trim() || `Just completed the full ${hobbyName} roadmap on HobbyQuest! 🏆`,
      });
      setShared(true);
      Alert.alert(
        'Shared! 🎉',
        'Your achievement has been submitted to the community feed. It will appear once approved.',
        [{ text: 'Awesome!' }]
      );
    } catch (err) {
      Alert.alert(
        'Could not share',
        err.response?.data?.message || 'Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />

      <ScrollView
        style={layout.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Trophy header ──────────────────────────────────────────────── */}
        <View style={s.heroSection}>
          {/* Radial glow rings */}
          <View style={s.glowOuter} />
          <View style={s.glowInner} />

          {/* Animated trophy */}
          <Animated.View
            style={[
              s.trophyWrap,
              { opacity: trophyOpacity, transform: [{ scale: trophyScale }] },
            ]}
          >
            <Text style={s.trophyEmoji}>🏆</Text>
          </Animated.View>

          <Text style={s.completedLabel}>ROADMAP COMPLETE</Text>

          <View style={s.hobbyPill}>
            <Text style={s.hobbyPillEmoji}>{hobbyEmoji}</Text>
            <Text style={s.hobbyPillText}>{hobbyName}</Text>
          </View>

          <Text style={s.congratsText}>
            You've mastered every skill in the {hobbyName} roadmap.
            That takes real dedication — well done.
          </Text>
        </View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <Animated.View style={[s.statsRow, { opacity: statsOpacity }]}>
          <StatTile emoji="🎯" value={totalSkills}   label="Skills mastered" />
          <StatTile emoji="📅" value={`${daysTaken}d`} label="Days taken"    />
          <StatTile emoji="⚡" value={`${totalXpEarned}`} label="XP earned"  />
        </Animated.View>

        {/* ── Share card ─────────────────────────────────────────────────── */}
        <View style={s.shareCard}>
          <View style={s.shareCardHeader}>
            <Text style={s.shareCardTitle}>Share your achievement</Text>
            <Text style={s.shareCardSub}>
              Post to the community feed — submitted posts are reviewed before going live
            </Text>
          </View>

          {/* Caption input — plain TextInput-like View */}
          {!shared && (
            <View style={s.captionWrap}>
              <Text style={s.captionLabel}>Caption (optional)</Text>
              <View style={s.captionInputBox}>
                {/* Using a React Native TextInput */}
                <CaptionInput value={caption} onChange={setCaption} />
              </View>
            </View>
          )}

          {shared ? (
            <View style={s.sharedConfirm}>
              <Text style={s.sharedConfirmEmoji}>✅</Text>
              <Text style={s.sharedConfirmText}>Submitted for review</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              style={[s.shareBtn, sharing && s.shareBtnDisabled]}
              activeOpacity={0.85}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Text style={s.shareBtnText}>👥  Share to Community</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Fixed footer: Back to Dashboard ──────────────────────────────── */}
      <View style={footer.bar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AppTabs')}
          style={s.dashBtn}
          activeOpacity={0.85}
        >
          <Text style={s.dashBtnText}>🏠  Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Inline caption TextInput to avoid circular imports ───────────────────────
import { TextInput } from 'react-native';

function CaptionInput({ value, onChange }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="e.g. Finally done after 3 months of practice!"
      placeholderTextColor={C.outline}
      multiline
      maxLength={150}
      style={ci.input}
    />
  );
}
const ci = StyleSheet.create({
  input: {
    fontSize: F.base,
    color: C.onSurface,
    lineHeight: 22,
    minHeight: 56,
    textAlignVertical: 'top',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const HERO_BG = C.primaryContainer;

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: 20 },

  // Hero section — navy banner
  heroSection: {
    backgroundColor: HERO_BG,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 24 : 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },

  // Decorative glow circles behind trophy
  glowOuter: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: '10%',
  },
  glowInner: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: '15%',
  },

  // Trophy
  trophyWrap: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  trophyEmoji: { fontSize: 52 },

  // "ROADMAP COMPLETE" label
  completedLabel: {
    fontSize: F.sm, fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Hobby pill
  hobbyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: R.full,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  hobbyPillEmoji: { fontSize: 18 },
  hobbyPillText:  { fontSize: F.md, fontWeight: '700', color: C.white },

  // Congrats paragraph
  congratsText: {
    fontSize: F.base, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Share card
  shareCard: {
    marginHorizontal: 20,
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...SHADOW.md,
  },
  shareCardHeader: { marginBottom: 14 },
  shareCardTitle:  { fontSize: F.md, fontWeight: '700', color: C.onSurface },
  shareCardSub:    { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 4, lineHeight: 18 },

  // Caption input
  captionWrap: { marginBottom: 14 },
  captionLabel: { fontSize: F.xs, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  captionInputBox: {
    backgroundColor: C.background,
    borderRadius: R.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },

  // Share button
  shareBtn: {
    height: 48,
    backgroundColor: C.primaryContainer,
    borderRadius: R.lg,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  shareBtnDisabled: { backgroundColor: C.surfaceContainer },
  shareBtnText:     { color: C.white, fontSize: F.base, fontWeight: '700' },

  // Shared confirmation
  sharedConfirm: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 12,
  },
  sharedConfirmEmoji: { fontSize: 20 },
  sharedConfirmText:  { fontSize: F.base, fontWeight: '700', color: C.teal },

  // Dashboard button
  dashBtn: {
    height: 52,
    backgroundColor: C.primaryContainer,
    borderRadius: R.lg,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  dashBtnText: { color: C.white, fontSize: F.md, fontWeight: '700' },
});