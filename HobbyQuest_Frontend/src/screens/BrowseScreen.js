// BrowseScreen
// API: GET /hobbies?type=structured|passion, POST /hobbies/{id}/enrol
// Layout: navy header, search, filter chips, tappable hobby catalogue cards.

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, header, badge } from '../styles';
import { PrimaryButton } from '../components/components';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';
import SlideToast from '../components/SlideToast';

export default function BrowseScreen({ navigation }) {
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentCounts, setEnrollmentCounts] = useState({ structured: 0, passion: 0 });
  const [toast, setToast] = useState(null);

  async function fetchHobbies(nextType = type) {
    setLoading(true);
    try {
      const query = nextType === 'all' ? '' : `?type=${nextType}`;
      const { data } = await api.get(`/hobbies${query}`);
      setHobbies(Array.isArray(data) ? data : []);

      const { data: enrolled } = await api.get('/hobbies/enrolled');
      const counts = { structured: 0, passion: 0 };
      (enrolled || []).forEach(h => {
        if (h.type === 'structured') counts.structured++;
        else if (h.type === 'passion') counts.passion++;
      });
      setEnrollmentCounts(counts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHobbies('all'); }, []);

  const filtered = useMemo(() => hobbies.filter(h => h.name.toLowerCase().includes(search.toLowerCase())), [hobbies, search]);

  async function enrol(hobby) {
    if (hobby.enrolled) {
      if (hobby.type === 'passion') navigation.navigate('PassionHome', { hobbyId: hobby.id, hobbyName: hobby.name });
      else navigation.navigate('Roadmap', { hobbyId: hobby.id, hobbyName: hobby.name });
      return;
    }

    const isStructured = hobby.type === 'structured';
    const currentCount = isStructured ? enrollmentCounts.structured : enrollmentCounts.passion;
    const maxAllowed = isStructured ? 2 : 3;

    if (currentCount >= maxAllowed) {
      const message = isStructured
        ? 'You can enrol in a maximum of 2 structured hobbies. Complete one or abandon it before starting another.'
        : 'You can enrol in a maximum of 3 passion hobbies. Complete one or abandon it before starting another.';
      Alert.alert('Enrollment limit reached', message);
      return;
    }

    try {
      await api.post(`/hobbies/${hobby.id}/enrol`);
      setToast(`Enrolled in ${hobby.name}`);
      setTimeout(() => {
        if (hobby.type === 'passion') navigation.navigate('PassionHome', { hobbyId: hobby.id, hobbyName: hobby.name });
        else navigation.navigate('Roadmap', { hobbyId: hobby.id, hobbyName: hobby.name });
      }, 900);
    } catch (err) {
      Alert.alert('Enrollment failed', err.response?.data?.message || 'Could not enrol in this hobby');
    }
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />

      <SlideToast visible={!!toast} message={toast} emoji="🎉" color={C.primaryContainer} />

      <View style={header.navy}>
        <Text style={header.titleLarge}>Discover Hobbies</Text>
        <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search hobbies" placeholderTextColor={C.outline} />
        <View style={s.tabs}>
          {['all', 'structured', 'passion'].map(item => (
            <TouchableOpacity key={item} style={[s.tab, type === item && s.tabActive]} onPress={() => { setType(item); fetchHobbies(item); }}>
              <Text style={[s.tabText, type === item && s.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading ? <ActivityIndicator color={C.primaryContainer} style={s.loader} /> : (
        <ScrollView contentContainerStyle={layout.scrollContentPb}>
          {filtered.map(hobby => {
            const accent = getHobbyAccent(hobby.id);
            return (
              <View key={hobby.id} style={s.card}>
                <View style={[s.emojiWrap, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                  <Text style={s.emoji}>{getHobbyEmoji(hobby)}</Text>
                </View>
                <View style={layout.fill}>
                  <Text style={s.name}>{hobby.name}</Text>
                  <Text style={s.desc} numberOfLines={2}>{hobby.description}</Text>
                  <View style={s.badges}>
                    <View style={[badge.base, hobby.type === 'passion' ? badge.passion : badge.indigo]}><Text style={[badge.text, hobby.type === 'passion' ? badge.passionText : badge.indigoText]}>{hobby.type}</Text></View>
                    <View style={[badge.base, badge.navy]}><Text style={[badge.text, badge.navyText]}>{hobby.difficulty || 'Beginner'}</Text></View>
                  </View>
                </View>
                <PrimaryButton label={hobby.enrolled ? 'Open' : 'Enrol'} onPress={() => enrol(hobby)} color={hobby.type === 'passion' ? C.passion : C.indigo} style={s.openBtn} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  search: { height: 48, borderRadius: R.lg, backgroundColor: C.surfaceLowest, paddingHorizontal: 14, marginTop: 16, color: C.onSurface },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: C.white },
  tabText: { color: C.white, textTransform: 'capitalize', fontWeight: '800' },
  tabTextActive: { color: C.primaryContainer },
  loader: { marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 12, ...SHADOW.md },
  emojiWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emoji: { fontSize: 24 },
  name: { fontSize: F.md, color: C.onSurface, fontWeight: '900' },
  desc: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 3 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 8 },
  openBtn: { width: 78, height: 42 },
});