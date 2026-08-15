// src/constants/vibeLabels.js
// Backend enum values (NAILED_IT / GETTING_THE_HANG_OF_IT / STRUGGLING) never
// change — only the display label/emoji/description shown to the user differs
// by hobby type. Structured hobbies are in a learning phase (skill-drilling
// language fits); passion hobbies already know what they're doing, so the
// wording shifts to an effort/flow register instead.

export const VIBE_LABELS = {
  structured: {
    NAILED_IT: {
      emoji: '🎯',
      label: 'Nailed it',
      desc: 'Felt great, made solid progress',
    },
    GETTING_THE_HANG_OF_IT: {
      emoji: '🙂',
      label: 'Making progress',
      desc: 'Made some progress, still learning',
    },
    STRUGGLING: {
      emoji: '😤',
      label: 'Struggled',
      desc: 'Tough session, but I showed up',
    },
  },
  passion: {
    NAILED_IT: {
      emoji: '✨',
      label: 'In the zone',
      desc: 'Everything just flowed today',
    },
    GETTING_THE_HANG_OF_IT: {
      emoji: '🌿',
      label: 'Found my rhythm',
      desc: 'Made some progress and enjoyed it',
    },
    STRUGGLING: {
      emoji: '💪',
      label: 'Showed up anyway',
      desc: 'Not my best session, but I kept the habit',
    },
  },
};

const XP_LABEL = {
  NAILED_IT: '+40 XP',
  GETTING_THE_HANG_OF_IT: '+30 XP',
  STRUGGLING: '+20 XP',
};

const VIBE_STYLE = {
  NAILED_IT: { border: '#0F6E56', bg: '#E1F5EE', color: '#0F6E56' }, // C.teal / C.tealLight
  GETTING_THE_HANG_OF_IT: { border: '#E67E22', bg: '#FEF3C7', color: '#E67E22' },
  STRUGGLING: { border: '#A32D2D', bg: '#FCEBEB', color: '#A32D2D' }, // C.admin / C.adminLight
};

// Builds the ordered VIBES array VibePickerModal renders, for a given context.
export function buildVibes(isPassion) {
  const set = isPassion ? VIBE_LABELS.passion : VIBE_LABELS.structured;
  return ['NAILED_IT', 'GETTING_THE_HANG_OF_IT', 'STRUGGLING'].map(value => ({
    value,
    emoji: set[value].emoji,
    label: set[value].label,
    desc: set[value].desc,
    xp: XP_LABEL[value],
    border: VIBE_STYLE[value].border,
    bg: VIBE_STYLE[value].bg,
    color: VIBE_STYLE[value].color,
  }));
}