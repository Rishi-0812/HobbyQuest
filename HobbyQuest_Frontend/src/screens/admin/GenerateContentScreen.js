import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../theme';
import { card, header, layout, section } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';
import { useAuth } from '../../services/AuthContext';

const MODES = {
  ROADMAP: 'roadmap',
  PROJECT: 'project',
};

export default function GenerateContentScreen({ navigation, route }) {
  const { signOut } = useAuth();
  const initialMode = route.params?.mode === MODES.PROJECT ? MODES.PROJECT : MODES.ROADMAP;
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passionHobbies, setPassionHobbies] = useState([]);

  const [roadmap, setRoadmap] = useState({
    hobbyName: route.params?.prefillHobbyName || '',
    difficulty: 'Beginner',
    extraGuidance: '',
  });

const [project, setProject] = useState({
  targetHobbyId: null,
  creatingNew: false,
  newHobbyName: '',
  newHobbyDescription: '',
  concept: '',
  targetCount: '30',
  unitLabel: '',
  unitLabelPlural: '',
  durationDays: '',
});


  useEffect(() => {
    api.get('/hobbies?type=passion')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setPassionHobbies(list);
        if (!project.targetHobbyId && list.length) {
          setProject(prev => ({ ...prev, targetHobbyId: list[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const selectedHobby = useMemo(
    () => passionHobbies.find(h => h.id === project.targetHobbyId),
    [passionHobbies, project.targetHobbyId]
  );

  async function submit() {
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === MODES.ROADMAP) {
        ({ data } = await api.post('/admin/hobbies/generate', {
          hobbyName: roadmap.hobbyName.trim(),
          difficulty: roadmap.difficulty,
          extraGuidance: roadmap.extraGuidance.trim() || null,
        }));
      } else {
      // inside submit(), project branch:
      ({ data } = await api.post('/admin/projects/generate', {
        targetHobbyId: project.creatingNew ? null : project.targetHobbyId,
        newHobbyName: project.creatingNew ? project.newHobbyName.trim() : null,
        newHobbyDescription: project.creatingNew ? project.newHobbyDescription.trim() : null,
        concept: project.concept.trim(),
        targetCount: Number(project.targetCount),
        unitLabel: project.unitLabel.trim(),
        unitLabelPlural: project.unitLabelPlural.trim() || null,
        durationDays: project.durationDays.trim() ? Number(project.durationDays) : null,
      }));
      }
      navigation.replace('ReviewContent', { contentId: data.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    signOut();
  }

  const roadmapValid = roadmap.hobbyName.trim().length > 0;
const projectValid = (project.creatingNew ? project.newHobbyName.trim().length > 0 : !!project.targetHobbyId)
  && project.concept.trim().length > 0
  && Number(project.targetCount) >= 1
  && project.unitLabel.trim().length > 0;

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}>
        <View style={s.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={header.backLink}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={s.logoutLink}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={header.titleLarge}>Generate Content</Text>
        <Text style={header.subtitle}>Create roadmap or project drafts with Gemini</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.segmentRow}>
            <TouchableOpacity style={[s.segmentBtn, mode === MODES.ROADMAP && s.segmentActive]} onPress={() => setMode(MODES.ROADMAP)}>
              <Text style={[s.segmentText, mode === MODES.ROADMAP && s.segmentTextActive]}>New Roadmap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.segmentBtn, mode === MODES.PROJECT && s.segmentActive]} onPress={() => setMode(MODES.PROJECT)}>
              <Text style={[s.segmentText, mode === MODES.PROJECT && s.segmentTextActive]}>New Project</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {mode === MODES.ROADMAP ? (
            <>
              <Text style={s.helperNote}>
                Creates a brand-new structured hobby with a full 4-level skill roadmap.
              </Text>

              <View style={s.formCard}>
                <Text style={s.label}>Hobby Name</Text>
                <TextInput
                  style={s.input}
                  value={roadmap.hobbyName}
                  onChangeText={(v) => setRoadmap(prev => ({ ...prev, hobbyName: v }))}
                  placeholder="e.g. Digital Painting"
                  placeholderTextColor={C.outline}
                />

                <Text style={s.label}>Overall Hobby Difficulty</Text>
                <View style={s.chips}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[s.chip, roadmap.difficulty === item && s.chipActive]}
                      onPress={() => setRoadmap(prev => ({ ...prev, difficulty: item }))}
                    >
                      <Text style={[s.chipText, roadmap.difficulty === item && s.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>Extra Guidance (optional)</Text>
                <TextInput
                  style={[s.input, s.multiline]}
                  value={roadmap.extraGuidance}
                  onChangeText={(v) => setRoadmap(prev => ({ ...prev, extraGuidance: v }))}
                  placeholder="Any constraints or style to follow"
                  placeholderTextColor={C.outline}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={s.helperNote}>
                Creates a new project inside an existing passion hobby (e.g. a new
                challenge under "Creative Writing"). Gemini writes the description
                and per-unit prompts — you set the structure (count, label, deadline).
              </Text>

              <View style={s.formCard}>
                <View style={section.header}>
                  <Text style={section.title}>Target Hobby</Text>
                </View>
                <Text style={s.helper}>{selectedHobby?.name || 'Select a hobby below'}</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hobbyScroll} contentContainerStyle={s.hobbyRow}>
  <TouchableOpacity
    style={[s.hobbyBtn, project.creatingNew && s.hobbyBtnActive]}
    onPress={() => setProject(prev => ({ ...prev, creatingNew: true, targetHobbyId: null }))}
  >
    <Text style={[s.hobbyText, project.creatingNew && s.hobbyTextActive]}>+ Create new</Text>
  </TouchableOpacity>
  {passionHobbies.map(h => (
    <TouchableOpacity
      key={h.id}
      style={[s.hobbyBtn, !project.creatingNew && project.targetHobbyId === h.id && s.hobbyBtnActive]}
      onPress={() => setProject(prev => ({ ...prev, creatingNew: false, targetHobbyId: h.id }))}
    >
      <Text style={[s.hobbyText, !project.creatingNew && project.targetHobbyId === h.id && s.hobbyTextActive]}>{h.name}</Text>
    </TouchableOpacity>
  ))}
    </ScrollView>

    {project.creatingNew ? (
      <>
        <Text style={[s.label, s.labelSpaced]}>New Hobby Name</Text>
        <TextInput
          style={s.input}
          value={project.newHobbyName || ''}
          onChangeText={(v) => setProject(prev => ({ ...prev, newHobbyName: v }))}
          placeholder="e.g. Woodworking"
          placeholderTextColor={C.outline}
        />
        <Text style={s.label}>Hobby Description (optional)</Text>
        <TextInput
          style={[s.input, s.multiline]}
          value={project.newHobbyDescription || ''}
          onChangeText={(v) => setProject(prev => ({ ...prev, newHobbyDescription: v }))}
          placeholder="Brief context to guide Gemini"
          placeholderTextColor={C.outline}
          multiline
          textAlignVertical="top"
        />
      </>
    ) : null}

                <Text style={[s.label, s.labelSpaced]}>Project Concept</Text>
                <TextInput
                  style={[s.input, s.multiline]}
                  value={project.concept}
                  onChangeText={(v) => setProject(prev => ({ ...prev, concept: v }))}
                  placeholder="What should this project challenge focus on?"
                  placeholderTextColor={C.outline}
                  multiline
                  textAlignVertical="top"
                />

                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}>
                    <Text style={s.label}>Target Count</Text>
                    <TextInput
                      style={s.input}
                      value={project.targetCount}
                      onChangeText={(v) => setProject(prev => ({ ...prev, targetCount: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="30"
                      placeholderTextColor={C.outline}
                    />
                  </View>
                  <View style={s.fieldHalf}>
                    <Text style={s.label}>Time limit (optional)</Text>
                    <TextInput
                      style={s.input}
                      value={project.durationDays}
                      onChangeText={(v) => setProject(prev => ({ ...prev, durationDays: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="days"
                      placeholderTextColor={C.outline}
                    />
                  </View>
                </View>
                <Text style={s.miniHint}>Leave Time limit blank for an open-ended project.</Text>

                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}>
                    <Text style={s.label}>Unit Label</Text>
                    <TextInput
                      style={s.input}
                      value={project.unitLabel}
                      onChangeText={(v) => setProject(prev => ({ ...prev, unitLabel: v }))}
                      placeholder="e.g. sketch"
                      placeholderTextColor={C.outline}
                    />
                  </View>
                  <View style={s.fieldHalf}>
                    <Text style={s.label}>Plural (optional)</Text>
                    <TextInput
                      style={s.input}
                      value={project.unitLabelPlural}
                      onChangeText={(v) => setProject(prev => ({ ...prev, unitLabelPlural: v }))}
                      placeholder="e.g. sketches"
                      placeholderTextColor={C.outline}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          <PrimaryButton
            label={loading ? 'Generating…' : 'Generate with AI'}
            onPress={submit}
            loading={loading}
            disabled={loading || (mode === MODES.ROADMAP ? !roadmapValid : !projectValid)}
            color={C.admin}
            style={s.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutLink: {
    color: C.white,
    fontSize: F.sm,
    fontWeight: '700',
    opacity: 0.9,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  segmentBtn: {
    flex: 1,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: C.admin },
  segmentText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '800' },
  segmentTextActive: { color: C.white },

  helperNote: {
    fontSize: F.sm,
    color: C.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 19,
  },

  errorBanner: {
    backgroundColor: C.adminLight,
    borderWidth: 1,
    borderColor: C.admin,
    borderRadius: R.lg,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: C.admin, fontSize: F.sm, fontWeight: '600' },

  // formCard replaces the raw card.hero usage — guarantees consistent
  // internal padding so inputs never sit flush against (or past) the edge
  formCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },

  label: { fontSize: F.sm, color: C.onSurfaceVariant, marginBottom: 6, fontWeight: '700' },
  labelSpaced: { marginTop: 4 },
  helper: { fontSize: F.xs, color: C.onSurfaceVariant, fontWeight: '600', marginBottom: 10 },
  miniHint: { fontSize: F.xs, color: C.outline, marginTop: -6, marginBottom: 12 },

  // width: '100%' + boxSizing-safe padding — this is the fix for fields
  // appearing to spill past their container
  input: {
    width: '100%',
    height: 46,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingHorizontal: 12,
    color: C.onSurface,
    backgroundColor: C.surfaceLowest,
    marginBottom: 12,
  },
  multiline: { minHeight: 90, paddingTop: 12, height: undefined },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderRadius: R.full, backgroundColor: C.surfaceContainerLow, paddingVertical: 8, paddingHorizontal: 12 },
  chipActive: { backgroundColor: C.adminLight, borderWidth: 1, borderColor: C.admin },
  chipText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  chipTextActive: { color: C.admin },

  hobbyScroll: { marginBottom: 4 },
  hobbyRow: { flexDirection: 'row', gap: 8, paddingBottom: 10, paddingRight: 4 },
  hobbyBtn: { backgroundColor: C.surfaceContainerLow, borderRadius: R.full, paddingVertical: 8, paddingHorizontal: 14 },
  hobbyBtnActive: { backgroundColor: C.adminLight, borderWidth: 1, borderColor: C.admin },
  hobbyText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '700' },
  hobbyTextActive: { color: C.admin },

  submitBtn: { marginTop: 4 },
});