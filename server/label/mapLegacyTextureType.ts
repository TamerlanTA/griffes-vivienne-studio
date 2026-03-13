import {
  LEGACY_TEXTURE_TYPE_TO_MATERIAL,
  MATERIAL_TO_LEGACY_TEXTURE_TYPE,
} from "./constants";
import type { LabelMaterial, LegacyTextureType } from "./types";

export function mapLegacyTextureType(
  textureType: LegacyTextureType | string | null | undefined
): LabelMaterial | undefined {
  if (typeof textureType !== "string") {
    return undefined;
  }

  const normalized = textureType.trim().toLowerCase();
  if (normalized in LEGACY_TEXTURE_TYPE_TO_MATERIAL) {
    return LEGACY_TEXTURE_TYPE_TO_MATERIAL[normalized as LegacyTextureType];
  }

  return undefined;
}

export function mapMaterialToLegacyTextureType(material: LabelMaterial): LegacyTextureType {
  return MATERIAL_TO_LEGACY_TEXTURE_TYPE[material];
}
