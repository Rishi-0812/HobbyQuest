// src/constants/hobbyAccent.js
import { C } from '../theme';

const PALETTE = [C.indigo, C.passion, C.secondary, C.almostThere, C.blue, C.teal, C.admin, C.orange];

export function getHobbyAccent(hobbyId) {
  if (!hobbyId) return C.indigo;
  return PALETTE[hobbyId % PALETTE.length];
}