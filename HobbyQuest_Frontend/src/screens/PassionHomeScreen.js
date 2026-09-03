// PassionHomeScreen
// Route params: { hobbyId, hobbyName }
// API: GET /hobbies/{hobbyId}/projects, POST /user/projects/enrol/{projectId}
// Layout: passion header, active projects list, grouped project rows, custom project CTA.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { ProgressBar, PrimaryButton, EmptyState } from '../components/components';
import { layout, card, header, section, badge } from '../styles';
import api from '../services/api';
import { getHobbyEmoji } from '../constants/hobbyEmojis';
import { getHobbyAccent } from '../constants/hobbyAccent';
import SlideToast from '../components/SlideToast';
import HelpModal from '../components/HelpModal';
import { HELP_CONTENT } from '../constants/helpContent';

function ProjectCard({ project, onEnrol, onResume, canEnrol }) {
  const progress = project.targetCount ? (project.currentCount || 0) / project.targetCount : 0;
  const disabled = !canEnrol && !project.isEnrolled;
  return (
    <View style={s.projectCard}>
      <View style={s.projectTop}>
        <Text style={s.projectTitle} numberOfLines={2}>{project.name}</Text>
        {project.isEnrolled ? (
          <View style={[badge.base, badge.teal]}><Text style={[badge.text, badge.tealText]}>Enrolled</Text></View>
        ) : null}
      </View>
      <Text style={s.projectDesc} numberOfLines={2}>{project.description || 'A focused creative challenge for steady progress.'}</Text>
      <View style={s.metaRow}>
        <View style={[badge.base, badge.passion]}>
          <Text style={[badge.text, badge.passionText]}>{project.targetCount} {project.unitLabel}s</Text>
        </View>
      </View>
      {project.isEnrolled ? (
        <>
          <ProgressBar progress={progress} color={C.passion} bg={C.passionLight} />
          <PrimaryButton label="Resume" onPress={() => onResume(project)} color={C.passion} style={s.cardBtn} />
        </>
      ) : (
        <PrimaryButton label="Enrol" onPress={() => onEnrol(project)} color={C.passion} style={s.cardBtn} disabled={disabled} />
      )}
      {disabled ? <Text style={s.disabledHint}>Max active projects reached (2). Complete or abandon one to start another.</Text> : null}
    </View>
  );
}

function ProjectSection({ title, projects, onEnrol, onResume, canEnrol }) {
  if (!projects.length) return null;
  return (
    <View style={s.sectionBlock}>
      <View style={section.header}><Text style={section.title}>{title}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.horizontalRow}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onEnrol={onEnrol} onResume={onResume} canEnrol={canEnrol} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function PassionHomeScreen({ route, navigation }) {
  const { hobbyId, hobbyName } = route.params;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const accent = getHobbyAccent(hobbyId);

  const fetchProjects = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get(`/hobbies/${hobbyId}/projects`);
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [hobbyId]);

  useEffect(() => {
    fetchProjects();
    const unsubscribe = navigation.addListener('focus', fetchProjects);
    return unsubscribe;
  }, [navigation, fetchProjects]);

  const activeProjects = useMemo(
    () => projects.filter(p => p.isEnrolled && p.status === 'ACTIVE'),
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter(p => p.isEnrolled && p.status === 'COMPLETED'),
    [projects]
  );
  const [globalActiveCount, setGlobalActiveCount] = useState(0);

  useEffect(() => {
    async function loadGlobalActiveCount() {
      try {
        const { data: hobbies } = await api.get('/hobbies?type=passion');
        if (!Array.isArray(hobbies) || hobbies.length === 0) {
          setGlobalActiveCount(activeProjects.length);
          return;
        }
        const counts = await Promise.all(
          hobbies.map(async (hobby) => {
            try {
              const { data: hobbyProjects } = await api.get(`/hobbies/${hobby.id}/projects`);
              const activeForHobby = Array.isArray(hobbyProjects)
                ? hobbyProjects.filter(project => project.isEnrolled && project.status === 'ACTIVE').length
                : 0;
              return activeForHobby;
            } catch {
              return 0;
            }
          })
        );
        setGlobalActiveCount(counts.reduce((sum, count) => sum + count, 0));
      } catch {
        setGlobalActiveCount(activeProjects.length);
      }
    }
    loadGlobalActiveCount();
  }, [activeProjects.length, hobbyId]);

  const activeCount = activeProjects.length;
  const otherHobbyActiveCount = Math.max(0, globalActiveCount - activeCount);

  const grouped = useMemo(() => ({
    admin: projects.filter(p => p.source === 'admin'),
    community: projects.filter(p => p.source === 'community'),
    custom: projects.filter(p => p.source === 'custom'),
  }), [projects]);

  function goActive(project) {
    navigation.navigate('ActiveProject', {
      progressId: project.progressId,
      projectName: project.name,
      unitLabel: project.unitLabel,
      targetCount: project.targetCount,
      hobbyId,
      hobbyName,
    });
  }

  function goCompleted(project) {
    navigation.navigate('ProjectCompletion', {
      progressId: project.progressId,
      projectId: project.id,
      projectName: project.name,
      unitLabel: project.unitLabel,
      totalUnits: project.targetCount,
      hobbyId,
      hobbyName,
      readOnly: true,
    });
  }

  async function enrol(project) {
    try {
      setBusyId(project.id);
      const { data } = await api.post(`/user/projects/enrol/${project.id}`);
      setToast(`Enrolled in ${project.name}`);
      goActive({ ...project, progressId: data.progressId });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not enrol in this project.');
    } finally {
      setBusyId(null);
    }
  }

function reportIssue() {
  navigation.navigate('Feedback', {
    prefillType: 'bug',
    prefillHobbyName: hobbyName,
    prefillMessage: `Issue with the "${hobbyName}" passion hobby: `,
  });
}

  function confirmUnenroll() {
    Alert.alert(
      'Unenrol from this hobby?',
      'Your project progress will be kept in case you come back — you just won\'t see this hobby on your active list anymore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenrol', style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/hobbies/${hobbyId}/unenrol`);
              setToast(`Unenrolled from ${hobbyName}`);
              setTimeout(() => navigation.navigate('AppTabs', { screen: 'Dashboard' }), 900);
            } catch (err) {
              setError(err.response?.data?.message || 'Could not unenrol.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <SafeAreaView style={[layout.root, layout.centered]}><ActivityIndicator color={C.passion} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={layout.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.passion} />

      <SlideToast visible={!!toast} message={toast} emoji="🎉" color={C.passion} />

      <View style={header.passion}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={header.backLink}>Back</Text>
          </TouchableOpacity>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={() => setHelpVisible(true)} style={s.helpBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.helpBtnText}>?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reportIssue} style={s.reportIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.reportIcon}>🚩</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.heroRow}>
          <View style={[s.heroIconWrap, { borderColor: accent + '90' }]}>
            <Text style={s.heroEmoji}>{getHobbyEmoji({ name: hobbyName })}</Text>
          </View>
          <View style={layout.fill}>
            <Text style={header.titleLarge}>{hobbyName}</Text>
            <Text style={header.subtitle}>Choose your next project</Text>
            <Text style={s.activeCount}>Active projects: {globalActiveCount}/2</Text>
            {otherHobbyActiveCount > 0 ? (
              <Text style={s.activeNote}>{otherHobbyActiveCount} more active in another hobby</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={layout.scrollContentPb} showsVerticalScrollIndicator={false}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {activeProjects.length > 0 ? (
          <View style={s.activeSection}>
            <View style={section.header}><Text style={section.title}>Active Projects</Text></View>
            {activeProjects.map(project => (
              <TouchableOpacity
                key={project.id}
                activeOpacity={0.85}
                style={[card.hero, s.resume]}
                onPress={() => goActive(project)}
              >
                <Text style={s.kicker}>In progress</Text>
                <Text style={s.resumeTitle}>{project.name}</Text>
                <Text style={s.resumeMeta}>{project.currentCount || 0} of {project.targetCount} {project.unitLabel}s complete</Text>
                <ProgressBar progress={(project.currentCount || 0) / project.targetCount} color={C.passion} bg={C.passionLight} />
                <Text style={s.resumeAction}>Resume</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {completedProjects.length > 0 ? (
          <View style={s.activeSection}>
            <View style={section.header}><Text style={section.title}>Completed Projects</Text></View>
            {completedProjects.map(project => (
              <TouchableOpacity
                key={project.id}
                activeOpacity={0.85}
                style={[card.hero, s.resume]}
                onPress={() => goCompleted(project)}
              >
                <Text style={s.kicker}>Finished</Text>
                <Text style={s.resumeTitle}>{project.name}</Text>
                <Text style={s.resumeMeta}>{project.targetCount} {project.unitLabel || 'unit'} goal</Text>
                <Text style={s.resumeAction}>View</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {!projects.length ? (
          <EmptyState emoji="🎨" title="No projects yet" subtitle="Create the first project for this passion hobby." />
        ) : null}

        <ProjectSection title="Suggested Projects" projects={grouped.admin} onEnrol={enrol} onResume={goActive} canEnrol={globalActiveCount < 2} />
        <ProjectSection title="Community Projects" projects={grouped.community} onEnrol={enrol} onResume={goActive} canEnrol={globalActiveCount < 2} />
        <ProjectSection title="Your Custom Projects" projects={grouped.custom} onEnrol={enrol} onResume={goActive} canEnrol={globalActiveCount < 2} />

        <PrimaryButton
          label="Create your own project"
          color={C.passion}
          onPress={() => navigation.navigate('CustomProject', { hobbyId, hobbyName })}
          style={s.createBtn}
          loading={busyId !== null}
        />

        <TouchableOpacity style={s.unenrollBtn} onPress={confirmUnenroll}>
          <Text style={s.unenrollBtnText}>Unenrol from this hobby</Text>
        </TouchableOpacity>
      </ScrollView>

      <HelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={HELP_CONTENT.passion.title}
        sections={HELP_CONTENT.passion.sections}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  helpBtnText: { color: C.white, fontWeight: '900', fontSize: F.base },
  reportIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  reportIcon: { fontSize: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  heroIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  heroEmoji: { fontSize: 28 },
  errorBox: { backgroundColor: C.errorContainer, borderRadius: R.lg, padding: 12, marginBottom: 14 },
  errorText: { color: C.error, fontSize: F.base },
  activeSection: { marginBottom: 8 },
  resume: { marginBottom: 14, borderColor: C.passion + '40' },
  kicker: { fontSize: F.sm, color: C.passion, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  resumeTitle: { fontSize: F.xl, color: C.onSurface, fontWeight: '800', marginTop: 6 },
  resumeMeta: { fontSize: F.base, color: C.onSurfaceVariant, marginVertical: 10 },
  resumeAction: { alignSelf: 'flex-end', color: C.passion, fontSize: F.md, fontWeight: '800', marginTop: 12 },
  sectionBlock: { marginBottom: 18 },
  horizontalRow: { flexDirection: 'row', gap: 12, paddingRight: 20 },
  projectCard: { width: 250, backgroundColor: C.surfaceLowest, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.outlineVariant, ...SHADOW.md },
  projectTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  projectTitle: { flex: 1, fontSize: F.md, color: C.onSurface, fontWeight: '800' },
  projectDesc: { fontSize: F.sm, color: C.onSurfaceVariant, lineHeight: 18, marginTop: 8, minHeight: 36 },
  metaRow: { flexDirection: 'row', marginVertical: 12 },
  cardBtn: { height: 44, marginTop: 12 },
  createBtn: { marginTop: 4 },
  activeCount: { fontSize: F.sm, color: C.onSurfaceVariant, marginTop: 6 },
  activeNote: { fontSize: F.xs, color: C.passion, fontWeight: '700', marginTop: 3 },
  disabledHint: { marginTop: 8, color: C.onSurfaceVariant, fontSize: F.xs },

  // Small self-contained pill instead of a full-width underlined link
  unenrollBtn: {
    alignSelf: 'center', marginTop: 20, marginBottom: 8,
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  unenrollBtnText: { color: C.onSurfaceVariant, fontSize: F.xs, fontWeight: '700' },
});