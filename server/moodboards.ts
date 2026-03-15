import type { LegacyTextureType } from "./label";
import { LEGACY_INLINE_MOODBOARDS } from "./moodboards.legacy";

const COTTON_MOODBOARD_PATHS = [
  "server/moodboards/cotton_1.jpeg",
  "server/moodboards/cotton_2.jpeg",
  "server/moodboards/cotton_3.jpeg",
  "server/moodboards/cotton_4.jpeg",
] as const;

const TAFFETA_MOODBOARD_PATHS = [
  "server/moodboards/taffeta_1.jpeg",
  "server/moodboards/taffeta_2.jpeg",
  "server/moodboards/taffeta_3.jpeg",
  "server/moodboards/taffeta_4.jpeg",
] as const;

export const moodboards = {
  cotton: COTTON_MOODBOARD_PATHS,
  taffeta: TAFFETA_MOODBOARD_PATHS,
} as const;

/**
 * Cotton and taffeta now load from the filesystem. HD and satin stay on their
 * legacy inline references until matching file sets are added.
 */
export const MOODBOARDS: Record<LegacyTextureType, readonly string[]> = {
  hd: LEGACY_INLINE_MOODBOARDS.hd,
  hdcoton: moodboards.cotton,
  satin: LEGACY_INLINE_MOODBOARDS.satin,
  taffetas: moodboards.taffeta,
};
