export const GENRES = [
  "electronic",
  "indie",
  "pop",
  "rock",
  "hip-hop",
  "jazz",
  "dance",
  "alternative",
] as const;

export type Genre = (typeof GENRES)[number];
