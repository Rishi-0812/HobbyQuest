// CommunityScreen
// API: GET /community/posts, GET /hobbies/enrolled
// Layout: navy header, enrolled hobby filter chips, approved post cards, feedback shortcut.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { header, layout, badge } from '../styles';
import api from '../services/api';

export default function CommunityScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchPosts(hobbyId = selected) {
    const query = hobbyId ? `?hobby_id=${hobbyId}` : '';
    const { data } = await api.get(`/community/posts${query}`);
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchPosts(null);
    api.get('/hobbies/enrolled').then(({ data }) => setHobbies(data || [])).catch(() => {});
  }, []);

  function pickFilter(hobbyId) {
    setSelected(hobbyId);
    setLoading(true);
    fetchPosts(hobbyId);
  }

  function renderPost({ item }) {
    const typeColor = item.postType === 'roadmap_completion' ? C.indigo : C.passion;
    return (
      <View style={s.post}>
        <View style={s.postHeader}>
          <View style={s.avatar}><Text style={s.avatarText}>U</Text></View>
          <View style={layout.fill}>
            <Text style={s.user}>Community member</Text>
            <Text style={s.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</Text>
          </View>
          <View style={[badge.base, { backgroundColor: typeColor + '20' }]}>
            <Text style={[badge.text, { color: typeColor }]}>{item.postType === 'roadmap_completion' ? 'Roadmap' : 'Project'}</Text>
          </View>
        </View>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={s.image} /> : null}
        <Text style={s.caption}>{item.caption || 'Shared a HobbyQuest milestone.'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <Text style={header.titleLarge}>Community</Text>
        <Text style={header.subtitle}>Approved wins from HobbyQuest users</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Feedback')} style={s.feedbackBtn}>
          <Text style={s.feedbackText}>Send feedback</Text>
        </TouchableOpacity>
      </View>
      <View style={s.filters}>
        <TouchableOpacity style={[s.filter, selected === null && s.filterActive]} onPress={() => pickFilter(null)}>
          <Text style={[s.filterText, selected === null && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {hobbies.map(hobby => (
          <TouchableOpacity key={hobby.id} style={[s.filter, selected === hobby.id && s.filterActive]} onPress={() => pickFilter(hobby.id)}>
            <Text style={[s.filterText, selected === hobby.id && s.filterTextActive]}>{hobby.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={C.primaryContainer} style={s.loader} /> : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={renderPost}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyEmoji}>👥</Text><Text style={s.emptyText}>No approved posts yet.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  feedbackBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, marginTop: 12 },
  feedbackText: { color: C.white, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.surfaceContainerLow },
  filterActive: { backgroundColor: C.primaryContainer },
  filterText: { color: C.onSurfaceVariant, fontWeight: '800' },
  filterTextActive: { color: C.white },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 100 },
  post: { backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 12, ...SHADOW.md },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.primaryContainer, fontWeight: '900' },
  user: { fontSize: F.sm, color: C.onSurface, fontWeight: '900' },
  date: { fontSize: F.xs, color: C.onSurfaceVariant },
  image: { width: '100%', height: 180, borderRadius: R.lg, marginBottom: 10 },
  caption: { fontSize: F.base, color: C.onSurface, lineHeight: 21 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: C.onSurfaceVariant, fontSize: F.base, marginTop: 8 },
});
