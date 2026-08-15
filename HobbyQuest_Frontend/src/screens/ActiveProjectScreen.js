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

const VIBE_LABEL = {
  NAILED_IT: 'Nailed it',
  GETTING_THE_HANG_OF_IT: 'Making progress',
  STRUGGLING: 'Struggled',
};

const VIBE_EMOJI = {
  NAILED_IT: '🎯',
  GETTING_THE_HANG_OF_IT: '🙂',
  STRUGGLING: '😤',
};

const VIBE_CFG = {
  NAILED_IT:              { emoji: '🎯', label: 'Nailed it',     color: C.teal,        border: C.teal },
  GETTING_THE_HANG_OF_IT: { emoji: '🙂', label: 'Making progress', color: '#E67E22',     border: '#E67E22' },
  STRUGGLING:             { emoji: '😤', label: 'Struggled',     color: C.admin,       border: C.admin },
};
function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

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

export default function ActiveProjectScreen({ route, navigation }) {
  const params = route.params;
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [error, setError] = useState('');
  const [xpResult, setXpResult] = useState(null);

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

  function confirmAbandon() {
    Alert.alert(
      'Abandon this project?',
      'Abandoning will stop tracking this project as active for you. Your past sessions and XP are kept. Are you sure you want to abandon it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Abandon', style: 'destructive', onPress: async () => {
            try {
              setBusy(true);
              await api.patch(`/user/projects/${params.progressId}/abandon`);
              navigation.navigate('PassionHome', { hobbyId: params.hobbyId, hobbyName: params.hobbyName });
            } catch {
              setError('Could not abandon this project.');
            } finally {
              setBusy(false);
            }
        } },
      ]
    );
  }

  if (loading) {
    return <SafeAreaView style={[layout.root, layout.centered]}><ActivityIndicator color={C.passion} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.passion} />

      {xpResult && (
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
      )}
      <View style={header.passion}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
        <Text style={header.titleLarge}>{active?.projectName ?? params.projectName}</Text>
        <Text style={header.subtitle}>{currentCount} of {targetCount} {unitLabel}s</Text>
        <View style={s.headerBar}><ProgressBar progress={progress} color={C.white} bg={C.passionLight} /></View>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb} showsVerticalScrollIndicator={false}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {active?.isComplete ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.completeBanner}
            onPress={() => navigation.navigate('ProjectCompletion', {
              progressId: params.progressId,
              projectName: active?.projectName ?? params.projectName,
              unitLabel,
              totalUnits: targetCount,
              hobbyId: params.hobbyId,
              hobbyName: params.hobbyName,
            })}
          >
            <Text style={s.completeBannerEmoji}>🏆</Text>
            <View style={layout.fill}>
              <Text style={s.completeBannerTitle}>Project complete!</Text>
              <Text style={s.completeBannerSub}>Tap to view your stats and share your win</Text>
            </View>
            <Text style={s.completeBannerArrow}>›</Text>
          </TouchableOpacity>
        ) : null}

        {/* Current prompt */}
        <View style={[card.infoPassion, s.promptCard]}>
          <Text style={s.promptIcon}>💡</Text>
          <View style={layout.fill}>
            <Text style={s.promptLabel}>Current prompt</Text>
            <Text style={s.promptText}>
              {active?.currentPrompt || `Complete your next ${unitLabel} (Unit ${currentCount + 1} of ${targetCount})`}
            </Text>
          </View>
        </View>

        {/* Next prompt — preview only, not yet active */}
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
          active.recentSessions.map(item => <SessionRow key={item.id} session={item} />)
        ) : (
          <View style={s.emptySessions}><Text style={s.emptyText}>No sessions yet. Log one when you practise.</Text></View>
        )}
      </ScrollView>

      <View style={s.abandonWrap}>
        <TouchableOpacity onPress={() => confirmAbandon()}>
          <Text style={s.abandonText}>Abandon project</Text>
        </TouchableOpacity>
      </View>

      <VibePickerModal
        visible={modalVisible}
        progressId={params.progressId}
        skillName={active?.projectName ?? params.projectName}
        unitLabel={unitLabel}
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
              navigation.navigate('ProjectCompletion', {
                progressId: params.progressId,
                projectName: active?.projectName ?? params.projectName,
                unitLabel,
                totalUnits: targetCount,
                hobbyId: params.hobbyId,
                hobbyName: params.hobbyName,
              });
            }, 3200); // gives the popup a moment to actually be read before navigating away
          }
          // No auto-dismiss otherwise — CelebrationPopup only closes on tap / "Nice!" now.
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerBar: { marginTop: 16 },
  errorBox: { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 14 },
  errorText: { color: C.error, fontSize: F.base },
  completeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.passionLight, borderRadius: R.xl, padding: 16,
    borderWidth: 1, borderColor: C.passion, marginBottom: 16,
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
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceLowest, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 10, ...SHADOW.sm },
  sessionEmoji: { fontSize: 24 },
  sessionTitle: { fontSize: F.base, color: C.onSurface, fontWeight: '800' },
  sessionNote: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 2 },
  sessionXp: { fontSize: F.sm, color: C.teal, fontWeight: '800' },
  emptySessions: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 18 },
  emptyText: { color: C.onSurfaceVariant, textAlign: 'center', fontSize: F.base },
  abandonWrap: { padding: 12, alignItems: 'center' },
  abandonText: { color: C.onSurfaceVariant, fontSize: F.sm, textDecorationLine: 'underline' },
  highlights: { fontSize: F.xs, color: C.teal, marginTop: 3, fontWeight: '600' }
});

const xpb = StyleSheet.create({
  wrap:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: 16 },
  inner:   { backgroundColor: C.passion, borderRadius: R.xl, padding: 16, alignItems: 'center', ...SHADOW.lg },
  main:    { fontSize: F.xxl, fontWeight: '800', color: C.white },
  sub:     { fontSize: F.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  dismiss: { fontSize: F.xs, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
});