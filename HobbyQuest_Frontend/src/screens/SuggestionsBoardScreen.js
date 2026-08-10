// SuggestionsBoardScreen
// API: GET /feedback/suggestions, POST /feedback/{id}/vote
// Layout: navy header, list of unreviewed suggestions with a tap-to-vote button.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, header } from '../styles';
import api from '../services/api';

function SuggestionCard({ item, onVote }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.hobbyName} numberOfLines={1}>{item.hobbyName || 'General suggestion'}</Text>
      </View>
      <Text style={s.message}>{item.message}</Text>
      <TouchableOpacity
        onPress={() => onVote(item.id)}
        style={[s.voteBtn, item.hasVoted && s.voteBtnActive]}
        activeOpacity={0.8}
      >
        <Text style={[s.voteIcon, item.hasVoted && s.voteIconActive]}>👍</Text>
        <Text style={[s.voteCount, item.hasVoted && s.voteCountActive]}>{item.voteCount}</Text>
        <Text style={[s.voteLabel, item.hasVoted && s.voteLabelActive]}>
          {item.hasVoted ? 'Voted' : 'Vote'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SuggestionsBoardScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/feedback/suggestions');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Suggestions board load error:', err.response?.status, err.response?.data, err.message);
      setError(
        err.response?.status
          ? `Error ${err.response.status}: ${err.response?.data?.message || 'Could not load suggestions.'}`
          : `Network error: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function vote(id) {
    setItems(prev => prev.map(item => item.id === id
      ? { ...item, hasVoted: !item.hasVoted, voteCount: item.voteCount + (item.hasVoted ? -1 : 1) }
      : item
    ));
    try {
      const { data } = await api.post(`/feedback/${id}/vote`);
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    } catch {
      load();
    }
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
        <Text style={header.titleLarge}>Suggestions Board</Text>
        <Text style={header.subtitle}>Vote for hobbies you'd like to see added</Text>
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={C.primaryContainer} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={layout.scrollContentPb}>
          {items.length === 0 && !error ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>💡</Text>
              <Text style={s.emptyText}>No open suggestions yet — be the first to suggest one from the Feedback screen.</Text>
            </View>
          ) : (
            items.map(item => <SuggestionCard key={item.id} item={item} onVote={vote} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  errorBox: { margin: 16, padding: 12, backgroundColor: C.errorContainer, borderRadius: R.lg },
  errorText: { color: C.error, fontSize: F.sm, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 12, ...SHADOW.md },
  cardTop: { marginBottom: 2 },
  hobbyName: { fontSize: F.md, fontWeight: '900', color: C.onSurface },
  message: { flex: 1, fontSize: F.sm, color: C.onSurfaceVariant, marginRight: 8 },
  voteBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 64, paddingVertical: 8,
    borderRadius: R.lg, backgroundColor: C.surfaceContainerLow,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  voteBtnActive: { backgroundColor: C.primaryFixed, borderColor: C.primaryContainer },
  voteIcon: { fontSize: 18 },
  voteIconActive: {},
  voteCount: { fontSize: F.base, fontWeight: '900', color: C.onSurface, marginTop: 2 },
  voteCountActive: { color: C.primaryContainer },
  voteLabel: { fontSize: 10, color: C.onSurfaceVariant, fontWeight: '700', marginTop: 1 },
  voteLabelActive: { color: C.primaryContainer },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: C.onSurfaceVariant, fontSize: F.base, textAlign: 'center' },
});