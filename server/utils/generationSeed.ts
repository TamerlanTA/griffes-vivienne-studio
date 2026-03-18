import { createHash } from "node:crypto";
import {
  getGenerationBackgroundColor,
  getGenerationLogoColor,
  getGenerationLogoType,
  type GenerationConfig,
} from "../types/generationConfig";

type SeedConfig = Pick<
  GenerationConfig,
  | "material"
  | "color"
  | "backgroundColor"
  | "logoColor"
  | "logoType"
  | "size"
  | "weave"
  | "density"
  | "threadAngle"
  | "glossLevel"
>;

export function generateSeed(config: SeedConfig): number {
  const baseString = [
    config.material,
    getGenerationBackgroundColor(config),
    getGenerationLogoColor(config),
    getGenerationLogoType(config),
    config.size,
    config.weave,
    config.density,
    config.threadAngle,
    config.glossLevel,
  ].join("_");

  const hash = createHash("sha256").update(baseString).digest("hex");
  return parseInt(hash.substring(0, 8), 16);
}
