// src/screens/VibePickerModal.js
// Bottom sheet modal for logging a session.
// Vibe cards relabel based on hobby type (structured vs passion) — same
// backend enum values throughout, only display wording changes.
// Optional note (max 100 chars)
// Handles cooldown errors gracefully
// For passion projects: units stepper capped at 2, with real prompt preview

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { C, F, R, SHADOW } from '../theme';
import api from '../services/api';
import { buildVibes } from '../constants/vibeLabels';

const MAX_UNITS_PER_SESSION = 2;

export default function VibePickerModal({
  visible,
  skillId,
  progressId,
  skillName,
  unitLabel,
  currentPrompt, // the prompt for the 1st unit that would be marked
  nextPrompt,    // the prompt for the 2nd unit that would be marked (may be null near project end)
  onClose,
  onLogged,
}) {
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [note, setNote]                 = useState('');
  const [completedUnits, setCompletedUnits] = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // presence of progressId is the same signal already used elsewhere to mean
  // "this is a passion project session" vs a structured skill session
  const isPassion = !!progressId;
  const VIBES = useMemo(() => buildVibes(isPassion), [isPassion]);

  const maxUnits = progressId
    ? (nextPrompt ? MAX_UNITS_PER_SESSION : (currentPrompt ? 1 : 0))
    : 0;

  useEffect(() => {
    if (completedUnits > maxUnits) setCompletedUnits(maxUnits);
  }, [maxUnits]);

  function reset() {
    setSelectedVibe(null);
    setNote('');
    setCompletedUnits(0);
    setError('');
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // "Showed up anyway" (STRUGGLING) defaults the stepper to 0 — a sensible
  // starting assumption for a rough session — but never locks it. The user
  // can still bump it up if they genuinely finished something; vibe and
  // completed-units stay independent axes, same as every other vibe.
  function handleVibeSelect(vibeValue) {
    setSelectedVibe(vibeValue);
    setError('');
    if (vibeValue === 'STRUGGLING' && progressId) {
      setCompletedUnits(0);
    }
  }

  async function handleLog() {
    if (!selectedVibe) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = progressId
        ? `/user/projects/${progressId}/log`
        : `/user/skills/${skillId}/log`;
      const payload = {
        vibe: selectedVibe,
        note: note.trim() || null,
      };
      if (progressId) {
        payload.completedUnits = Number.isInteger(completedUnits) ? completedUnits : 0;
      }
      const { data } = await api.post(endpoint, payload);
      reset();
      onLogged(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not log session. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const ticked = [];
  if (completedUnits >= 1 && currentPrompt) ticked.push(currentPrompt);
  if (completedUnits >= 2 && nextPrompt) ticked.push(nextPrompt);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={handleClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kvWrapper}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.title}>How did this session feel?</Text>
            <Text style={s.subtitle}>{skillName}</Text>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={s.vibes}>
              {VIBES.map(vibe => {
                const selected = selectedVibe === vibe.value;
                return (
                  <TouchableOpacity
                    key={vibe.value}
                    onPress={() => handleVibeSelect(vibe.value)}
                    activeOpacity={0.82}
                    style={[
                      s.vibeCard,
                      { backgroundColor: vibe.bg, borderColor: vibe.border },
                      selected ? s.vibeCardSelected : s.vibeCardUnselected,
                    ]}
                  >
                    <View style={s.vibeEmojiWrap}>
                      <Text style={s.vibeEmoji}>{vibe.emoji}</Text>
                    </View>
                    <View style={s.vibeInfo}>
                      <Text style={[s.vibeLabel, { color: vibe.color }]}>{vibe.label}</Text>
                      <Text style={s.vibeDesc}>{vibe.desc}</Text>
                    </View>
                    <View style={s.vibeRight}>
                      <Text style={[s.vibeXp, { color: vibe.color }]}>{vibe.xp}</Text>
                      {selected
                        ? <Text style={[s.vibeCheck, { color: vibe.color }]}>✓</Text>
                        : <View style={[s.vibeRadio, { borderColor: vibe.border + '60' }]} />
                      }
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.capNote}>
                      Base XP shown — your session may earn less if you're close to today's XP cap for this {progressId ? 'project' : 'skill'}.
            </Text>

            {progressId && maxUnits > 0 && (
              <>
                <View style={localStyles.unitsRow}>
                  <Text style={s.noteLabel}>Completed:</Text>
                  <View style={localStyles.stepper}>
                    <TouchableOpacity onPress={() => setCompletedUnits(Math.max(0, completedUnits - 1))}>
                      <Text style={localStyles.stepperBtn}>–</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.stepperValue}>{completedUnits}</Text>
                    <TouchableOpacity onPress={() => setCompletedUnits(Math.min(maxUnits, completedUnits + 1))}>
                      <Text style={localStyles.stepperBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.noteCount}>{unitLabel || 'unit'}{completedUnits === 1 ? '' : 's'}</Text>
                </View>

                {ticked.length > 0 ? (
                  <View style={localStyles.promptPreview}>
                    <Text style={localStyles.promptPreviewLabel}>You're completing:</Text>
                    {ticked.map((p, i) => (
                      <Text key={i} style={localStyles.promptPreviewText} numberOfLines={2}>
                        ✓ {p}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </>
            )}

            <View style={s.noteSection}>
              <View style={s.noteLabelRow}>
                <Text style={s.noteLabel}>QUICK NOTE (OPTIONAL)</Text>
                <Text style={s.noteCount}>{note.length}/100</Text>
              </View>
              <TextInput
                style={s.noteInput}
                placeholder="What did you practise?"
                placeholderTextColor={C.outline}
                value={note}
                onChangeText={v => setNote(v.slice(0, 100))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleLog}
              disabled={!selectedVibe || loading}
              activeOpacity={0.85}
              style={[s.logBtn, (!selectedVibe || loading) && s.logBtnDisabled]}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={s.logBtnText}>Log session</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor:      C.surfaceLowest,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal:    20,
    paddingBottom:        Platform.OS === 'ios' ? 36 : 24,
    maxHeight:            '92%',
    ...SHADOW.lg,
  },
  handle: {
    width:           40, height: 4,
    backgroundColor: C.outlineVariant,
    borderRadius:    2,
    alignSelf:       'center',
    marginTop:       12, marginBottom: 20,
  },

  title:    { fontSize: F.xl, fontWeight: '700', color: C.primaryContainer, marginBottom: 4 },
  subtitle: { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 16 },

  errorBox:  { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.error },
  errorText: { color: '#93000A', fontSize: F.base },

  vibes:              { gap: 10, marginBottom: 20 },
  vibeCard:           { flexDirection: 'row', alignItems: 'center', borderRadius: R.xl, padding: 14, gap: 12 },
  vibeCardSelected:   { borderWidth: 2 },
  vibeCardUnselected: { borderWidth: 1, opacity: 0.85 },
  vibeEmojiWrap:      { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)' },
  vibeEmoji:          { fontSize: 26 },
  vibeInfo:           { flex: 1 },
  vibeLabel:          { fontSize: F.base, fontWeight: '700' },
  vibeDesc:           { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  vibeRight:          { alignItems: 'flex-end', gap: 4 },
  vibeXp:             { fontSize: F.sm, fontWeight: '700' },
  vibeCheck:          { fontSize: F.lg, fontWeight: '800' },
  vibeRadio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },

  noteSection:  { marginBottom: 20 },
  noteLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteLabel:    { fontSize: F.sm, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase' },
  noteCount:    { fontSize: F.sm, color: C.outline },
  noteInput: {
    borderWidth:    1.5,
    borderColor:    C.outlineVariant,
    borderRadius:   R.lg,
    padding:        14,
    fontSize:       F.base,
    color:          C.onSurface,
    backgroundColor:C.surfaceLowest,
    minHeight:      88,
  },

  logBtn: {
    height: 52, backgroundColor: C.primaryContainer,
    borderRadius: R.lg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...SHADOW.md,
  },
  logBtnDisabled: { opacity: 0.45 },
  logBtnText:  { color: C.white, fontSize: F.md, fontWeight: '700' },
  cancelBtn:   { alignItems: 'center', paddingVertical: 8 },
  cancelText:  { fontSize: F.base, color: C.onSurfaceVariant, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  capNote: { fontSize: F.xs, color: C.onSurfaceVariant, marginBottom: 16, fontStyle: 'italic' }
});

const localStyles = StyleSheet.create({
  unitsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceLowest, borderRadius: R.lg, padding: 6, borderWidth: 1, borderColor: C.outlineVariant },
  stepperBtn: { fontSize: F.xl, color: C.onSurface, paddingHorizontal: 8, paddingVertical: 2 },
  stepperValue: { fontSize: F.base, fontWeight: '800', minWidth: 34, textAlign: 'center', color: C.onSurface },
  promptPreview: {
    backgroundColor: C.passionLight,
    borderRadius: R.lg,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.passion + '40',
  },
  promptPreviewLabel: { fontSize: F.xs, fontWeight: '700', color: C.passion, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  promptPreviewText: { fontSize: F.sm, color: C.onSurface, lineHeight: 19, marginBottom: 4 },
});