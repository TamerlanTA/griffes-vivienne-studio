import type { LabelConfig, TexturePreset } from "./types";
import {
  describeBackgroundColor,
  describeLogoColor,
  describeLogoType,
  getLabelSizeProfile,
  getLogoTypePromptHints,
} from "./variationProfiles";

const GENERAL_NEGATIVE_INSTRUCTIONS = [
  "Do not invent random artistic texture, decorative patterns, embroidery, print effects, or fantasy materials.",
  "Do not change the logo geometry, proportions, spacing, letterforms, alignment, or text layout from the supplied logo.",
  "Do not copy text, borders, seams, framing, props, garment context, or product staging from the reference images.",
  "Do not place the label on clothing, bodies, mannequins, hands, packaging, tables, or environments.",
  "Do not make the label resemble burlap, sack fabric, rough textile, linen, handmade cloth, loose open-grid weave, or oversized macro fibers.",
  "Do not create raised embroidery, stitched borders, puffed outlines, embossed edges, or halo artifacts around the logo.",
  "Do not emphasize the logo perimeter with thicker, darker, or raised boundary threads than the rest of the logo.",
  "Do not make the textile look printed on top of the fabric or coated with ink.",
  "Do not composite, paste, stamp, or overlay the logo after the textile surface is generated.",
  "Do not create sharp artificial edges that read like vector artwork instead of woven threads.",
  "Do not make the thread scale coarse, oversized, chunky, or loosely woven.",
  "Do not make the label look aged, faded, distressed, worn, washed, dirty, or damaged.",
];

const REQUIRED_NEGATIVE_PROMPT =
  "printed, flat, smooth surface, plastic texture, digital rendering, logo overlay, artificial sharp edges, embroidery, sticker effect, stamped ink, thick outline, dark contour, border ring, burlap, sack fabric, rough textile, linen, handmade fabric, loose weave, macro fibers, border seams, folded edges, decorative stitching";

const COTTON_FABRIC_FIRST_DIRECTIVE = [
  "A high-resolution studio photograph of a premium woven cotton clothing label with high-density jacquard weave.",
  "The fabric has a fine tightly packed micro-weave structure with uniform thread spacing and industrial precision, typical of premium fashion woven labels.",
  "The surface is smooth yet textured at a micro level, flat and refined rather than raw or open-grid.",
  "The weave must remain micro-scale and tightly packed across the full label with no large fibers, no loose threads, and no exaggerated yarn spacing.",
  "The textile structure shows realistic thread interlacing, subtle micro-shadows, and clean industrial jacquard construction.",
  "The logo is woven directly into the fabric using threads, not printed or placed on top, and the thread follows the same weave structure as the label base.",
  "Edges are clean and cut with no visible side stitching, no border seams, no folded edges, no decorative stitching, and no stitched borders.",
  "The fabric must appear clean and refined, not dirty, not aged, and not brownish.",
  "Lighting is bright, even, high-key studio lighting with natural textile shadows.",
  "Neutral background, realistic studio photography style.",
  "Extremely realistic industrial woven-label rendering.",
] as const;

const TAFFETA_FABRIC_FIRST_DIRECTIVE = [
  "A high-resolution studio photograph of a premium woven taffeta clothing label.",
  "The label is built from fine tightly packed threads with a visible classic woven grid.",
  "The design is not printed - it is formed by contrasting threads woven directly into the same taffeta structure.",
  "The taffeta grain must remain compact, crisp, and realistic with subtle thread-level depth.",
  "The surface should show restrained sheen, natural textile shadows, and no plastic or poster-like smoothness.",
  "The label should feel premium, newly manufactured, and sharply woven with fine industrial precision and no exaggerated checker pattern.",
] as const;

const SATIN_FABRIC_FIRST_DIRECTIVE = [
  "A high-resolution studio photograph of a premium woven satin clothing label.",
  "The design is created by woven threads inside the satin structure rather than by print or surface coating.",
  "The satin should show controlled sheen while preserving visible thread structure and woven depth.",
  "The textile must stay premium and realistic with no plastic gloss, no overlay, and no embroidery lift.",
] as const;

const HD_FABRIC_FIRST_DIRECTIVE = [
  "A high-resolution studio photograph of a premium high-definition damask woven clothing label.",
  "The design is woven directly into a dense compact fabric grid with crisp thread definition and clean woven transitions.",
  "The weave must stay realistic, fine, and newly manufactured with visible textile depth.",
  "The result must read as true woven construction rather than a printed or vector-like surface.",
] as const;

function getMaterialSpecificNegativeInstructions(
  config: LabelConfig
): readonly string[] {
  switch (config.material) {
    case "SATIN":
      return [
        "Do not let the satin label turn dark, gray, or black unless explicitly requested.",
        "Do not lose the satin sheen or replace it with a matte taffeta-like finish.",
      ];
    case "COTTON":
      return [
        "Do not add satin sheen, synthetic gloss, or plastic-looking highlights.",
        "Do not make the label look printed on flat cotton canvas, paper, or a raw textile swatch.",
        "Do not lose the visible woven thread structure or the micro-shadows between threads.",
        "Do not render the logo as an ink-like silhouette sitting on top of the cotton weave.",
        "Do not enlarge the yarn scale, open the weave grid, or create exaggerated thread spacing.",
        "Do not let the cotton label drift into burlap, sackcloth, linen, handmade cloth, or any other raw-fabric appearance.",
        "Do not add side stitching, sewing threads, border seams, folded edges, decorative stitching, or stitched borders along the label edges.",
      ];
    case "HD":
      return [
        "Do not loosen the weave or blur the thread definition.",
        "Do not soften the logo edges into a low-definition textile look.",
        "Do not introduce fading, wear, distressed grain, or aged textile patina.",
      ];
    case "TAFFETA":
      return [
        "Do not make the textile overly glossy or silky.",
        "Do not erase the classic visible grid structure.",
        "Do not enlarge the weave cells into an exaggerated checker pattern or open-grid texture.",
      ];
  }
}

function getMaterialSpecificRenderDirective(
  config: LabelConfig
): readonly string[] {
  switch (config.material) {
    case "COTTON":
      return COTTON_FABRIC_FIRST_DIRECTIVE;
    case "TAFFETA":
      return TAFFETA_FABRIC_FIRST_DIRECTIVE;
    case "SATIN":
      return SATIN_FABRIC_FIRST_DIRECTIVE;
    case "HD":
      return HD_FABRIC_FIRST_DIRECTIVE;
  }
}

function getSizeSpecificLayoutInstructions(
  config: LabelConfig
): readonly string[] {
  const sizeProfile = getLabelSizeProfile(config.size);

  switch (sizeProfile.shape) {
    case "small_square":
      return [
        "Use a small square woven label with centered composition and even breathing room on all sides.",
        "Do not stretch the square label into a long strip or compress it into a narrow badge.",
      ];
    case "medium_rectangle":
      return [
        "Use a medium rectangular woven label with stable left-to-right reading flow and balanced side margins.",
        "Keep the composition horizontally balanced without drifting into portrait orientation.",
      ];
    case "long_horizontal":
      return [
        "Use a long horizontal woven label with clear left-to-right hierarchy and generous side margins.",
        "Keep the label clearly wider than tall, like a luxury fashion woven label.",
      ];
  }
}

function getSizeSpecificNegativeInstructions(
  config: LabelConfig
): readonly string[] {
  const sizeProfile = getLabelSizeProfile(config.size);

  switch (sizeProfile.shape) {
    case "small_square":
      return [
        "Do not stretch the square label into a long horizontal strip, tall portrait tag, or banner shape.",
      ];
    case "medium_rectangle":
      return [
        "Do not rotate the label vertically or present it as a portrait-oriented tag.",
      ];
    case "long_horizontal":
      return [
        "Do not rotate the label vertically or present it as a portrait-oriented label.",
      ];
  }
}

function getSizeSpecificSelfChecks(config: LabelConfig): readonly string[] {
  const sizeProfile = getLabelSizeProfile(config.size);

  switch (sizeProfile.shape) {
    case "small_square":
      return [
        "Confirm the label reads as a small square woven badge with centered composition and even margins.",
      ];
    case "medium_rectangle":
      return [
        "Confirm the label reads as a medium rectangular woven label with stable left-to-right balance.",
      ];
    case "long_horizontal":
      return [
        "Confirm the label reads as a long horizontal woven label that is clearly wider than tall.",
      ];
  }
}

function getViewInstructions(config: LabelConfig): readonly string[] {
  const sizeProfile = getLabelSizeProfile(config.size);

  return [
    "- Standalone woven label only.",
    "- The label is centered in the frame.",
    "- The full rectangular or square label is clearly visible.",
    `- The composition must reflect a ${sizeProfile.displayName} format (${config.size}).`,
    "- Edges are clean and well defined.",
    "- Top-down or very slight product-photo perspective is acceptable, but the label remains easy to read.",
    "- Square composition.",
  ];
}

function getLogoSpecificInstructions(config: LabelConfig): readonly string[] {
  return [
    `Logo structure: ${describeLogoType(config.logoType)}.`,
    ...getLogoTypePromptHints(config.logoType),
  ];
}

function getLogoSpecificSelfChecks(config: LabelConfig): readonly string[] {
  switch (config.logoType) {
    case "SYMBOL_ONLY":
      return [
        "Confirm only the supplied symbol is present and it reads as woven threadwork with no invented text.",
      ];
    case "TEXT_ONLY":
      return [
        "Confirm the text remains readable and every letter is formed by woven threads rather than printed strokes.",
      ];
    case "SYMBOL_AND_TEXT":
      return [
        "Confirm both the symbol and text are present, aligned, and woven into the same textile grid.",
      ];
    case "AUTO":
      return [
        "Confirm the supplied logo structure is preserved exactly, whether it contains text, a symbol, or both.",
      ];
  }
}

function getOutlineArtifactNegativeInstructions(
  config: LabelConfig
): readonly string[] {
  if (config.material === "SATIN") {
    return [];
  }

  return [
    "Do not add a thick outer edge, dark stroke, border ring, contour line, or halo around the logo.",
    "Do not simulate embroidery by thickening the outermost logo threads.",
    "The logo boundary must come only from thread color transition inside the weave, not from a separate outline thread.",
  ];
}

function getOutlineArtifactSelfChecks(config: LabelConfig): readonly string[] {
  if (config.material === "SATIN") {
    return [];
  }

  return [
    "Confirm there is no thick edge, border stroke, dark contour, or embroidery-like outline around the logo.",
  ];
}

function getThreadThicknessConstraint(config: LabelConfig): string {
  switch (config.material) {
    case "COTTON":
      return "Threads should read as fine tightly packed cotton yarns with micro-scale definition, uniform spacing, and industrial jacquard precision.";
    default:
      return "Threads must appear fine and uniform, small-scale, and tightly packed with visible textile fibers.";
  }
}

function getWeaveDensityConstraint(config: LabelConfig): string {
  switch (config.material) {
    case "COTTON":
      return "The fabric must show a high-density fine cotton micro-weave with very tight thread spacing, uniform weave cells, and no open-grid appearance.";
    default:
      return "The fabric must show a tight and regular weave pattern matching the reference images.";
  }
}

export function buildGenerationPrompt(
  config: LabelConfig,
  preset: TexturePreset,
  options: { hasReferenceImages?: boolean; retryFeedback?: string } = {}
): string {
  const hasReferenceImages = options.hasReferenceImages ?? false;
  const retryFeedback = options.retryFeedback?.trim();
  const materialSpecificRenderDirective =
    getMaterialSpecificRenderDirective(config);
  const sizeProfile = getLabelSizeProfile(config.size);
  const referenceInstruction = hasReferenceImages
    ? "Reference images are provided. Use them only for weave structure, thread interlacing, fiber depth, textile micro-shadows, fabric density, and lighting."
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
    "- Start from the full woven label structure, then let the design emerge from the woven threads inside that same label surface.",
    "- Generate the base cloth and the logo together in one woven generation step.",
    "- Preserve the exact logo geometry, spacing, hierarchy, and text arrangement from the supplied logo.",
    "- Integrate the logo threads into the surrounding weave so the logo appears fully woven into the fabric, never printed or embroidered on top.",
    "- If the supplied logo contains text, every character must be formed by woven threads with visible interlacing and subtle depth.",
    "- Match the texture, thread pattern, weave behavior, and fabric density of the reference images.",
    "- Use the reference images only for weave structure, thread interlacing, fiber depth, fabric stiffness cues, and lighting.",
    "- Keep the logo threads flat and flush with the textile surface with no outline lift or stitched halo.",
    "- Maintain stable textile appearance across the full label surface with no decorative invention and no random artistic texture.",
    `- Target background threads: ${config.backgroundColor} (${describeBackgroundColor(config.backgroundColor)}).`,
    `- Target logo threads: ${config.logoColor} (${describeLogoColor(config.logoColor)}).`,
    `- Target label format: ${sizeProfile.displayName} (${config.size}).`,
    ...getLogoSpecificInstructions(config).map(line => `- ${line}`),
    ...getSizeSpecificLayoutInstructions(config).map(line => `- ${line}`),
    ...preset.referenceHandlingNotes.map(note => `- ${note}`),
    "",
    "STRUCTURAL GENERATION:",
    "- Generate the fabric field and the logo together in a single woven generation step.",
    "- The base cloth and the design must share the same textile grid and thread logic.",
    "- Build the design from contrasting threads woven directly into the surrounding fabric structure.",
    "- Never add, overlay, composite, print, stamp, or paste the logo after the fabric is created.",
    "",
    "PREMIUM LABEL MATERIAL DIRECTIVE:",
    ...materialSpecificRenderDirective.map(line => `- ${line}`),
    "",
    ...(retryFeedback ? ["RETRY CORRECTION:", `- ${retryFeedback}`, ""] : []),
    "STRICT TEXTILE CONSTRAINTS:",
    `- Thread thickness: ${getThreadThicknessConstraint(config)}`,
    `- Weave density: ${getWeaveDensityConstraint(config)}`,
    "- Fabric stiffness: The label must appear slightly stiff and structured like a real woven clothing label.",
    "- Label edge finish: Edges must be clean with realistic woven borders, not blurred, frayed, or folded.",
    "- Logo integration: The logo must be fully woven into the textile structure with flat threads flush to the fabric surface.",
    "- Manufacturing finish: The label must look newly manufactured, crisp, and clean with no aging, fading, or distress.",
    "- Lighting: Soft studio lighting with natural textile shadows and slightly angled light that reveals thread depth.",
    "- Material realism: Match the texture, thread pattern, fabric density, fiber depth, and micro-shadow behavior of the reference images.",
    `- Layout realism: ${sizeProfile.compositionDirective}`,
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
    ...preset.promptConstraints.map(constraint => `- ${constraint}`),
    "",
    "COLOR / BACKGROUND CONSTRAINTS:",
    `- Target label background color: ${config.backgroundColor}.`,
    `- Target logo thread color: ${config.logoColor}.`,
    `- Background guidance: ${preset.defaultBackgroundGuidance}`,
    `- Palette suggestion: ${preset.paletteSuggestion.join(", ")}.`,
    `- Logo type handling: ${describeLogoType(config.logoType)}.`,
    "",
    "IMPORTANT:",
    "- Do NOT reproduce text from the reference images.",
    "- Use the reference images ONLY for weave pattern, visible thread interlacing, fiber depth, fabric density, and lighting.",
    "- Do not infer garment styling, scene props, borders, or composition from the reference images.",
    "- No raised embroidery, no stitched border, no bulging outline, and no halo artifacts around the logo.",
    "- The result must look like a real woven clothing label with consistent weave density, realistic thread structure, clean woven edges, stable textile appearance, and a fresh factory-new finish.",
    "",
    "SELF-CHECK BEFORE OUTPUT:",
    "- Confirm the logo reads as woven thread integration inside the fabric, not as a printed mark on top.",
    "- Confirm warp and weft threads or the material's natural weave grid remain visible with natural interlacing and subtle micro-depth.",
    "- Confirm the surface stays fibrous or textile-real rather than smooth, plastic, or digitally sharpened.",
    ...getSizeSpecificSelfChecks(config).map(line => `- ${line}`),
    ...getLogoSpecificSelfChecks(config).map(line => `- ${line}`),
    ...getOutlineArtifactSelfChecks(config).map(line => `- ${line}`),
    "- Confirm the thread scale is appropriate for the selected material and never coarse, bulky, or oversized.",
    "",
    "CLEAN LABEL EDGES:",
    "- The woven label has industrial-grade selvedge edges.",
    "- Edges are straight, sharp, and professionally finished.",
    "- No frayed fibers.",
    "- No fuzzy borders.",
    "- No loose threads.",
    "- The label edge is cleanly cut and manufacturing-grade.",
    "",
    "NEGATIVE PROMPT:",
    `- ${REQUIRED_NEGATIVE_PROMPT}.`,
    "",
    "CRITICAL NEGATIVE INSTRUCTIONS:",
    ...GENERAL_NEGATIVE_INSTRUCTIONS.map(instruction => `- ${instruction}`),
    ...getMaterialSpecificNegativeInstructions(config).map(
      instruction => `- ${instruction}`
    ),
    ...getOutlineArtifactNegativeInstructions(config).map(
      instruction => `- ${instruction}`
    ),
    ...getSizeSpecificNegativeInstructions(config).map(
      instruction => `- ${instruction}`
    ),
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
    ...getViewInstructions(config),
  ].join("\n");
}
