// ActiveProjectScreen
// Route params: { progressId, projectName, unitLabel, targetCount, hobbyId, hobbyName }
// API: GET /user/projects/{progressId}/active, POST /user/projects/{progressId}/log,
//      PATCH /user/projects/{progressId}/abandon
// Layout: passion header, current + next prompt, circular progress, cooldown, actions, recent sessions.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { ProgressBar, PrimaryButton } from '../components/components';
import { layout, card, header, badge } from '../styles';
import api from '../services/api';
import VibePickerModal from './VibePickerModal';
import CelebrationPopup from '../components/CelebrationPopup';
import { getHobbyAccent } from '../constants/hobbyAccent';

const VIBE_LABEL = {
  NAILED_IT: 'In the zone',
  GETTING_THE_HANG_OF_IT: 'Kept at it',
  STRUGGLING: 'Showed up anyway',
};

const VIBE_EMOJI = {
  NAILED_IT: '✨',
  GETTING_THE_HANG_OF_IT: '🌿',
  STRUGGLING: '💪',
};

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Local calendar-date comparison — same logic as SkillDetailScreen, immune
// to timezone/hour-of-day issues.
function dayLabel(isoString) {
  if (!isoString) return '';
  const logged = new Date(isoString);
  const now = new Date();
  const loggedMidnight = new Date(logged.getFullYear(), logged.getMonth(), logged.getDate());
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayMidnight - loggedMidnight) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function iconForLabel(label) {
  if (label.includes('zone')) return '✨';
  if (label.includes('rhythm') || label.includes('anyway') || label.includes('Kept')) return '🌿';
  if (label.includes('Daily bonus')) return '☀️';
  if (label.includes('completed')) return '✍️';
  if (label.includes('Project complete')) return '🎊';
  if (label.includes('Streak')) return '🔥';
  return '💪';
}

function SessionRow({ session, unitLabel }) {
  const emoji = VIBE_EMOJI[session.vibe] || '✨';
  const label = VIBE_LABEL[session.vibe] || session.vibe;
  const total = (session.xpEarned || 0) + (session.bonusXp || 0);
  return (
    <View style={sr.row}>
      <Text style={sr.emoji}>{emoji}</Text>
      <View style={sr.info}>
        <Text style={sr.vibe}>{label}</Text>
        {session.note ? <Text style={sr.note} numberOfLines={2}>{session.note}</Text> : null}
        {session.highlights ? <Text style={sr.highlights}>🎉 {session.highlights}</Text> : null}
      </View>
      <View style={sr.right}>
        <Text style={sr.date}>{dayLabel(session.loggedAt)}</Text>
        {total > 0 ? <Text style={sr.xp}>+{total} XP</Text> : null}
      </View>
    </View>
  );
}
const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surfaceLowest, borderRadius: R.lg,
    padding: 14, borderWidth: 1, borderColor: C.outlineVariant,
    marginBottom: 10, ...SHADOW.sm,
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  vibe: { fontSize: F.base, color: C.onSurface, fontWeight: '800' },
  note: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 2 },
  highlights: { fontSize: F.xs, color: C.teal, marginTop: 3, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 2 },
  date: { fontSize: F.xs, color: C.outline },
  xp: { fontSize: F.sm, fontWeight: '800', color: C.teal },
});

export default function ActiveProjectScreen({ route, navigation }) {
  const params = route.params;
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [error, setError] = useState('');
  const [xpResult, setXpResult] = useState(null);

  const accent = getHobbyAccent(params.hobbyId);

  const fetchActive = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get(`/user/projects/${params.progressId}/active`);
      setActive(data);
      setCooldownMs(data.cooldownRemainingMs || 0);
    } catch {
      setError('Could not load this project.');
    } finally {
      setLoading(false);
    }
  }, [params.progressId]);

  useEffect(() => {
    fetchActive();
    const unsubscribe = navigation.addListener('focus', fetchActive);
    return unsubscribe;
  }, [navigation, fetchActive]);

  useEffect(() => {
    if (cooldownMs <= 0) return undefined;
    const timer = setInterval(() => setCooldownMs(ms => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(timer);
  }, [cooldownMs]);

  const currentCount = active?.currentCount ?? 0;
  const targetCount = active?.targetCount ?? params.targetCount ?? 1;
  const unitLabel = active?.unitLabel ?? params.unitLabel ?? 'unit';
  const progress = useMemo(() => currentCount / Math.max(targetCount, 1), [currentCount, targetCount]);

  function reportIssue() {
    const name = active?.projectName ?? params.projectName;
    navigation.navigate('Feedback', {
      prefillType: 'bug',
      prefillHobbyName: params.hobbyName,
      prefillMessage: `Issue with the "${name}" project: `,
    });
  }

  function goToCompletion() {
    navigation.navigate('ProjectCompletion', {
      progressId: params.progressId,
      projectId: active?.projectId ?? params.projectId,
      projectName: active?.projectName ?? params.projectName,
      unitLabel,
      totalUnits: targetCount,
      hobbyId: params.hobbyId,
      hobbyName: params.hobbyName,
      readOnly: Boolean(active?.isComplete),
    });
  }

  function confirmAbandon() {
    Alert.alert(
      'Abandon this project?',
      'Abandoning will stop tracking this project as active for you. Your past sessions and XP are kept. Are you sure you want to abandon it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon', style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await api.patch(`/user/projects/${params.progressId}/abandon`);
              navigation.navigate('PassionHome', { hobbyId: params.hobbyId, hobbyName: params.hobbyName });
            } catch {
              setError('Could not abandon this project.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <SafeAreaView style={[layout.root, layout.centered]}><ActivityIndicator color={C.passion} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.passion} />

      <CelebrationPopup
        visible={!!xpResult}
        xpEarned={xpResult?.totalXpEarned}
        accentColor={C.passion}
        lines={(xpResult?.xpBreakdown || []).map(item => ({
          emoji: iconForLabel(item.label),
          text: `${item.label} +${item.amount}`,
        }))}
        onDismiss={() => setXpResult(null)}
      />

      <View style={header.passion}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={reportIssue} style={s.reportIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.reportIcon}>🚩</Text>
          </TouchableOpacity>
        </View>
        <Text style={header.titleLarge}>{active?.projectName ?? params.projectName}</Text>
        <Text style={header.subtitle}>{currentCount} of {targetCount} {unitLabel}s</Text>
        <View style={s.headerBar}><ProgressBar progress={progress} color={C.white} bg={C.passionLight} /></View>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb} showsVerticalScrollIndicator={false}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {active?.isComplete ? (
          <TouchableOpacity activeOpacity={0.85} style={[s.completeBanner, { borderColor: accent }]} onPress={goToCompletion}>
            <Text style={s.completeBannerEmoji}>🏆</Text>
            <View style={layout.fill}>
              <Text style={s.completeBannerTitle}>Project complete!</Text>
              <Text style={s.completeBannerSub}>View your final stats and shared content.</Text>
            </View>
            <Text style={s.completeBannerArrow}>›</Text>
          </TouchableOpacity>
        ) : null}

        <View style={[card.infoPassion, s.promptCard]}>
          <Text style={s.promptIcon}>💡</Text>
          <View style={layout.fill}>
            <Text style={s.promptLabel}>Current prompt</Text>
            <Text style={s.promptText}>
              {active?.currentPrompt || `Complete your next ${unitLabel} (Unit ${currentCount + 1} of ${targetCount})`}
            </Text>
          </View>
        </View>

        {active?.nextPrompt ? (
          <View style={[card.base, s.nextPromptCard]}>
            <Text style={s.nextPromptIcon}>👀</Text>
            <View style={layout.fill}>
              <Text style={s.nextPromptLabel}>Up next</Text>
              <Text style={s.nextPromptText}>{active.nextPrompt}</Text>
            </View>
          </View>
        ) : null}

        <View style={[card.hero, s.progressCard]}>
          <View style={s.circle}>
            <Text style={s.circleCount}>{currentCount}</Text>
            <Text style={s.circleTotal}>of {targetCount}</Text>
          </View>
          <Text style={s.progressTitle}>{unitLabel}s completed</Text>
          <ProgressBar progress={progress} color={C.passion} bg={C.passionLight} height={10} />
        </View>

        {cooldownMs > 0 ? (
          <View style={s.cooldown}>
            <Text style={s.cooldownText}>Next log unlocks in {formatTime(cooldownMs)}</Text>
            <Text style={s.cooldownHint}>Keep writing — you can prepare both prompts above while you wait.</Text>
          </View>
        ) : null}

        {!active?.isComplete ? (
          <View style={s.actions}>
            <PrimaryButton
              label={cooldownMs > 0 ? `Log in ${formatTime(cooldownMs)}` : 'Log Session'}
              onPress={() => setModalVisible(true)}
              disabled={cooldownMs > 0}
              color={C.passion}
              style={s.actionBtn}
            />
          </View>
        ) : null}

        <Text style={s.sectionTitle}>Recent Sessions</Text>
        {(active?.recentSessions || []).length ? (
          active.recentSessions.map(item => <SessionRow key={item.id} session={item} unitLabel={unitLabel} />)
        ) : (
          <View style={s.emptySessions}><Text style={s.emptyText}>No sessions yet. Log one when you practise.</Text></View>
        )}
      </ScrollView>

      <View style={s.abandonWrap}>
        <TouchableOpacity style={s.unenrollBtn} onPress={confirmAbandon}>
          <Text style={s.unenrollBtnText}>Abandon project</Text>
        </TouchableOpacity>
      </View>

      <VibePickerModal
        visible={modalVisible}
        progressId={params.progressId}
        skillName={active?.projectName ?? params.projectName}
        unitLabel={unitLabel}
        currentCount={currentCount}
        targetCount={targetCount}
        currentPrompt={active?.currentPrompt}
        nextPrompt={active?.nextPrompt}
        onClose={() => setModalVisible(false)}
        onLogged={(result) => {
          setModalVisible(false);
          setXpResult(result);
          fetchActive();

          if (result.projectJustCompleted) {
            setTimeout(() => {
              setXpResult(null);
              goToCompletion();
            }, 3200);
          }
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  reportIcon: { fontSize: 14 },
  headerBar: { marginTop: 16 },
  errorBox: { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 14 },
  errorText: { color: C.error, fontSize: F.base },
  completeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.passionLight, borderRadius: R.xl, padding: 16,
    borderWidth: 1, marginBottom: 16,
  },
  completeBannerEmoji: { fontSize: 30 },
  completeBannerTitle: { fontSize: F.md, fontWeight: '800', color: C.passion },
  completeBannerSub: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 2 },
  completeBannerArrow: { fontSize: F.xl, color: C.passion, fontWeight: '800' },
  promptCard: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  promptIcon: { fontSize: 26 },
  promptLabel: { fontSize: F.sm, color: C.passion, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  promptText: { fontSize: F.md, color: C.onSurface, lineHeight: 23, marginTop: 4, fontWeight: '600' },
  nextPromptCard: { flexDirection: 'row', gap: 12, marginBottom: 16, opacity: 0.75 },
  nextPromptIcon: { fontSize: 22 },
  nextPromptLabel: { fontSize: F.xs, color: C.onSurfaceVariant, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  nextPromptText: { fontSize: F.sm, color: C.onSurfaceVariant, lineHeight: 19, marginTop: 3 },
  progressCard: { alignItems: 'center', marginBottom: 16 },
  circle: { width: 132, height: 132, borderRadius: 66, backgroundColor: C.passionLight, borderWidth: 10, borderColor: C.passion, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  circleCount: { fontSize: 42, color: C.passion, fontWeight: '900' },
  circleTotal: { fontSize: F.base, color: C.onSurfaceVariant, fontWeight: '700' },
  progressTitle: { fontSize: F.md, color: C.onSurface, fontWeight: '800', marginBottom: 12 },
  cooldown: { backgroundColor: C.almostThereLight, borderRadius: R.lg, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.almostThere },
  cooldownText: { color: C.onSurface, fontSize: F.base, fontWeight: '700', textAlign: 'center' },
  cooldownHint: { color: C.onSurfaceVariant, fontSize: F.xs, textAlign: 'center', marginTop: 4 },
  actions: { gap: 12, marginBottom: 22 },
  actionBtn: { height: 52 },
  sectionTitle: { fontSize: F.lg, color: C.onSurface, fontWeight: '800', marginBottom: 12 },
  emptySessions: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 18 },
  emptyText: { color: C.onSurfaceVariant, textAlign: 'center', fontSize: F.base },
  abandonWrap: { padding: 12, alignItems: 'center' },
  unenrollBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: R.full, backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.outlineVariant },
  unenrollBtnText: { color: C.onSurfaceVariant, fontSize: F.xs, fontWeight: '700' },
});