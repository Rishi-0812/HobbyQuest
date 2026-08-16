// ProfileScreen
// API: GET /user/dashboard, GET /hobbies/enrolled
// Layout: navy profile summary, XP/streak stats, enrolled hobbies, settings list.

import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, getXPProgress, SHADOW } from '../theme';
import { ProgressBar } from '../components/components';
import { layout, header, badge } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';
import { AuthContext } from '../services/AuthContext';

function SettingsRow({ emoji, label, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.settingsRow}>
      <Text style={[s.settingsRowText, danger && s.settingsRowTextDanger]}>{emoji} {label}</Text>
      <Text style={s.settingsRowArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/user/dashboard'),
      api.get('/hobbies/enrolled'),
      api.get('/user/profile'),
    ])
      .then(([dash, enrolled, prof]) => {
        setDashboard(dash.data);
        setHobbies(enrolled.data || []);
        setProfile(prof.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      signOut();
    } catch {
      signOut();
    }
  }

  if (loading) return <SafeAreaView style={[layout.root, layout.centered]}><ActivityIndicator color={C.primaryContainer} /></SafeAreaView>;

  const user = dashboard?.user || {};
  const xp = getXPProgress(user.xp || 0);
  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <View style={s.identityRow}>
          <View style={s.avatarCircle}><Text style={s.avatarInitial}>{initial}</Text></View>
          <View style={layout.fill}>
            <Text style={header.titleLarge}>{user.name || 'Profile'}</Text>
            <Text style={header.subtitle}>Level {user.level || xp.level} • {user.xp || 0} XP</Text>
          </View>
        </View>
        <View style={s.xpBarWrap}>
          <ProgressBar progress={xp.progress} color={C.secondary} bg={C.primaryFixedDim} />
        </View>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={s.stats}>
          <View style={s.tile}><Text style={s.tileValue}>🔥 {dashboard?.streak || 0}</Text><Text style={s.tileLabel}>Current streak</Text></View>
          <View style={s.tile}><Text style={s.tileValue}>🏆 {dashboard?.longestStreak || 0}</Text><Text style={s.tileLabel}>Longest streak</Text></View>
          <View style={s.tile}><Text style={s.tileValue}>{dashboard?.freezeAvailable ? '❄️ Held' : 'No freeze'}</Text><Text style={s.tileLabel}>Freeze</Text></View>
        </View>

        {hobbies.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Enrolled hobbies</Text>
            {hobbies.map(hobby => {
              const accent = getHobbyAccent(hobby.id);
              return (
                <View key={hobby.id} style={s.hobbyRow}>
                  <View style={[s.hobbyIconWrap, { borderColor: accent + '90' }]}>
                    <Text style={s.hobbyEmoji}>{getHobbyEmoji(hobby)}</Text>
                  </View>
                  <View style={layout.fill}>
                    <Text style={s.hobbyName}>{hobby.name}</Text>
                    <View style={[badge.base, hobby.type === 'passion' ? badge.passion : badge.indigo, s.inlineBadge]}>
                      <Text style={[badge.text, hobby.type === 'passion' ? badge.passionText : badge.indigoText]}>{hobby.type}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : null}

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Settings</Text>
        <View style={s.settingsCard}>
          <SettingsRow
            emoji="✏️"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile', {
              currentName: profile?.name,
              currentEmail: profile?.email,
            })}
          />
          <SettingsRow emoji="💡" label="Suggestions Board" onPress={() => navigation.navigate('SuggestionsBoard')} />
          <SettingsRow emoji="💬" label="Send Feedback" onPress={() => navigation.navigate('Feedback')} />
        </View>

        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  avatarInitial: { fontSize: F.xl, fontWeight: '800', color: C.white },
  xpBarWrap: { marginTop: 16 },

  stats: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: 4 },
  tile: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 12, borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.md },
  tileValue: { fontSize: F.base, fontWeight: '900', color: C.primaryContainer },
  tileLabel: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 4 },

  sectionTitle: { fontSize: F.lg, fontWeight: '900', color: C.onSurface, marginBottom: 12 },
  hobbyRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 10 },
  hobbyIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceContainerLow, borderWidth: 2 },
  hobbyEmoji: { fontSize: 22 },
  hobbyName: { fontSize: F.md, fontWeight: '900', color: C.onSurface },
  inlineBadge: { alignSelf: 'flex-start', marginTop: 6 },

  settingsCard: { backgroundColor: C.surfaceLowest, borderRadius: R.xl, borderWidth: 1, borderColor: C.outlineVariant, paddingHorizontal: 16, ...SHADOW.sm },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingsRowText: { fontSize: F.md, fontWeight: '700', color: C.onSurface },
  settingsRowTextDanger: { color: C.error },
  settingsRowArrow: { fontSize: F.lg, color: C.outlineVariant },

  logoutBtn: { marginTop: 24, marginBottom: 20, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.outlineVariant, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  logoutText: { fontSize: F.md, fontWeight: '700', color: '#D32F2F' },
});