// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import {
  InputField, PrimaryButton, GhostButton,
  DividerText, ErrorBanner,
} from '../components/components';
import api, { saveToken } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setApiError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const { data } = await api.post('/auth/login', {
        email:    email.trim().toLowerCase(),
        password: password,
      });
      await saveToken(data.token);
      await signIn();
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Brand block — sits directly on the navy background, no header box */}
          <View style={[s.brandBlock, { paddingTop: insets.top + 32 }]}>
            <View style={s.logoWrap}>
              <Image
                source={require('../../assets/logo-placeholder.png')}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={s.appName}>HobbyQuest</Text>
            <Text style={s.tagline}>Welcome back</Text>
          </View>

          {/* Content card — single rounded sheet, everything lives inside it */}
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Sign in</Text>
            <Text style={s.sheetSub}>Continue your streak where you left off</Text>

            <View style={s.statStrip}>
              <View style={s.statItem}>
                <Text style={s.statEmoji}>🔥</Text>
                <Text style={s.statText}>Keep your streak alive</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statEmoji}>⭐</Text>
                <Text style={s.statText}>Earn XP every session</Text>
              </View>
            </View>

            {apiError ? (
              <View style={s.errorWrap}>
                <ErrorBanner message={apiError} />
              </View>
            ) : null}

            <View style={s.fieldGroup}>
              <InputField
                label="Email address"
                placeholder="name@example.com"
                value={email}
                onChangeText={v => { setEmail(v); setApiError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <InputField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={v => { setPassword(v); setApiError(''); }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={s.forgotWrap}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              label="Sign in"
              onPress={handleLogin}
              loading={loading}
              style={s.submitBtn}
            />

            <DividerText text="new to HobbyQuest?" />

            <GhostButton
              label="Create a free account"
              onPress={() => navigation.navigate('Register')}
              color={C.primaryContainer}
            />
          </View>

          <Text style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
            Securely encrypted · Built for learners
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primaryContainer },
  scrollContent: { flexGrow: 1 },

  // Brand sits directly on the navy background — no separate header box,
  // no arbitrary paddingBottom guess, just breathing room before the sheet.
  brandBlock: {
    alignItems: 'center',
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 64, height: 64,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  logoImage: { width: 36, height: 36 },
  appName:   { fontSize: F.xxl, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  tagline:   { fontSize: F.base, color: 'rgba(255,255,255,0.75)', marginTop: 6 },

  // Sheet — one continuous card holding all interactive content, rounded
  // only at the top so it reads as "rising up" from the brand block above.
  sheet: {
    flex: 1,
    backgroundColor: C.surfaceLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    ...SHADOW.lg,
  },
  sheetTitle: { fontSize: F.xl, fontWeight: '800', color: C.primary, marginBottom: 4 },
  sheetSub:   { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 20, lineHeight: 20 },

  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryFixed,
    borderRadius: R.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 22,
  },
  statItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statDivider: { width: 1, height: 24, backgroundColor: C.primaryFixedDim, marginHorizontal: 8 },
  statEmoji:   { fontSize: 16 },
  statText:    { fontSize: 11, color: C.primaryContainer, fontWeight: '700', flexShrink: 1, textAlign: 'center' },

  errorWrap: { marginBottom: 6 },

  fieldGroup: { gap: 14, marginBottom: 4 },

  forgotWrap:  { alignSelf: 'flex-end', marginTop: 6, marginBottom: 20 },
  forgotText:  { fontSize: F.sm, color: '#2980B9', fontWeight: '600' },

  submitBtn: { marginBottom: 4 },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: C.outline,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingTop: 20,
    backgroundColor: C.surfaceLowest,
  },
});