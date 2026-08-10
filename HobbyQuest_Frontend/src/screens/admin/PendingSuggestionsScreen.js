import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../../theme';
import { badge, header, layout } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';

export default function PendingSuggestionsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  async function load() { const { data } = await api.get('/admin/suggestions'); setItems(Array.isArray(data) ? data : []); }
  useEffect(() => { load(); }, []);
  async function markReviewed(id) { await api.patch(`/admin/suggestions/${id}/reviewed`); load(); }

  const filtered = useMemo(() => {
    const base = filter === 'all' ? items : items.filter(item => (item.type || '').toLowerCase() === filter);
    // Unreviewed first, reviewed pushed to the bottom — within each group,
    // keep the existing vote-count ordering the backend already provides.
    return [...base].sort((a, b) => {
      if (a.isReviewed === b.isReviewed) return 0;
      return a.isReviewed ? 1 : -1;
    });
  }, [items, filter]);

  function rowDate(item) {
    if (!item.createdAt) return '';
    return new Date(item.createdAt).toLocaleDateString();
  }

  function toggleExpanded(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity><Text style={header.titleLarge}>Suggestions</Text></View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={s.filters}>
          {['all', 'bug', 'suggestion', 'other'].map(type => (
            <TouchableOpacity key={type} style={[s.filter, filter === type && s.filterActive]} onPress={() => setFilter(type)}>
              <Text style={[s.filterText, filter === type && s.filterTextActive]}>{type === 'all' ? 'All' : type === 'suggestion' ? 'Suggestions' : type === 'bug' ? 'Bugs' : 'Other'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map(item => {
          const expanded = expandedId === item.id;
          return (
            <View key={item.id} style={[s.row, item.isReviewed && s.rowReviewed]}>
              {/* Collapsed header — always visible, tap to expand/collapse */}
              <TouchableOpacity style={s.topRow} onPress={() => toggleExpanded(item.id)} activeOpacity={0.7}>
                <View style={s.topRowText}>
                  <Text style={s.title} numberOfLines={expanded ? undefined : 1}>{item.hobbyName || 'General feedback'}</Text>
                  {!expanded ? (
                    <Text style={s.previewMessage} numberOfLines={1}>{item.message}</Text>
                  ) : null}
                </View>
                {item.isReviewed ? (
                  <View style={[badge.base, badge.teal]}>
                    <Text style={[badge.text, badge.tealText]}>Reviewed</Text>
                  </View>
                ) : null}
                <Text style={s.chevron}>{expanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {expanded ? (
                <View style={s.body}>
                  <Text style={s.message}>{item.message}</Text>

                  {item.imageUrl ? (
                    <TouchableOpacity onPress={() => setPreviewImage(item.imageUrl)} activeOpacity={0.85}>
                      <Image source={{ uri: item.imageUrl }} style={s.thumb} resizeMode="cover" />
                      <Text style={s.thumbHint}>Tap to view full size</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={s.metaRow}>
                    <View style={[badge.base, badge.admin]}>
                      <Text style={[badge.text, badge.adminText]}>{item.voteCount || 0} votes</Text>
                    </View>
                    <Text style={s.metaDate}>{rowDate(item)}</Text>
                  </View>
                  {(item.type || '').toLowerCase() === 'suggestion' ? (
                    <PrimaryButton
                      label="Generate Roadmap →"
                      color={C.admin}
                      onPress={() => navigation.navigate('GenerateContent', { mode: 'roadmap', prefillHobbyName: item.hobbyName })}
                      style={{ marginBottom: 8 }}
                    />
                  ) : null}
                  {!item.isReviewed ? (
                    <TouchableOpacity onPress={() => markReviewed(item.id)} style={s.discard}>
                      <Text style={s.discardText}>Mark reviewed</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Full-size image viewer */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity style={s.imageOverlay} activeOpacity={1} onPress={() => setPreviewImage(null)}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={s.fullImage} resizeMode="contain" />
          ) : null}
          <Text style={s.closeHint}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filter: { backgroundColor: C.surfaceContainerLow, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: C.adminLight, borderWidth: 1, borderColor: C.admin },
  filterText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  filterTextActive: { color: C.admin },

  row: { backgroundColor: C.surfaceLowest, borderRadius: R.xl, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 12, overflow: 'hidden', ...SHADOW.md },
  rowReviewed: { opacity: 0.6 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  topRowText: { flex: 1 },
  title: { fontSize: F.md, fontWeight: '900', color: C.onSurface },
  previewMessage: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  chevron: { fontSize: F.lg, color: C.onSurfaceVariant },

  body: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.outlineVariant, paddingTop: 12 },
  message: { color: C.onSurfaceVariant, marginBottom: 8, fontSize: F.sm },
  thumb: { width: '100%', height: 160, borderRadius: R.lg, marginBottom: 4, backgroundColor: C.surfaceContainerLow },
  thumbHint: { fontSize: F.xs, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metaDate: { fontSize: F.xs, color: C.onSurfaceVariant },
  discard: { alignItems: 'center', marginTop: 10 },
  discardText: { color: C.admin, fontWeight: '800' },

  imageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: '100%', height: '80%' },
  closeHint: { color: 'rgba(255,255,255,0.6)', fontSize: F.sm, marginTop: 16 },
}); 