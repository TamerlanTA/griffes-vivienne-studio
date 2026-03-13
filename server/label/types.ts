export type LabelMaterial = "HD" | "COTTON" | "SATIN" | "TAFFETA";

export type LabelColor = "BLACK" | "WHITE" | "CREAM" | "BEIGE" | "GOLD";

export type LabelSize = "20x10" | "30x15" | "50x20";

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
