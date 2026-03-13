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
      "High-density damask woven label with very tight weave control, crisp contours, precise thread rendering, and a clean high-definition woven finish.",
    promptConstraints: [
      "Very tight weave with compact thread spacing.",
      "Clean, precise thread rendering with crisp logo edges.",
      "Low gloss with controlled matte textile response.",
    ],
    paletteSuggestion: ["#F5F5DC", "#000000", "#FFFFFF"],
    defaultBackgroundGuidance:
      "Keep the woven label base warm cream and neutral, with no garment or environmental background influence.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for dense weave behavior, thread spacing, and lighting response.",
      "Ignore any garment, seam, or framing context from the references.",
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
      "Organic cotton woven label with stable HD-like weave control, natural matte body, visible cotton fibers, and soft but precise thread structure.",
    promptConstraints: [
      "Matte cotton surface with visible natural fiber texture.",
      "Stable weave logic with no satin-like reflectivity.",
      "Natural organic feel, not synthetic and not glossy.",
    ],
    paletteSuggestion: ["#E6DCCF", "#5C5C5C", "#8B7E66"],
    defaultBackgroundGuidance:
      "Keep the woven label base natural beige and softly matte, without introducing dark or synthetic-looking backgrounds.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for cotton fiber visibility, matte thread behavior, and organic palette cues.",
      "Do not borrow folds, product staging, or any foreign surface color from the references.",
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
      "Classic taffeta woven label with a visible standard grid structure, traditional textile body, balanced thread definition, and a controlled heritage woven look.",
    promptConstraints: [
      "Classic visible woven grid with traditional thread spacing.",
      "Structured textile body with moderate gloss only.",
      "Traditional woven look, not overly glossy and not satin-like.",
    ],
    paletteSuggestion: ["#F0EAD6", "#8B0000", "#2F4F4F"],
    defaultBackgroundGuidance:
      "Keep the woven label base soft flax beige with a controlled neutral field and no environmental contamination.",
    sheenExpected: false,
    referenceHandlingNotes: [
      "Use references only for classic grid structure, thread definition, and lighting response.",
      "Do not copy reference text, framing, or external props.",
    ],
    camera: "top-down macro textile photography",
    lighting: "balanced studio lighting with moderate specular detail",
  },
};
