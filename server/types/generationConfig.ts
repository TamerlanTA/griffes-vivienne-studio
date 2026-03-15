export const GENERATION_CONFIG_MATERIALS = [
  "HD",
  "HD_COTTON",
  "SATIN",
  "TAFFETA",
] as const;

export type GenerationConfigMaterial = (typeof GENERATION_CONFIG_MATERIALS)[number];

export interface GenerationConfig {
  material: GenerationConfigMaterial;
  color: string;
  size: string;
  weave: string;
  density: number;
  threadAngle?: number;
  glossLevel?: number;
}
