// CustomProjectCreationScreen
// Route params: { hobbyId, hobbyName }
// API: POST /projects, POST /user/projects/enrol/{projectId}
// Layout: passion header, project form, public switch, optional unit names, duplicate suggestions.

import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../theme';
import { PrimaryButton } from '../components/components';
import { layout, card, header } from '../styles';
import api from '../services/api';

export default function CustomProjectCreationScreen({ route, navigation }) {
  const { hobbyId, hobbyName } = route.params;
  const [name, setName] = useState('');
  const [targetCount, setTargetCount] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [isPublic, setIsPublic] = useState(false); // default private per spec
  const [durationDays, setDurationDays] = useState('');
  const [showUnits, setShowUnits] = useState(false);
  const [unitNames, setUnitNames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingTimer, setTypingTimer] = useState(null);
  const [liveSuggestions, setLiveSuggestions] = useState([]);

  const count = useMemo(() => Math.min(Number(targetCount) || 0, 50), [targetCount]);

  // Debounced duplicate check
  React.useEffect(() => {
    if (!name.trim()) { setLiveSuggestions([]); return; }
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/projects/check-duplicate', { params: { name: name.trim(), hobbyId } });
        setLiveSuggestions(data || []);
      } catch (e) {
        // ignore
      }
    }, 500);
    setTypingTimer(t);
    return () => clearTimeout(t);
  }, [name, hobbyId]);

  function updateTarget(value) {
    const cleaned = value.replace(/[^0-9]/g, '');
    setTargetCount(cleaned);
    const nextCount = Math.min(Number(cleaned) || 0, 50);
    setUnitNames(prev => Array.from({ length: nextCount }, (_, i) => prev[i] || ''));
  }

  function updateDuration(value) {
    const cleaned = value.replace(/[^0-9]/g, '');
    setDurationDays(cleaned);
  }

  async function submit(forceCreate = false) {
    if (!name.trim() || !unitLabel.trim() || !count) {
      setError('Add a project name, unit label, and target count.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/projects', {
        hobbyId,
        name: name.trim(),
        targetCount: count,
        unitLabel: unitLabel.trim(),
        unitNames: showUnits ? unitNames : [],
        isPublic,
        forceCreate,
        durationDays: durationDays ? Number(durationDays) : null,
      });
      if (data.suggestions?.length && !forceCreate) {
        setSuggestions(data.suggestions);
        return;
      }
      navigation.navigate('ActiveProject', {
        progressId: data.progressId,
        projectName: name.trim(),
        unitLabel: unitLabel.trim(),
        targetCount: count,
        hobbyId,
        hobbyName,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create this project.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function useExisting(project) {
    try {
      setLoading(true);
      const { data } = await api.post(`/user/projects/enrol/${project.id}`);
      navigation.navigate('ActiveProject', {
        progressId: data.progressId,
        projectName: project.name,
        unitLabel: project.unitLabel,
        targetCount: project.targetCount,
        hobbyId,
        hobbyName,
      });
    } catch {
      setError('Could not use the existing project.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.passion} />
      <View style={header.passion}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity>
        <Text style={header.titleLarge}>Create Your Project</Text>
        <Text style={header.subtitle}>{hobbyName}</Text>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb} showsVerticalScrollIndicator={false}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <View style={card.hero}>
          <Text style={s.label}>Project name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Write 30 poems" placeholderTextColor={C.outline} />

          <Text style={s.label}>Unit label</Text>
          <TextInput style={s.input} value={unitLabel} onChangeText={setUnitLabel} placeholder="poem, sketch, photo" placeholderTextColor={C.outline} />

          <Text style={s.label}>How many {unitLabel || 'units'}?</Text>
          <TextInput style={s.input} value={targetCount} onChangeText={updateTarget} keyboardType="number-pad" placeholder="30" placeholderTextColor={C.outline} />

          <Text style={s.label}>Time limit (optional) — leave blank for an open-ended project</Text>
          <TextInput style={s.input} value={durationDays} onChangeText={updateDuration} keyboardType="number-pad" placeholder="e.g. 30" placeholderTextColor={C.outline} />

          <View style={s.switchRow}>
            <View style={layout.fill}>
              <Text style={s.switchTitle}>Share as a community project</Text>
              <Text style={s.switchText}>Public projects can be discovered and used by the community.</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: C.passionLight, false: C.surfaceContainer }} thumbColor={isPublic ? C.passion : C.outline} />
          </View>

          {count > 0 ? (
            <>
              <TouchableOpacity style={s.expand} onPress={() => setShowUnits(v => !v)}>
                <Text style={s.expandText}>{showUnits ? 'Hide unit names' : 'Name your units (optional)'}</Text>
              </TouchableOpacity>
              {showUnits && unitNames.map((unit, index) => (
                <TextInput
                  key={index}
                  style={s.unitInput}
                  value={unit}
                  onChangeText={value => setUnitNames(prev => prev.map((item, i) => i === index ? value : item))}
                  placeholder={`Unit ${index + 1}`}
                  placeholderTextColor={C.outline}
                />
              ))}
            </>
          ) : null}
        </View>

        {liveSuggestions.length ? (
          <View style={[card.infoAmber, s.suggestions]}>
            <Text style={s.suggestionTitle}>Similar projects found</Text>
            {liveSuggestions.map(item => <Text key={item.id} style={s.suggestionItem}>• {item.name}</Text>)}
            <View style={s.suggestionActions}>
              <TouchableOpacity style={s.smallGhost} onPress={() => useExisting(liveSuggestions[0])}>
                <Text style={s.smallGhostText}>Enrol in this instead</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallSolid} onPress={() => submit(true)}>
                <Text style={s.smallSolidText}>Create mine anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {suggestions.length ? (
          <View style={[card.infoAmber, s.suggestions]}>
            <Text style={s.suggestionTitle}>Similar projects found</Text>
            {suggestions.map(item => <Text key={item.id} style={s.suggestionItem}>• {item.name}</Text>)}
            <View style={s.suggestionActions}>
              <TouchableOpacity style={s.smallGhost} onPress={() => useExisting(suggestions[0])}>
                <Text style={s.smallGhostText}>Use existing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallSolid} onPress={() => submit(true)}>
                <Text style={s.smallSolidText}>Create mine anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <PrimaryButton label="Create project" color={C.passion} onPress={() => submit(false)} loading={loading} style={s.submit} />
        {loading ? <ActivityIndicator color={C.passion} style={s.loader} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  errorBox: { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 14 },
  errorText: { color: C.error, fontSize: F.base },
  label: { fontSize: F.sm, color: C.onSurfaceVariant, fontWeight: '800', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.7 },
  input: { height: 52, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: R.lg, paddingHorizontal: 14, backgroundColor: C.surfaceLowest, color: C.onSurface, fontSize: F.base },
  switchRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.passionLight, borderRadius: R.lg, padding: 14, marginTop: 16 },
  switchTitle: { fontSize: F.base, color: C.onSurface, fontWeight: '800' },
  switchText: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 3 },
  expand: { paddingVertical: 14 },
  expandText: { color: C.passion, fontSize: F.base, fontWeight: '800' },
  unitInput: { minHeight: 46, borderWidth: 1, borderColor: C.outlineVariant, borderRadius: R.md, paddingHorizontal: 12, marginBottom: 8, color: C.onSurface, backgroundColor: C.surfaceContainerLow },
  suggestions: { marginTop: 16 },
  suggestionTitle: { fontSize: F.md, color: C.onSurface, fontWeight: '800', marginBottom: 8 },
  suggestionItem: { fontSize: F.base, color: C.onSurface, marginBottom: 4 },
  suggestionActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallGhost: { flex: 1, height: 44, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.passion, alignItems: 'center', justifyContent: 'center' },
  smallGhostText: { color: C.passion, fontWeight: '800' },
  smallSolid: { flex: 1, height: 44, borderRadius: R.lg, backgroundColor: C.passion, alignItems: 'center', justifyContent: 'center' },
  smallSolidText: { color: C.white, fontWeight: '800' },
  submit: { marginTop: 18 },
  loader: { marginTop: 10 },
});
