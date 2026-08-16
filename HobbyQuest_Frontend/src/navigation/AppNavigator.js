// src/navigation/AppNavigator.js
// Auth flow:
//   'loading'    â†’ splash while checking SecureStore
//   'auth'       â†’ no token â†’ Login / Register
//   'onboarding' â†’ token + no user_preferences â†’ OnboardingStack
//   'app'        â†’ token + preferences done â†’ AppStack (Dashboard)

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet , Platform }  from 'react-native';
import { NavigationContainer }          from '@react-navigation/native';
import { createStackNavigator }         from '@react-navigation/stack';
import { createBottomTabNavigator }     from '@react-navigation/bottom-tabs';

import { C, F, R ,SHADOW}                      from '../theme';
import { clearToken, getToken, isLoggedIn } from '../services/api';
import api                              from '../services/api';
import { AuthContext, useAuth }         from '../services/AuthContext';

// â”€â”€ Screens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth
import LoginScreen              from '../screens/LoginScreen';
import RegisterScreen           from '../screens/RegisterScreen';

// Onboarding
import OnboardingScreen         from '../screens/OnboardingScreen';
import RecommendationsScreen    from '../screens/RecommendationsScreen';

// App â€” always present
import DashboardScreen          from '../screens/DashboardScreen';

// Sprint 3 â€” Structured hobby (all now fully active)
import RoadmapScreen            from '../screens/RoadmapScreen';
import SkillDetailScreen        from '../screens/SkillDetailScreen';
import RoadmapCompletionScreen  from '../screens/RoadmapCompletionScreen';

// Sprint 4 â€” Passion hobby
import PassionHomeScreen        from '../screens/PassionHomeScreen';
import ActiveProjectScreen      from '../screens/ActiveProjectScreen';
import CustomProjectScreen      from '../screens/CustomProjectCreationScreen';
import ProjectCompletionScreen  from '../screens/ProjectCompletionScreen';

// Sprint 5 â€” Community / Admin (uncomment when built)
import BrowseScreen             from '../screens/BrowseScreen';
import CommunityScreen          from '../screens/CommunityScreen';
import AdminDashboardScreen     from '../screens/admin/AdminDashboardScreen';
import PendingSuggestionsScreen from '../screens/admin/PendingSuggestionsScreen';
import GenerateContentScreen    from '../screens/admin/GenerateContentScreen';
import ReviewContentScreen      from '../screens/admin/ReviewContentScreen';
import CommunityModerationScreen from '../screens/admin/CommunityModerationScreen';
import PendingContentScreen from '../screens/admin/PendingContentScreen';

// Sprint 6 â€” Profile / Feedback (uncomment when built)
import ProfileScreen            from '../screens/ProfileScreen';
import FeedbackScreen           from '../screens/FeedbackScreen';
import SuggestionsBoardScreen from '../screens/SuggestionsBoardScreen';

import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import EditProfileScreen from '../screens/EditProfileScreen';

// â”€â”€ Auth Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Usage in any screen: const { signOut } = useAuth();
// NOTE: AuthContext is defined in ../services/AuthContext.js to avoid circular dependencies

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon ────────────────────────────────────────────────────────────────
function TabIcon({ emoji, label, focused }) {
  return (
    <View style={ti.wrap}>
      <View style={[ti.iconBg, focused && ti.iconBgActive]}>
        <Text style={ti.emoji}>{emoji}</Text>
      </View>
      <Text style={[ti.label, focused && ti.active]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}
const ti = StyleSheet.create({
  wrap:   { alignItems: 'center', justifyContent: 'center', width: 68, gap: 3 },
  iconBg: {
    width: 42, height: 28,
    borderRadius: R.full,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBgActive: { backgroundColor: C.primaryFixed },
  emoji:  { fontSize: 17 },
  label:  { fontSize: 10, color: C.onSurfaceVariant, fontWeight: '600' },
  active: { color: C.primaryContainer, fontWeight: '800' },
});

// â”€â”€ Bottom Tab Navigator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surfaceLowest,
          borderTopColor: C.outlineVariant,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          ...SHADOW.sm,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Browse" focused={focused} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Community" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
      />
      {/*
        Uncomment as each sprint's screens are built:

        Sprint 5:
        <Tab.Screen
          name="Browse"
          component={BrowseScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="ðŸ”" label="Browse" focused={focused} /> }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="ðŸ‘¥" label="Community" focused={focused} /> }}
        />

        Sprint 6:
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="ðŸ‘¤" label="Profile" focused={focused} /> }}
        />
      */}
    </Tab.Navigator>
  );
}

// â”€â”€ Auth Stack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// â”€â”€ Onboarding Stack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used for new users who have no user_preferences row yet.
// Must also include Sprint 3 screens so "enrol from recommendations" works.
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding"         component={OnboardingScreen} />
      <Stack.Screen name="Recommendations"    component={RecommendationsScreen} />
      {/* Allow navigation into the app from recommendations */}
      <Stack.Screen name="AppTabs"            component={AppTabs} />
      {/* Sprint 3 */}
      <Stack.Screen name="Roadmap"            component={RoadmapScreen} />
      <Stack.Screen name="SkillDetail"        component={SkillDetailScreen} />
      <Stack.Screen name="RoadmapCompletion"  component={RoadmapCompletionScreen} />
      <Stack.Screen name="PassionHome"       component={PassionHomeScreen} />
      <Stack.Screen name="ActiveProject"     component={ActiveProjectScreen} />
      <Stack.Screen name="CustomProject"     component={CustomProjectScreen} />
      <Stack.Screen name="ProjectCompletion" component={ProjectCompletionScreen} />
      <Stack.Screen name="Feedback"          component={FeedbackScreen} />
      <Stack.Screen name="SuggestionsBoard" component={SuggestionsBoardScreen} />
    </Stack.Navigator>
  );
}

// â”€â”€ App Stack (authenticated + onboarded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* â”€â”€ Root tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Stack.Screen name="AppTabs"            component={AppTabs} />

      {/* â”€â”€ Onboarding (re-accessible if skipped) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Stack.Screen name="Onboarding"         component={OnboardingScreen} />
      <Stack.Screen name="Recommendations"    component={RecommendationsScreen} />

      {/* â”€â”€ Sprint 3: Structured hobby â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Stack.Screen name="Roadmap"            component={RoadmapScreen} />
      <Stack.Screen name="SkillDetail"        component={SkillDetailScreen} />
      <Stack.Screen name="RoadmapCompletion"  component={RoadmapCompletionScreen} />

      <Stack.Screen name="PassionHome"       component={PassionHomeScreen} />
      <Stack.Screen name="ActiveProject"     component={ActiveProjectScreen} />
      <Stack.Screen name="CustomProject"     component={CustomProjectScreen} />
      <Stack.Screen name="ProjectCompletion" component={ProjectCompletionScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      {/*
        â”€â”€ Sprint 5: Community + Admin (uncomment when built) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        <Stack.Screen name="Browse"            component={BrowseScreen} />
        <Stack.Screen name="Community"         component={CommunityScreen} />
      */}

      {/*
        â”€â”€ Sprint 6: Profile + Feedback (uncomment when built) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        <Stack.Screen name="Profile"           component={ProfileScreen} />
        <Stack.Screen name="Feedback"          component={FeedbackScreen} />
      */}
      <Stack.Screen name="Feedback"          component={FeedbackScreen} />
      <Stack.Screen name="SuggestionsBoard"  component={SuggestionsBoardScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="PendingSuggestions" component={PendingSuggestionsScreen} />
      <Stack.Screen name="PendingContent" component={PendingContentScreen} />
      <Stack.Screen name="GenerateContent" component={GenerateContentScreen} />
      <Stack.Screen name="ReviewContent" component={ReviewContentScreen} />
      <Stack.Screen name="CommunityModeration" component={CommunityModerationScreen} />
      
    </Stack.Navigator>
  );
}

function getRoleFromToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let decoded = '';
    let buffer = 0;
    let bits = 0;
    for (const char of payload) {
      const value = table.indexOf(char);
      if (value < 0 || char === '=') continue;
      buffer = (buffer << 6) | value;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        decoded += String.fromCharCode((buffer >> bits) & 255);
      }
    }
    return JSON.parse(decoded).role || 'USER';
  } catch {
    return 'USER';
  }
}

// â”€â”€ Root Navigator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AppNavigator() {
  const [state, setState] = useState('loading');
  const [role, setRole] = useState('USER');

  useEffect(() => { checkAuthStatus(); }, []);

async function checkAuthStatus() {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) { setState('auth'); return; }
    const token = await getToken();
    const currentRole = getRoleFromToken(token || '');
    setRole(currentRole);

    if (currentRole === 'ADMIN') {
      setState('app');   // admins bypass onboarding entirely
      return;
    }

    const { data } = await api.get('/user/onboarding/status');
    setState(data.onboardingComplete ? 'app' : 'onboarding');
  } catch {
    await clearToken();
    setState('auth');
  }
}

  const authContext = {
signIn: async () => {
  try {
    const token = await getToken();
    const currentRole = getRoleFromToken(token || '');
    setRole(currentRole);

    if (currentRole === 'ADMIN') {
      setState('app');
      return;
    }

    const { data } = await api.get('/user/onboarding/status');
    setState(data.onboardingComplete ? 'app' : 'onboarding');
  } catch {
    setState('app');
  }
},
    signOut: async () => {
      await clearToken();
      setState('auth');
    },
  };

  // â”€â”€ Splash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (state === 'loading') {
    return (
      <View style={splash.wrap}>
        <View style={splash.logoBox}>
          <Text style={{ fontSize: 38 }}>ðŸŽ¯</Text>
        </View>
        <Text style={splash.name}>HobbyQuest</Text>
        <ActivityIndicator
          color="rgba(255,255,255,0.6)"
          size="small"
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {state === 'auth'       && <AuthStack />}
        {state === 'onboarding' && <OnboardingStack />}
        {state === 'app'        && (role === 'ADMIN' ? <AdminStack /> : <AppStack />)}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

// â”€â”€â”€ Splash styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const splash = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  name: {
    fontSize: F.xxl,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
});
