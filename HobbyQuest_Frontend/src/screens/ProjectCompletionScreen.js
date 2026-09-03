// ProjectCompletionScreen
// Route params: { progressId, projectName, unitLabel, totalUnits, hobbyId, hobbyName }
// API: GET /user/projects/{progressId}/active (for authoritative stats),
//      POST /community/posts (with an optional Cloudinary-hosted image)
// Layout: navy completion hero, animated trophy, stats, optional caption + photo share.

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { PrimaryButton } from '../components/components';
import { layout, card, header } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';
import { pickOrCaptureImage } from '../services/imagePicker';
import SlideToast from '../components/SlideToast';

function StatTile({ label, value }) {
  return (
    <View style={s.statTile}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProjectCompletionScreen({ route, navigation }) {
  const params = route.params;
  const scale = useRef(new Animated.Value(0.7)).current;
  const [caption, setCaption] = useState('');
  const [postText, setPostText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [existingPost, setExistingPost] = useState(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [stats, setStats] = useState({
    totalUnits: params.totalUnits ?? 0,
    sessionsLogged: 0,
    xpEarned: 0,
  });

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const { data } = await api.get(`/user/projects/${params.progressId}/active`);
        if (cancelled) return;
        setStats({
          totalUnits: data.targetCount ?? params.totalUnits ?? 0,
          sessionsLogged: data.sessionsLogged ?? 0,
          xpEarned: data.totalXpEarned ?? 0,
        });
      } catch {
        // fall back to params silently
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [params.progressId]);

useEffect(() => {
  if (!params.projectId) return;
  async function loadExistingShare() {
    try {
      const { data } = await api.get('/community/posts', { params: { project_id: params.projectId } });
      const match = Array.isArray(data) && data.length ? data[0] : null;
      if (match) {
        setExistingPost(match);
        setCaption(match.caption || '');
        setPostText(match.postText || '');
        setImageUri(match.imageUrl || null);
      }
    } catch {
      // no existing share yet
    }
  }
  loadExistingShare();
}, [params.projectId]);

async function pickImage() {
  const uri = await pickOrCaptureImage();
  if (uri) setImageUri(uri);
}

  function removeImage() {
    setImageUri(null);
  }

  async function share() {
    try {
      setSharing(true);
      setMessage('');

      let uploadedUrl = null;
      if (imageUri) {
        setUploading(true);
        uploadedUrl = await uploadImageToCloudinary(imageUri);
        setUploading(false);
      }

      const payload = {
        hobbyId: params.hobbyId,
        projectId: params.projectId,
        postType: 'project_completion',
        caption: caption.trim() || `Completed ${params.projectName}!`,
        imageUrl: uploadedUrl || (existingPost?.imageUrl ?? null),
        postText: postText.trim() || null,
      };

      if (existingPost && existingPost.id) {
        await api.patch(`/community/posts/${existingPost.id}`, payload);
      } else {
        await api.post('/community/posts', payload);
      }

      setMessage('Shared to the moderation queue.');
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        if (!params.readOnly) navigation.navigate('AppTabs', { screen: 'Dashboard' });
      }, 1200);
    } catch (err) {
      setUploading(false);
      setMessage(err.response?.data?.message || err.message || 'Could not share right now.');
    } finally {
      setSharing(false);
    }
  }

  const showShareForm = !params.readOnly && !(existingPost && !replaceMode);

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={[header.navy, s.hero]}>
        <Animated.View style={[s.trophyWrap, { transform: [{ scale }] }]}>
          <Text style={s.trophy}>🏆</Text>
        </Animated.View>
        <Text style={s.caps}>PROJECT COMPLETE</Text>
        <View style={s.namePill}>
          <Text style={s.namePillText}>{getHobbyEmoji(params.hobbyName)} {params.projectName}</Text>
        </View>
        <Text style={s.congrats}>
          You completed all {stats.totalUnits} {params.unitLabel}s. That's real creative commitment.
        </Text>
      </View>

      <SlideToast visible={toastVisible} message="Shared to community" emoji="✅" color={C.primaryContainer} />

      <ScrollView contentContainerStyle={layout.scrollContentPb} showsVerticalScrollIndicator={false}>
        {loadingStats ? (
          <ActivityIndicator color={C.primaryContainer} style={{ marginBottom: 16 }} />
        ) : (
          <View style={s.stats}>
            <StatTile label="Units" value={stats.totalUnits} />
            <StatTile label="Sessions" value={stats.sessionsLogged} />
            <StatTile label="XP earned" value={stats.xpEarned} />
          </View>
        )}

        {existingPost && !params.readOnly && !replaceMode ? (
          <View style={[card.hero, s.shareCard]}>
            <Text style={s.shareTitle}>You already shared this one</Text>
            {existingPost.imageUrl ? <Image source={{ uri: existingPost.imageUrl }} style={s.imagePreview} resizeMode="cover" /> : null}
            {existingPost.postText ? <Text style={s.previewText}>{existingPost.postText}</Text> : null}
            <PrimaryButton label="Replace" color={C.primaryContainer} onPress={() => setReplaceMode(true)} />
          </View>
        ) : null}

        {showShareForm ? (
          <View style={[card.hero, s.shareCard]}>
            <Text style={s.shareTitle}>Share your win</Text>
            <Text style={s.shareText}>
              Pick a favorite to share — not everything, just the one you're proudest of. Add a short caption for the community feed. Posts appear after admin approval.
            </Text>

            {imageUri ? (
              <View style={s.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
                <TouchableOpacity onPress={removeImage} style={s.removeImageBtn}>
                  <Text style={s.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={s.pickImageBtn}>
                <Text style={s.pickImageEmoji}>🖼️</Text>
                <Text style={s.pickImageText}>Add a photo (optional)</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={s.caption}
              value={caption}
              onChangeText={value => setCaption(value.slice(0, 150))}
              placeholder="What did this project teach you?"
              placeholderTextColor={C.outline}
              multiline
            />

            <TextInput
              style={s.postTextInput}
              value={postText}
              onChangeText={value => setPostText(value.slice(0, 1000))}
              placeholder="Write it out — a poem, a reflection, or a short story"
              placeholderTextColor={C.outline}
              multiline
            />

            {message ? <Text style={s.message}>{message}</Text> : null}
            <PrimaryButton
              label={uploading ? 'Uploading photo…' : existingPost ? 'Update community post' : 'Share to Community'}
              color={C.primaryContainer}
              onPress={share}
              loading={sharing}
            />
            <TouchableOpacity onPress={() => navigation.navigate('AppTabs')} style={s.skipLink}>
              <Text style={s.skipLinkText}>Skip sharing</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {params.readOnly ? (
          <View style={[card.hero, s.shareCard]}>
            <Text style={s.shareTitle}>Completed project</Text>
            <Text style={s.shareText}>This project is complete and viewable as a historical milestone.</Text>
          </View>
        ) : null}

        <TouchableOpacity style={s.backHome} onPress={() => navigation.navigate('AppTabs')}>
          <Text style={s.backHomeText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  trophyWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  trophy: { fontSize: 52 },
  caps: { color: C.secondaryContainer, fontSize: F.sm, fontWeight: '900', letterSpacing: 1 },
  namePill: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: R.full, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10 },
  namePillText: { color: C.white, fontSize: F.base, fontWeight: '800' },
  congrats: { color: 'rgba(255,255,255,0.78)', textAlign: 'center', fontSize: F.md, lineHeight: 24, marginTop: 14 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statTile: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.md },
  statValue: { fontSize: F.xl, color: C.primaryContainer, fontWeight: '900' },
  statLabel: { fontSize: F.xs, color: C.onSurfaceVariant, fontWeight: '700', marginTop: 4 },
  shareCard: { gap: 12 },
  shareTitle: { fontSize: F.lg, color: C.onSurface, fontWeight: '900' },
  shareText: { fontSize: F.base, color: C.onSurfaceVariant, lineHeight: 20 },
  pickImageBtn: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.outlineVariant,
    borderRadius: R.lg, paddingVertical: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceContainerLow,
  },
  pickImageEmoji: { fontSize: 28, marginBottom: 6 },
  pickImageText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  imagePreviewWrap: { position: 'relative' },
  imagePreview: { width: '100%', height: 180, borderRadius: R.lg, backgroundColor: C.surfaceContainerLow },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: R.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  removeImageText: { color: C.white, fontSize: F.xs, fontWeight: '700' },
  caption: { minHeight: 94, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.outlineVariant, padding: 14, textAlignVertical: 'top', color: C.onSurface, backgroundColor: C.surfaceContainerLow },
  postTextInput: { minHeight: 150, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.outlineVariant, padding: 14, textAlignVertical: 'top', color: C.onSurface, backgroundColor: C.surfaceContainerLow },
  previewText: { color: C.onSurface, fontSize: F.sm, lineHeight: 20 },
  message: { color: C.primaryContainer, fontSize: F.sm, fontWeight: '700' },
  skipLink: { alignItems: 'center', paddingTop: 4 },
  skipLinkText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '600', textDecorationLine: 'underline' },
  backHome: { alignItems: 'center', paddingVertical: 18 },
  backHomeText: { color: C.primaryContainer, fontSize: F.base, fontWeight: '800' },
});