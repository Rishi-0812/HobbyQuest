import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { C, F, R, SHADOW } from '../theme';

// Reusable top-sliding toast. Pass visible=true to slide in, false to slide out.
// This same component is the foundation for later XP/level-up/unlock popups.
export default function SlideToast({ visible, message, emoji = '✅', color = C.completed, bg }) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -120,
      useNativeDriver: true,
      damping: 14,
      mass: 0.9,
      stiffness: 140,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        st.wrap,
        { transform: [{ translateY }], borderColor: color, backgroundColor: bg || C.surfaceLowest },
      ]}
    >
      <Text style={st.emoji}>{emoji}</Text>
      <Text style={[st.text, { color }]} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    marginTop: 54, // clears status bar / notch on most devices
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: R.lg,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 10,
    ...SHADOW.lg,
  },
  emoji: { fontSize: 20 },
  text: { fontSize: F.base, fontWeight: '700', flex: 1 },
});