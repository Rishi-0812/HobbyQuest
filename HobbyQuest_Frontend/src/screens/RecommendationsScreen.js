// src/screens/RecommendationsScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, header, text, card, badge } from '../styles';
import { PrimaryButton, GhostButton } from '../components/components';
import api from '../services/api';
import SlideToast from '../components/SlideToast';
import { getHobbyEmoji } from '../constants/hobbyEmojis';

function PreviewModal({ hobby, visible, onClose, onEnrolled }) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => { setEnrolled(false); }, [hobby?.id]);

  if (!hobby) return null;

  const isStructured = hobby.type === 'structured';
  const accentColor = isStructured ? C.indigo : C.passion;
  const accentLight = isStructured ? C.indigoLight : C.passionLight;

  async function handleEnrol() {
    setEnrolling(true);
    try {
      await api.post(`/hobbies/${hobby.id}/enrol`);
      setEnrolled(true);
      onEnrolled?.(hobby);
    } catch {
      setEnrolled(true);
      onEnrolled?.(hobby);
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />

          <View style={[pm.iconWrap, { backgroundColor: accentLight }]}>
            <Text style={pm.iconEmoji}>{getHobbyEmoji(hobby)}</Text>
          </View>

          <Text style={pm.hobbyName}>{hobby.name}</Text>
          <View style={pm.badgeRow}>
            <View style={[badge.base, { backgroundColor: accentLight }]}>
              <Text style={[badge.text, { color: accentColor }]}>
                {isStructured ? '🗺️ Structured' : '🎨 Passion'}
              </Text>
            </View>
            <View style={[badge.base, { backgroundColor: C.surfaceContainerHigh }]}>
              <Text style={[badge.text, { color: C.onSurfaceVariant }]}>{hobby.difficulty}</Text>
            </View>
          </View>

          <Text style={pm.desc}>{hobby.description}</Text>

          {/* Full tag list here — hero card only shows a preview slice, so this is genuinely more info, not a repeat */}
          <View style={pm.tags}>
            {(hobby.tags || []).map(t => (
              <View key={t} style={[badge.base, { backgroundColor: accentLight }]}>
                <Text style={[badge.text, { color: accentColor }]}>{t}</Text>
              </View>
            ))}
          </View>

          {enrolled ? (
            <View style={pm.enrolledBox}>
              <Text style={pm.enrolledText}>✓ You're enrolled in {hobby.name}</Text>
            </View>
          ) : (
            <PrimaryButton
              label={`Enrol in ${hobby.name}`}
              onPress={handleEnrol}
              loading={enrolling}
              color={accentColor}
              style={{ marginTop: 8 }}
            />
          )}

          <TouchableOpacity onPress={onClose} style={pm.closeLink}>
            <Text style={pm.closeLinkText}>{enrolled ? 'Back to recommendations' : 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surfaceLowest, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, marginBottom: 20 },
  iconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconEmoji: { fontSize: 32 },
  hobbyName: { fontSize: F.xl, fontWeight: '800', color: C.primary, marginBottom: 8, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  desc: { fontSize: F.base, color: C.onSurfaceVariant, lineHeight: 22, marginBottom: 14, textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 },
  enrolledBox: { width: '100%', backgroundColor: C.tealLight, borderRadius: R.lg, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: C.teal },
  enrolledText: { fontSize: F.base, fontWeight: '700', color: C.teal },
  closeLink: { paddingTop: 16 },
  closeLinkText: { fontSize: F.base, color: C.onSurfaceVariant },
});

export default function RecommendationsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchRecommendations(); }, []);

  async function fetchRecommendations() {
    try {
      const { data: res } = await api.get('/hobbies/recommendations');
      setData(res);
    } catch {
      setError('Could not load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Single ranked pool — hero is just "whichever one is currently first"
  const pool = useMemo(() => {
    if (!data) return [];
    return [...(data.structured || []), ...(data.passion || [])];
  }, [data]);

  const heroHobby = pool[heroIndex] || null;
  const secondary = useMemo(
    () => pool.filter((_, i) => i !== heroIndex).slice(0, 4),
    [pool, heroIndex]
  );

  function openPreview(hobby) {
    setSelected(hobby);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setSelected(null);
  }

  function handleEnrolled(hobby) {
    setToast(`Enrolled in ${hobby.name}`);
  }

  // "Not for me" — pure rejection, cycles the hero in place, no modal involved
  function skipHero() {
    setHeroIndex(i => (i + 1 < pool.length ? i + 1 : 0));
  }

  if (loading) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <ActivityIndicator size="large" color={C.primaryContainer} />
        <Text style={[text.muted, { marginTop: 12 }]}>Finding your matches...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />

      <SlideToast visible={!!toast} message={toast} emoji="🎉" color={C.primaryContainer} />

      <View style={header.navy}>
        <Text style={s.headerTitle}>Picked for you</Text>
        <Text style={s.headerSubtitle}>Based on what you told us in onboarding</Text>
      </View>

      <ScrollView style={layout.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        ) : null}

        {heroHobby ? (
          <View style={card.hero}>
            <View style={s.heroTop}>
              <View style={[s.heroIconWrap, { backgroundColor: heroHobby.type === 'structured' ? C.indigoLight : C.passionLight }]}>
                <Text style={s.heroIcon}>{getHobbyEmoji(heroHobby)}</Text>
              </View>
              <Text style={s.heroName} numberOfLines={1}>{heroHobby.name}</Text>
              <View style={s.matchPill}>
                <Text style={s.matchPillText}>Strong match</Text>
              </View>
            </View>

            <Text style={s.heroDesc} numberOfLines={3}>{heroHobby.description}</Text>

            <View style={s.heroTags}>
              {(heroHobby.tags || []).slice(0, 3).map(t => (
                <View key={t} style={s.heroTag}><Text style={s.heroTagText}>{t}</Text></View>
              ))}
            </View>

            <PrimaryButton
              label="Explore this hobby →"
              onPress={() => openPreview(heroHobby)}
              color={heroHobby.type === 'structured' ? C.indigo : C.passion}
            />
            <TouchableOpacity onPress={skipHero} style={s.notForMe}>
              <Text style={s.notForMeText}>Not for me — show another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.errorBox}><Text style={s.errorText}>No recommendations available yet.</Text></View>
        )}

        {secondary.length > 0 ? (
          <View style={s.secondarySection}>
            <Text style={s.secondaryLabel}>ALSO WORTH EXPLORING</Text>
            {secondary.map(h => (
              <TouchableOpacity key={h.id} onPress={() => openPreview(h)} activeOpacity={0.82} style={sc.card}>
                <View style={[sc.iconWrap, { backgroundColor: h.type === 'structured' ? C.indigoLight : C.passionLight }]}>
                  <Text style={sc.icon}>{getHobbyEmoji(h)}</Text>
                </View>
                <View style={sc.info}>
                  <Text style={sc.name}>{h.name}</Text>
                  <Text style={[sc.type, { color: h.type === 'structured' ? C.indigo : C.passion }]}>
                    {h.type === 'structured' ? 'Structured' : 'Passion'}
                  </Text>
                </View>
                <Text style={[sc.preview, { color: h.type === 'structured' ? C.indigo : C.passion }]}>Preview →</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <GhostButton
          label="Browse all hobbies"
          onPress={() => navigation.navigate('AppTabs', { screen: 'Browse' })}
          color={C.primaryContainer}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity onPress={() => navigation.replace('AppTabs')} style={s.skipDash}>
          <Text style={s.skipDashText}>Go to dashboard →</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <PreviewModal hobby={selected} visible={modalVisible} onClose={closeModal} onEnrolled={handleEnrolled} />
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceLowest, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 10, ...SHADOW.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: F.base, fontWeight: '700', color: C.primary },
  type: { fontSize: F.xs, fontWeight: '600', marginTop: 2 },
  preview: { fontSize: F.sm, fontWeight: '700' },
});

const s = StyleSheet.create({
  headerTitle: { fontSize: F.xxl, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: F.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },
  errorBox: { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 14, marginTop: 16 },
  errorText: { color: '#93000A', fontSize: F.base },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: -8 },
  heroIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 24 },
  heroName: { flex: 1, fontSize: F.xl, fontWeight: '700', color: C.primary },
  matchPill: { backgroundColor: C.indigo, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  matchPillText: { color: C.white, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroDesc: { fontSize: F.base, color: C.onSurfaceVariant, lineHeight: 22, marginBottom: 14 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  heroTag: { backgroundColor: C.secondaryFixed, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.lg },
  heroTagText: { fontSize: F.sm, fontWeight: '600', color: C.indigo },
  notForMe: { alignItems: 'center', paddingTop: 14 },
  notForMeText: { fontSize: F.sm, color: C.onSurfaceVariant, fontWeight: '600' },
  secondarySection: { marginTop: 28, marginBottom: 8 },
  secondaryLabel: { fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  skipDash: { alignItems: 'center', paddingTop: 16 },
  skipDashText: { fontSize: F.base, color: C.onSurfaceVariant },
});