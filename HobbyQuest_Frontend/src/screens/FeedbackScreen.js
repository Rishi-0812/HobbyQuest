// FeedbackScreen
// API: POST /feedback
// Layout: navy header, type chips, optional hobby field, message composer,
// optional screenshot attachment (bug reports benefit most from this).

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { C, F, R } from '../theme';
import { layout, header, card } from '../styles';
import { PrimaryButton } from '../components/components';
import api from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';

export default function FeedbackScreen({ navigation , route }) {
  const prefill = route.params || {};
  const [type, setType] = useState(prefill.prefillType || 'bug');
  const [hobbyName, setHobbyName] = useState(prefill.prefillHobbyName || '');
  const [message, setMessage] = useState(prefill.prefillMessage || '');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  function removeImage() {
    setImageUri(null);
  }

  async function submit() {
    setLoading(true);
    setStatus('');
    try {
      let uploadedUrl = null;
      if (imageUri) {
        setUploading(true);
        uploadedUrl = await uploadImageToCloudinary(imageUri, 'hobbyquest/feedback');
        setUploading(false);
      }

      await api.post('/feedback', {
        type,
        hobbyName: type === 'suggestion' ? hobbyName : null,
        message,
        imageUrl: uploadedUrl,
      });
      setStatus('Feedback sent. Thank you.');
      setMessage('');
      setHobbyName('');
      setImageUri(null);
    } catch (err) {
      setUploading(false);
      setStatus(err.message || 'Could not send feedback.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
        <Text style={header.titleLarge}>Send Feedback</Text>
      </View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={card.hero}>
          <View style={s.chips}>
            {['bug', 'suggestion', 'other'].map(item => (
              <TouchableOpacity key={item} style={[s.chip, type === item && s.chipActive]} onPress={() => setType(item)}>
                <Text style={[s.chipText, type === item && s.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
            {type === 'suggestion' ? (
              <TextInput style={s.input} value={hobbyName} onChangeText={setHobbyName} placeholder="Hobby name" placeholderTextColor={C.outline} />
            ) : hobbyName ? (
              <View style={s.prefilledHobbyBox}>
                  <Text style={s.prefilledHobbyLabel}>Reporting an issue with:</Text>
                  <Text style={s.prefilledHobbyText}>{hobbyName}</Text>
                </View>
              ) : null}

          {imageUri ? (
            <View style={s.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
              <TouchableOpacity onPress={removeImage} style={s.removeImageBtn}>
                <Text style={s.removeImageText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickImage} style={s.pickImageBtn}>
              <Text style={s.pickImageEmoji}>📎</Text>
              <Text style={s.pickImageText}>
                {type === 'bug' ? 'Attach a screenshot (optional)' : 'Attach an image (optional)'}
              </Text>
            </TouchableOpacity>
          )}

          {status ? <Text style={s.status}>{status}</Text> : null}

          <PrimaryButton
            label={uploading ? 'Uploading image…' : 'Submit'}
            onPress={submit}
            loading={loading}
            disabled={!message.trim()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: R.full, backgroundColor: C.surfaceContainerLow },
  chipActive: { backgroundColor: C.primaryContainer },
  chipText: { color: C.onSurfaceVariant, fontWeight: '800', textTransform: 'capitalize' },
  chipTextActive: { color: C.white },
  input: { height: 50, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: R.lg, paddingHorizontal: 14, color: C.onSurface, marginBottom: 12 },
  message: { minHeight: 150, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: R.lg, padding: 14, color: C.onSurface, textAlignVertical: 'top', marginBottom: 12 },
  pickImageBtn: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.outlineVariant,
    borderRadius: R.lg, paddingVertical: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceContainerLow, marginBottom: 12,
  },
  pickImageEmoji: { fontSize: 24, marginBottom: 6 },
  pickImageText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  imagePreviewWrap: { position: 'relative', marginBottom: 12 },
  imagePreview: { width: '100%', height: 160, borderRadius: R.lg, backgroundColor: C.surfaceContainerLow },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: R.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  removeImageText: { color: C.white, fontSize: F.xs, fontWeight: '700' },
  status: { color: C.primaryContainer, fontWeight: '800', marginBottom: 12 },

  prefilledHobbyBox: { backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: 12, marginBottom: 12 }, prefilledHobbyLabel: { fontSize: F.xs, color: C.onSurfaceVariant, fontWeight: '700' }, prefilledHobbyText: { fontSize: F.base, color: C.onSurface, fontWeight: '700', marginTop: 2 }
});