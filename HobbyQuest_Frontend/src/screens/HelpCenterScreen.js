import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { header, layout } from '../styles';
import { HELP_CONTENT } from '../constants/helpContent';

export default function HelpCenterScreen({ navigation }) {
  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <View style={header.navy}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={header.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={header.titleLarge}>How HobbyQuest Works</Text>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb}>
        {Object.values(HELP_CONTENT).map((group, gi) => (
          <View key={gi} style={s.group}>
            <Text style={s.groupTitle}>{group.title}</Text>
            {group.sections.map((sec, i) => (
              <View key={i} style={s.card}>
                <Text style={s.emoji}>{sec.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{sec.title}</Text>
                  <Text style={s.cardBody}>{sec.body}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  group: { marginBottom: 24 },
  groupTitle: { fontSize: F.lg, fontWeight: '900', color: C.onSurface, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.surfaceLowest,
    borderRadius: R.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginBottom: 10,
    ...SHADOW.sm,
  },
  emoji: { fontSize: 22 },
  cardTitle: { fontSize: F.base, fontWeight: '800', color: C.onSurface, marginBottom: 3 },
  cardBody: { fontSize: F.sm, color: C.onSurfaceVariant, lineHeight: 19 },
});
