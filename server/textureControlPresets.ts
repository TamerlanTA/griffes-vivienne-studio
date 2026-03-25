import { mapLegacyTextureType } from "./label/mapLegacyTextureType";
import type { LabelMaterial } from "./label/types";
import type { TextureType } from "./texturePresets";

export interface TextureControlPreset {
  material: LabelMaterial;
  name: "HD" | "HD_COTTON" | "SATIN" | "TAFFETA";
  gridDensity: number;
  threadThickness: number;
  weaveAngle: number;
  glossLevel: number;
  noiseLevel: number;
  sharpness: number;
  textureSummary: string;
  textureRules: readonly string[];
}

export const TEXTURE_CONTROL_PRESETS_BY_MATERIAL: Record<
  LabelMaterial,
  TextureControlPreset
> = {
  HD: {
    material: "HD",
    name: "HD",
    gridDensity: 2,
    threadThickness: 0.34,
    weaveAngle: 0,
    glossLevel: 0.18,
    noiseLevel: 0.02,
    sharpness: 0.96,
    textureSummary:
      "Ultra-tight micro weave with a locked high-definition background and subtly cleaner denser motif thread behavior.",
    textureRules: [
      "Keep the approved HD background weave locked with no global texture drift.",
      "Ultra high-density weave with clean micro grid behavior.",
      "Logo and text threads may read slightly tighter and cleaner than the base weave, but must stay fully woven and subtle.",
      "No visible gaps between threads, no patch effect, and no printed or embroidered behavior.",
    ],
  },
  COTTON: {
    material: "COTTON",
    name: "HD_COTTON",
    gridDensity: 1.75,
    threadThickness: 0.35,
    weaveAngle: 0,
    glossLevel: 0.12,
    noiseLevel: 0.04,
    sharpness: 0.88,
    textureSummary:
      "Dense cotton micro weave with locked background weave, tone, lighting, and a narrow woven selvedge, plus subtly tighter logo thread structure.",
    textureRules: [
      "The background cotton weave, tone, lighting, and selvedge must remain locked and unchanged.",
      "Logo threads should be slightly tighter, denser, cleaner, and more motif-like than the background weave, with subtle and realistic contrast only.",
      "Organic cotton threads.",
      "Slight softness but still dense.",
      "NO coarse grain, NO noise, NO patch effect, and NO printed or embroidered behavior.",
      "Micro-thin woven cotton selvedge trim on the top and bottom edges only, narrow, clean, real-production, and never a wide band, folded hem, or stitched border.",
    ],
  },
  SATIN: {
    material: "SATIN",
    name: "SATIN",
    gridDensity: 1.25,
    threadThickness: 0.33,
    weaveAngle: 20,
    glossLevel: 0.72,
    noiseLevel: 0.02,
    sharpness: 0.9,
    textureSummary:
      "Controlled satin weave with a stable 20 degree diagonal structure, visible threads, and restrained sheen.",
    textureRules: [
      "Diagonal weave (~20 degree angle).",
      "Smooth surface with controlled sheen.",
      "Must still show woven thread structure.",
      "Must NOT look like ribbon or plastic.",
    ],
  },
  TAFFETA: {
    material: "TAFFETA",
    name: "TAFFETA",
    gridDensity: 1.5,
    threadThickness: 0.28,
    weaveAngle: 0,
    glossLevel: 0.28,
    noiseLevel: 0.02,
    sharpness: 0.93,
    textureSummary:
      "Fine dense compact taffeta weave with tight small weave cells, a flat clean industrial label-tape surface, and no cotton softness or canvas coarseness.",
    textureRules: [
      "Fine dense regular taffeta weave with tight compact weave cells and no oversized or exaggerated grid.",
      "Flat clean industrial label-tape surface with reduced visible grain and no coarse or porous texture.",
      "Crisp controlled thread definition with no softness, no fuzziness, and no organic cotton or linen character.",
      "No cotton softness, no canvas texture, no linen texture, no porous fabric, and no coarse weave.",
      "No thick fabric strip look, no natural cloth swatch appearance, and no raw textile feel.",
      "More manufactured, regular, and precise than cotton — a tighter, flatter, more controlled woven label tape.",
    ],
  },
};

function isLabelMaterial(value: string): value is LabelMaterial {
  return (
    value === "HD" ||
    value === "COTTON" ||
    value === "SATIN" ||
    value === "TAFFETA"
  );
}

export function getTextureControlPreset(
  materialOrTextureType: LabelMaterial | TextureType | string
): TextureControlPreset {
  if (isLabelMaterial(materialOrTextureType)) {
    return TEXTURE_CONTROL_PRESETS_BY_MATERIAL[materialOrTextureType];
  }

  const material = mapLegacyTextureType(materialOrTextureType);
  if (!material) {
    throw new Error(
      `Unsupported texture control preset: ${materialOrTextureType}`
    );
  }

  return TEXTURE_CONTROL_PRESETS_BY_MATERIAL[material];
}
