import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../theme';
import { header, layout } from '../styles';
import { PrimaryButton } from '../components/components';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function EditProfileScreen({ route, navigation }) {
  const { signOut } = useAuth();
  const [name, setName] = useState(route.params?.currentName || '');
  const [email] = useState(route.params?.currentEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name cannot be empty.'); return; }
    if (trimmed.length > 100) { setError('Name must be 100 characters or fewer.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.patch('/user/profile', { name: trimmed });
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'This will deactivate your account and sign you out. This cannot be undone by yourself — contact support if you change your mind.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/user/profile');
              signOut();
            } catch {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
        <Text style={header.titleLarge}>Edit Profile</Text>
      </View>

      <View style={s.content}>
        {error ? <Text style={s.error}>{error}</Text> : null}

        <Text style={s.label}>Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={(text) => setName(text.slice(0, 100))}
          placeholder="Your name"
          placeholderTextColor={C.outline}
          maxLength={100}
        />

        <Text style={s.label}>Email</Text>
        <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{email}</Text></View>
        <Text style={s.hint}>Email can't be changed.</Text>

        <PrimaryButton label="Save changes" onPress={save} loading={loading} style={{ marginTop: 16 }} />

        <TouchableOpacity onPress={confirmDelete} style={s.deleteRow}>
          <Text style={s.deleteText}>Delete my account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 24 },
  error: { color: C.error, fontSize: F.sm, marginBottom: 12, fontWeight: '600' },
  label: { fontSize: F.sm, color: C.onSurfaceVariant, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  input: { height: 50, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: R.lg, paddingHorizontal: 14, color: C.onSurface },
  readOnlyBox: { height: 50, borderRadius: R.lg, backgroundColor: C.surfaceContainerLow, justifyContent: 'center', paddingHorizontal: 14 },
  readOnlyText: { color: C.onSurfaceVariant, fontSize: F.base },
  hint: { fontSize: F.xs, color: C.outline, marginTop: 4 },
  deleteRow: { marginTop: 40, alignItems: 'center', paddingVertical: 12 },
  deleteText: { color: C.error, fontSize: F.base, fontWeight: '700' },
});