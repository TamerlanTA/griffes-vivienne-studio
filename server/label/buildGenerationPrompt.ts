import { getMaterialPromptSpec, GLOBAL_RULES } from "./promptRules";
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
  "Do not make the background surface match the label weave pattern, sharpness, or tone so closely that the label blends into it.",
  "Do not make the logo threads look perfectly smooth, mechanically flawless, or digitally uniform.",
  "Do not switch to random backgrounds or change the scene style between generations.",
];

const REQUIRED_NEGATIVE_PROMPT =
  "printed, flat, smooth surface, plastic texture, digital rendering, logo overlay, artificial sharp edges, embroidery, sticker effect, stamped ink, thick outline, dark contour, border ring, burlap, sack fabric, rough textile, linen, handmade fabric, loose weave, macro fibers, border seams, folded edges, visible stitching, sewn borders, decorative seams, blended background, matching weave backdrop, random background, fabric backdrop";

function getMaterialSpecificNegativeInstructions(
  config: LabelConfig
): readonly string[] {
  const sharedNegativeLines = getMaterialPromptSpec(config.material).negativeLines;

  switch (config.material) {
    case "SATIN":
      return [
        ...sharedNegativeLines,
        "Do not let the satin label turn dark, gray, or black unless explicitly requested.",
        "Do not lose the satin sheen or replace it with a matte taffeta-like finish.",
      ];
    case "COTTON":
      return [
        ...sharedNegativeLines,
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
        ...sharedNegativeLines,
        "Do not loosen the weave or blur the thread definition.",
        "Do not soften the logo edges into a low-definition textile look.",
        "Do not introduce fading, wear, distressed grain, or aged textile patina.",
      ];
    case "TAFFETA":
      return [
        ...sharedNegativeLines,
        "Do not make the textile overly glossy or silky.",
        "Do not erase the visible grid structure or make the weave disappear entirely.",
        "Do not enlarge the weave cells into an exaggerated checker pattern, open-grid texture, or oversized macro weave.",
        "Do not give the taffeta cotton softness, organic yarn presence, or a natural fabric swatch appearance.",
        "Do not give the taffeta a canvas texture, linen texture, burlap texture, or any coarse open-grain woven look.",
        "Do not make the taffeta surface porous, rough, coarse-grained, or thick.",
        "Do not make the label read as a thick fabric strip, a cut textile sample, or a raw natural cloth piece.",
        "Do not let the taffeta look like a soft woven cotton fabric — it must read as a tight flat manufactured label tape.",
      ];
  }
}

function getMaterialSpecificRenderDirective(
  config: LabelConfig
): readonly string[] {
  return getMaterialPromptSpec(config.material).directiveLines;
}

function describeMaterialBackgroundThreads(config: LabelConfig): string {
  if (config.material === "TAFFETA") {
    return "slightly warm neutral beige / light ivory woven taffeta tone with subtle natural variation";
  }

  return describeBackgroundColor(config.backgroundColor);
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
  const materialPromptSpec = getMaterialPromptSpec(config.material);

  return [
    "- Exactly one standalone woven label is visible.",
    "- No duplicates, no secondary labels, and no stacking.",
    "- The label is centered in the frame and fully visible.",
    ...materialPromptSpec.viewLines.map(line => `- ${line}`),
    `- The composition must reflect a ${sizeProfile.displayName} format (${config.size}).`,
    "- Camera angle is slightly top-down (15 to 25 degrees).",
    "- Clean product composition with soft neutral studio lighting.",
    "- Edges are clean and well defined.",
    "- The label sits slightly raised and casts a soft natural shadow with subtle edge depth.",
    "- 1:1 image composition with the full label clearly readable.",
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
      return "Background threads should read as fine tightly packed cotton yarns with micro-scale definition, while logo threads read slightly denser, tighter, and more defined with industrial jacquard precision.";
    case "HD":
      return "Threads should read ultra-fine and dense, with the logo threads slightly tighter and more compact than the background so the mark reads as woven construction rather than flat fill.";
    default:
      return "Threads must appear fine and uniform, small-scale, and tightly packed with visible textile fibers.";
  }
}

function getWeaveDensityConstraint(config: LabelConfig): string {
  switch (config.material) {
    case "COTTON":
      return "The background must show a high-density fine cotton micro-weave with very tight thread spacing, while the logo weave stays slightly tighter and denser for broche separation without changing the base fabric.";
    case "HD":
      return "The background must stay ultra-tight and compact, while the logo weave remains slightly denser and tighter than the background to preserve a thread-built broche effect.";
    case "TAFFETA":
      return "The fabric must show a very fine dense compact taffeta weave with tight small weave cells, a flat clean industrial label-tape surface, and no large or exaggerated checker pattern. The weave must be tighter and finer than cotton with no coarse grain, no porous texture, and no cotton or canvas softness.";
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
  const materialPromptSpec = getMaterialPromptSpec(config.material);
  const sizeProfile = getLabelSizeProfile(config.size);
  const referenceInstruction = hasReferenceImages
    ? "Reference images are provided. Use them only for weave structure, thread interlacing, fiber depth, textile micro-shadows, fabric density, selvedge finishing, and lighting."
    : "No reference images are provided. Follow the controlled textile preset exactly and do not invent alternate materials, weave structures, or backgrounds.";

  return [
    "ROLE:",
    "- You are a professional textile manufacturing visualization system.",
    "",
    "TASK:",
    "- Perform a high-precision woven label rendering.",
    `- Render the uploaded logo as a physically woven textile label for label code ${config.labelCode}.`,
    "",
    "GLOBAL FRAME RULES:",
    GLOBAL_RULES,
    "",
    "MATERIAL FIRST DIRECTIVE:",
    ...materialSpecificRenderDirective.map(line => `- ${line}`),
    ...(config.material === "COTTON"
      ? [
          "- The background fabric stays approved and unchanged, while the logo/text read as a separate jacquard-selected woven layer with slightly denser, tighter thread packing.",
          "- Use the approved cotton preset as the baseline for the background only; the logo and text weave must be allowed to evolve and improve.",
          "- Internal yarn structure must remain visible even in dark logo areas, and edges must resolve through thread transitions rather than vector-smooth fill.",
        ]
      : []),
    ...(config.material === "HD"
      ? [
          "- The approved HD background stays exactly as-is, while the logo/text read as a separate jacquard-selected woven layer with slightly denser, tighter thread packing.",
          "- Use the approved HD preset as the baseline for the background only; the logo and text weave must be allowed to evolve and improve.",
          "- Internal yarn structure must remain visible even in dark logo areas, and edges must resolve through thread transitions rather than vector-smooth fill.",
        ]
      : []),
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
    "- Never fall back to a geometric or vector-like filled shape for the logo.",
    "- Preserve the exact logo geometry, spacing, hierarchy, and text arrangement from the supplied logo.",
    "- Integrate the logo threads into the surrounding weave so the logo appears fully woven into the fabric, never printed or embroidered on top.",
    "- If the supplied logo contains text, every character must be formed by woven threads with visible interlacing and subtle depth.",
    "- Match the texture, thread pattern, weave behavior, and fabric density of the reference images.",
    "- Use the reference images only for weave structure, thread interlacing, fiber depth, fabric stiffness cues, and lighting.",
    "- Keep the logo threads flat and flush with the textile surface with no outline lift or stitched halo.",
    "- Maintain stable textile appearance across the full label surface with no decorative invention and no random artistic texture.",
    "- Keep the background surface fixed per material so the scene stays stable across generations and the label remains clearly separated from the background.",
    `- Target background threads: ${config.backgroundColor} (${describeMaterialBackgroundThreads(config)}).`,
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
    ...(config.material === "COTTON" || config.material === "HD"
      ? [
          "- The logo must be built from visible thread structure, not a flat filled shape with texture applied on top.",
          "- The logo must keep a subtle directional weave difference from the background so the broche layer reads as woven construction.",
        ]
      : []),
    "",
    ...(retryFeedback ? ["RETRY CORRECTION:", `- ${retryFeedback}`, ""] : []),
    "STRICT TEXTILE CONSTRAINTS:",
    `- Thread thickness: ${getThreadThicknessConstraint(config)}`,
    `- Weave density: ${getWeaveDensityConstraint(config)}`,
    "- Micro thread realism: Logo threads should show very subtle natural irregularities in tension and alignment so they never look perfectly smooth or digitally uniform.",
    ...(config.material === "COTTON" || config.material === "HD"
      ? [
          "- Weave direction: the logo should keep a subtle directional weave shift versus the background so it reads as thread-built rather than filled.",
        ]
      : []),
    "- Fabric stiffness: The label must appear slightly stiff and structured like a real woven clothing label.",
    "- Background separation: The label must sit on its fixed material-specific background with clear visual separation, a slightly different tone, and no scene drift.",
    "- Physical depth: The label should sit slightly raised above the surface and cast a soft natural shadow with subtle edge depth.",
    "- Label edge finish: Edges must be realistic woven selvedges with tightly finished borders, not blurred, frayed, cut, stitched, or folded.",
    "- Selvedge structure: The woven selvedge edge should be very thin, tight, subtle, and almost flush with the fabric surface, never thick, padded, or decorative.",
    "- Logo integration: The logo must be fully woven into the textile structure with flat threads flush to the fabric surface.",
    "- Logo readability: The woven logo must stand out clearly through higher thread density while still remaining unmistakably textile-based rather than printed.",
    ...(config.material === "COTTON" || config.material === "HD"
      ? [
          "- Logo construction: use visible thread structure and a subtle directional weave shift, not a filled shape with texture on top.",
        ]
      : []),
    "- Manufacturing finish: The label must look newly manufactured, crisp, and clean with no aging, fading, or distress.",
    "- Lighting: Soft studio lighting with natural textile shadows and slightly angled light that reveals thread depth.",
    "- Material realism: Match the texture, thread pattern, fabric density, fiber depth, and micro-shadow behavior of the reference images.",
    `- Layout realism: ${sizeProfile.compositionDirective}`,
    ...materialPromptSpec.qualityLines.map(line => `- ${line}`),
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
    "- Keep clear visual separation between the label and its fixed material-specific background through tone contrast, edge depth, and a soft natural shadow.",
    "- Preserve subtle natural irregularities in the woven logo threads so the textile feels real rather than perfectly uniform.",
    "- The result must look like a real woven clothing label with consistent weave density, realistic thread structure, clean woven selvedge edges, stable textile appearance, and a fresh factory-new finish.",
    "",
    "SELF-CHECK BEFORE OUTPUT:",
    "- Confirm the logo reads as woven thread integration inside the fabric, not as a printed mark on top.",
    "- Confirm warp and weft threads or the material's natural weave grid remain visible with natural interlacing and subtle micro-depth.",
    "- Confirm the surface stays fibrous or textile-real rather than smooth, plastic, or digitally sharpened.",
    "- Confirm the label is clearly separated from its fixed material-specific background through shadow, edge depth, and different tone.",
    "- Confirm the woven logo still shows visible internal thread structure instead of a flat fill.",
    ...getSizeSpecificSelfChecks(config).map(line => `- ${line}`),
    ...getLogoSpecificSelfChecks(config).map(line => `- ${line}`),
    ...getOutlineArtifactSelfChecks(config).map(line => `- ${line}`),
    ...materialPromptSpec.validationLines.map(line => `- ${line}`),
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
