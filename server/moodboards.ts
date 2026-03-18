import type { LegacyTextureType } from "./label";
import { LEGACY_INLINE_MOODBOARDS } from "./moodboards.legacy";

const COTTON_MOODBOARD_PATHS = [
  "server/moodboards/cotton_macro_1.jpeg",
  "server/moodboards/cotton_macro_2.jpeg",
  "server/moodboards/cotton_macro_3.jpeg",
  "server/moodboards/cotton_macro_4.jpeg",
] as const;

const TAFFETA_MOODBOARD_PATHS = [
  "server/moodboards/taffeta_1.jpeg",
  "server/moodboards/taffeta_2.jpeg",
  "server/moodboards/taffeta_3.jpeg",
  "server/moodboards/taffeta_4.jpeg",
] as const;

// Keep reference assets and transfer targets together so texture tuning stays
// localized without changing how the generation service loads the moodboards.
export const MOODBOARD_PROMPT_GUIDANCE: Record<
  LegacyTextureType,
  readonly string[]
> = {
  hd: [
    "Prefer crisp, newly manufactured dense weave behavior with compact threads and clean contours.",
    "Ignore any worn, faded, distressed, or aged textile cues when transferring the HD texture.",
  ],
  hdcoton: [
    "Use only the curated cotton references that clearly show premium woven-label construction, dense micro-weave behavior, realistic jacquard integration, and clean studio lighting.",
    "Target a true woven cotton label with a clean light cotton base, high-density fine woven structure, very tight thread spacing, uniform micro-weave, and clean cut edges.",
    "Favor textile references with micro-depth, thread-level shadowing, darker woven logo yarns integrated into the same fabric structure, and a smooth yet micro-textured industrial label surface.",
    "Avoid printed-cotton appearance, raw-fabric behavior, overly smooth poster-like planes, synthetic surface response, side stitching, border seams, folded edges, decorative stitching, vertical label orientation, or oversized yarn scale.",
  ],
  satin: [
    "Use satin references only for sheen control and refined weave behavior while keeping the label isolated and premium.",
  ],
  taffetas: [
    "Use the taffeta references for fine woven grid behavior, crisp thread transitions, and realistic lighting only.",
    "Keep the taffeta background grain fine, tight, and small-scale like a premium woven care label.",
    "Avoid oversized texture, exaggerated checkerboard weave patterns, raw-fabric appearance, or any printed-looking surface patches.",
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
