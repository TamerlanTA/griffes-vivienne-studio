import type {
  LabelColor,
  LabelMaterial,
  LabelSize,
  LegacyTextureType,
  WeaveType,
} from "./types";

export const LABEL_MATERIALS = ["HD", "COTTON", "SATIN", "TAFFETA"] as const;

export const LABEL_COLORS = ["BLACK", "WHITE", "CREAM", "BEIGE", "GOLD"] as const;

export const LABEL_SIZES = ["20x10", "30x15", "50x20"] as const;

export const WEAVE_TYPES = [
  "DAMASK_HD",
  "COTTON_STABLE",
  "SATIN_DIAGONAL_20",
  "TAFFETA_CLASSIC_GRID",
] as const;

export const LEGACY_TEXTURE_TYPES = ["hd", "hdcoton", "satin", "taffetas"] as const;

export const DEFAULT_LABEL_MATERIAL: LabelMaterial = "HD";
export const DEFAULT_LABEL_COLOR: LabelColor = "BLACK";
export const DEFAULT_LABEL_SIZE: LabelSize = "50x20";

export const MATERIAL_TO_LEGACY_TEXTURE_TYPE: Record<LabelMaterial, LegacyTextureType> = {
  HD: "hd",
  COTTON: "hdcoton",
  SATIN: "satin",
  TAFFETA: "taffetas",
};

export const LEGACY_TEXTURE_TYPE_TO_MATERIAL: Record<LegacyTextureType, LabelMaterial> = {
  hd: "HD",
  hdcoton: "COTTON",
  satin: "SATIN",
  taffetas: "TAFFETA",
};

export const MATERIAL_TO_DEFAULT_WEAVE: Record<LabelMaterial, WeaveType> = {
  HD: "DAMASK_HD",
  COTTON: "COTTON_STABLE",
  SATIN: "SATIN_DIAGONAL_20",
  TAFFETA: "TAFFETA_CLASSIC_GRID",
};
