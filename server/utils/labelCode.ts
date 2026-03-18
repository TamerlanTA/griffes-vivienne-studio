import { generateLabelCode as generateDomainLabelCode } from "../label/generateLabelCode";
import {
  getGenerationBackgroundColor,
  type GenerationConfig,
} from "../types/generationConfig";

type LabelCodeConfig = Pick<
  GenerationConfig,
  "material" | "color" | "backgroundColor" | "size"
>;

export function generateLabelCode(config: LabelCodeConfig): string {
  return generateDomainLabelCode(
    config.material,
    getGenerationBackgroundColor(config),
    config.size
  );
}
