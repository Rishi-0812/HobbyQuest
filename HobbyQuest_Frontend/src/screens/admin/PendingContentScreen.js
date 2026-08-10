import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { C, F, R, SHADOW } from '../../theme';
import { header, layout } from '../../styles';
import api from '../../services/api';

const TYPE_META = {
  roadmap: { label: 'Structured · Roadmap', color: C.indigo, bg: C.indigoLight },
  project: { label: 'Passion · Project', color: C.passion, bg: C.passionLight },
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function PendingContentScreen({ navigation }) {
  const [items, setItems] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'roadmap' | 'project'

  async function load() {
    try {
      const { data } = await api.get('/admin/content/pending');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }

  // Refetch every time this screen comes into focus — not just on first mount —
  // so a project you just generated shows up immediately when you navigate back here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = (items || []).filter(item =>
    filter === 'all' ? true : item.contentType === filter
  );

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={header.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={header.titleLarge}>Pending Review</Text>
        <Text style={header.subtitle}>
          {items ? `${items.length} draft${items.length === 1 ? '' : 's'} waiting` : 'Loading…'}
        </Text>
      </View>

      <View style={s.filterRow}>
        {['all', 'roadmap', 'project'].map(key => (
          <TouchableOpacity
            key={key}
            style={[s.filterChip, filter === key && s.filterChipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.filterText, filter === key && s.filterTextActive]}>
              {key === 'all' ? 'All' : key === 'roadmap' ? 'Roadmaps' : 'Projects'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {items === null ? (
        <ActivityIndicator color={C.admin} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={layout.scrollContentPb}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.admin} />}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>Nothing pending here.</Text>
            </View>
          ) : (
            filtered.map(item => {
              const meta = TYPE_META[item.contentType] || TYPE_META.roadmap;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={s.itemCard}
                  onPress={() => navigation.navigate('ReviewContent', { contentId: item.id })}
                >
                  <View style={s.itemTop}>
                    <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[s.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={s.dateText}>{formatDate(item.generatedAt)}</Text>
                  </View>
                  <Text style={s.itemTitle}>
                    {item.contentType === 'project'
                      ? (item.projectName || `${item.hobbyName} project`)
                      : item.hobbyName}
                  </Text>
                  <Text style={s.itemSub} numberOfLines={2}>
                    {item.contentType === 'project'
                      ? `Project for ${item.hobbyName}${item.targetCount ? ` · ${item.targetCount} ${item.unitLabelPlural || item.unitLabel + 's'}` : ''}`
                      : `${item.difficulty || 'Beginner'} difficulty roadmap`}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
  },
  filterChipActive: { backgroundColor: C.adminLight, borderWidth: 1, borderColor: C.admin },
  filterText: { fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant },
  filterTextActive: { color: C.admin },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: C.onSurfaceVariant, fontSize: F.sm },

  itemCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    padding: 14,
    marginBottom: 10,
    ...SHADOW.sm,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.full },
  typeBadgeText: { fontSize: F.xs, fontWeight: '800' },
  dateText: { fontSize: F.xs, color: C.onSurfaceVariant },
  itemTitle: { fontSize: F.base, fontWeight: '800', color: C.onSurface, marginBottom: 4 },
  itemSub: { fontSize: F.sm, color: C.onSurfaceVariant },
});