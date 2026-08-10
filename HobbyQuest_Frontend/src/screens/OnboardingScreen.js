// src/screens/OnboardingScreen.js
// 4+1 step onboarding questionnaire.
// Steps 1-4 match the Stitch AI designs provided.
// Step 5 = broad interest category checkboxes.
// LOGIC IS UNCHANGED — only questions, options, and colors updated.
// All colors use correct C.* names from theme.js.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { PrimaryButton } from '../components/components';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// STEP DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  // ── Step 1: Location + Energy (two questions, one screen) ─────────────────
  {
    id:        'location_energy',
    type:      'location_energy',
    field1:    'locationPreference',
    field2:    'energyLevel',
    question1: 'Where do you want to do your hobby?',
    question2: 'What energy level suits you?',
    options1: [
      { value: 'indoor',  label: 'At home alone', emoji: '🏠' },
      { value: 'social',  label: 'With others',   emoji: '👥' },
      { value: 'venue',   label: 'At a venue',    emoji: '🏢' },
      { value: 'outdoor', label: 'Outdoors',      emoji: '🌿' },
    ],
    options2: [
      { value: 'calm',     label: 'Calm',     emoji: '😌' },
      { value: 'light',    label: 'Light',    emoji: '🚶' },
      { value: 'moderate', label: 'Moderate', emoji: '💪' },
      { value: 'intense',  label: 'Intense',  emoji: '🔥' },
    ],
  },

  // ── Step 2: Motivation (single radio card) ────────────────────────────────
  {
    id:       'motivation',
    type:     'radio',
    emoji:    '🎯',
    question: 'What pulls you toward a hobby?',
    subtitle: 'Pick the one that resonates most.',
    field:    'motivation',
    options: [
      { value: 'build',      emoji: '🔨', label: 'Build or make something physical',  desc: 'Crafting, constructing, shaping — working with materials' },
      { value: 'understand', emoji: '🔍', label: 'Figure out how it works',           desc: 'Puzzles, systems, analysis — the pull is understanding' },
      { value: 'create',     emoji: '🎨', label: 'Create something expressive',       desc: 'Art, writing, music — putting your voice into what you make' },
      { value: 'compete',    emoji: '🏆', label: 'Compete, perform, or level up',     desc: 'Rankings, skill curves, performing — the drive to improve' },
      { value: 'master',     emoji: '🧠', label: 'Master a precise craft',            desc: 'Chess, calligraphy, code — doing it the correct way is the reward' },
    ],
  },

  // ── Step 3: Budget (single radio card) ───────────────────────────────────
  {
    id:       'budget',
    type:     'radio',
    emoji:    '💰',
    question: 'What is your starting budget?',
    subtitle: 'We only show hobbies you can realistically start.',
    field:    'budgetRange',
    options: [
      { value: 'free',   emoji: '🆓', label: 'Free only',       desc: 'No money, no equipment needed'       },
      { value: 'low',    emoji: '💵', label: 'Low budget',       desc: 'Under RM 50 to get started'         },
      { value: 'medium', emoji: '💎', label: 'Happy to invest',  desc: 'If I enjoy it, I will spend on it'  },
    ],
  },

  // ── Step 4: Depth + Mental load (two questions, one screen) ──────────────
  {
    id:        'depth_mental',
    type:      'depth_mental',
    field1:    'depthPreference',
    field2:    'mentalLoad',
    question1: 'How deep do you want to go?',
    question2: 'Mental load preference?',
    options1: [
      { value: 'fun',    emoji: '😊', label: 'Just for fun', desc: 'No pressure'      },
      { value: 'good',   emoji: '📈', label: 'Get good',     desc: 'Worth climbing'   },
      { value: 'master', emoji: '🎯', label: 'Master it',    desc: 'Lifelong pursuit' },
    ],
    options2: [
      { value: 'switch_off',    emoji: '🧘', label: 'Switch off'   },
      { value: 'light_focus',   emoji: '🎯', label: 'Light focus'  },
      { value: 'deep_thinking', emoji: '🤔', label: 'Deep thinking'},
    ],
  },

  // ── Step 5: Interest categories (multi-select checkboxes, pick 3–4) ───────
  {
    id:        'interest_tags',
    type:      'categories',
    emoji:     '✨',
    question:  'What kind of things interest you?',
    subtitle:  'Pick 3 or 4 broad areas — we\'ll find the best hobbies inside them.',
    field:     'interestTags',
    maxSelect: 4,
    minSelect: 3,
    // Each value maps to hobby tags used by the recommendation engine
    options: [
      { value: 'creative',     label: 'Creative',     emoji: '🎨', tags: ['creative','art','drawing','watercolour'] },
      { value: 'art',          label: 'Art',          emoji: '🖼️', tags: ['art','drawing','creative','calligraphy'] },
      { value: 'music',        label: 'Music',        emoji: '🎵', tags: ['music','instruments','singing'] },
      { value: 'performance',  label: 'Performance',  emoji: '🎭', tags: ['performance','dexterity','pen-spinning','card-tricks','juggling'] },
      { value: 'strategy',     label: 'Strategy',     emoji: '♟️', tags: ['strategy','chess','puzzles','analytical'] },
      { value: 'dexterity',    label: 'Dexterity',    emoji: '🤹', tags: ['dexterity','performance','skill','precision'] },
      { value: 'fitness',      label: 'Fitness',      emoji: '🏃', tags: ['fitness','sports','movement','martial-arts'] },
      { value: 'cooking',      label: 'Cooking',      emoji: '🍳', tags: ['cooking','baking','food','recipe'] },
      { value: 'writing',      label: 'Writing',      emoji: '✍️', tags: ['writing','creative-writing','poetry','storytelling'] },
      { value: 'crafts',       label: 'Crafts',       emoji: '🧶', tags: ['crafts','diy','knitting','origami','making'] },
      { value: 'outdoor',      label: 'Outdoor',      emoji: '🌿', tags: ['outdoor','nature','gardening','photography'] },
      { value: 'mindfulness',  label: 'Mindfulness',  emoji: '🧘', tags: ['mindfulness','calm','journaling','reading'] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// 2×2 grid card selector — used for location (step 1)
function GridSelector({ options, selected, onSelect, cols = 2 }) {
  const cardWidth = cols === 2 ? '47%' : '30%';
  return (
    <View style={gc.grid}>
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
            style={[gc.card, { width: cardWidth }, active ? gc.cardActive : gc.cardInactive]}
          >
            <Text style={gc.emoji}>{opt.emoji}</Text>
            <Text style={[gc.label, active && gc.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const gc = StyleSheet.create({
  grid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  card:        { borderRadius: R.xl, paddingVertical: 18, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  cardActive:  { backgroundColor: C.secondaryFixed, borderWidth: 2, borderColor: C.secondary },
  cardInactive:{ backgroundColor: C.surfaceLowest,  borderWidth: 1, borderColor: C.outlineVariant },
  emoji:       { fontSize: 26 },
  label:       { fontSize: F.sm, fontWeight: '600', color: C.onSurfaceVariant, textAlign: 'center' },
  labelActive: { color: C.secondary },
});

// Horizontal pill selector — used for energy (step 1) and mental load (step 4)
function PillRow({ options, selected, onSelect }) {
  return (
    <View style={pr.row}>
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
            style={[pr.pill, active ? pr.pillActive : pr.pillInactive]}
          >
            <Text style={pr.emoji}>{opt.emoji}</Text>
            <Text style={[pr.label, active && pr.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const pr = StyleSheet.create({
  row:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.full },
  pillActive:  { backgroundColor: C.secondary },
  pillInactive:{ backgroundColor: C.surfaceLowest, borderWidth: 1, borderColor: C.outlineVariant },
  emoji:       { fontSize: 16 },
  label:       { fontSize: F.sm, fontWeight: '600', color: C.onSurfaceVariant },
  labelActive: { color: C.white },
});

// Full-width radio card — used for motivation (step 2) and budget (step 3)
function RadioCard({ option, selected, onSelect }) {
  const active = selected === option.value;
  return (
    <TouchableOpacity
      onPress={() => onSelect(option.value)}
      activeOpacity={0.8}
      style={[rc.card, active ? rc.cardActive : rc.cardInactive]}
    >
      <Text style={rc.emoji}>{option.emoji}</Text>
      <View style={rc.info}>
        <Text style={[rc.label, active && rc.labelActive]}>{option.label}</Text>
        {option.desc ? <Text style={rc.desc}>{option.desc}</Text> : null}
      </View>
      <View style={[rc.radio, active && rc.radioActive]}>
        {active && <View style={rc.dot} />}
      </View>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  card:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.xl, marginBottom: 10 },
  cardActive:  { backgroundColor: C.secondaryFixed, borderWidth: 2,   borderColor: C.secondary     },
  cardInactive:{ backgroundColor: C.surfaceLowest,  borderWidth: 1.5, borderColor: C.outlineVariant, ...SHADOW.sm },
  emoji:       { fontSize: 26 },
  info:        { flex: 1 },
  label:       { fontSize: F.base, fontWeight: '600', color: C.onSurface },
  labelActive: { color: C.onSurface },
  desc:        { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  radio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.secondary },
  dot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: C.secondary },
});

// 3-column square grid — used for depth (step 4)
function SquareGrid({ options, selected, onSelect }) {
  return (
    <View style={sg.grid}>
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
            style={[sg.card, active ? sg.cardActive : sg.cardInactive]}
          >
            <Text style={sg.emoji}>{opt.emoji}</Text>
            <Text style={[sg.label, active && sg.labelActive]}>{opt.label}</Text>
            <Text style={sg.desc}>{opt.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const sg = StyleSheet.create({
  grid:        { flexDirection: 'row', gap: 10 },
  card:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: R.xl, aspectRatio: 1 },
  cardActive:  { backgroundColor: C.secondaryFixed, borderWidth: 2, borderColor: C.secondary },
  cardInactive:{ backgroundColor: C.surfaceLowest,  borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.sm },
  emoji:       { fontSize: 22, marginBottom: 6 },
  label:       { fontSize: 11, fontWeight: '700', color: C.onSurface, textAlign: 'center' },
  labelActive: { color: C.secondary },
  desc:        { fontSize: 10, color: C.outline, textAlign: 'center', marginTop: 2 },
});

// Full-width pill with check — used for mental load (step 4)
function PillList({ options, selected, onSelect }) {
  return (
    <View style={pl.col}>
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
            style={[pl.pill, active ? pl.pillActive : pl.pillInactive]}
          >
            <View style={pl.left}>
              <Text style={pl.emoji}>{opt.emoji}</Text>
              <Text style={[pl.label, active && pl.labelActive]}>{opt.label}</Text>
            </View>
            {active && <Text style={pl.check}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const pl = StyleSheet.create({
  col:         { gap: 10 },
  pill:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderRadius: R.full },
  pillActive:  { backgroundColor: C.secondary },
  pillInactive:{ backgroundColor: C.surfaceLowest, borderWidth: 1, borderColor: C.outlineVariant },
  left:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji:       { fontSize: 20 },
  label:       { fontSize: F.base, fontWeight: '600', color: C.onSurface },
  labelActive: { color: C.white },
  check:       { color: C.white, fontWeight: '700', fontSize: F.base },
});

// Checkbox grid — used for interest categories (step 5)
// 3-column wrap grid with emoji + label + checkbox indicator
function CategoryCheckboxes({ options, selected, onSelect, max }) {
  return (
    <View style={cb.grid}>
      {options.map(opt => {
        const active = (selected || []).includes(opt.value);
        const maxed  = !active && (selected || []).length >= max;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => !maxed && onSelect(opt.value)}
            activeOpacity={0.8}
            style={[
              cb.card,
              active  && cb.cardActive,
              maxed   && cb.cardDisabled,
            ]}
          >
            {/* Checkbox indicator top-right */}
            <View style={[cb.checkBox, active && cb.checkBoxActive]}>
              {active && <Text style={cb.checkMark}>✓</Text>}
            </View>

            <Text style={cb.emoji}>{opt.emoji}</Text>
            <Text style={[cb.label, active && cb.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const cb = StyleSheet.create({
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  card:          {
    width: '30%', aspectRatio: 1,
    borderRadius: R.xl, borderWidth: 1.5, borderColor: C.outlineVariant,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    ...SHADOW.sm,
  },
  cardActive:    { borderColor: C.secondary, backgroundColor: C.secondaryFixed, borderWidth: 2 },
  cardDisabled:  { opacity: 0.4 },
  checkBox:      {
    position: 'absolute', top: 7, right: 7,
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: C.outlineVariant,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive:{ backgroundColor: C.secondary, borderColor: C.secondary },
  checkMark:     { color: C.white, fontSize: 11, fontWeight: '800', lineHeight: 14 },
  emoji:         { fontSize: 28, marginBottom: 4 },
  label:         { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant, textAlign: 'center' },
  labelActive:   { color: C.secondary },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers]         = useState({
    locationPreference: '',
    energyLevel:        '',
    motivation:         '',
    budgetRange:        '',
    depthPreference:    '',
    mentalLoad:         '',
    interestTags:       [],
  });
  const [loading, setLoading] = useState(false);

  const step = STEPS[currentStep];

  // ── Selection helpers ────────────────────────────────────────────────────
  function setSingle(field, value) {
    setAnswers(a => ({ ...a, [field]: value }));
  }

  function toggleCategory(value) {
    setAnswers(a => {
      const current = a.interestTags || [];
      if (current.includes(value)) {
        return { ...a, interestTags: current.filter(v => v !== value) };
      }
      if (current.length >= STEPS[4].maxSelect) return a; // max reached
      return { ...a, interestTags: [...current, value] };
    });
  }

  // ── Can continue? ────────────────────────────────────────────────────────
  function canProceed() {
    switch (step.type) {
      case 'location_energy':
        return !!answers.locationPreference && !!answers.energyLevel;
      case 'radio':
        return !!answers[step.field];
      case 'depth_mental':
        return !!answers.depthPreference && !!answers.mentalLoad;
      case 'categories':
        return answers.interestTags.length >= step.minSelect;
      default:
        return false;
    }
  }

  // ── Build flat interest tags from selected categories ────────────────────
  // Maps broad category values → specific hobby tags for the recommendation engine
  function buildInterestTags() {
    const catMap = Object.fromEntries(
      STEPS[4].options.map(o => [o.value, o.tags])
    );
    const flat = answers.interestTags.flatMap(v => catMap[v] || []);
    return [...new Set(flat)]; // deduplicate
  }

  // ── Map motivation → hobby type preference ───────────────────────────────
  function motivationToType(m) {
    const map = {
      build:      'both',
      understand: 'structured',
      create:     'passion',
      compete:    'structured',
      master:     'structured',
    };
    return map[m] || 'both';
  }

  // ── Handle next / submit ─────────────────────────────────────────────────
  async function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      return;
    }

    // Final step — submit to backend
    setLoading(true);
    try {
      await api.post('/user/onboarding', {
        hobbyTypePreference: motivationToType(answers.motivation),
        locationPreference:  answers.locationPreference,
        budgetRange:         answers.budgetRange,
        energyLevel:         answers.energyLevel,
        depthPreference:     answers.depthPreference,
        mentalLoad:          answers.mentalLoad,
        interestTags:        buildInterestTags(),
      });
      navigation.replace('Recommendations');
    } catch (err) {
      console.error('Onboarding submit error:', err);
    } finally {
      setLoading(false);
    }
  }

  const isLast    = currentStep === STEPS.length - 1;
  const progress  = (currentStep + 1) / STEPS.length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.secondary} />

      {/* ── Purple header bar ──────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => currentStep > 0 && setCurrentStep(p => p - 1)}
          style={s.headerSide}
        >
          {currentStep > 0 && <Text style={s.backText}>←</Text>}
        </TouchableOpacity>

        {/* Step dots */}
        <View style={s.dotsWrap}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i === currentStep ? s.dotActive : s.dotInactive]} />
          ))}
        </View>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => navigation.replace('Recommendations')}
          style={[s.headerSide, { alignItems: 'flex-end' }]}
        >
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── STEP 1: Location + Energy ─────────────────────────────── */}
        {step.type === 'location_energy' && (
          <>
            <Text style={s.question}>{step.question1}</Text>
            <GridSelector
              options={step.options1}
              selected={answers.locationPreference}
              onSelect={v => setSingle('locationPreference', v)}
              cols={2}
            />
            <View style={s.spacer} />
            <Text style={s.question}>{step.question2}</Text>
            <PillRow
              options={step.options2}
              selected={answers.energyLevel}
              onSelect={v => setSingle('energyLevel', v)}
            />
          </>
        )}

        {/* ── STEP 2: Motivation ───────────────────────────────────── */}
        {step.type === 'radio' && step.id === 'motivation' && (
          <>
            <View style={s.heroHeader}>
              <Text style={s.heroEmoji}>{step.emoji}</Text>
              <Text style={s.heroQuestion}>{step.question}</Text>
              <Text style={s.heroSub}>{step.subtitle}</Text>
            </View>
            {step.options.map(opt => (
              <RadioCard
                key={opt.value}
                option={opt}
                selected={answers.motivation}
                onSelect={v => setSingle('motivation', v)}
              />
            ))}
          </>
        )}

        {/* ── STEP 3: Budget ───────────────────────────────────────── */}
        {step.type === 'radio' && step.id === 'budget' && (
          <>
            <View style={s.heroHeader}>
              <Text style={s.heroEmoji}>{step.emoji}</Text>
              <Text style={s.heroQuestion}>{step.question}</Text>
              <Text style={s.heroSub}>{step.subtitle}</Text>
            </View>
            {step.options.map(opt => (
              <RadioCard
                key={opt.value}
                option={opt}
                selected={answers.budgetRange}
                onSelect={v => setSingle('budgetRange', v)}
              />
            ))}
          </>
        )}

        {/* ── STEP 4: Depth + Mental load ──────────────────────────── */}
        {step.type === 'depth_mental' && (
          <>
            <Text style={s.question}>{step.question1}</Text>
            <SquareGrid
              options={step.options1}
              selected={answers.depthPreference}
              onSelect={v => setSingle('depthPreference', v)}
            />
            <View style={s.spacer} />
            <Text style={s.question}>{step.question2}</Text>
            <PillList
              options={step.options2}
              selected={answers.mentalLoad}
              onSelect={v => setSingle('mentalLoad', v)}
            />
          </>
        )}

        {/* ── STEP 5: Interest categories ──────────────────────────── */}
        {step.type === 'categories' && (
          <>
            <View style={s.heroHeader}>
              <Text style={s.heroEmoji}>{step.emoji}</Text>
              <Text style={s.heroQuestion}>{step.question}</Text>
              <Text style={s.heroSub}>{step.subtitle}</Text>
            </View>

            {/* Counter badge */}
            <View style={s.counterRow}>
              <View style={[
                s.counter,
                answers.interestTags.length >= step.minSelect && s.counterDone,
              ]}>
                <Text style={[
                  s.counterText,
                  answers.interestTags.length >= step.minSelect && s.counterTextDone,
                ]}>
                  {answers.interestTags.length} / {step.maxSelect} selected
                  {answers.interestTags.length < step.minSelect
                    ? `  (pick at least ${step.minSelect})`
                    : '  ✓'}
                </Text>
              </View>
            </View>

            <CategoryCheckboxes
              options={step.options}
              selected={answers.interestTags}
              onSelect={toggleCategory}
              max={step.maxSelect}
            />
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Fixed bottom CTA ───────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed() || loading}
          activeOpacity={0.85}
          style={[
            s.continueBtn,
            (!canProceed() || loading) && s.continueBtnDisabled,
          ]}
        >
          <Text style={s.continueBtnText}>
            {loading ? 'Finding hobbies...' : isLast ? 'Find my hobbies →' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    backgroundColor:  C.secondary,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingVertical:  14,
    paddingTop: Platform.OS === 'android' ? 14 : 14,
  },
  headerSide: { width: 48 },
  backText:   { color: C.white, fontSize: F.lg, fontWeight: '300' },
  dotsWrap:   { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  dotActive:    { backgroundColor: C.white },
  dotInactive:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
  skipText:   { color: 'rgba(255,255,255,0.75)', fontSize: F.base, fontWeight: '600' },

  // Progress bar below header
  progressTrack:{ height: 3, backgroundColor: 'rgba(88,79,188,0.15)' },
  progressFill: { height: 3, backgroundColor: C.secondary },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },

  // Hero header (steps 2, 3, 5)
  heroHeader:   { alignItems: 'center', marginBottom: 24 },
  heroEmoji:    { fontSize: 44, marginBottom: 12 },
  heroQuestion: { fontSize: F.xl, fontWeight: '700', color: C.onSurface, textAlign: 'center', lineHeight: 30 },
  heroSub:      { fontSize: F.base, color: C.onSurfaceVariant, textAlign: 'center', marginTop: 6, lineHeight: 22 },

  // Question label (steps 1, 4)
  question: { fontSize: F.lg, fontWeight: '700', color: C.primary, marginBottom: 14 },
  spacer:   { height: 28 },

  // Counter badge (step 5)
  counterRow:       { alignItems: 'center', marginBottom: 16 },
  counter:          { backgroundColor: C.surfaceContainerHigh, paddingHorizontal: 16, paddingVertical: 6, borderRadius: R.full },
  counterDone:      { backgroundColor: C.tealLight },
  counterText:      { fontSize: F.sm, color: C.onSurfaceVariant, fontWeight: '600' },
  counterTextDone:  { color: C.teal },

  // Footer button
  footer: {
    paddingHorizontal: 20,
    paddingBottom:  Platform.OS === 'ios' ? 36 : 24,
    paddingTop:     12,
    backgroundColor: C.background,
    borderTopWidth:  1,
    borderTopColor:  C.outlineVariant,
  },
  continueBtn: {
    height:          52,
    borderRadius:    R.lg,
    backgroundColor: C.secondary,
    alignItems:      'center',
    justifyContent:  'center',
    ...SHADOW.md,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: {
    color:       C.white,
    fontSize:    F.md,
    fontWeight:  '700',
    letterSpacing: 0.3,
  },
});