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

export const HD_MOODBOARD_GUIDANCE = {
  baseReferences: [
    "Approved HD background reference is the locked anchor for the HD texture family, tone, weave density, surface sharpness, lighting, label shape, composition, and margins.",
    "Approved polished white onyx / light marble support surface is part of the locked HD preset and must remain exactly the same.",
    "Approved HD label fabric tone is also locked: light warm ivory / pale beige / off-white, slightly warm, clearly distinct from the brighter cooler marble support surface, and never pure white.",
    "The HD base is now approved and locked: preserve the existing HD base exactly and do not soften, reinterpret, or drift the HD background or support surface.",
  ],
  motifReferences: [
    "Use the new successful woven logo/text behavior only as motif guidance for stronger motif-vs-ground separation inside the logo/text region.",
    "Refine only the internal woven realism of the logo and text through slightly tighter denser cleaner thread behavior, visible internal woven thread logic inside black shapes, and less smooth black fill appearance.",
    "Logo and text must remain visibly thread-woven, with slightly cleaner more production-like edges created by tighter thread alignment and cleaner thread transitions rather than fuzziness.",
    "Logo and text should show slightly denser thread packing than the ground, and the text must preserve internal woven logic rather than smooth black lettering or soft fuzzy black edges.",
    "Keep the polished white onyx / light marble support surface as the background only; the HD label itself must remain warm ivory / pale beige and must not shift toward pure white or tonally merge into the marble.",
    "Do not reinterpret the scene, do not change the support surface, do not drift to green cutting mats, wood, workshop tables, or random tabletops, and do not soften the approved HD background.",
  ],
} as const;

export const HD_COTTON_MOODBOARD_GUIDANCE = {
  baseReferences: [
    "Stage A anchor: treat the approved cotton reference background as the locked base family for warm light beige / natural ecru cotton tone, soft matte surface, subtle diagonal ground weave, gentle yarn presence, refined selvedge behavior, lighting, and composition stability.",
    "During base generation, use the approved cotton references only for background/base construction and do not prioritize motif refinement or global fabric reinterpretation.",
  ],
  motifReferences: [
    "Stage B anchor: preserve the approved Stage A base fabric family exactly and use the close-up woven reference only to refine motif-vs-ground textile separation inside the logo/text region.",
    "During motif refinement, preserve the subtle diagonal ground weave, selvedge, lighting, wood surface, and label shape while refining only the woven logo/text behavior.",
    "Inside the black motif, show visible woven thread logic, tighter denser thread packing, and a more compact thread rhythm than the softer background ground.",
    "Do not flatten the logo or text into a uniform black shape and do not let the motif collapse back into the same weave expression as the ground.",
  ],
} as const;

// Keep reference assets and transfer targets together so texture tuning stays
// localized without changing how the generation service loads the moodboards.
export const MOODBOARD_PROMPT_GUIDANCE: Record<
  LegacyTextureType,
  readonly string[]
> = {
  hd: [
    ...HD_MOODBOARD_GUIDANCE.baseReferences,
    "Prefer crisp, newly manufactured dense weave behavior with compact threads and clean contours.",
    ...HD_MOODBOARD_GUIDANCE.motifReferences,
    "Ignore any worn, faded, distressed, or aged textile cues when transferring the HD texture.",
  ],
  hdcoton: [
    ...HD_COTTON_MOODBOARD_GUIDANCE.baseReferences,
    "Use only cotton references that preserve refined factory-made cotton label behavior with soft natural lighting, no bright white drift, no cold synthetic cast, no ribbon-like diagonal bands, and no coarse twill ridges.",
    ...HD_COTTON_MOODBOARD_GUIDANCE.motifReferences,
    "Keep the black motif visibly woven as a distinct motif layer with internal thread logic and tighter denser thread behavior than the softer ground; do not flatten the motif into the same ground weave.",
    "Keep the selvedge ultra-subtle and structural on the top and bottom only, and do not erase the subtle diagonal woven direction visible in the cotton reference.",
  ],
  satin: [
    "Use satin references only for sheen control and refined weave behavior while keeping the label isolated and premium.",
  ],
  taffetas: [
    "Use the approved taffeta references for a very fine dense compact regular woven taffeta label surface — tighter, finer, and flatter than cotton, with small compact weave cells and a clean industrial label-tape precision.",
    "The taffeta surface must show a fine regular small-cell grid pattern: tight compact weave cells clearly smaller and finer than cotton, with no coarse grain, no canvas texture, no linen texture, and no porous surface.",
    "The label must read as a manufactured precision woven label tape — thin, flat, clean, and industrially controlled — not as a thick fabric swatch, cotton patch, or soft natural cloth sample.",
    "Preserve the approved neutral paper-like support surface / backdrop family and do not drift to marble, wood, concrete, or random blank white backgrounds.",
    "Keep the taffeta flat, thin, and slightly warm neutral beige / light ivory with a clean controlled woven face and no cotton softness, organic yarn presence, fuzzy fibers, or canvas/linen character.",
    "Keep the logo and text flat woven and integrated into the same fine taffeta structure with clean black thread definition — never embroidered, never raised, never outlined with thick stitching.",
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
