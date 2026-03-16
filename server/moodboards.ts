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

// Keep reference assets and transfer targets together so texture tuning stays
// localized without changing how the generation service loads the moodboards.
export const MOODBOARD_PROMPT_GUIDANCE: Record<LegacyTextureType, readonly string[]> = {
  hd: [
    "Prefer crisp, newly manufactured dense weave behavior with compact threads and clean contours.",
    "Ignore any worn, faded, distressed, or aged textile cues when transferring the HD texture.",
  ],
  hdcoton: [
    "Target a true woven cotton label with soft natural cotton fibers, subtle thread irregularity, organic matte weave structure, and slightly thicker yarns.",
    "Avoid printed-cotton appearance, overly smooth fabric planes, or synthetic surface behavior.",
  ],
  satin: [
    "Use satin references only for sheen control and refined weave behavior while keeping the label isolated and premium.",
  ],
  taffetas: [
    "Keep the taffeta background grain fine, tight, and small-scale like a premium woven care label.",
    "Avoid coarse texture, oversized threads, or exaggerated checkerboard weave patterns.",
  ],
};

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
