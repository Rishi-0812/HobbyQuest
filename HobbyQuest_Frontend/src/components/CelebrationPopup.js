// src/components/CelebrationPopup.js
// Center-screen bordered popup for XP/completion events — distinct from
// SlideToast, which stays reserved for quick enroll/unenroll confirmations.
// Reused by SkillDetailScreen (structured) and ActiveProjectScreen (passion).

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F, R, SHADOW } from '../theme';

// accentColor: C.indigo for structured hobbies, C.passion for passion hobbies
export default function CelebrationPopup({ visible, onDismiss, xpEarned, accentColor = C.indigo, lines = [] }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={cp.overlay} pointerEvents="box-none">
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onDismiss}
      />
      <Animated.View style={[cp.card, { borderColor: accentColor, transform: [{ scale }], opacity }]}>
        <View style={[cp.accentStrip, { backgroundColor: accentColor }]} />

        <Text style={[cp.xpValue, { color: accentColor }]}>+{xpEarned || 0} XP</Text>

        {lines.length > 0 ? (
          <View style={cp.linesWrap}>
            {lines.map((line, i) => (
              <View key={i} style={cp.line}>
                <Text style={cp.lineEmoji}>{line.emoji}</Text>
                <Text style={cp.lineText}>{line.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity onPress={onDismiss} style={[cp.dismissBtn, { backgroundColor: accentColor }]}>
          <Text style={cp.dismissText}>Nice!</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const cp = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 200,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xxl,
    borderWidth: 2,
    paddingTop: 0,
    paddingBottom: 22,
    paddingHorizontal: 24,
    overflow: 'hidden',
    alignItems: 'center',
    ...SHADOW.lg,
  },
  accentStrip: {
    width: '100%',
    height: 8,
    marginBottom: 20,
  },
  xpValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 14,
  },
  linesWrap: {
    width: '100%',
    gap: 10,
    marginBottom: 18,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lineEmoji: { fontSize: 18 },
  lineText: { fontSize: F.sm, fontWeight: '700', color: C.onSurface, flex: 1 },
  dismissBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: R.full,
  },
  dismissText: { color: C.white, fontSize: F.base, fontWeight: '800' },
});