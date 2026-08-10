// src/constants/hobbyEmojis.js
// Maps hobby names to emojis client-side.
// Used instead of storing emojis in DB (avoids SQL encoding issues).

const EMOJI_MAP = {
  // Structured
  'Pen Spinning':   '🖊️',
  'Chess':          '♟️',
  'Calligraphy':    '🖋️',
  'Guitar':         '🎸',
  'Juggling':       '🤹',
  'Origami':        '🦢',
  'Knitting':       '🧶',
  'Coding':         '💻',
  'Language Learning': '🗣️',

  // Passion
  'Creative Writing': '✍️',
  'Sketching':        '✏️',
  'Photography':      '📷',
  'Watercolour':      '🎨',
  'Journaling':       '📓',
  'Cooking':          '🍳',
  'Gardening':        '🌱',
  'Video Creation':   '🎬',
};

export function getHobbyEmoji(hobby) {
  if (!hobby) return '🎯';
  if (typeof hobby === 'object') {
    if (hobby.emoji) return hobby.emoji;
    return getHobbyEmoji(hobby.name);
  }
  const name = hobby;
  if (EMOJI_MAP[name]) return EMOJI_MAP[name];
  const key = Object.keys(EMOJI_MAP).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? EMOJI_MAP[key] : '🎯';
}