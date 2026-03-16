import type { LabelMaterial, TexturePreset } from "./types";

export const TEXTURE_PRESETS_BY_MATERIAL: Record<LabelMaterial, TexturePreset> = {
  HD: {
    material: "HD",
    title: "HD (High Definition)",
    legacyTextureType: "hd",
    weaveType: "DAMASK_HD",
    gridDensity: 2,
    threadAngle: 0,
    glossLevel: "low",
    promptMaterialDescription:
      "High-density damask woven label with very tight weave control, crisp contours, precise thread rendering, flat woven logo integration, and a clean newly manufactured high-definition finish.",
    promptConstraints: [
      "Very tight weave with compact thread spacing and crisp high-density thread definition.",
      "Logo threads stay flat woven, flush with the fabric surface, and never form raised borders.",
      "Fresh newly manufactured textile finish with no fading, wear, or distressed fibers.",
      "Low gloss with controlled matte textile response.",
    ],
    paletteSuggestion: ["#F5F5DC", "#000000", "#FFFFFF"],
    defaultBackgroundGuidance:
      "Keep the woven label base warm cream and neutral, with no garment influence and no vintage or distressed cast.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for dense weave behavior, thread spacing, crisp thread integration, and lighting response.",
      "Ignore any garment, seam, framing context, or worn surface marks from the references.",
    ],
    camera: "top-down macro textile photography",
    lighting: "soft studio lighting with controlled shadow falloff",
  },
  COTTON: {
    material: "COTTON",
    title: "HD Cotton",
    legacyTextureType: "hdcoton",
    weaveType: "COTTON_STABLE",
    gridDensity: 1.5,
    threadAngle: 0,
    glossLevel: "low",
    promptMaterialDescription:
      "True woven cotton label with soft natural cotton fibers, slight thread irregularity, organic matte weave structure, slightly thicker yarns, and a real woven-not-printed finish.",
    promptConstraints: [
      "Soft matte cotton surface with visible natural fibers and subtle thread irregularity.",
      "Slightly thicker cotton yarns woven into an organic structure, never a smooth printed sheet.",
      "Natural organic feel with no synthetic gloss, no printed-cotton look, and no overly smooth fabric surface.",
    ],
    paletteSuggestion: ["#E6DCCF", "#5C5C5C", "#8B7E66"],
    defaultBackgroundGuidance:
      "Keep the woven label base natural beige, softly matte, and clearly woven rather than printed, without dark or synthetic-looking background contamination.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for cotton fiber visibility, matte thread behavior, slightly thicker yarn scale, and organic weave cues.",
      "Do not borrow folds, product staging, foreign surface color, or any smooth printed-looking areas from the references.",
    ],
    camera: "top-down macro textile photography",
    lighting: "diffused daylight studio lighting with gentle contrast",
  },
  SATIN: {
    material: "SATIN",
    title: "Satin",
    legacyTextureType: "satin",
    weaveType: "SATIN_DIAGONAL_20",
    gridDensity: 1.25,
    threadAngle: 20,
    glossLevel: "high",
    promptMaterialDescription:
      "Luxury satin woven label with silky sheen, refined thread transitions, a controlled 20 degree diagonal structure, and a light premium woven base.",
    promptConstraints: [
      "Silky sheen must remain visible across the woven surface.",
      "The label background must be light beige or cream (#F5F5DC).",
      "The label itself must stay light-colored and must NOT turn dark.",
      "Do not adopt dark garment background from reference images.",
      "Do not drift into a matte taffeta-like look.",
    ],
    paletteSuggestion: ["#F5F5DC", "#FFFFFF", "#000000"],
    defaultBackgroundGuidance:
      "Keep the woven label itself light beige or cream (#F5F5DC), isolated, premium, and never darkened by any garment or reference background.",
    sheenExpected: true,
    referenceHandlingNotes: [
      "Use references only for satin weave response, light reflection, and sheen behavior.",
      "Ignore any dark cloth backdrop, folds, borders, or staging elements from the references.",
    ],
    camera: "top-down macro textile photography",
    lighting: "polished studio lighting that preserves soft satin sheen",
  },
  TAFFETA: {
    material: "TAFFETA",
    title: "Taffetas",
    legacyTextureType: "taffetas",
    weaveType: "TAFFETA_CLASSIC_GRID",
    gridDensity: 1,
    threadAngle: 0,
    glossLevel: "medium",
    promptMaterialDescription:
      "High-quality woven taffeta label with fine tight grain, small-scale classic grid structure, balanced thread definition, and a clean professional woven finish.",
    promptConstraints: [
      "Fine, tight woven grain with small, regular weave cells.",
      "Balanced thread definition with restrained gloss and compact thread scale.",
      "Premium woven taffeta look, not coarse, not oversized, and not satin-like.",
    ],
    paletteSuggestion: ["#F0EAD6", "#8B0000", "#2F4F4F"],
    defaultBackgroundGuidance:
      "Keep the woven label base soft flax beige with a clean neutral field, fine tight grain, and no environmental contamination.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for fine classic grid structure, compact thread definition, and lighting response.",
      "Do not copy reference text, framing, external props, or any exaggerated coarse weave zones.",
    ],
    camera: "top-down macro textile photography",
    lighting: "balanced studio lighting with moderate specular detail",
  },
};
