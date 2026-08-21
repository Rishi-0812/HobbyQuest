export const HELP_CONTENT = {
  dashboard: {
    title: 'Your Dashboard',
    sections: [
      { emoji: '🔥', title: 'Streak', body: 'Log at least one session (any hobby) each day to keep your streak alive. Miss a day and it resets — unless you have a freeze available.' },
      { emoji: '⭐', title: 'XP & Level', body: 'You earn XP from every session, plus bonuses for completing skills, levels, and projects. Your level is just prestige — it doesn\'t unlock anything.' },
      { emoji: '📊', title: 'Activity graph', body: 'Each square is a day. Darker squares mean more sessions logged that day.' },
    ],
  },
  roadmap: {
    title: 'Structured Hobbies',
    sections: [
      { emoji: '🗺️', title: 'The roadmap', body: 'Skills unlock in order: Basic → Intermediate → Advanced → Mastery. Complete every skill in a level to unlock the next.' },
      { emoji: '📝', title: 'Logging a session', body: 'After practicing, log how it went. 3+ sessions on a skill lets you mark it "Almost there" — then a "Nailed it" session completes it automatically.' },
      { emoji: '🚩', title: 'Something wrong?', body: 'Tap the flag icon to report an inaccurate skill or description.' },
    ],
  },
  passion: {
    title: 'Passion Hobbies',
    sections: [
      { emoji: '🎨', title: 'Projects, not roadmaps', body: 'Passion hobbies work through projects — creative challenges with a target count, like "30 Poems in 30 Days".' },
      { emoji: '✅', title: 'Logging progress', body: 'Each session, you can mark up to 2 units complete — you\'ll always see the actual prompt before confirming.' },
      { emoji: '📌', title: 'Active project limit', body: 'You can have up to 2 active projects at once, across all your passion hobbies combined.' },
    ],
  },
  xp: {
    title: 'How XP Works',
    sections: [
      { emoji: '✨', title: 'Sessions', body: 'Struggled = +20, Kept at it = +30, Nailed it = +40. Plus a +30 bonus for your first session of the day, on any hobby.' },
      { emoji: '📈', title: 'Daily cap', body: 'Each skill/project can earn up to 90 XP per day from sessions — this stops repetitive grinding from dominating your total.' },
      { emoji: '🏆', title: 'Milestones', body: 'Completing skills, levels, and whole roadmaps/projects gives large one-time bonuses — this is where most of your XP comes from over time.' },
    ],
  },
};