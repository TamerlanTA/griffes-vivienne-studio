import { MOODBOARDS } from "./moodboards";
import {
  LEGACY_TEXTURE_TYPES,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
  type GlossLevel,
  type LegacyTextureType,
} from "./label";

export const TEXTURE_TYPES = [...LEGACY_TEXTURE_TYPES] as const;

export type TextureType = (typeof TEXTURE_TYPES)[number];

export interface TexturePreset {
  id: TextureType;
  title: string;
  materialDescription: string;
  colors: string[];
  backgroundColor: string;
  weaveType: string;
  glossLevel: GlossLevel;
  camera: string;
  lighting: string;
  references: readonly string[];
}

function toLegacyPreset(textureType: LegacyTextureType): TexturePreset {
  const material = mapLegacyTextureType(textureType);
  if (!material) {
    throw new Error(`Unsupported legacy texture type: ${textureType}`);
  }

  const preset = TEXTURE_PRESETS_BY_MATERIAL[material];

  return {
    id: textureType,
    title: preset.title,
    materialDescription: preset.promptMaterialDescription,
    colors: [...preset.paletteSuggestion],
    backgroundColor: preset.defaultBackgroundGuidance,
    weaveType: preset.weaveType,
    glossLevel: preset.glossLevel,
    camera: preset.camera,
    lighting: preset.lighting,
    references: MOODBOARDS[textureType],
  };
}

export const TEXTURE_PRESETS: Record<TextureType, TexturePreset> = TEXTURE_TYPES.reduce(
  (accumulator, textureType) => {
    accumulator[textureType] = toLegacyPreset(textureType);
    return accumulator;
  },
  {} as Record<TextureType, TexturePreset>
);
