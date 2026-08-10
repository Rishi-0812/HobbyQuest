import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../theme';
import { header, layout, card } from '../../styles';
import { PrimaryButton } from '../../components/components';
import api from '../../services/api';

export default function ReviewRoadmapScreen({ route, navigation }) {
  const [json, setJson] = useState(route.params?.editableJson || '{}');
  const [loading, setLoading] = useState(false);
  async function approve() { setLoading(true); await api.patch(`/admin/roadmaps/${route.params.stagingId}/approve`, { editedJson: json }); setLoading(false); navigation.navigate('AdminDashboard'); }
  async function discard() { await api.patch(`/admin/roadmaps/${route.params.stagingId}/discard`); navigation.navigate('AdminDashboard'); }
  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.admin} />
      <View style={header.admin}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={header.backLink}>Back</Text></TouchableOpacity><Text style={header.titleLarge}>Review Roadmap</Text></View>
      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        <View style={card.hero}>
          <Text style={s.help}>Edit the staged JSON before approving. Nothing is published until approval.</Text>
          <TextInput style={s.editor} value={json} onChangeText={setJson} multiline textAlignVertical="top" />
          <PrimaryButton label="Approve" color={C.admin} onPress={approve} loading={loading} />
          <TouchableOpacity onPress={discard} style={s.discard}><Text style={s.discardText}>Discard</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  help: { fontSize: F.base, color: C.onSurfaceVariant, marginBottom: 12 },
  editor: { minHeight: 260, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.outlineVariant, padding: 12, color: C.onSurface, marginBottom: 14 },
  discard: { alignItems: 'center', marginTop: 12 },
  discardText: { color: C.admin, fontWeight: '900' },
});
