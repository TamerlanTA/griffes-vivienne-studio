import { generateLabelCode as generateDomainLabelCode } from "../label/generateLabelCode";
import type { GenerationConfig } from "../types/generationConfig";

type LabelCodeConfig = Pick<GenerationConfig, "material" | "color" | "size">;

export function generateLabelCode(config: LabelCodeConfig): string {
  return generateDomainLabelCode(config.material, config.color, config.size);
}
