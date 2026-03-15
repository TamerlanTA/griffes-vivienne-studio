import { MOODBOARDS } from "./moodboards";
import {
  LEGACY_TEXTURE_TYPES,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
  type LegacyTextureType,
} from "./label";

export const TEXTURE_TYPES = [...LEGACY_TEXTURE_TYPES] as const;

export type TextureType = (typeof TEXTURE_TYPES)[number];

export interface TexturePreset {
  name: string;
  references: string[];
  parameters: {
    threadThickness: number;
    weaveDensity: number;
    fabricStiffness: number;
    edgeFinish: "woven" | "clean";
    glossLevel: number;
    threadAngle?: number;
  };
  promptTemplate: string;
}

const TEXTURE_PRESET_NAMES: Record<TextureType, TexturePreset["name"]> = {
  hd: "HD",
  hdcoton: "HD_COTTON",
  satin: "SATIN",
  taffetas: "TAFFETA",
};

const TEXTURE_PRESET_PARAMETERS: Record<TextureType, TexturePreset["parameters"]> = {
  hd: {
    threadThickness: 0.4,
    weaveDensity: 0.9,
    fabricStiffness: 0.8,
    edgeFinish: "woven",
    glossLevel: 0.2,
  },
  hdcoton: {
    threadThickness: 0.45,
    weaveDensity: 0.82,
    fabricStiffness: 0.74,
    edgeFinish: "woven",
    glossLevel: 0.15,
  },
  satin: {
    threadThickness: 0.38,
    weaveDensity: 0.8,
    fabricStiffness: 0.7,
    edgeFinish: "clean",
    glossLevel: 0.85,
    threadAngle: 20,
  },
  taffetas: {
    threadThickness: 0.5,
    weaveDensity: 0.75,
    fabricStiffness: 0.85,
    edgeFinish: "woven",
    glossLevel: 0.35,
  },
};

const BASE_PROMPT_TEMPLATE = [
  "- Apply controlled textile realism for woven label generation.",
  "- Use the reference images only for textile texture, weave pattern, thread behavior, and lighting.",
  "- Keep the result manufacturing-aligned, stable, and free from ad-hoc artistic interpretation.",
].join("\n");

function createPromptTemplate(textureType: TextureType): string {
  const material = mapLegacyTextureType(textureType);
  if (!material) {
    throw new Error(`Unsupported legacy texture type: ${textureType}`);
  }

  const preset = TEXTURE_PRESETS_BY_MATERIAL[material];

  return [
    BASE_PROMPT_TEMPLATE,
    `- Material target: ${preset.promptMaterialDescription}`,
    ...preset.referenceHandlingNotes.map((note) => `- ${note}`),
  ].join("\n");
}

function createTexturePreset(textureType: TextureType): TexturePreset {
  const references = MOODBOARDS[textureType];

  return {
    name: TEXTURE_PRESET_NAMES[textureType],
    references: [...references],
    parameters: { ...TEXTURE_PRESET_PARAMETERS[textureType] },
    promptTemplate: createPromptTemplate(textureType),
  };
}

export const TEXTURE_PRESETS: Record<TextureType, TexturePreset> = TEXTURE_TYPES.reduce(
  (accumulator, textureType) => {
    accumulator[textureType] = createTexturePreset(textureType);
    return accumulator;
  },
  {} as Record<TextureType, TexturePreset>
);

export const texturePresets = TEXTURE_PRESETS;

export function getTexturePreset(textureType: TextureType | LegacyTextureType): TexturePreset {
  return TEXTURE_PRESETS[textureType];
}
