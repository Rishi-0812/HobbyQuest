import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../../theme';
import { badge, header, layout } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';

export default function CommunityModerationScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  async function load() { const { data } = await api.get('/admin/posts/pending'); setPosts(data || []); }
  useEffect(() => { load(); }, []);
  async function act(id, action) { await api.patch(`/admin/posts/${id}/${action}`); load(); }

  function confirmReject(id) {
    Alert.alert(
      'Reject this post?',
      'This will permanently delete the post.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => act(id, 'reject') },
      ]
    );
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity><Text style={header.titleLarge}>Moderation</Text></View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        {posts.map(post => (
          <View key={post.id} style={s.post}>
            {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={s.thumb} resizeMode="cover" /> : null}
            <View style={s.topRow}>
              <View style={[badge.base, badge.admin]}>
                <Text style={[badge.text, badge.adminText]}>{post.postType}</Text>
              </View>
              <Text style={s.hobby}>{post.hobbyName || 'General'}</Text>
            </View>
            <Text style={s.poster}>Posted by {post.posterName || 'Unknown'}</Text>
            <Text style={s.caption}>{post.caption || 'No caption'}</Text>
            <View style={s.actions}>
              <PrimaryButton label="Approve" color={C.teal} onPress={() => act(post.id, 'approve')} style={s.btn} />
              <PrimaryButton label="Reject" color={C.admin} onPress={() => confirmReject(post.id)} style={s.btn} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  post: { backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.outlineVariant, marginBottom: 12, ...SHADOW.md },
  thumb: { width: '100%', height: 170, borderRadius: R.lg, marginBottom: 10, backgroundColor: C.surfaceContainerLow },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hobby: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  poster: { color: C.onSurfaceVariant, fontSize: F.xs, marginTop: 6 },
  caption: { fontSize: F.base, color: C.onSurface, marginVertical: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44 },
});
