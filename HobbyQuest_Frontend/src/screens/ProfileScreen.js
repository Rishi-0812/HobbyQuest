// ProfileScreen
// API: GET /user/dashboard, GET /hobbies/enrolled
// Layout: navy profile summary, XP/streak stats, enrolled hobbies, logout button.

import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, getXPProgress, SHADOW } from '../theme';
import { ProgressBar, PrimaryButton } from '../components/components';
import { layout, header, badge } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { AuthContext } from '../services/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/user/dashboard'), api.get('/hobbies/enrolled')])
      .then(([dash, enrolled]) => { setDashboard(dash.data); setHobbies(enrolled.data || []); })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      signOut();
    } catch {
      signOut(); // Still sign out locally even if server logout fails
    }
  }

  if (loading) return <SafeAreaView style={[layout.root, layout.centered]}><ActivityIndicator color={C.primaryContainer} /></SafeAreaView>;

  const user = dashboard?.user || {};
  const xp = getXPProgress(user.xp || 0);

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <Text style={header.titleLarge}>{user.name || 'Profile'}</Text>
        <Text style={header.subtitle}>Level {user.level || xp.level} • {user.xp || 0} XP</Text>
        <ProgressBar progress={xp.progress} color={C.secondary} bg={C.primaryFixedDim} />
      </View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={s.stats}>
          <View style={s.tile}><Text style={s.tileValue}>🔥 {dashboard?.streak || 0}</Text><Text style={s.tileLabel}>Current streak</Text></View>
          <View style={s.tile}><Text style={s.tileValue}>🏆 {dashboard?.longestStreak || 0}</Text><Text style={s.tileLabel}>Longest streak</Text></View>
          <View style={s.tile}><Text style={s.tileValue}>{dashboard?.freezeAvailable ? '❄️ Held' : 'No freeze'}</Text><Text style={s.tileLabel}>Freeze</Text></View>
        </View>
        <Text style={s.sectionTitle}>Enrolled hobbies</Text>
        {hobbies.map(hobby => (
          <View key={hobby.id} style={s.hobbyRow}>
            <Text style={s.hobbyEmoji}>{getHobbyEmoji(hobby.name)}</Text>
            <View style={layout.fill}>
              <Text style={s.hobbyName}>{hobby.name}</Text>
              <View style={[badge.base, hobby.type === 'passion' ? badge.passion : badge.indigo, s.inlineBadge]}>
                <Text style={[badge.text, hobby.type === 'passion' ? badge.passionText : badge.indigoText]}>{hobby.type}</Text>
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity onPress={() => navigation.navigate('SuggestionsBoard')} style={s.settingsRow}>
          <Text style={s.settingsRowText}>💡 Suggestions Board</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </TouchableOpacity>

        <View style={s.logoutWrap}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tile: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 12, borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.md },
  tileValue: { fontSize: F.base, fontWeight: '900', color: C.primaryContainer },
  tileLabel: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 4 },
  sectionTitle: { fontSize: F.lg, fontWeight: '900', color: C.onSurface, marginBottom: 12 },
  hobbyRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 10 },
  hobbyEmoji: { fontSize: 30 },
  hobbyName: { fontSize: F.md, fontWeight: '900', color: C.onSurface },
  inlineBadge: { alignSelf: 'flex-start', marginTop: 6 },
  logoutWrap: { marginTop: 24, marginBottom: 20 },
  logoutBtn: { paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: C.outlineVariant, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  logoutText: { fontSize: F.md, fontWeight: '700', color: '#D32F2F', textAlign: 'center' },
  settingsRow: {
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  paddingVertical: 14, paddingHorizontal: 4,
  borderTopWidth: 1, borderTopColor: C.outlineVariant,
},
settingsRowText: { fontSize: F.md, fontWeight: '700', color: C.onSurface },
settingsRowArrow: { fontSize: F.lg, color: C.outlineVariant },
  
});
