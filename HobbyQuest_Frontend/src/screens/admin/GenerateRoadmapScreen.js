import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../theme';
import { header, layout, card } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';

export default function GenerateRoadmapScreen({ route, navigation }) {
  const [hobbyName, setHobbyName] = useState(route.params?.hobbyName || '');
  const [hobbyType, setHobbyType] = useState('structured');
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true);
    const { data } = await api.post('/admin/hobbies/generate', { hobbyName, hobbyType });
    setLoading(false);
    navigation.navigate('ReviewRoadmap', { stagingId: data.stagingId, editableJson: data.editableJson });
  }
  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity><Text style={header.titleLarge}>Generate Roadmap</Text></View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={card.hero}>
          <TextInput style={s.input} value={hobbyName} onChangeText={setHobbyName} placeholder="Hobby name" placeholderTextColor={C.outline} />
          <View style={s.types}>{['structured', 'passion'].map(t => <TouchableOpacity key={t} onPress={() => setHobbyType(t)} style={[s.type, hobbyType === t && s.typeActive]}><Text style={[s.typeText, hobbyType === t && s.typeTextActive]}>{t}</Text></TouchableOpacity>)}</View>
          <PrimaryButton label="Generate with AI" color={C.admin} onPress={generate} loading={loading} disabled={!hobbyName.trim()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  input: { height: 52, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: R.lg, paddingHorizontal: 14, marginBottom: 14, color: C.onSurface },
  types: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  type: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: R.full, backgroundColor: C.surfaceContainerLow },
  typeActive: { backgroundColor: C.admin },
  typeText: { color: C.onSurfaceVariant, fontWeight: '800' },
  typeTextActive: { color: C.white },
});
