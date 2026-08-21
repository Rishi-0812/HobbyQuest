// src/screens/DashboardScreen.js
// Fetches real data from:
//   GET /user/dashboard  → XP, streak, level, activity heatmap, community highlights
//   GET /hobbies/enrolled → active hobby cards
// Navigates to RoadmapScreen for structured hobbies (Sprint 3)
// PassionHome for passion hobbies (Sprint 4)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW, getXPProgress } from '../theme';
import { layout, section, card, avatar } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';
import HelpModal from '../components/HelpModal';
import { HELP_CONTENT } from '../constants/helpContent';

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Activity heatmap — redesigned ──────────────────────────────────────────────
function ActivityHeatmap({ data = [] }) {
  const stats = useMemo(() => {
    const activeDays = data.filter(d => (d.count ?? 0) > 0).length;
    const thisWeek = data.slice(-7).reduce((sum, d) => sum + (d.count ?? 0), 0);

    let best = 0, running = 0;
    for (const d of data) {
      if ((d.count ?? 0) > 0) { running++; best = Math.max(best, running); }
      else running = 0;
    }
    return { activeDays, thisWeek, best };
  }, [data]);

  if (!data.length) {
    return (
      <View style={ah.emptyWrap}>
        <Text style={ah.emptyEmoji}>📊</Text>
        <Text style={ah.emptyText}>Log your first session to start building your activity history.</Text>
      </View>
    );
  }

  const weeks = [];
  for (let w = 0; w < 12; w++) weeks.push(data.slice(w * 7, w * 7 + 7));
  const maxCount = Math.max(...data.map(d => d.count ?? 0), 1);

  function cellColor(count) {
    if (!count) return C.surfaceContainerHigh;
    const pct = count / maxCount;
    if (pct < 0.25) return '#B7E4D0';
    if (pct < 0.5)  return '#5CC4A0';
    if (pct < 0.75) return '#0F9B74';
    return C.teal;
  }

  // Month label for each week column — only show when the month changes
  function monthLabelForWeek(weekIndex) {
    const firstDay = weeks[weekIndex]?.[0];
    if (!firstDay?.date) return '';
    const prevFirstDay = weeks[weekIndex - 1]?.[0];
    const month = new Date(firstDay.date).getMonth();
    if (weekIndex === 0) return MONTH_SHORT[month];
    const prevMonth = prevFirstDay?.date ? new Date(prevFirstDay.date).getMonth() : month;
    return month !== prevMonth ? MONTH_SHORT[month] : '';
  }

  return (
    <View>
      {/* Stats row */}
      <View style={ah.statsRow}>
        <View style={ah.statTile}>
          <Text style={ah.statValue}>{stats.activeDays}</Text>
          <Text style={ah.statLabel}>Active days</Text>
        </View>
        <View style={ah.statDivider} />
        <View style={ah.statTile}>
          <Text style={ah.statValue}>{stats.best}🔥</Text>
          <Text style={ah.statLabel}>Best streak</Text>
        </View>
        <View style={ah.statDivider} />
        <View style={ah.statTile}>
          <Text style={ah.statValue}>{stats.thisWeek}</Text>
          <Text style={ah.statLabel}>This week</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ah.scrollInner}>
        <View>
          {/* Month row */}
          <View style={ah.monthRow}>
            {weeks.map((_, wi) => (
              <Text key={wi} style={ah.monthLabel}>{monthLabelForWeek(wi)}</Text>
            ))}
          </View>

          <View style={ah.gridRow}>
            {/* Day labels */}
            <View style={ah.dayLabelsCol}>
              {DAY_LABELS.map((d, i) => (
                <Text key={i} style={ah.dayLabel}>{d}</Text>
              ))}
            </View>

            {/* Grid */}
            <View style={ah.grid}>
              {weeks.map((week, wi) => (
                <View key={wi} style={ah.col}>
                  {week.map((day, di) => (
                    <View key={wi + '-' + di} style={[ah.cell, { backgroundColor: cellColor(day.count) }]} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={ah.legend}>
        <Text style={ah.legendText}>Less</Text>
        {[C.surfaceContainerHigh, '#B7E4D0', '#5CC4A0', '#0F9B74', C.teal].map((c, i) => (
          <View key={i} style={[ah.cell, { backgroundColor: c }]} />
        ))}
        <Text style={ah.legendText}>More</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 12;
const CELL_GAP = 3;

const ah = StyleSheet.create({
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.tealLight, borderRadius: R.lg,
    paddingVertical: 12, marginBottom: 16,
  },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: F.lg, fontWeight: '900', color: C.teal },
  statLabel: { fontSize: 10, color: C.teal, fontWeight: '700', marginTop: 2, opacity: 0.8 },
  statDivider: { width: 1, height: 28, backgroundColor: C.teal, opacity: 0.25 },

  scrollInner: { paddingRight: 8 },
  monthRow: { flexDirection: 'row', marginLeft: 26, marginBottom: 4 },
  monthLabel: { width: CELL_SIZE + CELL_GAP, fontSize: 9, color: C.onSurfaceVariant, fontWeight: '600' },

  gridRow: { flexDirection: 'row' },
  dayLabelsCol: { width: 26, marginRight: 2 },
  dayLabel: { height: CELL_SIZE + CELL_GAP, fontSize: 9, color: C.onSurfaceVariant, lineHeight: CELL_SIZE + CELL_GAP },

  grid: { flexDirection: 'row', gap: CELL_GAP },
  col: { gap: CELL_GAP },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3 },

  legend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: C.outlineVariant,
  },
  legendText: { fontSize: 10, color: C.onSurfaceVariant, fontWeight: '600', marginHorizontal: 4 },

  emptyWrap: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: F.sm, color: C.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 20 },
});

// ── Hobby card ────────────────────────────────────────────────────────────────
function HobbyCard({ hobby, onPress }) {
  const isStructured = hobby.type === 'structured';
  const accentColor  = isStructured ? C.indigo  : C.passion;
  const accentLight  = isStructured ? C.indigoLight : C.passionLight;
  const ring = getHobbyAccent(hobby.id);

  return (
    <TouchableOpacity
      onPress={() => onPress(hobby)}
      activeOpacity={0.82}
      style={hc.card}
    >
      <View style={hc.topRow}>
        <View style={[hc.iconWrap, { backgroundColor: accentLight, borderColor: ring + '90' }]}>
          <Text style={{ fontSize: 22 }}>{getHobbyEmoji(hobby)}</Text>
        </View>
        <View style={hc.info}>
          <Text style={hc.name}>{hobby.name}</Text>
          <Text style={hc.type}>{isStructured ? '🗺️ Structured' : '🎨 Passion'}</Text>
        </View>
        <View style={[hc.badge, { backgroundColor: accentLight }]}>
          <Text style={[hc.badgeText, { color: accentColor }]}>
            {isStructured ? 'Roadmap' : 'Projects'}
          </Text>
        </View>
      </View>
      <Text style={hc.hint}>Tap to open →</Text>
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceLowest, borderRadius: R.lg,
    padding: 14, marginBottom: 10, borderWidth: 1,
    borderColor: C.outlineVariant, ...SHADOW.sm,
  },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  iconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  info:     { flex: 1 },
  name:     { fontSize: F.base, fontWeight: '700', color: C.onSurface },
  type:     { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  badge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  badgeText:{ fontSize: F.xs, fontWeight: '600' },
  hint:     { fontSize: F.xs, color: C.outline, textAlign: 'right' },
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const [dashData,   setDashData]   = useState(null);
  const [hobbies,    setHobbies]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const { data: enrolledData } = await api.get('/hobbies/enrolled');
      setHobbies(enrolledData);

      try {
        const { data: dash } = await api.get('/user/dashboard');
        setDashData(dash);
      } catch {
        setDashData({
          user:   { name: 'You', xp: 0, level: 1 },
          streak: 0,
          heatmapData: Array.from({ length: 84 }, (_, i) => ({
            date:  new Date(Date.now() - (83 - i) * 86400000).toISOString().split('T')[0],
            count: 0,
          })),
          communityHighlights: [],
        });
      }
    } catch (err) {
      setError('Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAll);
    return unsubscribe;
  }, [navigation, fetchAll]);

  function navigateToHobby(hobby) {
    if (hobby.type === 'structured') {
      navigation.navigate('Roadmap', { hobbyId: hobby.id, hobbyName: hobby.name });
    } else {
      navigation.navigate('PassionHome', { hobbyId: hobby.id, hobbyName: hobby.name });
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <ActivityIndicator size="large" color={C.primaryContainer} />
      </SafeAreaView>
    );
  }

  const xpInfo  = getXPProgress(dashData?.user?.xp ?? 0);
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? '☀️ Good morning'
                 : hour < 17 ? '👋 Hello'
                 : '🌙 Good evening';

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />

      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.userName}>{dashData?.user?.name ?? 'there'} 👋</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={() => setHelpVisible(true)} style={s.helpBtn}>
              <Text style={s.helpBtnText}>?</Text>
            </TouchableOpacity>
            <View style={s.streakBadge}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
              <Text style={s.streakNum}>{dashData?.streak ?? 0}</Text>
              <Text style={s.streakLabel}>day streak</Text>
            </View>
          </View>
        </View>

        <View style={s.xpCard}>
          <View style={s.xpRow}>
            <View style={s.levelPill}>
              <Text style={s.levelText}>Lv {xpInfo.level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.xpLabel}>{dashData?.user?.xp ?? 0} XP total</Text>
              <Text style={s.xpToNext}>{xpInfo.xpToNext} XP to next level</Text>
            </View>
            <Text style={s.xpPct}>{Math.round(xpInfo.progress * 100)}%</Text>
          </View>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${xpInfo.progress * 100}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        style={layout.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        ) : null}

        <View style={section.header}>
          <Text style={section.title}>Your hobbies</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Recommendations')}>
            <Text style={section.action}>Find more</Text>
          </TouchableOpacity>
        </View>

        {hobbies.length === 0 ? (
          <TouchableOpacity
            style={s.emptyHobbies}
            onPress={() => navigation.navigate('Recommendations')}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
            <Text style={s.emptyHobbiesTitle}>No hobbies yet</Text>
            <Text style={s.emptyHobbiesText}>Tap to find your first hobby →</Text>
          </TouchableOpacity>
        ) : (
          hobbies.map(h => (
            <HobbyCard key={h.id} hobby={h} onPress={navigateToHobby} />
          ))
        )}

        {/* Heatmap — now a distinct accented card, not a flat white box */}
        <View style={[section.header, { marginTop: 8 }]}>
          <Text style={section.title}>Activity — last 12 weeks</Text>
        </View>
        <View style={s.heatmapCard}>
          <View style={s.heatmapAccentStrip} />
          <View style={s.heatmapCardInner}>
            <ActivityHeatmap data={dashData?.heatmapData ?? []} />
          </View>
        </View>

        {dashData?.communityHighlights?.length > 0 && (
          <>
            <View style={[section.header, { marginTop: 16 }]}>
              <Text style={section.title}>Community</Text>
              <TouchableOpacity>
                <Text style={section.action}>See all</Text>
              </TouchableOpacity>
            </View>
            {dashData.communityHighlights.map(post => (
              <View key={post.id} style={[card.sm, { marginBottom: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={avatar.sm}>
                    <Text style={avatar.letter}>{post.user[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: F.sm, fontWeight: '700', color: C.onSurface }}>{post.user}</Text>
                    <Text style={{ fontSize: F.xs, color: C.onSurfaceVariant }}>{post.hobby}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: F.sm, color: C.onSurface }}>{post.text}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <HelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={HELP_CONTENT.dashboard.title}
        sections={HELP_CONTENT.dashboard.sections}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor:     C.primaryContainer,
    paddingHorizontal:   20,
    paddingTop:          16,
    paddingBottom:       24,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting:  { fontSize: F.sm, color: 'rgba(255,255,255,0.65)' },
  userName:  { fontSize: F.lg, fontWeight: '800', color: C.white, marginTop: 2 },
  streakBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  streakNum:   { fontSize: F.lg, fontWeight: '800', color: C.white },
  streakLabel: { fontSize: F.xs, color: 'rgba(255,255,255,0.6)' },
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: { color: C.white, fontWeight: '900', fontSize: F.base },

  xpCard:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: R.md, padding: 12 },
  xpRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  levelPill: { backgroundColor: C.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  levelText: { fontSize: F.sm, fontWeight: '700', color: C.white },
  xpLabel:   { fontSize: F.sm, fontWeight: '600', color: C.white },
  xpToNext:  { fontSize: F.xs, color: 'rgba(255,255,255,0.55)' },
  xpPct:     { fontSize: F.sm, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  xpTrack:   { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: R.full, overflow: 'hidden' },
  xpFill:    { height: 6, backgroundColor: C.secondary, borderRadius: R.full },

  scrollContent: { padding: 20 },

  errorBox:  { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 16 },
  errorText: { color: '#93000A', fontSize: F.base },

  emptyHobbies: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: C.outlineVariant,
    borderRadius: R.lg, padding: 32, alignItems: 'center', marginBottom: 10,
  },
  emptyHobbiesTitle: { fontSize: F.lg, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
  emptyHobbiesText:  { fontSize: F.base, color: '#2980B9', fontWeight: '600' },

  // Heatmap card — teal accent strip on top, distinguishing it from plain cards
  heatmapCard: {
    backgroundColor: C.surfaceLowest, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.outlineVariant,
    overflow: 'hidden', marginBottom: 8, ...SHADOW.md,
  },
  heatmapAccentStrip: { height: 5, backgroundColor: C.teal },
  heatmapCardInner: { padding: 16 },
});