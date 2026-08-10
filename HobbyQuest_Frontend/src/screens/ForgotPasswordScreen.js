import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../theme';
import { InputField, PrimaryButton, ErrorBanner } from '../components/components';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

async function submit() {
  if (!email.trim()) {
    setError('Please enter your email.');
    return;
  }
  setLoading(true);
  setError('');
  try {
    await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    setSent(true);
  } catch (err) {
    setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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

        <Text style={s.title}>Forgot password?</Text>
        <Text style={s.sub}>Enter your email and we'll send you a reset code.</Text>

        {error ? <ErrorBanner message={error} /> : null}

        {sent ? (
          <View style={s.sentBox}>
            <Text style={s.sentText}>✅ A reset code has been sent to your email if it's registered.</Text>
            <PrimaryButton
              label="Enter reset code"
              onPress={() => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() })}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <>
            <InputField
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PrimaryButton label="Send reset code" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
          </>
        )}
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
  sentBox: { backgroundColor: C.tealLight, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: C.teal },
  sentText: { fontSize: F.base, color: C.teal, fontWeight: '600', lineHeight: 20 },
});