import type {
  LabelColor,
  LabelLogoColor,
  LabelLogoType,
  LabelMaterial,
  LabelSize,
} from "./types";
import { buildLabelConfig } from "./buildLabelConfig";
import type {
  GenerationConfig,
  GenerationConfigMaterial,
} from "../types/generationConfig";

export interface ProductionBatchVariation {
  slug: string;
  description: string;
  material: LabelMaterial;
  backgroundColor: LabelColor;
  logoColor: LabelLogoColor;
  logoType: Exclude<LabelLogoType, "AUTO">;
  size: LabelSize;
  config: GenerationConfig;
}

type ProductionBatchBlueprint = Omit<
  ProductionBatchVariation,
  "slug" | "description" | "material" | "config"
>;

const PRODUCTION_BATCH_BLUEPRINTS: readonly ProductionBatchBlueprint[] = [
  {
    size: "25x25",
    backgroundColor: "OFF_WHITE",
    logoColor: "BLACK",
    logoType: "SYMBOL_ONLY",
  },
  {
    size: "25x25",
    backgroundColor: "DARK_CHARCOAL",
    logoColor: "WHITE",
    logoType: "TEXT_ONLY",
  },
  {
    size: "40x20",
    backgroundColor: "CREAM",
    logoColor: "DARK_BLUE",
    logoType: "SYMBOL_AND_TEXT",
  },
  {
    size: "40x20",
    backgroundColor: "LIGHT_BEIGE",
    logoColor: "BLACK",
    logoType: "TEXT_ONLY",
  },
  {
    size: "60x24",
    backgroundColor: "OFF_WHITE",
    logoColor: "DARK_BLUE",
    logoType: "SYMBOL_AND_TEXT",
  },
  {
    size: "60x24",
    backgroundColor: "DARK_CHARCOAL",
    logoColor: "WHITE",
    logoType: "SYMBOL_ONLY",
  },
] as const;

function mapMaterialToGenerationMaterial(
  material: LabelMaterial
): GenerationConfigMaterial {
  switch (material) {
    case "COTTON":
      return "COTTON";
    case "HD":
      return "HD";
    case "SATIN":
      return "SATIN";
    case "TAFFETA":
      return "TAFFETA";
  }
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export function buildProductionBatchVariations(
  materials: readonly LabelMaterial[] = ["COTTON", "TAFFETA"]
): ProductionBatchVariation[] {
  return materials.flatMap(material =>
    PRODUCTION_BATCH_BLUEPRINTS.map(blueprint => {
      const labelConfig = buildLabelConfig({
        material,
        backgroundColor: blueprint.backgroundColor,
        logoColor: blueprint.logoColor,
        logoType: blueprint.logoType,
        size: blueprint.size,
      });

      return {
        slug: [
          toSlug(material),
          toSlug(blueprint.logoType),
          toSlug(blueprint.backgroundColor),
          toSlug(blueprint.logoColor),
          toSlug(blueprint.size),
        ].join("__"),
        description: [
          `${material} woven label`,
          `${blueprint.logoType.toLowerCase().replace(/_/g, " ")}`,
          `${blueprint.backgroundColor.toLowerCase()}`,
          `${blueprint.logoColor.toLowerCase()}`,
          `${blueprint.size}`,
        ].join(" | "),
        material,
        backgroundColor: blueprint.backgroundColor,
        logoColor: blueprint.logoColor,
        logoType: blueprint.logoType,
        size: blueprint.size,
        config: {
          material: mapMaterialToGenerationMaterial(material),
          color: labelConfig.backgroundColor.toLowerCase(),
          backgroundColor: labelConfig.backgroundColor.toLowerCase(),
          logoColor: labelConfig.logoColor.toLowerCase(),
          logoType: labelConfig.logoType,
          size: labelConfig.size,
          weave: labelConfig.weaveType,
          density: labelConfig.gridDensity,
          threadAngle: labelConfig.threadAngle,
          glossLevel:
            labelConfig.glossLevel === "low"
              ? 0.2
              : labelConfig.glossLevel === "medium"
                ? 0.5
                : 0.85,
        },
      };
    })
  );
}
