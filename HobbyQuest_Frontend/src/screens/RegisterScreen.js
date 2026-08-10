// src/screens/RegisterScreen.js
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

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    if (apiError)    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.name.trim())              e.name    = 'Name is required';
    if (!form.email.includes('@'))      e.email   = 'Enter a valid email address';
    if (form.password.length < 6)       e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      await saveToken(data.token);
      await signIn();
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data || err.message);
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
          <View style={[s.brandBlock, { paddingTop: insets.top + 32 }]}>
            <View style={s.logoWrap}>
              <Image
                source={require('../../assets/logo-placeholder.png')}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={s.appName}>HobbyQuest</Text>
            <Text style={s.tagline}>Your hobby journey starts here</Text>
          </View>

          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Create account</Text>
            <Text style={s.sheetSub}>Join thousands building better hobby habits</Text>

            {apiError ? (
              <View style={s.errorWrap}>
                <ErrorBanner message={apiError} />
              </View>
            ) : null}

            <View style={s.fieldGroup}>
              <InputField
                label="Full name"
                placeholder="Enter your full name"
                value={form.name}
                onChangeText={v => set('name', v)}
                error={errors.name}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <InputField
                label="Email address"
                placeholder="name@example.com"
                value={form.email}
                onChangeText={v => set('email', v)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <InputField
                label="Password"
                placeholder="Create a password"
                value={form.password}
                onChangeText={v => set('password', v)}
                error={errors.password}
                secureTextEntry
                returnKeyType="next"
              />
              <InputField
                label="Confirm password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChangeText={v => set('confirm', v)}
                error={errors.confirm}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <PrimaryButton
              label="Create my account"
              onPress={handleRegister}
              loading={loading}
              style={s.submitBtn}
            />

            <DividerText text="already have an account?" />

            <GhostButton
              label="Sign in instead"
              onPress={() => navigation.navigate('Login')}
              color={C.primaryContainer}
            />
          </View>

          <View style={[s.anchorWrap, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.anchor} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primaryContainer },
  scrollContent: { flexGrow: 1 },

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
  sheetSub:   { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 22, lineHeight: 20 },

  errorWrap: { marginBottom: 6 },

  fieldGroup: { gap: 14, marginBottom: 20 },

  submitBtn: { marginBottom: 4 },

  anchorWrap: {
    alignItems: 'center',
    backgroundColor: C.surfaceLowest,
    paddingTop: 24,
  },
  anchor: {
    width: 80, height: 4,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: R.full,
  },
});