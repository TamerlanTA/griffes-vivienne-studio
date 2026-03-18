import type {
  LabelColor,
  LabelLogoColor,
  LabelLogoType,
  LabelMaterial,
  LabelSize,
  LegacyTextureType,
  WeaveType,
} from "./types";

export const LABEL_MATERIALS = ["HD", "COTTON", "SATIN", "TAFFETA"] as const;

export const LABEL_COLORS = [
  "BLACK",
  "WHITE",
  "CREAM",
  "BEIGE",
  "GOLD",
  "OFF_WHITE",
  "LIGHT_BEIGE",
  "DARK_CHARCOAL",
] as const;

export const LABEL_LOGO_COLORS = ["BLACK", "DARK_BLUE", "WHITE"] as const;

export const LABEL_LOGO_TYPES = [
  "AUTO",
  "SYMBOL_ONLY",
  "TEXT_ONLY",
  "SYMBOL_AND_TEXT",
] as const;

export const LABEL_SIZES = [
  "20x10",
  "25x25",
  "30x15",
  "40x20",
  "50x20",
  "60x24",
] as const;

export const WEAVE_TYPES = [
  "DAMASK_HD",
  "COTTON_STABLE",
  "SATIN_DIAGONAL_20",
  "TAFFETA_CLASSIC_GRID",
] as const;

export const LEGACY_TEXTURE_TYPES = [
  "hd",
  "hdcoton",
  "satin",
  "taffetas",
] as const;

export const DEFAULT_LABEL_MATERIAL: LabelMaterial = "HD";
export const DEFAULT_LABEL_COLOR: LabelColor = "BLACK";
export const DEFAULT_LABEL_LOGO_COLOR: LabelLogoColor = "BLACK";
export const DEFAULT_LABEL_LOGO_TYPE: LabelLogoType = "AUTO";
export const DEFAULT_LABEL_SIZE: LabelSize = "50x20";

export const MATERIAL_DEFAULT_BACKGROUND_COLORS: Record<
  LabelMaterial,
  LabelColor
> = {
  HD: "BEIGE",
  COTTON: "BEIGE",
  SATIN: "CREAM",
  TAFFETA: "BEIGE",
};

export const MATERIAL_TO_LEGACY_TEXTURE_TYPE: Record<
  LabelMaterial,
  LegacyTextureType
> = {
  HD: "hd",
  COTTON: "hdcoton",
  SATIN: "satin",
  TAFFETA: "taffetas",
};

export const LEGACY_TEXTURE_TYPE_TO_MATERIAL: Record<
  LegacyTextureType,
  LabelMaterial
> = {
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
