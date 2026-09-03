// CommunityScreen
// API: GET /community/posts?hobby_id=, GET /hobbies?type=passion&type=structured (for filters)
// Layout: navy header, horizontal-scrolling hobby filter chips, post feed.

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { layout, header, badge } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';

const POST_TYPE_LABEL = {
  roadmap_completion: '🗺️ Completed a roadmap',
  project_completion: '🎨 Completed a project',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PostCard({ post, onOpenImage, onOpenText }) {
  const accent = post.hobbyId ? getHobbyAccent(post.hobbyId) : C.primaryContainer;
  const initial = (post.posterName || 'H').charAt(0).toUpperCase();
  const previewText = post.postText ? post.postText.trim() : '';

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, { backgroundColor: accent + '22', borderColor: accent + '60' }]}>
          <Text style={[s.avatarText, { color: accent }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.posterName}>{post.posterName}</Text>
          <Text style={s.metaLine}>
            {POST_TYPE_LABEL[post.postType] || 'Shared an update'}
            {post.hobbyName ? ` · ${post.hobbyName}` : ''}
          </Text>
        </View>
        <Text style={s.time}>{timeAgo(post.createdAt)}</Text>
      </View>

      {post.imageUrl ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenImage(post.imageUrl)}>
          <Image source={{ uri: post.imageUrl }} style={s.image} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}

      {previewText ? (
        <View style={s.textPreviewWrap}>
          <Text style={s.previewText} numberOfLines={5}>{previewText}</Text>
          {previewText.length > 150 ? (
            <TouchableOpacity onPress={() => onOpenText(previewText)}>
              <Text style={s.readMore}>Read more</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {post.caption ? <Text style={s.caption}>{post.caption}</Text> : null}
    </View>
  );
}

export default function CommunityScreen({ navigation }) {
  const [hobbies, setHobbies] = useState([]);
  const [selectedHobby, setSelectedHobby] = useState(null); // null = All
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [textPost, setTextPost] = useState(null);

  useEffect(() => {
    api.get('/hobbies').then(({ data }) => setHobbies(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async (hobbyId) => {
    setLoading(true);
    try {
      const query = hobbyId ? `?hobby_id=${hobbyId}` : '';
      const { data } = await api.get(`/community/posts${query}`);
      setPosts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(selectedHobby); }, [selectedHobby, fetchPosts]);

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <Text style={header.titleLarge}>Community</Text>
        <Text style={header.subtitle}>See what others are creating</Text>
      </View>

      {/* Filter chips — real horizontal ScrollView, not a wrapping View */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          <TouchableOpacity
            style={[s.chip, selectedHobby === null && s.chipActive]}
            onPress={() => setSelectedHobby(null)}
          >
            <Text style={[s.chipText, selectedHobby === null && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {hobbies.map(hobby => (
            <TouchableOpacity
              key={hobby.id}
              style={[s.chip, selectedHobby === hobby.id && s.chipActive]}
              onPress={() => setSelectedHobby(hobby.id)}
            >
              <Text style={s.chipEmoji}>{getHobbyEmoji(hobby)}</Text>
              <Text style={[s.chipText, selectedHobby === hobby.id && s.chipTextActive]}>{hobby.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primaryContainer} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={layout.scrollContentPb}>
          {posts.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🎉</Text>
              <Text style={s.emptyText}>No posts yet in this filter — finish a roadmap or project to be the first to share.</Text>
            </View>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} onOpenImage={setPreviewImage} onOpenText={setTextPost} />)
          )}
        </ScrollView>
      )}

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity style={s.imageOverlay} activeOpacity={1} onPress={() => setPreviewImage(null)}>
          {previewImage ? <Image source={{ uri: previewImage }} style={s.fullImage} resizeMode="contain" /> : null}
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!textPost} transparent animationType="fade" onRequestClose={() => setTextPost(null)}>
        <TouchableOpacity style={s.textOverlay} activeOpacity={1} onPress={() => setTextPost(null)}>
          <View style={s.textModal}>
            <Text style={s.textModalTitle}>Reading view</Text>
            <Text style={s.textModalBody}>{textPost || ''}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  filterWrap: {
    backgroundColor: C.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    paddingVertical: 10,
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.surfaceContainerLow,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.full,
  },
  chipActive: { backgroundColor: C.primaryFixed, borderWidth: 1, borderColor: C.primaryContainer },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant },
  chipTextActive: { color: C.primaryContainer },

  card: {
    backgroundColor: C.surfaceLowest, borderRadius: R.xl,
    padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.outlineVariant,
    ...SHADOW.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText: { fontSize: F.base, fontWeight: '900' },
  posterName: { fontSize: F.base, fontWeight: '800', color: C.onSurface },
  metaLine: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 1 },
  time: { fontSize: F.xs, color: C.outline },
  image: { width: '100%', height: 200, borderRadius: R.lg, marginBottom: 10, backgroundColor: C.surfaceContainerLow },
  textPreviewWrap: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 12, marginBottom: 10 },
  previewText: { fontSize: F.sm, color: C.onSurface, lineHeight: 20 },
  readMore: { marginTop: 8, color: C.primaryContainer, fontWeight: '800' },
  caption: { fontSize: F.sm, color: C.onSurface, lineHeight: 19 },
  imageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  fullImage: { width: '100%', height: '70%', borderRadius: 18, backgroundColor: C.surfaceContainerLow },
  textOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  textModal: { width: '100%', maxWidth: 520, backgroundColor: C.surfaceLowest, borderRadius: 24, padding: 22, maxHeight: '80%' },
  textModalTitle: { fontSize: F.lg, fontWeight: '800', color: C.onSurface, marginBottom: 12 },
  textModalBody: { fontSize: F.base, lineHeight: 26, color: C.onSurface },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: F.base, color: C.onSurfaceVariant, textAlign: 'center' },
});