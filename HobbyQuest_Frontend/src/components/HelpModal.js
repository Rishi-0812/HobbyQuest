import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F, R, SHADOW } from '../theme';

export default function HelpModal({ visible, onClose, title, sections = [] }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>{title || 'How this works'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {sections.map((sec, i) => (
              <View key={i} style={s.section}>
                <Text style={s.sectionEmoji}>{sec.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionTitle}>{sec.title}</Text>
                  <Text style={s.sectionBody}>{sec.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: C.surfaceLowest, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, ...SHADOW.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: F.xl, fontWeight: '800', color: C.primary, marginBottom: 16 },
  section: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  sectionEmoji: { fontSize: 24 },
  sectionTitle: { fontSize: F.base, fontWeight: '800', color: C.onSurface, marginBottom: 3 },
  sectionBody: { fontSize: F.sm, color: C.onSurfaceVariant, lineHeight: 20 },
  closeBtn: { marginTop: 8, backgroundColor: C.primaryContainer, borderRadius: R.lg, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: C.white, fontWeight: '800', fontSize: F.base },
});