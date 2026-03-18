export type LabelMaterial = "HD" | "COTTON" | "SATIN" | "TAFFETA";

export type LabelColor =
  | "BLACK"
  | "WHITE"
  | "CREAM"
  | "BEIGE"
  | "GOLD"
  | "OFF_WHITE"
  | "LIGHT_BEIGE"
  | "DARK_CHARCOAL";

export type LabelLogoColor = "BLACK" | "DARK_BLUE" | "WHITE";

export type LabelLogoType =
  | "AUTO"
  | "SYMBOL_ONLY"
  | "TEXT_ONLY"
  | "SYMBOL_AND_TEXT";

export type LabelSize =
  | "20x10"
  | "25x25"
  | "30x15"
  | "40x20"
  | "50x20"
  | "60x24";

export type WeaveType =
  | "DAMASK_HD"
  | "COTTON_STABLE"
  | "SATIN_DIAGONAL_20"
  | "TAFFETA_CLASSIC_GRID";

export type LegacyTextureType = "hd" | "hdcoton" | "satin" | "taffetas";

export type GlossLevel = "low" | "medium" | "high";

export interface LabelConfigInput {
  material?: LabelMaterial | LegacyTextureType | string | null;
  color?: LabelColor | string | null;
  backgroundColor?: LabelColor | string | null;
  logoColor?: LabelLogoColor | string | null;
  logoType?: LabelLogoType | string | null;
  size?: LabelSize | string | null;
  weaveType?: WeaveType | string | null;
  gridDensity?: number | null;
  threadAngle?: number | null;
  glossLevel?: GlossLevel | string | null;
  textureTypeLegacy?: LegacyTextureType | string | null;
}

export interface LabelConfig {
  material: LabelMaterial;
  color: LabelColor;
  backgroundColor: LabelColor;
  logoColor: LabelLogoColor;
  logoType: LabelLogoType;
  size: LabelSize;
  weaveType: WeaveType;
  gridDensity: number;
  threadAngle: number;
  glossLevel: GlossLevel;
  textureTypeLegacy: LegacyTextureType;
  labelCode: string;
}

export interface TexturePreset {
  material: LabelMaterial;
  title: string;
  legacyTextureType: LegacyTextureType;
  weaveType: WeaveType;
  gridDensity: number;
  threadAngle: number;
  glossLevel: GlossLevel;
  promptMaterialDescription: string;
  promptConstraints: readonly string[];
  paletteSuggestion: readonly string[];
  defaultBackgroundGuidance: string;
  sheenExpected: boolean;
  referenceHandlingNotes: readonly string[];
  camera: string;
  lighting: string;
}
