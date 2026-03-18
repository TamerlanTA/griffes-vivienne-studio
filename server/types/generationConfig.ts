export const GENERATION_CONFIG_MATERIALS = [
  "HD",
  "COTTON",
  "HD_COTTON",
  "SATIN",
  "TAFFETA",
] as const;

export type GenerationConfigMaterial =
  (typeof GENERATION_CONFIG_MATERIALS)[number];

export const GENERATION_CONFIG_LOGO_TYPES = [
  "AUTO",
  "SYMBOL_ONLY",
  "TEXT_ONLY",
  "SYMBOL_AND_TEXT",
] as const;

export type GenerationConfigLogoType =
  (typeof GENERATION_CONFIG_LOGO_TYPES)[number];

export interface GenerationConfig {
  material: GenerationConfigMaterial;
  color?: string;
  backgroundColor?: string;
  logoColor?: string;
  logoType?: GenerationConfigLogoType;
  size: string;
  weave: string;
  density: number;
  threadAngle?: number;
  glossLevel?: number;
}

const DARK_BACKGROUND_ALIASES = new Set([
  "BLACK",
  "DARK",
  "DARK_CHARCOAL",
  "CHARCOAL",
]);

export function getGenerationBackgroundColor(
  config: Pick<GenerationConfig, "color" | "backgroundColor">
): string {
  return (config.backgroundColor ?? config.color ?? "").trim();
}

export function getGenerationLogoColor(
  config: Pick<GenerationConfig, "color" | "backgroundColor" | "logoColor">
): string {
  const explicitLogoColor = config.logoColor?.trim();
  if (explicitLogoColor) {
    return explicitLogoColor;
  }

  const backgroundColor = getGenerationBackgroundColor(config).toUpperCase();
  return DARK_BACKGROUND_ALIASES.has(backgroundColor) ? "white" : "black";
}

export function getGenerationLogoType(
  config: Pick<GenerationConfig, "logoType">
): GenerationConfigLogoType {
  const logoType = config.logoType?.trim().toUpperCase();
  switch (logoType) {
    case "SYMBOL_ONLY":
    case "TEXT_ONLY":
    case "SYMBOL_AND_TEXT":
      return logoType;
    default:
      return "AUTO";
  }
}
