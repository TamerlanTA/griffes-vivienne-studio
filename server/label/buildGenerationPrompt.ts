import type { LabelConfig, TexturePreset } from "./types";

const GENERAL_NEGATIVE_INSTRUCTIONS = [
  "Do not invent random artistic texture, decorative patterns, embroidery, print effects, or fantasy materials.",
  "Do not change the logo geometry, proportions, spacing, letterforms, alignment, or text layout from the supplied logo.",
  "Do not copy text, borders, seams, framing, props, garment context, or product staging from the reference images.",
  "Do not place the label on clothing, bodies, mannequins, hands, packaging, tables, or environments.",
];

function getMaterialSpecificNegativeInstructions(config: LabelConfig): readonly string[] {
  switch (config.material) {
    case "SATIN":
      return [
        "Do not let the label background turn dark, gray, or black.",
        "Do not adopt dark garment background from the reference images.",
        "Do not lose the satin sheen or replace it with a matte taffeta-like finish.",
      ];
    case "COTTON":
      return [
        "Do not add satin sheen, synthetic gloss, or plastic-looking highlights.",
        "Do not hide the natural fiber visibility.",
      ];
    case "HD":
      return [
        "Do not loosen the weave or blur the thread definition.",
        "Do not soften the logo edges into a low-definition textile look.",
      ];
    case "TAFFETA":
      return [
        "Do not make the textile overly glossy or silky.",
        "Do not erase the classic visible grid structure.",
      ];
  }
}

export function buildGenerationPrompt(
  config: LabelConfig,
  preset: TexturePreset,
  options: { hasReferenceImages?: boolean } = {}
): string {
  const hasReferenceImages = options.hasReferenceImages ?? false;
  const referenceInstruction = hasReferenceImages
    ? "Reference images are provided. Transfer only their textile material behavior, weave response, sheen response, and lighting behavior."
    : "No reference images are provided. Follow the controlled preset exactly and do not invent alternate materials or backgrounds.";

  return [
    "ROLE:",
    "- You are a textile product photography model specialized in controlled woven label rendering for manufacturing-aligned previews.",
    "",
    "TASK:",
    `- Render the supplied logo as a standalone woven label mockup for label code ${config.labelCode}.`,
    "- Perform a high-fidelity texture transfer focused on woven label realism, not artistic interpretation.",
    "",
    "INPUTS:",
    "- [IMAGE 1] is the logo geometry and layout source.",
    "- [REFERENCE IMAGES] define textile material behavior only.",
    `- ${referenceInstruction}`,
    "",
    "MATERIAL:",
    `- Canonical material: ${config.material}.`,
    `- Material description: ${preset.promptMaterialDescription}`,
    `- Canonical weave structure: ${config.weaveType}.`,
    `- Legacy texture mapping for reference loading: ${config.textureTypeLegacy}.`,
    "",
    "WEAVE PARAMETERS:",
    `- Grid density: ${config.gridDensity}.`,
    `- Thread angle: ${config.threadAngle} degrees.`,
    `- Gloss level: ${config.glossLevel}.`,
    `- Expected sheen: ${preset.sheenExpected ? "visible controlled sheen" : "matte to restrained sheen"}.`,
    "",
    "THREAD CHARACTERISTICS:",
    ...preset.promptConstraints.map((constraint) => `- ${constraint}`),
    "",
    "COLOR / BACKGROUND CONSTRAINTS:",
    `- Target label color: ${config.color}.`,
    `- Target label size: ${config.size}.`,
    `- Palette suggestion: ${preset.paletteSuggestion.join(", ")}.`,
    `- Background guidance: ${preset.defaultBackgroundGuidance}`,
    "",
    "INSTRUCTIONS:",
    "- Preserve the exact logo geometry, spacing, hierarchy, and text arrangement from the supplied logo.",
    "- Use the references only for material properties, thread density, gloss behavior, lighting response, and palette cues.",
    "- Maintain strict texture transfer fidelity with no decorative invention and no random artistic texture.",
    "- Produce realistic woven thread detail with controlled textile edges and premium material discipline.",
    ...preset.referenceHandlingNotes.map((note) => `- ${note}`),
    "",
    "CRITICAL NEGATIVE INSTRUCTIONS:",
    ...GENERAL_NEGATIVE_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
    ...getMaterialSpecificNegativeInstructions(config).map((instruction) => `- ${instruction}`),
    "",
    "VIEW / RENDER:",
    "- Standalone woven label only.",
    "- Centered composition with the full label visible.",
    "- Macro photography.",
    "- Top-down camera angle.",
    "- Controlled studio lighting.",
    "- 2K resolution with sharp textile detail.",
    "- Square composition.",
  ].join("\n");
}
