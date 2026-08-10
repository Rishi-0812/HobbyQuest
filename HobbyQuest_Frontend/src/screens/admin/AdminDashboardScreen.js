import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../../theme';
import { badge, card, header, layout, section } from '../../styles';
import api from '../../services/api';
import { useAuth } from '../../services/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingContent, setPendingContent] = useState([]);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data));
    api.get('/admin/content/pending').then(({ data }) => setPendingContent(Array.isArray(data) ? data : []));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0 },
    { label: 'Structured Hobbies', value: stats?.totalStructuredHobbies ?? 0 },
    { label: 'Passion Hobbies', value: stats?.totalPassionHobbies ?? 0 },
  ];

  function openPendingReview() {
    navigation.navigate('PendingContent');
  }

  function handleLogout() {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to access the admin dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}>
        <View style={s.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={header.titleLarge}>Admin Dashboard</Text>
            <Text style={header.subtitle}>Review, generate, moderate</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!stats ? <ActivityIndicator color={C.admin} style={s.loader} /> : (
        <ScrollView contentContainerStyle={layout.scrollContentPb}>
          <View style={s.statsRow}>
            {statCards.map(item => (
              <View key={item.label} style={s.statCard}>
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.reviewCard}>
            <Text style={s.reviewKicker}>Needs your review</Text>
            <Text style={s.reviewCount}>{stats.pendingContentCount ?? 0}</Text>
            <Text style={s.reviewSub}>Pending AI-generated drafts</Text>
          </View>

          <View style={section.header}>
            <Text style={section.title}>Quick Actions</Text>
          </View>
          <View style={s.quickGrid}>
            <TouchableOpacity style={s.quickTile} onPress={() => navigation.navigate('GenerateContent', { mode: 'roadmap' })}>
              <Text style={s.quickTitle}>Generate Roadmap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickTile} onPress={() => navigation.navigate('GenerateContent', { mode: 'project' })}>
              <Text style={s.quickTitle}>Generate Project</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickTile} onPress={openPendingReview}>
              <Text style={s.quickTitle}>Review Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickTile} onPress={() => navigation.navigate('CommunityModeration')}>
              <Text style={s.quickTitle}>Moderate Community</Text>
            </TouchableOpacity>
          </View>

          <View style={card.base}>
            <Text style={s.infoTitle}>Most popular hobby</Text>
            <Text style={s.infoValue}>{stats.mostPopularHobbyName || 'N/A'}</Text>
            <View style={[badge.base, badge.admin, { alignSelf: 'flex-start', marginTop: 8 }]}>
              <Text style={[badge.text, badge.adminText]}>{stats.pendingSuggestionsCount ?? 0} feedback items pending</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PendingSuggestions')} style={{ marginTop: 10 }}>
              <Text style={s.link}>Open suggestions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  logoutBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: R.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 12,
  },
  logoutText: { color: C.white, fontSize: F.sm, fontWeight: '700' },

  loader: { marginTop: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 12, borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.md },
  statValue: { fontSize: F.xl, color: C.admin, fontWeight: '900' },
  statLabel: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 4, fontWeight: '700' },
  reviewCard: { backgroundColor: C.adminLight, borderRadius: R.xl, borderWidth: 1, borderColor: C.admin, padding: 14, marginBottom: 16 },
  reviewKicker: { color: C.admin, fontSize: F.sm, fontWeight: '800', textTransform: 'uppercase' },
  reviewCount: { color: C.admin, fontSize: F.xxl, fontWeight: '900', marginTop: 2 },
  reviewSub: { color: C.onSurfaceVariant, fontSize: F.sm, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickTile: { width: '48%', backgroundColor: C.surfaceLowest, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.sm },
  quickTitle: { color: C.onSurface, fontSize: F.sm, fontWeight: '800' },
  infoTitle: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  infoValue: { color: C.onSurface, fontSize: F.lg, fontWeight: '900', marginTop: 4 },
  link: { color: C.admin, fontSize: F.sm, fontWeight: '700' },
});