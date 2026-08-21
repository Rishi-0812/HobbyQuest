import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../../theme';
import { footer, header, layout } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';

const LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Mastery'];

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function ReviewContentScreen({ navigation, route }) {
  const contentId = route.params?.contentId;
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Basic');
  const [content, setContent] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialized = useRef(false);

  const [expandedSkills, setExpandedSkills] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});

  const isRoadmap = content?.contentType === 'roadmap';
  const isProject = content?.contentType === 'project';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/content/${contentId}`);
      setContent(data);

      const parsed = parseJson(data.editedJson || '{}', {});
      if (data.contentType === 'roadmap') {
        setRoadmapData({
          hobbyDescription: parsed.hobbyDescription || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          levels: LEVELS.map(level => {
            const existing = (parsed.levels || []).find(l => l.levelStage === level);
            return {
              levelStage: level,
              skills: Array.isArray(existing?.skills) ? existing.skills : [],
            };
          }),
        });
        } else {
          setProjectData({
            targetHobbyName: data.hobbyName,
            projectName: parsed.projectName || data.projectName || data.hobbyName || '',
            description: parsed.description || '',
            targetCount: String(parsed.targetCount ?? data.targetCount ?? 1),
            unitLabel: parsed.unitLabel || data.unitLabel || 'unit',
            unitLabelPlural: parsed.unitLabelPlural || data.unitLabelPlural || '',
            durationDays: parsed.durationDays ?? data.durationDays ?? '',
            units: Array.isArray(parsed.units) ? parsed.units : [],
            // NEW — only present when this project was generated alongside a brand-new hobby
            newHobby: parsed.newHobby ? {
              name: data.hobbyName,
              description: parsed.newHobby.description || '',
              tags: Array.isArray(parsed.newHobby.tags) ? parsed.newHobby.tags.join(', ') : '',
              difficulty: parsed.newHobby.difficulty || 'Beginner',
              emoji: parsed.newHobby.emoji || '',
            } : null,
          });
        }
      initialized.current = true;
      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load content.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [contentId]);

  const serializedDraft = useMemo(() => {
    if (!initialized.current) return '';
    if (isRoadmap && roadmapData) return JSON.stringify(roadmapData);
    if (isProject && projectData) {
      return JSON.stringify({
        projectName: projectData.projectName,
        description: projectData.description,
        targetCount: Number(projectData.targetCount) || 1,
        unitLabel: projectData.unitLabel,
        unitLabelPlural: projectData.unitLabelPlural,
        durationDays: projectData.durationDays === '' ? null : Number(projectData.durationDays),
        units: projectData.units,
        // NEW — preserve the embedded new-hobby data through edits, or it silently
    // drops out of the payload the moment the admin edits anything else.
    newHobby: projectData.newHobby ? {
      description: projectData.newHobby.description,
      tags: projectData.newHobby.tags.split(',').map(t => t.trim()).filter(Boolean),
      difficulty: projectData.newHobby.difficulty,
      emoji: projectData.newHobby.emoji,
    } : undefined,
      });
    }
    return '';
  }, [isRoadmap, isProject, roadmapData, projectData]);

  useEffect(() => {
    if (!initialized.current || !isDirty || !serializedDraft) return;
    const timer = setTimeout(async () => {
      try {
        setSavingDraft(true);
        await api.patch(`/admin/content/${contentId}/draft`, { editedJson: serializedDraft });
        setIsDirty(false);
      } catch {
        // Preserve local edits; user can still approve.
      } finally {
        setSavingDraft(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [serializedDraft, isDirty, contentId]);

  function updateRoadmap(updateFn) {
    setRoadmapData(prev => {
      const next = updateFn(prev);
      setIsDirty(true);
      return next;
    });
  }

  function updateProject(updateFn) {
    setProjectData(prev => {
      const next = updateFn(prev);
      setIsDirty(true);
      return next;
    });
  }

  function roadmapLevel(level) {
    return roadmapData?.levels?.find(l => l.levelStage === level) || { levelStage: level, skills: [] };
  }

  function skillKey(levelStage, index) {
    return `${levelStage}-${index}`;
  }

  function toggleSkillExpanded(levelStage, index) {
    const key = skillKey(levelStage, index);
    setExpandedSkills(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleUnitExpanded(index) {
    setExpandedUnits(prev => ({ ...prev, [index]: !prev[index] }));
  }

  function addSkill(levelStage) {
    updateRoadmap(prev => ({
      ...prev,
      levels: prev.levels.map(level => level.levelStage === levelStage ? {
        ...level,
        skills: [...level.skills, { name: '', description: '', tip: '', struggledTip: '', xpReward: 50, orderIndex: level.skills.length + 1 }],
      } : level),
    }));
    setExpandedSkills(prev => ({ ...prev, [skillKey(levelStage, roadmapLevel(levelStage).skills.length)]: true }));
  }

  function updateSkill(levelStage, index, field, value) {
    updateRoadmap(prev => ({
      ...prev,
      levels: prev.levels.map(level => {
        if (level.levelStage !== levelStage) return level;
        const nextSkills = level.skills.map((skill, i) => i === index ? { ...skill, [field]: value } : skill);
        return { ...level, skills: nextSkills };
      }),
    }));
  }

  function removeSkill(levelStage, index) {
    updateRoadmap(prev => ({
      ...prev,
      levels: prev.levels.map(level => {
        if (level.levelStage !== levelStage) return level;
        const nextSkills = level.skills.filter((_, i) => i !== index).map((skill, idx) => ({ ...skill, orderIndex: idx + 1 }));
        return { ...level, skills: nextSkills };
      }),
    }));
  }

  function moveSkill(levelStage, index, direction) {
    updateRoadmap(prev => ({
      ...prev,
      levels: prev.levels.map(level => {
        if (level.levelStage !== levelStage) return level;
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= level.skills.length) return level;
        const nextSkills = [...level.skills];
        [nextSkills[index], nextSkills[target]] = [nextSkills[target], nextSkills[index]];
        return { ...level, skills: nextSkills.map((skill, idx) => ({ ...skill, orderIndex: idx + 1 })) };
      }),
    }));
  }

  function addUnit() {
    updateProject(prev => ({
      ...prev,
      units: [...prev.units, { unitNumber: prev.units.length + 1, name: '', creativePrompt: '' }],
    }));
    setExpandedUnits(prev => ({ ...prev, [projectData?.units?.length || 0]: true }));
  }

  function updateUnit(index, field, value) {
    updateProject(prev => ({
      ...prev,
      units: prev.units.map((unit, i) => i === index ? { ...unit, [field]: value } : unit),
    }));
  }

  function removeUnit(index) {
    updateProject(prev => ({
      ...prev,
      units: prev.units
        .filter((_, i) => i !== index)
        .map((unit, idx) => ({ ...unit, unitNumber: idx + 1 })),
    }));
  }

  async function discard() {
    Alert.alert(
      'Discard this draft?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await api.patch(`/admin/content/${contentId}/discard`);
              navigation.navigate('AdminDashboard');
            } catch (err) {
              setError(err.response?.data?.message || 'Could not discard this content.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  async function approve() {
    try {
      setBusy(true);
      await api.patch(`/admin/content/${contentId}/approve`, { editedJson: serializedDraft });
      Alert.alert('Published', isRoadmap ? 'Roadmap published.' : 'Project published.');
      navigation.navigate('AdminDashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve this content.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <ActivityIndicator color={C.admin} />
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={[layout.root, layout.centered]}>
        <Text style={{ color: C.onSurfaceVariant }}>No content found.</Text>
      </SafeAreaView>
    );
  }

  const activeLevel = roadmapLevel(activeTab);
  const targetCountNum = Number(projectData?.targetCount) || 0;
  const remainingDefaultUnits = isProject ? Math.max(targetCountNum - (projectData?.units?.length || 0), 0) : 0;

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={header.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={header.titleLarge}>Review Content</Text>
        <Text style={header.subtitle}>{savingDraft ? 'Saving draft…' : 'Draft autosaves after edits'}</Text>
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
          {error ? (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {isRoadmap && roadmapData ? (
            <>
              <Text style={s.sectionHeader}>Roadmap Overview</Text>
              <View style={s.formCard}>
                <Text style={s.smallLabel}>Description</Text>
                <TextInput
                  style={[s.input, s.multiline]}
                  value={roadmapData.hobbyDescription}
                  onChangeText={(v) => updateRoadmap(prev => ({ ...prev, hobbyDescription: v }))}
                  multiline
                  textAlignVertical="top"
                  placeholder="What is this hobby about?"
                  placeholderTextColor={C.outline}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.tabsScroll}
              >
                {LEVELS.map(level => {
                  const count = roadmapLevel(level).skills.length;
                  const active = activeTab === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[s.tab, active && s.tabActive]}
                      onPress={() => setActiveTab(level)}
                    >
                      <Text style={[s.tabText, active && s.tabTextActive]}>{level}</Text>
                      <Text style={[s.tabCount, count === 0 && s.tabCountWarn]}>{count} skills</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={s.sectionHeader}>{activeTab} · {activeLevel.skills.length} skills</Text>

              {activeLevel.skills.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyText}>No skills yet in this level.</Text>
                </View>
              ) : (
                activeLevel.skills.map((skill, index) => {
                  const key = skillKey(activeTab, index);
                  const expanded = !!expandedSkills[key];
                  return (
                    <View key={key} style={s.itemCard}>
                      <TouchableOpacity
                        style={s.itemHeader}
                        onPress={() => toggleSkillExpanded(activeTab, index)}
                        activeOpacity={0.7}
                      >
                        <View style={s.orderBadge}>
                          <Text style={s.orderBadgeText}>{index + 1}</Text>
                        </View>
                        <View style={s.itemHeaderTextWrap}>
                          <Text style={s.itemTitle} numberOfLines={1}>
                            {skill.name?.trim() ? skill.name : 'Untitled skill'}
                          </Text>
                          {!expanded && skill.description ? (
                            <Text style={s.itemPreview} numberOfLines={1}>{skill.description}</Text>
                          ) : null}
                        </View>
                        <View style={s.iconRow}>
                          <TouchableOpacity style={s.iconBtn} onPress={() => moveSkill(activeTab, index, 'up')}>
                            <Text style={s.iconText}>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.iconBtn} onPress={() => moveSkill(activeTab, index, 'down')}>
                            <Text style={s.iconText}>↓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.iconBtn} onPress={() => removeSkill(activeTab, index)}>
                            <Text style={s.iconText}>🗑</Text>
                          </TouchableOpacity>
                          <Text style={s.chevron}>{expanded ? '▾' : '▸'}</Text>
                        </View>
                      </TouchableOpacity>

                      {expanded ? (
                        <View style={s.itemBody}>
                          <Text style={s.fieldLabel}>Name</Text>
                          <TextInput style={s.input} value={skill.name} onChangeText={(v) => updateSkill(activeTab, index, 'name', v)} placeholder="Skill name" placeholderTextColor={C.outline} />

                          <Text style={s.fieldLabel}>Description</Text>
                          <TextInput style={[s.input, s.multiline]} value={skill.description} onChangeText={(v) => updateSkill(activeTab, index, 'description', v)} placeholder="What does the user practice?" placeholderTextColor={C.outline} multiline textAlignVertical="top" />

                          <Text style={s.fieldLabel}>Tip</Text>
                          <TextInput style={[s.input, s.multiline]} value={skill.tip} onChangeText={(v) => updateSkill(activeTab, index, 'tip', v)} placeholder="Default tip shown to the user" placeholderTextColor={C.outline} multiline textAlignVertical="top" />

                          <Text style={s.fieldLabel}>Struggled tip</Text>
                          <TextInput style={[s.input, s.multiline]} value={skill.struggledTip} onChangeText={(v) => updateSkill(activeTab, index, 'struggledTip', v)} placeholder="Shown after 3 struggling sessions" placeholderTextColor={C.outline} multiline textAlignVertical="top" />

                          <Text style={s.fieldLabel}>XP Reward</Text>
                          <TextInput
                            style={s.input}
                            value={String(skill.xpReward ?? 50)}
                            onChangeText={(v) => updateSkill(activeTab, index, 'xpReward', Number(v.replace(/[^0-9]/g, '') || 50))}
                            keyboardType="number-pad"
                            placeholder="50"
                            placeholderTextColor={C.outline}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}

              <TouchableOpacity style={s.addRow} onPress={() => addSkill(activeTab)}>
                <Text style={s.addRowText}>+ Add Skill to {activeTab}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isProject && projectData ? (
            <>
              <Text style={s.sectionHeader}>Project Overview</Text>
              <View style={s.formCard}>
                <Text style={s.smallLabel}>Target Hobby</Text>
                <Text style={s.readOnly}>{projectData.targetHobbyName}</Text>

                <Text style={s.smallLabel}>Project Name</Text>
                <TextInput style={s.input} value={projectData.projectName} onChangeText={(v) => updateProject(prev => ({ ...prev, projectName: v }))} placeholderTextColor={C.outline} />

                <Text style={s.smallLabel}>Description</Text>
                <TextInput style={[s.input, s.multiline]} value={projectData.description} onChangeText={(v) => updateProject(prev => ({ ...prev, description: v }))} placeholderTextColor={C.outline} multiline textAlignVertical="top" />

                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}>
                    <Text style={s.smallLabel}>Target Count</Text>
                    <TextInput style={s.input} value={projectData.targetCount} onChangeText={(v) => updateProject(prev => ({ ...prev, targetCount: v.replace(/[^0-9]/g, '') }))} keyboardType="number-pad" placeholderTextColor={C.outline} />
                  </View>
                  <View style={s.fieldHalf}>
                    <Text style={s.smallLabel}>Time limit (optional)</Text>
                    <TextInput style={s.input} value={String(projectData.durationDays ?? '')} onChangeText={(v) => updateProject(prev => ({ ...prev, durationDays: v.replace(/[^0-9]/g, '') }))} keyboardType="number-pad" placeholder="days" placeholderTextColor={C.outline} />
                  </View>
                </View>

                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}>
                    <Text style={s.smallLabel}>Unit Label</Text>
                    <TextInput style={s.input} value={projectData.unitLabel} onChangeText={(v) => updateProject(prev => ({ ...prev, unitLabel: v }))} placeholderTextColor={C.outline} />
                  </View>
                  <View style={s.fieldHalf}>
                    <Text style={s.smallLabel}>Plural (optional)</Text>
                    <TextInput style={s.input} value={projectData.unitLabelPlural} onChangeText={(v) => updateProject(prev => ({ ...prev, unitLabelPlural: v }))} placeholder="e.g. stories" placeholderTextColor={C.outline} />
                  </View>
                </View>
              </View>

              {isProject && projectData?.newHobby ? (
                <>
                  <Text style={s.sectionHeader}>New Hobby - {projectData.newHobby.name}</Text>
                  <View style={s.formCard}>
                    <Text style={s.smallLabel}>Description</Text>
                    <TextInput
                      style={[s.input, s.multiline]}
                      value={projectData.newHobby.description}
                      onChangeText={(v) => updateProject(prev => ({ ...prev, newHobby: { ...prev.newHobby, description: v } }))}
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor={C.outline}
                    />

                    <View style={s.fieldRow}>
                      <View style={s.fieldHalf}>
                        <Text style={s.smallLabel}>Difficulty</Text>
                        <TextInput
                          style={s.input}
                          value={projectData.newHobby.difficulty}
                          onChangeText={(v) => updateProject(prev => ({ ...prev, newHobby: { ...prev.newHobby, difficulty: v } }))}
                          placeholderTextColor={C.outline}
                        />
                      </View>
                      <View style={s.fieldHalf}>
                        <Text style={s.smallLabel}>Emoji</Text>
                        <TextInput
                          style={s.input}
                          value={projectData.newHobby.emoji}
                          onChangeText={(v) => updateProject(prev => ({ ...prev, newHobby: { ...prev.newHobby, emoji: v } }))}
                          placeholderTextColor={C.outline}
                        />
                      </View>
                    </View>

                    <Text style={s.smallLabel}>Tags (comma-separated)</Text>
                    <TextInput
                      style={s.input}
                      value={projectData.newHobby.tags}
                      onChangeText={(v) => updateProject(prev => ({ ...prev, newHobby: { ...prev.newHobby, tags: v } }))}
                      placeholder="creative, indoor, solo"
                      placeholderTextColor={C.outline}
                    />
                  </View>
                </>
              ) : null}

              <Text style={s.sectionHeader}>Units · {projectData.units.length}</Text>

              {projectData.units.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyText}>No custom units yet — all units will use the default prompt.</Text>
                </View>
              ) : (
                projectData.units.map((unit, index) => {
                  const expanded = !!expandedUnits[index];
                  return (
                    <View key={index} style={s.itemCard}>
                      <TouchableOpacity
                        style={s.itemHeader}
                        onPress={() => toggleUnitExpanded(index)}
                        activeOpacity={0.7}
                      >
                        <View style={s.orderBadge}>
                          <Text style={s.orderBadgeText}>{unit.unitNumber}</Text>
                        </View>
                        <View style={s.itemHeaderTextWrap}>
                          <Text style={s.itemTitle} numberOfLines={1}>
                            {unit.name?.trim() ? unit.name : `Unit ${unit.unitNumber}`}
                          </Text>
                          {!expanded && unit.creativePrompt ? (
                            <Text style={s.itemPreview} numberOfLines={1}>{unit.creativePrompt}</Text>
                          ) : null}
                        </View>
                        <View style={s.iconRow}>
                          <TouchableOpacity style={s.iconBtn} onPress={() => removeUnit(index)}>
                            <Text style={s.iconText}>🗑</Text>
                          </TouchableOpacity>
                          <Text style={s.chevron}>{expanded ? '▾' : '▸'}</Text>
                        </View>
                      </TouchableOpacity>

                      {expanded ? (
                        <View style={s.itemBody}>
                          <Text style={s.fieldLabel}>Unit name (optional)</Text>
                          <TextInput
                            style={s.input}
                            value={unit.name || ''}
                            onChangeText={(v) => updateUnit(index, 'name', v)}
                            placeholder="e.g. Opening scene"
                            placeholderTextColor={C.outline}
                          />
                          <Text style={s.fieldLabel}>Creative prompt</Text>
                          <TextInput
                            style={[s.input, s.multiline]}
                            value={unit.creativePrompt || ''}
                            onChangeText={(v) => updateUnit(index, 'creativePrompt', v)}
                            placeholder="What should the user create for this unit?"
                            placeholderTextColor={C.outline}
                            multiline
                            textAlignVertical="top"
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}

              <TouchableOpacity style={s.addRow} onPress={addUnit}>
                <Text style={s.addRowText}>+ Add Unit</Text>
              </TouchableOpacity>

              {remainingDefaultUnits > 0 ? (
                <Text style={s.infoNote}>{remainingDefaultUnits} units will use the default prompt</Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={footer.barWhite}>
        <View style={s.footerRow}>
          <TouchableOpacity style={s.discardBtn} onPress={discard} disabled={busy}>
            <Text style={s.discardText}>Discard</Text>
          </TouchableOpacity>
          <PrimaryButton label="Approve & Publish" onPress={approve} loading={busy} color={C.admin} style={s.approveBtn} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Single source of horizontal padding for the whole screen — nothing else
  // (no shared card style) contributes competing padding anymore.
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  errorBanner: {
    backgroundColor: C.adminLight,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.admin,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: C.admin, fontSize: F.sm, fontWeight: '700' },

  sectionHeader: {
    fontSize: F.sm,
    fontWeight: '800',
    color: C.onSurfaceVariant,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Replaces card.hero — explicit padding on all sides guarantees inputs
  // inside never touch or exceed the card's own edge.
  formCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    padding: 16,
    marginBottom: 8,
    ...SHADOW.sm,
  },

  smallLabel: { fontSize: F.xs, color: C.onSurfaceVariant, marginBottom: 6, fontWeight: '700' },
  fieldLabel: { fontSize: F.xs, color: C.onSurfaceVariant, marginBottom: 4, marginTop: 8, fontWeight: '600' },
  readOnly: { fontSize: F.base, color: C.onSurface, fontWeight: '700', marginBottom: 12 },

  // width: '100%' relative to formCard/itemBody's own padded box — this is
  // the actual fix for fields appearing to spill past their container.
  input: {
    width: '100%',
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: R.lg,
    paddingHorizontal: 12,
    height: 46,
    color: C.onSurface,
    marginBottom: 12,
  },
  multiline: { minHeight: 88, paddingTop: 12, height: undefined },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },

  tabsScroll: { gap: 8, paddingVertical: 4 },
  tab: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 100,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: C.adminLight, borderWidth: 1, borderColor: C.admin },
  tabText: { color: C.onSurfaceVariant, fontSize: F.sm, fontWeight: '800' },
  tabTextActive: { color: C.admin },
  tabCount: { color: C.onSurfaceVariant, fontSize: F.xs, marginTop: 2 },
  tabCountWarn: { color: C.almostThere, fontWeight: '700' },

  emptyState: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: { color: C.onSurfaceVariant, fontSize: F.sm },

  itemCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: R.full,
    backgroundColor: C.adminLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderBadgeText: { color: C.admin, fontWeight: '800', fontSize: F.sm },
  itemHeaderTextWrap: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: F.base, fontWeight: '800', color: C.onSurface },
  itemPreview: { fontSize: F.xs, color: C.onSurfaceVariant, marginTop: 2 },
  itemBody: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    backgroundColor: C.surfaceContainerLow,
  },

  iconRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: R.md,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  iconText: { fontSize: F.sm, color: C.onSurfaceVariant, fontWeight: '700' },
  chevron: { fontSize: F.md, color: C.onSurfaceVariant, marginLeft: 2, width: 16, textAlign: 'center' },

  addRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.admin,
    borderRadius: R.lg,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  addRowText: { color: C.admin, fontWeight: '700', fontSize: F.sm },

  infoNote: { marginTop: 10, marginBottom: 8, color: C.onSurfaceVariant, fontSize: F.sm },

  footerRow: { flexDirection: 'row', gap: 10 },
  discardBtn: {
    flex: 1,
    height: 48,
    borderRadius: R.lg,
    backgroundColor: C.adminLight,
    borderWidth: 1,
    borderColor: C.admin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: { color: C.admin, fontWeight: '800', fontSize: F.base },
  approveBtn: { flex: 2 },
});