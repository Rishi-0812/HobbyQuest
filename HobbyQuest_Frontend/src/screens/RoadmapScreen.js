// src/screens/RoadmapScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, header as H, text, empty } from '../styles';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';
import api from '../services/api';
import SlideToast from '../components/SlideToast';

const LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Mastery'];

const STATUS_CFG = {
  locked:       { icon: '🔒', color: C.locked,      bg: C.surfaceContainer,  border: C.outlineVariant },
  learning:     { icon: '📖', color: C.learning,     bg: C.purpleLight,       border: C.learning + '50' },
  almost_there: { icon: '⚡', color: C.almostThere,  bg: C.almostThereLight,  border: C.almostThere + '60' },
  completed:    { icon: '✅', color: C.completed,    bg: C.tealLight,         border: C.completed + '50' },
};

function ProgressBar({ progress = 0, color = C.secondary, height = 6, bg }) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: bg || C.outlineVariant, overflow: 'hidden' }}>
      <View style={{ height, width: `${clamped * 100}%`, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

function SkillRow({ skill, onPress, isLast }) {
  const cfg      = STATUS_CFG[skill.status] || STATUS_CFG.locked;
  const isLocked = skill.status === 'locked';

  if (isLocked) {
    return (
      <View style={rs.rowWrap}>
        <View style={rs.connector}>
          <View style={[rs.dot, { backgroundColor: C.outlineVariant }]} />
          {!isLast && <View style={[rs.line, { backgroundColor: C.outlineVariant }]} />}
        </View>
        <View style={rs.lockedCard}>
          <View style={rs.lockedIconWrap}>
            <Text style={rs.lockedIcon}>🔒</Text>
          </View>
          <Text style={rs.lockedName} numberOfLines={1}>{skill.name}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(skill)}
      activeOpacity={0.75}
      style={rs.rowWrap}
    >
      <View style={rs.connector}>
        <View style={[rs.dot, { backgroundColor: cfg.color }]} />
        {!isLast && <View style={[rs.line, { backgroundColor: cfg.color + '40' }]} />}
      </View>

      <View style={[rs.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <View style={rs.cardTop}>
          <Text style={rs.statusIcon}>{cfg.icon}</Text>
          <View style={rs.nameWrap}>
            <Text style={rs.skillName} numberOfLines={1}>{skill.name}</Text>
            <Text style={rs.attempts}>
              {skill.attempt_count} session{skill.attempt_count !== 1 ? 's' : ''} logged
            </Text>
          </View>
          <View style={[rs.badge, { backgroundColor: cfg.color }]}>
            <Text style={rs.badgeText}>{skill.order_index}</Text>
          </View>
        </View>

        <View style={rs.cardBottom}>
          <Text style={[rs.statusLabel, { color: cfg.color }]}>
            {skill.status === 'almost_there' ? 'Almost there'
             : skill.status === 'completed'   ? 'Completed'
             : 'Learning'}
          </Text>
          {skill.status === 'almost_there' && (
            <Text style={rs.upgradeHint}>Log Nailed It → auto-complete ›</Text>
          )}
          {skill.status === 'completed' && (
            <Text style={[rs.upgradeHint, { color: C.completed }]}>+{skill.xp_reward ?? 50} XP earned</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Compact locked-level notice — replaces the old oversized empty.wrap box
function LockedLevelNotice({ previousLevel, targetLevel }) {
  return (
    <View style={ln.wrap}>
      <View style={ln.iconCircle}><Text style={ln.icon}>🔒</Text></View>
      <View style={ln.textWrap}>
        <Text style={ln.title}>{targetLevel} is locked</Text>
        <Text style={ln.subtitle}>Complete all {previousLevel || 'previous'} skills to unlock it</Text>
      </View>
    </View>
  );
}
const ln = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surfaceContainerLow, borderRadius: R.xl,
    padding: 16, borderWidth: 1, borderColor: C.outlineVariant,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  title: { fontSize: F.base, fontWeight: '800', color: C.onSurface },
  subtitle: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
});

const STATUS_MAP = { AVAILABLE: 'learning', LEARNING: 'learning', ALMOST_THERE: 'almost_there', COMPLETED: 'completed', LOCKED: 'locked' };

function normalise(data, fallbackName) {
  const levelsObj = {};
  let totalSkills = 0, completedSkills = 0;

  for (const lvl of (data.levels || [])) {
    const skills = (lvl.skills || []).map(s => ({
      id: s.skillId, name: s.name, status: STATUS_MAP[s.status] ?? 'locked',
      order_index: s.orderIndex, attempt_count: s.attemptCount ?? 0, xp_reward: s.xpReward ?? 50,
    }));
    const completed = lvl.completedCount ?? skills.filter(s => s.status === 'completed').length;
    const total = lvl.totalCount ?? skills.length;
    levelsObj[lvl.level] = { progress: total > 0 ? completed / total : 0, skills };
    totalSkills += total;
    completedSkills += completed;
  }

  return {
    hobby: { name: data.hobby?.name ?? fallbackName ?? 'Roadmap', emoji: data.hobby?.emoji ?? '', type: data.hobby?.type ?? 'structured' },
    totalSkills, completedSkills,
    overallProgress: totalSkills > 0 ? completedSkills / totalSkills : 0,
    levels: levelsObj,
  };
}

function LevelTab({ level, isActive, isUnlocked, progress, accent, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[lt.tab, isActive && { backgroundColor: accent + '22' }]} activeOpacity={0.75}>
      <Text style={[lt.label, isActive && { color: accent, fontWeight: '700' }]}>{!isUnlocked && '🔒 '}{level}</Text>
      {isActive && progress !== undefined && <Text style={[lt.pct, { color: accent }]}>{Math.round(progress * 100)}%</Text>}
    </TouchableOpacity>
  );
}

export default function RoadmapScreen({ route, navigation }) {
  const { hobbyId, hobbyName: routeHobbyName } = route.params || {};

  const [roadmap, setRoadmap] = useState(null);
  const [activeLevel, setActiveLevel] = useState('Basic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const accent = getHobbyAccent(hobbyId);

  const fetchRoadmap = useCallback(async () => {
    if (!hobbyId) { setError('No hobby selected.'); setLoading(false); return; }
    try {
      const { data } = await api.get(`/hobbies/${hobbyId}/roadmap`);
      const normalised = normalise(data, routeHobbyName);
      setRoadmap(normalised);
      const inProgress = LEVELS.find(lvl => {
        const ld = normalised.levels?.[lvl];
        return ld && ld.progress < 1 && ld.skills?.some(s => s.status !== 'locked');
      });
      if (inProgress) setActiveLevel(inProgress);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load roadmap.');
    } finally {
      setLoading(false);
    }
  }, [hobbyId]);

  useEffect(() => {
    fetchRoadmap();
    const unsubscribe = navigation.addListener('focus', fetchRoadmap);
    return unsubscribe;
  }, [navigation, fetchRoadmap]);

  function reportIssue() {
    navigation.navigate('Feedback', {
  prefillType: 'bug',
  prefillHobbyName: hobbyLabel, // add this
  prefillMessage: `Issue with the "${hobbyLabel}" roadmap: `,
});
  }

  function confirmUnenroll() {
    Alert.alert(
      'Unenrol from this hobby?',
      'Your progress will be kept in case you come back — you just won\'t see this hobby on your active list anymore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenrol', style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/hobbies/${hobbyId}/unenrol`);
              setToast(`Unenrolled from ${hobbyLabel}`);
              setTimeout(() => navigation.navigate('AppTabs', { screen: 'Dashboard' }), 900);
            } catch (err) {
              setError(err.response?.data?.message || 'Could not unenrol.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo} />
        <ActivityIndicator size="large" color={C.indigo} />
        <Text style={[text.muted, { marginTop: 12 }]}>Loading roadmap…</Text>
      </SafeAreaView>
    );
  }

  if (error || !roadmap) {
    return (
      <SafeAreaView style={layout.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo} />
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={H.backLink}>← Back</Text></TouchableOpacity>
        </View>
        <View style={layout.centered}>
          <Text style={empty.emoji}>😕</Text>
          <Text style={empty.title}>Could not load roadmap</Text>
          <Text style={empty.subtitle}>{error}</Text>
          <TouchableOpacity onPress={fetchRoadmap} style={styles.retryBtn}><Text style={styles.retryBtnText}>Try again</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hobbyEmoji = getHobbyEmoji({ emoji: roadmap.hobby?.emoji, name: roadmap.hobby?.name || routeHobbyName });
  const hobbyLabel = roadmap.hobby?.name || routeHobbyName || 'Roadmap';
  const levelData = roadmap.levels?.[activeLevel] || { progress: 0, skills: [] };
  const completedSkills = roadmap.completedSkills ?? 0;
  const totalSkills = roadmap.totalSkills ?? 0;
  const overallProgress = totalSkills > 0 ? completedSkills / totalSkills : 0;
  const activeIdx = LEVELS.indexOf(activeLevel);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.indigo} />
      <SlideToast visible={!!toast} message={toast} emoji="👋" color={C.indigo} />

      <View style={styles.hobbyHeader}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reportIssue} style={styles.reportIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.reportIcon}>🚩</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hobbyRow}>
          <View style={[styles.hobbyIconWrap, { borderColor: accent + '90' }]}>
            <Text style={styles.hobbyIconEmoji}>{hobbyEmoji}</Text>
          </View>
          <View style={styles.hobbyInfo}>
            <Text style={styles.hobbyName}>{hobbyLabel}</Text>
            <Text style={styles.hobbySubtitle}>{completedSkills} of {totalSkills} skills completed</Text>
          </View>
        </View>

        <View style={styles.overallProgressWrap}>
          <ProgressBar progress={overallProgress} color={C.secondaryContainer} height={6} bg="rgba(255,255,255,0.2)" />
          <Text style={styles.overallPct}>{Math.round(overallProgress * 100)}% complete</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsInner}>
          {LEVELS.map((level, idx) => {
            const prevLevel = idx > 0 ? LEVELS[idx - 1] : null;
            const prevData = prevLevel ? roadmap.levels?.[prevLevel] : null;
            const isUnlocked = idx === 0 || (prevData && prevData.progress >= 1);
            const lvData = roadmap.levels?.[level] || { progress: 0 };
            return (
              <LevelTab key={level} level={level} isActive={activeLevel === level} isUnlocked={isUnlocked}
                progress={lvData.progress} accent={accent} onPress={() => setActiveLevel(level)} />
            );
          })}
        </ScrollView>
        <View style={styles.levelProgressStrip}>
          <ProgressBar progress={levelData.progress} color={accent} height={3} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {levelData.skills.length === 0 ? (
          <LockedLevelNotice previousLevel={LEVELS[activeIdx - 1]} targetLevel={activeLevel} />
        ) : (
          levelData.skills.map((skill, i) => (
            <SkillRow key={skill.id} skill={skill} isLast={i === levelData.skills.length - 1}
              onPress={s => navigation.navigate('SkillDetail', { skillId: s.id, skillName: s.name, hobbyId, hobbyName: hobbyLabel })} />
          ))
        )}

        <TouchableOpacity style={styles.unenrollBtn} onPress={confirmUnenroll}>
          <Text style={styles.unenrollBtnText}>Unenrol from this hobby</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const lt = StyleSheet.create({
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full, alignItems: 'center', marginHorizontal: 2 },
  label: { fontSize: F.sm, fontWeight: '600', color: C.onSurfaceVariant },
  pct: { fontSize: F.xs, fontWeight: '700', marginTop: 1 },
});

const rs = StyleSheet.create({
  rowWrap: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  rowLocked: { opacity: 0.5 },
  connector: { width: 20, alignItems: 'center', paddingTop: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  line: { width: 2, flex: 1, marginTop: 2, minHeight: 20 },
  card: { flex: 1, borderRadius: R.xl, padding: 14, borderWidth: 1.5, marginBottom: 12, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { fontSize: 20 },
  nameWrap: { flex: 1 },
  skillName: { fontSize: F.base, fontWeight: '700', color: C.textPrimary },
  skillNameLocked: { color: C.textTertiary },
  attempts: { fontSize: F.xs, color: C.textSecondary, marginTop: 2 },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: F.xs, fontWeight: '800', color: C.white },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: F.xs, fontWeight: '700' },
  upgradeHint: { fontSize: F.xs, color: C.textSecondary },
  lockedCard: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: C.surfaceContainerLow,
  borderRadius: R.xl,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: C.outlineVariant,
},
lockedIconWrap: {
  width: 32, height: 32, borderRadius: 16,
  backgroundColor: C.surfaceContainerHigh,
  alignItems: 'center', justifyContent: 'center',
},
lockedIcon: { fontSize: 14, opacity: 0.6 },
lockedName: { flex: 1, fontSize: F.base, fontWeight: '600', color: C.textTertiary },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  hobbyHeader: { backgroundColor: C.indigo, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 20, paddingBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: F.sm },
  reportIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  reportIcon: { fontSize: 14 },
  hobbyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  hobbyIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  hobbyIconEmoji: { fontSize: 24 },
  hobbyInfo: { flex: 1 },
  hobbyName: { fontSize: F.lg, fontWeight: '800', color: C.white },
  hobbySubtitle: { fontSize: F.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  overallProgressWrap: { gap: 4 },
  overallPct: { fontSize: F.xs, color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  tabsWrap: { backgroundColor: C.surfaceLowest, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  tabsInner: { paddingHorizontal: 12, paddingVertical: 6, gap: 2 },
  levelProgressStrip: { paddingHorizontal: 16, paddingBottom: 6 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },
  errorHeader: { backgroundColor: C.indigo, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 20, paddingBottom: 16 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.indigo, borderRadius: R.lg },
  retryBtnText: { color: C.white, fontWeight: '700', fontSize: F.base },

  // Smaller, self-contained pill instead of a full-width bar — sits in-flow
  // at the bottom of the skill list, not floating over content.
  unenrollBtn: {
    alignSelf: 'center', marginTop: 24,
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  unenrollBtnText: { color: C.onSurfaceVariant, fontSize: F.xs, fontWeight: '700' },
});