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
    ? "Reference images are provided. Use them only for texture, weave pattern, thread thickness, fabric density, and lighting."
    : "No reference images are provided. Follow the controlled textile preset exactly and do not invent alternate materials, weave structures, or backgrounds.";

  return [
    "ROLE:",
    "- You are a professional textile manufacturing visualization system.",
    "",
    "TASK:",
    "- Perform a high-precision woven label rendering.",
    `- Render the uploaded logo as a physically woven textile label for label code ${config.labelCode}.`,
    "",
    "INPUTS:",
    "IMAGE 1",
    "- The uploaded logo.",
    "REFERENCE IMAGES",
    "- Real woven labels showing the exact fabric structure.",
    `- ${referenceInstruction}`,
    "",
    "INSTRUCTIONS:",
    "- Render the uploaded logo as a physically woven textile label.",
    "- Preserve the exact logo geometry, spacing, hierarchy, and text arrangement from the supplied logo.",
    "- Match the texture, thread pattern, weave behavior, and fabric density of the reference images.",
    "- Use the reference images only for texture, weave pattern, thread thickness, fabric stiffness cues, and lighting.",
    "- Maintain stable textile appearance across the full label surface with no decorative invention and no random artistic texture.",
    ...preset.referenceHandlingNotes.map((note) => `- ${note}`),
    "",
    "STRICT TEXTILE CONSTRAINTS:",
    "- Thread thickness: Threads must appear fine and uniform with visible textile fibers.",
    "- Weave density: The fabric must show a tight and regular weave pattern matching the reference images.",
    "- Fabric stiffness: The label must appear slightly stiff and structured like a real woven clothing label.",
    "- Label edge finish: Edges must be clean with realistic woven borders, not blurred, frayed, or folded.",
    "- Lighting: Soft studio lighting with natural textile shadows.",
    "- Material realism: Match the texture, thread pattern, and fabric density of the reference images.",
    "",
    "MATERIAL SPECIFICATION:",
    `- Canonical material: ${config.material}.`,
    `- Material description: ${preset.promptMaterialDescription}`,
    `- Legacy texture mapping for reference loading: ${config.textureTypeLegacy}.`,
    "",
    "WEAVE PARAMETERS:",
    `- Canonical weave structure: ${config.weaveType}.`,
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
    "IMPORTANT:",
    "- Do NOT reproduce text from the reference images.",
    "- Use the reference images ONLY for texture, weave pattern, thread thickness, fabric density, and lighting.",
    "- Do not infer garment styling, scene props, borders, or composition from the reference images.",
    "- The result must look like a real woven clothing label with consistent weave density, realistic thread structure, clean woven edges, and stable textile appearance.",
    "",
    "CLEAN LABEL EDGES:",
    "- The woven label has industrial-grade selvedge edges.",
    "- Edges are straight, sharp, and rectangular.",
    "- No frayed fibers.",
    "- No fuzzy borders.",
    "- No loose threads.",
    "- The label edge is cleanly cut and professionally finished.",
    "",
    "CRITICAL NEGATIVE INSTRUCTIONS:",
    ...GENERAL_NEGATIVE_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
    ...getMaterialSpecificNegativeInstructions(config).map((instruction) => `- ${instruction}`),
    "",
    "CAMERA STYLE:",
    "- Macro textile photography.",
    "- Studio product photography.",
    "- High resolution textile macro.",
    "- Sharp textile fibers.",
    "- Sharp focus on fabric edges.",
    "- High detail.",
    "- Soft studio lighting with natural textile shadows.",
    "- 2K resolution.",
    "",
    "VIEW / RENDER:",
    "- Standalone woven label only.",
    "- The label is centered in the frame.",
    "- The full rectangular label is clearly visible.",
    "- Edges are clean and well defined.",
    "- Top-down camera angle.",
    "- Square composition.",
  ].join("\n");
}
