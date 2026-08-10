import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { InputField, PrimaryButton, ErrorBanner } from '../components/components';
import api from '../services/api';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!code.trim() || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token: code.trim(), newPassword });
      navigation.navigate('Login');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Reset password</Text>
        <Text style={s.sub}>
          {email ? `Enter the 6-digit code sent to ${email}` : 'Enter the 6-digit code sent to your email'}
        </Text>

        {error ? <ErrorBanner message={error} /> : null}

        <InputField label="Reset code" placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
        <InputField label="New password" placeholder="Create a new password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <InputField label="Confirm password" placeholder="Repeat your new password" value={confirm} onChangeText={setConfirm} secureTextEntry />

        <PrimaryButton label="Reset password" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surfaceLowest },
  content: { flex: 1, padding: 24, paddingTop: 20 },
  back: { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 20 },
  title: { fontSize: F.xl, fontWeight: '800', color: C.primary, marginBottom: 6 },
  sub: { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 20 },
});