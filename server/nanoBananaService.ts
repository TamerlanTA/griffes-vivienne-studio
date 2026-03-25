/**
 * Service d'integration Nano Banana Pro (Gemini 3 Pro Image Preview)
 * via Google AI Studio (ai.google.dev)
 *
 * Structure corrigee basee sur le code fonctionnel de l'utilisateur
 * Integre les moodboards (images de reference) pour guider la generation
 */

import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { GoogleGenAI } from "@google/genai";
import {
  backgroundColorMap,
  buildGenerationPrompt,
  buildLabelConfig,
  describeBackgroundColor,
  describeLogoColor,
  describeLogoType,
  getLabelSizeProfile,
  getLogoTypePromptHints,
  isDarkBackgroundColor,
  mapLegacyTextureType,
  logoColorMap,
  safeColor,
  TEXTURE_PRESETS_BY_MATERIAL,
  type LabelConfig,
  type LabelConfigInput,
} from "./label";
import {
  GLOBAL_COMPACT_RULES,
  getMaterialPromptSpec,
} from "./label/promptRules";
import {
  getTexturePreset,
  type TexturePreset as ResolvedTexturePreset,
  type TextureType,
} from "./texturePresets";
import { getTextureControlPreset } from "./textureControlPresets";
import {
  getGenerationBackgroundColor,
  getGenerationLogoColor,
  getGenerationLogoType,
  type GenerationConfig,
} from "./types/generationConfig";
import { generateLabelCode } from "./utils/labelCode";
import { generateSeed } from "./utils/generationSeed";

export interface GenerateLabelInput {
  logoBase64: string;
  logoMimeType?: "image/png" | "image/jpeg" | "image/webp";
  textureType?: TextureType;
  mode: "preview" | "final";
  config?: GenerationConfig | LabelConfigInput;
}

export interface GenerateLabelOutput {
  success: boolean;
  imageBase64?: string;
  error?: string;
  labelConfig?: LabelConfig;
  labelCode?: string;
  seed?: number;
}

const MODEL_CONFIG = {
  preview: "gemini-3-pro-image-preview",
  final: "gemini-3-pro-image-preview",
} as const;

const MAX_WOVEN_GENERATION_ATTEMPTS = 3;
const MAX_API_GENERATION_RETRIES = 2;
const MAX_PROMPT_LENGTH = 3600;
const VALIDATION_RESPONSE_MIME_TYPE = "text/plain";
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const INVALID_PROMPT_PATTERN = /\b(?:undefined|null)\b/i;
const INVALID_TEXTILE_BODY_PATTERN =
  /\b(?:coarse|rough|burlap|linen|handmade)\b/i;
const API_NEGATIVE_PROMPT =
  "burlap, sack fabric, rough textile, linen, handmade fabric, loose weave, macro fibers, printed, flat, smooth surface, plastic texture, digital rendering, logo overlay, artificial sharp edges, embroidery, sticker effect, stamped ink, thick outline, dark contour, border ring";
const HD_COTTON_NEGATIVE_PROMPT =
  "coarse twill ridges, exaggerated diagonal bands, ribbon-like diagonal texture, satin ribbon texture, hard ribbed twill, synthetic white fabric, flat black fill, printed ink look, embroidery, patch effect, embossed logo, glossy textile, glossy 3D relief, visible decorative border band";
const HD_COTTON_BASE_NEGATIVE_PROMPT =
  "synthetic white fabric, glossy textile, coarse twill ridges, ribbon-like diagonal texture, satin ribbon texture, decorative border band, harsh contrast, folded hem, stitched border, dark or colored wood surface";
const TAFFETA_NEGATIVE_PROMPT =
  "cotton softness, cotton texture, organic yarn, fuzzy weave, porous surface, canvas texture, linen texture, burlap, coarse weave, coarse grain, thick fabric strip, natural cloth swatch, fabric sample, oversized weave cells, open grid weave, macro fibers, embroidery, raised stitching, stitched outline, embroidered logo, printed logo, patch effect, applique, thick padded edges, rounded label edges, satin gloss drift, hd embossed drift, heavy grain, rough surface";
const HD_MOTIF_NEGATIVE_PROMPT =
  "flat black fill, smooth black fill, flat black letters, uniform dark shape, uniform dark shape interior, solid black graphic surface, printed logo, printed text, logo merged into the same weave with no differentiation, motif merged into background weave with no internal structure, embroidery, patch effect, embossed logo, glossy black surface, noisy black grain, fuzzy black edges, fluffy black grain, hairy textile edges, noisy black motif, soft smeared black letters, cotton-like texture drift, background reinterpretation, green cutting mat, cutting mat, self-healing mat, workshop surface, workbench, sewing table, craft table, wood surface, wood tabletop, random tabletop, grid background, studio prop reinterpretation, pure white label, optical white fabric, paper white textile, cold white label, label blending tonally into the marble, washed out fabric tone, over-bright textile, white canvas look";
const HD_COTTON_MOTIF_NEGATIVE_PROMPT =
  "flat black fill, uniform dark shape, solid black graphic surface, printed logo, printed ink look, logo merged into the same weave with no differentiation, embroidery, patch effect, embossed logo, glossy black surface, thick outline";

type GeminiInlineImage = {
  mimeType: string;
  data: string;
};

type GenerationExecutionContext = {
  ai: GoogleGenAI;
  modelId: string;
  mode: GenerateLabelInput["mode"];
  labelConfig: LabelConfig;
  labelCode: string;
  seed: number;
  referenceImages: GeminiInlineImage[];
};

type GenerationStageResult = {
  imageBase64: string;
  validationPassed: boolean;
  validationReason: string;
  attemptsUsed: number;
};

type GeminiPart =
  | { text: string }
  | {
      inlineData: GeminiInlineImage;
    };

type GeminiResponsePart = {
  text?: string;
  inlineData?: {
    data?: string;
  };
};

type GeminiResponseLike = {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
    };
  }>;
};

const REAL_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const SUPPORTED_LOGO_MIME_TYPES = new Set<GenerateLabelInput["logoMimeType"]>([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const REAL_PHOTO_FILE_MIME_TYPES = new Map<
  string,
  GeminiInlineImage["mimeType"]
>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erreur inconnue lors de la generation";
}

function getErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const status = error.status;
  return typeof status === "number" ? status : undefined;
}

function extractGeneratedImage(
  response: GeminiResponseLike
): string | undefined {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const imageBase64 = part.inlineData?.data;
    if (typeof imageBase64 === "string" && imageBase64.length > 0) {
      return imageBase64;
    }
  }

  return undefined;
}

function extractGeneratedText(
  response: GeminiResponseLike
): string | undefined {
  if (typeof response.text === "string" && response.text.trim().length > 0) {
    return response.text.trim();
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map(part => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text.length > 0 ? text : undefined;
}

export function resolveLogoMimeType(
  mimeType: GenerateLabelInput["logoMimeType"]
): GeminiInlineImage["mimeType"] {
  if (mimeType && SUPPORTED_LOGO_MIME_TYPES.has(mimeType)) {
    return mimeType;
  }

  return "image/png";
}

function resolveLabelConfig(input: GenerateLabelInput): LabelConfig {
  const mappedLegacyMaterial = mapLegacyTextureType(input.textureType);
  const normalizedConfig = isGenerationConfig(input.config)
    ? mapGenerationConfigToLabelConfigInput(input.config)
    : input.config;
  const hasStructuredMaterial =
    typeof normalizedConfig?.material === "string" &&
    normalizedConfig.material.trim().length > 0;

  return buildLabelConfig({
    ...normalizedConfig,
    material: normalizedConfig?.material ?? mappedLegacyMaterial,
    textureTypeLegacy: hasStructuredMaterial
      ? normalizedConfig?.textureTypeLegacy
      : (input.textureType ?? normalizedConfig?.textureTypeLegacy),
  });
}

function isGenerationConfig(
  config: GenerateLabelInput["config"]
): config is GenerationConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "material" in config &&
    "density" in config &&
    "weave" in config
  );
}

function mapNumericGlossLevel(
  value: GenerationConfig["glossLevel"]
): LabelConfigInput["glossLevel"] {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  if (value < 0.34) {
    return "low";
  }

  if (value < 0.67) {
    return "medium";
  }

  return "high";
}

function mapGenerationConfigToLabelConfigInput(
  config: GenerationConfig
): LabelConfigInput {
  const backgroundColor = getGenerationBackgroundColor(config);

  return {
    material: config.material,
    color: backgroundColor,
    backgroundColor,
    logoColor: getGenerationLogoColor(config),
    logoType: getGenerationLogoType(config),
    size: config.size,
    weaveType: config.weave,
    gridDensity: config.density,
    threadAngle: config.threadAngle,
    glossLevel: mapNumericGlossLevel(config.glossLevel),
  };
}

function mapLabelMaterialToGenerationMaterial(
  material: LabelConfig["material"]
): GenerationConfig["material"] {
  switch (material) {
    case "COTTON":
      return "HD_COTTON";
    case "HD":
      return "HD";
    case "SATIN":
      return "SATIN";
    case "TAFFETA":
      return "TAFFETA";
  }
}

function buildFallbackGenerationConfig(config: LabelConfig): GenerationConfig {
  const preset = getTexturePreset(config.textureTypeLegacy);

  return {
    material: mapLabelMaterialToGenerationMaterial(config.material),
    color: config.backgroundColor.toLowerCase(),
    backgroundColor: config.backgroundColor.toLowerCase(),
    logoColor: config.logoColor.toLowerCase(),
    logoType: config.logoType,
    size: config.size,
    weave: config.weaveType,
    density: config.gridDensity,
    threadAngle: config.threadAngle,
    glossLevel: preset.parameters.glossLevel,
  };
}

function resolveGenerationConfig(
  input: GenerateLabelInput,
  labelConfig: LabelConfig
): GenerationConfig {
  if (isGenerationConfig(input.config)) {
    const fallbackConfig = buildFallbackGenerationConfig(labelConfig);
    const backgroundColor = labelConfig.backgroundColor.toLowerCase();
    const logoColor = labelConfig.logoColor.toLowerCase();

    return {
      ...fallbackConfig,
      material: input.config.material,
      color: backgroundColor,
      backgroundColor,
      logoColor,
      logoType: labelConfig.logoType,
      size: input.config.size.trim(),
      weave: input.config.weave.trim(),
      density: input.config.density,
      ...(typeof input.config.threadAngle === "number"
        ? { threadAngle: input.config.threadAngle }
        : {}),
      ...(typeof input.config.glossLevel === "number"
        ? { glossLevel: input.config.glossLevel }
        : {}),
    };
  }

  return buildFallbackGenerationConfig(labelConfig);
}

export function extractInlineImage(dataUrl: string): GeminiInlineImage | null {
  const trimmed = dataUrl.trim();
  const match = trimmed.match(
    /^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    return null;
  }

  const [, mimeType, data] = match;
  if (!mimeType || !data) {
    return null;
  }

  return { mimeType, data };
}

function getReferenceFileMimeType(
  ref: string
): GeminiInlineImage["mimeType"] | null {
  const extension = extname(ref.trim()).toLowerCase();
  return REAL_PHOTO_FILE_MIME_TYPES.get(extension) ?? null;
}

export function detectImageMimeTypeFromBuffer(
  buffer: Buffer
): GeminiInlineImage["mimeType"] | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function isRealPhotoRef(ref: string): boolean {
  const image = extractInlineImage(ref);
  if (image) {
    return REAL_PHOTO_MIME_TYPES.has(image.mimeType);
  }

  return getReferenceFileMimeType(ref) !== null;
}

async function loadReferenceImage(ref: string): Promise<GeminiInlineImage> {
  const inlineImage = extractInlineImage(ref);
  if (inlineImage) {
    if (!REAL_PHOTO_MIME_TYPES.has(inlineImage.mimeType)) {
      throw new Error(
        `Unsupported moodboard reference image MIME type: ${inlineImage.mimeType}`
      );
    }

    return inlineImage;
  }

  const extensionMimeType = getReferenceFileMimeType(ref);
  if (!extensionMimeType) {
    throw new Error(`Unsupported moodboard reference image path: ${ref}`);
  }

  const absolutePath = resolve(process.cwd(), ref);

  try {
    const buffer = await readFile(absolutePath);
    const detectedMimeType = detectImageMimeTypeFromBuffer(buffer);
    const mimeType = detectedMimeType ?? extensionMimeType;

    return {
      mimeType,
      data: buffer.toString("base64"),
    };
  } catch (error: unknown) {
    if (isRecord(error) && error.code === "ENOENT") {
      throw new Error(`Missing moodboard reference image: ${ref}`);
    }

    throw new Error(`Unable to load moodboard reference image: ${ref}`);
  }
}

async function loadReferenceImages(
  preset: ResolvedTexturePreset
): Promise<GeminiInlineImage[]> {
  const referenceImages = await Promise.all(
    preset.references.map(loadReferenceImage)
  );
  return referenceImages;
}

function buildTextureParameterPrompt(preset: ResolvedTexturePreset): string {
  const { parameters } = preset;

  return [
    "TEXTURE PRESET:",
    `- Preset name: ${preset.name}.`,
    preset.promptTemplate,
    "",
    "TEXTILE PARAMETERS:",
    `- Thread thickness: ${parameters.threadThickness}.`,
    `- Weave density: ${parameters.weaveDensity}.`,
    `- Fabric stiffness: ${parameters.fabricStiffness}.`,
    `- Label edge finish: ${parameters.edgeFinish}. Industrial woven edges with clean rectangular selvedges.`,
    `- Gloss level: ${parameters.glossLevel}.`,
    ...(typeof parameters.threadAngle === "number"
      ? [`- Thread angle: ${parameters.threadAngle}.`]
      : []),
  ].join("\n");
}

function buildGenerationConfigPrompt(config: GenerationConfig): string {
  const backgroundColor = getGenerationBackgroundColor(config);
  const logoColor = getGenerationLogoColor(config);
  const logoType = getGenerationLogoType(config);
  const backgroundColorDescription = safeColor(
    backgroundColorMap,
    backgroundColor.toUpperCase(),
    "light cotton color"
  );
  const logoColorDescription = safeColor(
    logoColorMap,
    logoColor.toUpperCase(),
    "black threads"
  );

  return [
    "GENERATION CONFIG:",
    `- Material: ${config.material}.`,
    `- Background color: ${backgroundColor}.`,
    `- Background color description: ${backgroundColorDescription}.`,
    `- Logo thread color: ${logoColor}.`,
    `- Logo thread color description: ${logoColorDescription}.`,
    `- Logo type: ${logoType}.`,
    `- Label size: ${config.size}.`,
    `- Weave: ${config.weave}.`,
    `- Weave density: ${config.density}.`,
    ...(typeof config.threadAngle === "number"
      ? [`- Thread angle: ${config.threadAngle}.`]
      : []),
    ...(typeof config.glossLevel === "number"
      ? [`- Gloss level: ${config.glossLevel}.`]
      : []),
  ].join("\n");
}

function buildDeterminismPrompt(seed: number): string {
  return [
    "DETERMINISM:",
    `- Generation seed: ${seed}.`,
    "- Use this seed to maintain visual consistency.",
  ].join("\n");
}

function getMaterialPromptLabel(material: LabelConfig["material"]): string {
  switch (material) {
    case "COTTON":
      return "cotton";
    case "HD":
      return "high-definition damask";
    case "SATIN":
      return "satin";
    case "TAFFETA":
      return "taffeta";
  }
}

function getSafeBackgroundColorPrompt(config: LabelConfig): string {
  return safeColor(
    backgroundColorMap,
    config.backgroundColor,
    "light cotton color"
  );
}

function getSafeLogoColorPrompt(config: LabelConfig): string {
  return safeColor(logoColorMap, config.logoColor, "black threads");
}

function getApiMaterialPromptLines(config: LabelConfig): readonly string[] {
  switch (config.material) {
    case "COTTON":
      return [
        "The label has a high-density fine woven cotton structure with very tight thread spacing, uniform micro-weave, and industrial jacquard weaving.",
        "The weave must be micro-scale and tightly packed with a smooth micro-textured surface typical of premium fashion woven labels.",
        "The logo and text must be built from visible thread structure as a distinct woven motif layer, not flat filled shapes.",
        "Keep a subtle directional weave shift inside the logo versus the background so the mark reads as a jacquard-selected woven motif rather than a filled patch or patch-like insert.",
        "Keep the label flat, clean, refined, and industrially precise with no exaggerated yarn scale.",
      ];
    case "HD":
      return [
        "The label has a dense high-definition damask weave with compact thread spacing, precise micro-weave control, and crisp industrial thread definition.",
        "The logo and text must be built from visible thread structure as a distinct woven motif layer, not flat filled shapes.",
        "Use a subtle directional weave shift inside the logo compared with the background so the shape reads as thread-built construction rather than a filled patch or patch-like insert.",
        "The result must stay fine, controlled, flat, and newly manufactured with premium woven-label precision.",
      ];
    case "SATIN":
      return [
        "The weave is satin with controlled premium sheen, visible thread structure, and woven depth rather than print or glossy plastic.",
        "The satin must stay light and premium when a light background is requested.",
      ];
    case "TAFFETA":
      return [
        "Fine dense compact woven taffeta clothing label with a very tight regular weave, flat thin surface, and a clean industrial label-tape feel.",
        "The taffeta surface must show a fine regular small-cell grid pattern — tight compact weave cells that are clearly smaller and finer than cotton.",
        "Keep the material flat, clean, thin, and industrially precise: tighter than cotton, no soft organic yarn presence, no heavy grain, no canvas texture, no open natural-fiber texture.",
        "The label must read as a manufactured precision label tape, not as a thick fabric swatch, patch, or natural cloth sample.",
        isDarkBackgroundColor(config.backgroundColor)
          ? `The label fabric is ${getSafeBackgroundColorPrompt(config)} — dark, flat, dense, industrially precise taffeta weave with visible micro-texture and no sterile flat fill.`
          : "Keep a slightly warm neutral beige / light ivory tone with restrained natural woven variation and no sterile artificial uniformity.",
        "The logo must be flat woven into the same fine taffeta structure — never embroidered, never raised, never outlined with thick stitching.",
      ];
  }
}

function buildCompactTextureDifferentiationPrompt(
  config: LabelConfig
): string | undefined {
  switch (config.material) {
    case "COTTON":
      return "HD COTTON LOGO: visible internal yarn grain, subtle motif-vs-background directional weave shift, slightly tighter cleaner thread packing than the base fabric, and narrow real-production woven selvedge/lisiere at the top and bottom edges; never uniform blend, patch, embroidery, or print.";
    case "HD":
      return "HD LOGO: visible internal yarn grain with a subtle motif-vs-background directional weave shift and slightly tighter cleaner thread packing so the logo reads as thread-built construction, never a uniform blend, patch, embroidery, or print.";
    default:
      return undefined;
  }
}

function buildColorControlPrompt(config: LabelConfig): string {
  const backgroundColor =
    config.material === "TAFFETA" && !isDarkBackgroundColor(config.backgroundColor)
      ? "slightly warm neutral beige / light ivory woven taffeta tone with subtle natural variation"
      : getSafeBackgroundColorPrompt(config);
  const logoColor = getSafeLogoColorPrompt(config);

  return [
    `The fabric color is ${backgroundColor}.`,
    `The design is formed by ${logoColor}.`,
    "The specified colors must be clearly visible and accurately rendered. Do not default to black or neutral tones unless explicitly specified.",
    "The fabric must appear clean and refined, not dirty, not aged, and not brownish.",
  ].join(" ");
}

function buildTextureFreezePrompt(
  preset: ReturnType<typeof getTextureControlPreset>
): string {
  if (preset.name === "HD" || preset.name === "HD_COTTON") {
    return [
      "TEXTURE BASELINE:",
      "- Use the approved preset as reference.",
      "- Preserve the overall fabric appearance, tone, and lighting.",
      "- The background must remain unchanged.",
      "- The logo and text weave structure must be allowed to evolve and improve.",
      `- Treat preset ${preset.name} as the baseline for the background fabric only.`,
    ].join("\n");
  }

  return [
    "TEXTURE FREEZE:",
    "- Do not alter the weave pattern, thread density, lighting or material appearance from the reference images.",
    `- Treat preset ${preset.name} as locked.`,
    "- Preserve the same weave structure, thread scale, and surface response across repeated generations.",
    "- No drift, reinterpretation, or scene-driven texture changes.",
  ].join("\n");
}

function buildStrictTextureControlPrompt(
  preset: ReturnType<typeof getTextureControlPreset>
): string {
  if (preset.name === "HD" || preset.name === "HD_COTTON") {
    return [
      "STRUCTURAL FLEXIBILITY:",
      "- Keep the approved background texture, tone, and lighting unchanged.",
      "- Apply controlled flexibility only inside the logo and text region.",
      "- Allow logo and text weave to improve through visible thread structure, subtle internal yarn grain, and tighter denser thread packing than the background.",
      "- Allow a subtle directional weave difference between the logo and the background to improve broche separation.",
      "- Relief must remain very subtle and come only from weave structure.",
      "- No shadows, no gradients, no emboss effect, and no 3D rendering.",
    ].join("\n");
  }

  return [
    "STRICT TEXTURE CONTROL:",
    "- The texture preset is locked and must stay visually consistent with the approved references.",
    "- Do not alter the weave pattern, thread density, lighting or material appearance from the reference images.",
    "- Thread thickness must remain uniform and consistent.",
    "- Grid density and material response must remain stable.",
  ].join("\n");
}

function buildLogoIntegrationPriorityPrompt(
  config: LabelConfig
): string | undefined {
  if (config.material !== "HD" && config.material !== "COTTON") {
    return undefined;
  }

  return [
    "LOGO INTEGRATION PRIORITY:",
    "- Logo and text must NOT be treated as flat filled shapes.",
    "- Construct the logo and text as a distinct woven motif layer using visible thread structure.",
    "- Introduce subtle internal yarn grain inside the shapes.",
    "- Avoid smooth, uniform black fill.",
    "- Keep logo threads slightly denser, tighter, and cleaner than the background.",
    "- Keep the background weave softer and more open than the logo weave.",
    "- Use subtle directional weave variation between the logo and background to improve broche separation.",
    "- Keep relief very subtle (~5%) using weave only.",
    "- No shadows, no gradients, no emboss effect, no patch effect, and no 3D rendering.",
  ].join("\n");
}

function buildScopedModificationRulesPrompt(
  config: LabelConfig
): string | undefined {
  if (config.material !== "HD" && config.material !== "COTTON") {
    return undefined;
  }

  return [
    "RULES:",
    "- Do not change composition or proportions.",
    "- Do not change label shape.",
    "- Do not alter background texture.",
    "- Only modify logo and text weave behavior.",
  ].join("\n");
}

function buildCompactTextureFreezePrompt(
  preset: ReturnType<typeof getTextureControlPreset>
): string {
  if (preset.name === "HD" || preset.name === "HD_COTTON") {
    return sanitizePrompt(
      `TEXTURE BASELINE: approved ${preset.name} preset is the baseline for the background only; preserve overall fabric appearance, tone, and lighting; background unchanged; logo and text weave may evolve and improve.`
    );
  }

  return sanitizePrompt(
    `TEXTURE FREEZE: preset ${preset.name} is locked; do not alter weave pattern, thread density, lighting, or material appearance from the reference images.`
  );
}

function buildCompactStrictTextureControlPrompt(
  preset: ReturnType<typeof getTextureControlPreset>
): string {
  if (preset.name === "HD" || preset.name === "HD_COTTON") {
    return sanitizePrompt(
      "STRUCTURAL FLEXIBILITY: keep approved background texture, tone, and lighting unchanged; apply controlled flexibility only inside the logo and text region; allow visible thread structure, subtle internal yarn grain, tighter denser thread packing, subtle directional weave difference, and very subtle weave-only relief; no shadows, gradients, emboss, or 3D."
    );
  }

  return sanitizePrompt(
    `STRICT TEXTURE CONTROL: preset ${preset.name} stays visually consistent with the approved references.`
  );
}

function buildCompactLogoIntegrationPriorityPrompt(
  config: LabelConfig
): string | undefined {
  if (config.material !== "HD" && config.material !== "COTTON") {
    return undefined;
  }

  return sanitizePrompt(
    "LOGO INTEGRATION PRIORITY: distinct woven motif layer, thread-built not flat fill; internal yarn grain inside shapes; denser tighter cleaner logo threads than softer background; subtle directional weave variation; ~5% weave-only relief; no shadows, patch effect, gradients, emboss, or 3D."
  );
}

function buildCompactScopedModificationRulesPrompt(
  config: LabelConfig
): string | undefined {
  if (config.material !== "HD" && config.material !== "COTTON") {
    return undefined;
  }

  return sanitizePrompt(
    "RULES: do not change composition or proportions; do not change label shape; do not alter background texture; only modify logo and text weave behavior."
  );
}

function isHdCotton(textureType: LabelConfig["textureTypeLegacy"]): boolean {
  return textureType === "hdcoton";
}

function joinPromptLines(lines: Array<string | undefined>): string {
  return lines
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
}

export function buildHdCottonBasePrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const retryFeedback = options.retryFeedback?.trim();
  const positivePrompt = joinPromptLines([
    "STAGE A - HD COTTON BASE:",
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    options.hasReferenceImages
      ? "Use the approved cotton reference background as the locked Stage A anchor for cotton family, subtle diagonal ground weave, selvedge, lighting, and composition."
      : "Lock the HD Cotton base family first: background fabric, subtle diagonal ground weave, selvedge, lighting, and composition.",
    "Generate or preserve the HD Cotton base only before motif refinement.",
    "COMPOSITION:",
    "- One long horizontal woven cotton label only, centered, fully visible, clean margins, no duplicates or stacking.",
    "- Slight top-down camera 15 to 25 degrees, soft neutral studio lighting, fixed light natural wood surface, and preserved label shape.",
    "COTTON BASE:",
    "- Warm light beige / natural ecru woven cotton clothing label.",
    `- Background target stays ${getSafeBackgroundColorPrompt(config)} while remaining in the approved natural ecru cotton family.`,
    "- Soft matte factory-made cotton surface with gentle yarn presence and a subtle fine diagonal woven direction in the ground fabric.",
    "- Preserve refined factory-made cotton behavior, stable composition, and an ultra-subtle selvedge on the top and bottom edges only.",
    "- Keep the cotton ground soft, matte, stable, and textile-real with no global reinterpretation.",
    "STAGE A SCOPE:",
    "- Prioritize base fabric behavior, diagonal woven ground, selvedge, composition, wood surface, and lighting stability.",
    "- Do not prioritize logo or text refinement in this pass; keep the base ready for a motif-only refinement pass.",
  ]);

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}, ${HD_COTTON_BASE_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

export function buildHdCottonMotifRefinementPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const retryFeedback = options.retryFeedback?.trim();
  const positivePrompt = joinPromptLines([
    "STAGE B - HD COTTON MOTIF REFINEMENT:",
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    "The supplied Stage A image is the locked HD Cotton base anchor.",
    options.hasReferenceImages
      ? "Use the approved cotton references only to guide motif thread behavior while preserving the approved Stage A base fabric family exactly."
      : undefined,
    "PRESERVE EXACTLY:",
    "- Preserve the background exactly: cotton tone, subtle diagonal ground weave, selvedge, lighting, wood surface, label shape, composition, and margins.",
    "- Preserve the approved HD Cotton base behavior from Stage A with no new background, no new cotton family, and no global reinterpretation.",
    "- Do not reinterpret the whole fabric, change the label proportions, drift the wood background, or weaken the diagonal ground weave.",
    "REFINE ONLY THE MOTIF:",
    "- Refine only the logo and text woven integration on top of the locked base.",
    `- Motif thread target stays ${getSafeLogoColorPrompt(config)} with the supplied logo structure preserved: ${describeLogoType(config.logoType)}.`,
    "- Logo and text must appear visibly woven into the cloth through tighter, denser, finer thread behavior than the softer background ground.",
    "- Logo and text must visibly read as a distinct woven motif layer, and the motif and background must not share the exact same weave expression.",
    "- Motif threads must read tighter, denser, more compact, slightly finer, and cleaner through thread transitions than the softer background cloth.",
    "- Internal woven thread logic and yarn grain must remain visible inside the black motif shapes so they do not read as a uniform dark fill.",
    "- The black motif must remain clearly black but must not read as a flat solid fill, solid black graphic surface, or dark graphics placed on the same fabric.",
    "- Encourage slightly finer motif thread rhythm, slightly denser motif packing, slightly cleaner motif edges through thread transitions, and only subtle weave-only relief.",
    "- Separation must come from thread density, weave rhythm, and internal yarn structure, not from outline, embossing, print effect, patch effect, stitched look, or lighting tricks.",
    "- If text is present, each letter must show woven micro-structure, slight textile stepping, visible thread-built strokes, and compact internal thread logic instead of smooth vector-like bars.",
    "KEEP DISALLOWED:",
    "- No flat black fill, no uniform dark shape, no solid black graphic surface, no printed logo, no embroidery, no patch effect, no embossed logo, no glossy black surface, no stitched look, and no motif collapse into the same ground weave with no differentiation.",
  ]);

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}, ${HD_COTTON_MOTIF_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

export function buildHdMotifRefinementPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const retryFeedback = options.retryFeedback?.trim();
  const positivePrompt = joinPromptLines([
    "HD MOTIF REFINEMENT:",
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    "The approved HD reference is the locked base anchor.",
    options.hasReferenceImages
      ? "Use the approved HD references to preserve the HD base exactly and use the improved woven logo/text behavior only as motif guidance."
      : undefined,
    "PRESERVE EXACTLY:",
    "- Preserve the full HD base exactly: polished white onyx / light marble support surface, approved HD texture family, weave density, surface sharpness, scene, lighting, framing, label placement, composition, and margins.",
    "- Preserve the approved HD label fabric tone exactly: light warm ivory / pale beige / off-white, slightly warm, clearly distinct from the brighter cooler marble background. The label must never become pure white.",
    "- Keep the marble background as the support surface only. The label fabric stays in the approved warm ivory / light beige HD textile family and must not shift toward pure white or tonally merge into the marble.",
    "- Preserve the approved HD base identity exactly: clean, controlled, sharp, refined, dense, premium woven HD look.",
    "- Do not change the support surface, scene, framing, weave family, label tone, or HD sharpness, and do not introduce cotton-like texture drift.",
    "REFINE ONLY THE MOTIF:",
    "- Preserve the HD base exactly. Refine only the logo and text so they display slightly tighter, denser, cleaner woven thread behavior than the background, with visible internal thread logic inside the black shapes. The motif must remain clearly black but never read as a smooth uniform fill.",
    "- Refine only the woven behavior inside the logo and text.",
    "- The logo and text must remain visibly constructed from woven threads with internal thread logic inside the black shapes. Do not flatten the motif into a smooth graphic fill.",
    `- Motif thread target stays ${getSafeLogoColorPrompt(config)} and preserves the supplied logo structure: ${describeLogoType(config.logoType)}.`,
    "- The logo and text must appear visibly woven into the HD label through tighter, denser, cleaner thread behavior than the approved background surface.",
    "- The motif must show slightly tighter, denser, cleaner, more compact thread behavior than the HD background while staying fully woven into the same label.",
    "- Internal woven thread logic must remain visible inside the black motif shapes so they do not read as a uniform dark fill.",
    "- The black motif must remain clearly black but must not read as a flat solid fill, solid black graphic surface, or printed logo sitting on top.",
    "- Keep the woven-thread structure, but make motif edges slightly cleaner and more controlled through tighter thread alignment and cleaner thread transitions, without print-like smoothness.",
    "- Logo realism and text realism must both improve through subtle internal thread structure, slightly denser thread rhythm, and clean woven edges created by thread transitions rather than graphic smoothness.",
    "- Text must feel woven, not merely clean black lettering; letter interiors must keep subtle internal woven structure with no flat black letter fill, and text edges should become slightly cleaner and more controlled without losing thread-built realism.",
    "- Encourage only a subtle polish: slightly denser motif packing, slightly tighter black thread packing, slightly clearer internal thread readability, slightly cleaner thread transitions, and reduced fuzzy black grain without changing the approved HD base.",
    "KEEP DISALLOWED:",
    "- No green cutting mat, no cutting mat, no self-healing mat, no workshop surface, no workbench, no sewing table, no craft table, no wood surface, no wood tabletop, no random tabletop, and no grid background.",
    "- No pure white label, no optical white fabric, no paper white textile, no cold white label, no label tonally blending into the marble, no washed out fabric tone, no over-bright textile, and no white canvas look.",
    "- No smooth or flat black fill, no flat black letters, no printed logo or text, no motif merged into the background weave with no internal structure, no fuzzy black edges, no fluffy black grain, no hairy textile edges, no noisy black motif, no soft smeared black letters, no embroidery, no patch effect, no embossed logo, no glossy black surface, no cotton-like texture drift, and no background reinterpretation.",
  ]);

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}, ${HD_MOTIF_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

function buildHdCottonSinglePassPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const retryFeedback = options.retryFeedback?.trim();
  const positivePrompt = joinPromptLines([
    ...(options.hasReferenceImages
      ? [
          "Match the approved cotton reference background first. Preserve the same cotton tone, surface softness, lighting family, and edge construction. Only allow controlled variation inside the logo and text weave.",
        ]
      : []),
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    "COMPOSITION:",
    "- One long horizontal woven cotton label only, centered, fully visible, clean margins, no duplicates or stacking.",
    "- Slight top-down camera 15 to 25 degrees, soft neutral studio lighting, fixed light natural wood surface.",
    "- Preserve label proportions and shape.",
    "COTTON BACKGROUND:",
    "- Warm light beige / natural ecru woven cotton clothing label.",
    "- Soft matte factory-made cotton surface with subtle woven face, gentle natural yarn presence, and fine visible diagonal woven direction in the ground fabric.",
    "- Match the approved cotton reference background family first and preserve its tone, lighting, edge language, and refined factory-made cotton behavior.",
    "- Avoid heavy twill ridges, ribbon-like diagonal bands, synthetic drift, or overly regular fabric behavior.",
    "WOVEN MOTIF:",
    "- Logo and text woven into the cloth as a distinct motif layer, not uniformly blended into the same background weave expression.",
    "- The motif must appear visibly woven into the label through tighter, finer, denser thread behavior than the softer background cloth.",
    "- The motif must preserve internal thread logic and subtle yarn texture inside the black shapes, so it reads as a true woven motif layer rather than a uniform black surface merged into the same fabric.",
    "- Separation must come from weave behavior, thread packing, and internal yarn structure, not from outline or contrast alone.",
    `- Motif thread target stays ${getSafeLogoColorPrompt(config)}.`,
    "- The black motif must remain clearly black but never read as a solid flat black fill, printed ink, or simply darkened background weave.",
    "- Thread-built only: not printed, not embroidered, not patch-like, not embossed, not glossy, not 3D.",
    "- If text is present, each letter must look like real woven lettering built from tiny thread cells inside the same textile grid, not smooth vector typography stamped onto cotton.",
    "- Letter strokes must stay flush with the label plane and show visible woven structure, tiny thread variation, and subtle micro-breaks inside the dark areas.",
    "- Letter edges must look slightly stepped and textile-real at macro scale, never perfectly smooth, solid, or ink-flat.",
    "EDGE FINISH:",
    "- Ultra-narrow woven cotton selvedge on the top and bottom only.",
    "- A real integrated woven finishing edge used in cotton label production, extremely subtle and structural, never decorative.",
    "- Not stitched, folded, striped, framed, ribbon-like, or a visible border band.",
    "KEEP FIXED:",
    "- Preserve composition, label shape, background fabric family, warm cotton tone family, lighting, and wood background; allow controlled refinement only inside the logo and text weave region.",
    `LOGO STRUCTURE: ${describeLogoType(config.logoType)}.`,
  ]);

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}, ${HD_COTTON_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

function buildMaterialSpecificLogoPrompt(config: LabelConfig): readonly string[] {
  if (config.material === "COTTON") {
    return [
      "The cotton background weave must remain locked and unchanged.",
      "The cotton logo and text must not be integrated uniformly into the background weave.",
      "The logo and text must read as a distinct woven motif layer built from visible thread structure, not a flat filled shape with texture on top.",
      "The cotton logo threads must read slightly denser, tighter, cleaner, and more structured than the softer more open background weave.",
      "Internal yarn grain must remain visible inside the logo and text at fabric scale with no blur and no smooth fill.",
      "Keep edges crisp and readable without softening or over-sharpening them.",
      "Use a subtle directional weave variation between logo and background so the broche effect comes from thread behavior rather than color contrast.",
      "The cotton logo must not use the same texture uniformly as the background and must not collapse into a flat black area.",
      "The cotton logo must not read as a patch, applique, embroidery, printed ink, or outlined motif.",
      "Fine thread structure must remain visible at small scale and black threads must stay textured rather than flat.",
      "Relief must come from weave structure, thread density, and thread contrast only, not from lighting changes or shadows.",
      "No artificial shadows, no drop shadows, no bevel, no emboss effect, and no 3D rendering are allowed on the cotton logo.",
      "No glossy, plastic, ink, or printed appearance is allowed on the cotton logo.",
      "The cotton selvedge must stay narrow, clean, woven, and production-real on the top and bottom edges, never a folded hem or stitched border.",
    ];
  }

  if (config.material === "HD") {
    return [
      "The HD background weave must remain locked and unchanged.",
      "The HD logo and text must use broche-style thread behavior rather than fully blending into the background weave.",
      "The HD logo threads must read denser, more compact, slightly tighter, cleaner, and subtly raised versus the background.",
      "The HD logo must show visible internal yarn grain even in dark areas and must not collapse into a smooth black fill.",
      "The HD logo and text must read as a distinct woven motif layer built from visible thread structure, not a flat filled shape with texture overlaid on top.",
      "Use subtle directional weave variation between the HD logo and background to create structural separation without changing lighting or contrast.",
      "Keep the relief extremely subtle and create it through weave structure only.",
      "Do not over-integrate the HD logo into the fabric and do not let it read like only a darker variation of the same weave.",
      "The HD logo must not read as a patch, applique, embroidery, printed ink, or outlined motif.",
      "No shadows, gradients, emboss, gloss tricks, patch effect, or 3D rendering are allowed on the HD logo.",
    ];
  }

  if (config.material === "TAFFETA") {
    return [
      "The taffeta base must stay very fine, dense, compact, thin, and flat — a manufactured industrial label-tape surface with tight regular weave cells and no cotton softness or canvas texture.",
      "The logo and text must be flat woven into the same fine taffeta structure — never embroidered, never raised, never outlined with thick stitching, and never patch-like.",
      "Keep the logo clean, readable, and fully integrated into the taffeta weave with no separate outline ring, no embroidery lift, no raised border, and no stitched halo.",
      "The label must not look like a canvas patch, a thick fabric swatch, or a sewn applique — it must read as a thin flat precision woven label tape.",
      "Preserve the approved neutral paper-like support presentation and do not drift to marble, wood, concrete, or a random blank white background.",
    ];
  }

  return [];
}

export function sanitizePrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim().slice(0, MAX_PROMPT_LENGTH);
}

export function assertValidPrompt(prompt: string): void {
  if (prompt.trim().length === 0) {
    throw new Error("Invalid prompt detected");
  }

  if (INVALID_PROMPT_PATTERN.test(prompt)) {
    throw new Error("Invalid prompt detected");
  }
}

export function assertValidGenerationPrompt(prompt: string): void {
  assertValidPrompt(prompt);

  if (INVALID_TEXTILE_BODY_PATTERN.test(prompt)) {
    throw new Error("Invalid textile prompt vocabulary detected");
  }
}

export function normalizeLogoBase64(logoBase64: string): string {
  if (typeof logoBase64 !== "string") {
    throw new Error("Invalid logo input");
  }

  const normalized = logoBase64.replace(/\s+/g, "").trim();
  if (normalized.length === 0 || !BASE64_PATTERN.test(normalized)) {
    throw new Error("Invalid logo input");
  }

  const bytes = Buffer.from(normalized, "base64");
  if (bytes.length === 0) {
    throw new Error("Invalid logo input");
  }

  return normalized;
}


function buildHdDarkVariantPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const retryFeedback = options.retryFeedback?.trim();
  const labelFabricColor = getSafeBackgroundColorPrompt(config);
  const motifColor = getSafeLogoColorPrompt(config);
  const primaryLogoHint = getLogoTypePromptHints(config.logoType)[0];

  const positivePrompt = joinPromptLines([
    "HD DARK VARIANT:",
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    "COMPOSITION:",
    "- One standalone woven HD label, centered, fully visible on polished white onyx / light marble support surface.",
    "- Slight top-down camera 15 to 25 degrees, soft neutral studio lighting, clean product composition.",
    "- Preserve label proportions and shape.",
    "LABEL FABRIC:",
    `- The HD label fabric is ${labelFabricColor}.`,
    "- Dense high-definition damask weave with compact thread spacing, precise micro-weave control, and crisp industrial thread definition.",
    "- The label must read as a flat fine refined woven fabric — not a printed surface, not a dyed solid, and not a coated substrate.",
    "- The dark woven threads must show subtle natural variation and woven micro-texture, never a flat uniform fill.",
    "- The label must be clearly distinct from the lighter marble support surface behind it.",
    "WOVEN MOTIF:",
    `- The motif and text are formed by ${motifColor}.`,
    "- The logo and text must be built from visible woven thread structure as a distinct motif layer — not printed, not painted, and not a flat solid fill.",
    "- Use a subtle directional weave shift inside the logo versus the background so the mark reads as a jacquard-selected woven motif rather than a bright overlay or flat patch.",
    "- Internal thread logic must remain visible inside the light-colored motif shapes so they do not read as flat printed fills.",
    "- Keep the motif edges crisp and well-defined through tight woven thread behavior, not graphic smoothness.",
    "- Motif threads must integrate into the same dark woven label surface — no halo, no border ring, no embroidery outline, no raised stitching.",
    `- Logo structure: ${describeLogoType(config.logoType)}.`,
    primaryLogoHint,
    "KEEP DISALLOWED:",
    "- No printed graphics, no flat ink application, no digital overlay, no logo stamped on top of dark fabric.",
    "- No embroidery, no raised stitching, no patch effect, no applique, no halo ring around the logo.",
    "- No flat solid dark fill for the background — woven thread texture must be visible.",
    "- No flat solid light fill for the logo — thread structure must be visible inside the light motif shapes.",
    "- No satin sheen, no plastic gloss, no synthetic coating.",
    options.hasReferenceImages
      ? "Reference images guide micro-weave, jacquard behavior, and lighting only — do not copy background, props, or staging."
      : undefined,
  ]);

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}, ${HD_MOTIF_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

export function buildApiPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    seed: number;
    retryFeedback?: string;
  }
): string {
  const sizeProfile = getLabelSizeProfile(config.size);
  const primaryLogoHint = getLogoTypePromptHints(config.logoType)[0];
  const retryFeedback = options.retryFeedback?.trim();
  const materialPromptSpec = getMaterialPromptSpec(config.material);
  const textureControlPreset = getTextureControlPreset(config.material);
  const compactTextureBaseline =
    buildCompactTextureFreezePrompt(textureControlPreset);
  const compactStructuralFlexibility =
    buildCompactStrictTextureControlPrompt(textureControlPreset);
  const compactLogoIntegration =
    buildCompactLogoIntegrationPriorityPrompt(config);
  const compactScopedRules = buildCompactScopedModificationRulesPrompt(config);
  const materialSpecificLogoPrompt = buildMaterialSpecificLogoPrompt(config);
  const outlineGuardrail =
    config.material === "SATIN"
      ? undefined
      : "No thick edge, dark contour, border ring, halo, or embroidery-like outline around the logo. Boundary threads must stay the same thickness as the interior logo threads.";
  const referenceInstruction = options.hasReferenceImages
    ? "Reference images guide micro-weave, jacquard behavior, and lighting only."
    : undefined;
  const materialNegativePrompt =
    config.material === "TAFFETA"
      ? TAFFETA_NEGATIVE_PROMPT
      : API_NEGATIVE_PROMPT;

  if (isHdCotton(config.textureTypeLegacy)) {
    return buildHdCottonSinglePassPrompt(config, options);
  }

  if (config.material === "HD") {
    return isDarkBackgroundColor(config.backgroundColor)
      ? buildHdDarkVariantPrompt(config, options)
      : buildHdMotifRefinementPrompt(config, options);
  }

  const positivePrompt = [
    GLOBAL_COMPACT_RULES,
    ...materialPromptSpec.compactLines,
    compactTextureBaseline,
    compactStructuralFlexibility,
    compactLogoIntegration,
    compactScopedRules,
    `A high-resolution studio photograph of a premium woven ${getMaterialPromptLabel(config.material)} clothing label.`,
    ...getApiMaterialPromptLines(config),
    buildColorControlPrompt(config),
    buildCompactTextureDifferentiationPrompt(config),
    "The logo must be woven into the fabric using threads, not printed or placed on top, and the thread follows the weave structure of the label.",
    "Show realistic thread interlacing, subtle micro-shadows, and clean industrial label depth.",
    "Generate the label and logo together in one woven step. Do not overlay or print the logo afterward.",
    ...materialSpecificLogoPrompt,
    `Use a ${sizeProfile.displayName} label format (${config.size}) with clean margins and a flat label structure.`,
    `Logo structure: ${describeLogoType(config.logoType)}.`,
    primaryLogoHint,
    retryFeedback ? `Retry correction: ${retryFeedback}` : undefined,
    "No visible side stitching, border seams, folded edges, decorative stitching, sewing threads, or stitched borders.",
    outlineGuardrail,
    "Soft studio lighting with clean edges and clear micro-scale thread depth.",
    referenceInstruction,
  ]
    .filter(
      (line): line is string => typeof line === "string" && line.length > 0
    )
    .join("\n");

  const sanitizedPositivePrompt = sanitizePrompt(positivePrompt);
  assertValidGenerationPrompt(sanitizedPositivePrompt);

  const finalPromptParts =
    config.material === "TAFFETA"
      ? [
          `Negative prompt: ${TAFFETA_NEGATIVE_PROMPT}.`,
          sanitizedPositivePrompt,
          `Seed ${options.seed}.`,
        ]
      : [
          sanitizedPositivePrompt,
          `Negative prompt: ${materialNegativePrompt}.`,
          `Seed ${options.seed}.`,
        ];

  const finalPrompt = sanitizePrompt(finalPromptParts.join(" "));

  assertValidPrompt(finalPrompt);
  return finalPrompt;
}

async function generateWithRetry<T>(
  operation: () => Promise<T>,
  context: {
    attempt: number;
    material: LabelConfig["material"];
    labelCode: string;
    modelId: string;
    seed: number;
  },
  retries = MAX_API_GENERATION_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (retries > 0) {
      console.warn("[NanoBanana] Retrying generation request", {
        ...context,
        retriesRemaining: retries,
        errorMessage: getErrorMessage(error),
        errorStatus: getErrorStatus(error),
      });

      return generateWithRetry(operation, context, retries - 1);
    }

    throw error;
  }
}

function getMaterialQualityGuardrails(config: LabelConfig): readonly string[] {
  switch (config.material) {
    case "HD":
      return [
        "Maintain clean high-density weave with compact thread spacing and clean woven edge transitions without any separate outline ring.",
        "Keep the logo built as a distinct woven motif layer with visible thread structure and a subtle directional weave shift versus the background, not a smooth filled patch.",
      ];
    case "COTTON":
      return [
        "Maintain a premium woven cotton label look with high-density fine micro-weave, tight thread spacing, flat structure, clean cut contours, and industrial jacquard precision.",
        "Keep the logo built as a distinct woven motif layer with visible thread structure and a subtle directional weave shift versus the background, and preserve the narrow cotton selvedge/lisiere at the top and bottom edges.",
      ];
    case "SATIN":
      return [
        "Preserve controlled satin sheen while keeping the woven surface smooth, premium, and free from embroidered lift.",
      ];
    case "TAFFETA":
      return [
        "Keep the taffeta weave very fine, dense, compact, and regular with tight small-scale weave cells — tighter and finer than cotton, with no oversized grid, no heavy grain, no porous texture, and no canvas or open natural-fiber character.",
        "The taffeta surface must be flat, thin, and industrially clean — a manufactured label-tape look, not a thick fabric swatch or soft natural cloth.",
        "The logo must be flat woven into the taffeta grid with no embroidery lift, no raised stitching, no thick outline, and no separate border ring around the logo.",
        "No cotton softness, no fuzzy surface, no organic yarn presence, and no natural cloth swatch appearance.",
      ];
  }
}

function getLogoQualityGuardrails(config: LabelConfig): readonly string[] {
  const baseLines = (() => {
    switch (config.logoType) {
      case "SYMBOL_ONLY":
        return [
          "Keep the symbol shape precise and fully woven with no invented supporting text.",
        ];
      case "TEXT_ONLY":
        return [
          "Every letter must remain readable as woven thread structure, not as printed typography.",
        ];
      case "SYMBOL_AND_TEXT":
        return [
          "Keep the symbol and text relationship intact with woven hierarchy, spacing, and alignment preserved.",
        ];
      case "AUTO":
        return [
          "Preserve the supplied logo structure exactly, whether it contains a symbol, text, or both.",
        ];
    }
  })();

  const materialSpecificLines =
    config.material === "HD"
      ? [
          "Keep the HD logo visibly thread-built, with internal yarn grain preserved even in dark areas and no smooth uniform black fill.",
        ]
      : config.material === "COTTON"
        ? [
            "Keep the cotton logo visibly thread-built, with internal yarn grain preserved even in dark areas and no flat filled shape with texture on top.",
          ]
        : [];

  return [...baseLines, ...materialSpecificLines];
}

function getOutlineArtifactGuardrails(config: LabelConfig): readonly string[] {
  if (config.material === "SATIN") {
    return [];
  }

  return [
    "No thick edge, no dark contour, no border stroke, and no embroidery-like outline around the logo.",
    "Logo boundaries must come from woven thread transitions only, not from an extra outer ring of darker threads.",
  ];
}

function buildQualityGuardrailsPrompt(config: LabelConfig): string {
  const sizeProfile = getLabelSizeProfile(config.size);

  return [
    "QUALITY GUARDRAILS:",
    "- The logo must appear fully woven into the fabric structure, never printed, coated, embossed, or placed on top of the textile.",
    "- Logo threads must be flat woven, flush with the textile surface, and integrated into the surrounding weave.",
    "- Build the base fabric and the logo simultaneously as a single woven structure, never as separate layers.",
    "- Boundary threads at the logo edge must stay the same visual thickness as the interior logo threads.",
    `- Background target: ${describeBackgroundColor(config.backgroundColor)}.`,
    `- Logo thread target: ${describeLogoColor(config.logoColor)}.`,
    `- Logo structure target: ${describeLogoType(config.logoType)}.`,
    `- Label format target: ${sizeProfile.displayName} (${config.size}) with aspect ratio ${sizeProfile.aspectRatio.toFixed(2)}.`,
    `- ${sizeProfile.compositionDirective}`,
    "- No raised embroidery, no stitched border, no bulging outline, no puffed edge, and no halo around logo shapes.",
    "- Keep the weave crisp, clean, and newly manufactured with stable density across the full label.",
    "- No aging, no wear, no fading, no distress, no washed texture, and no damaged fibers.",
    ...getMaterialQualityGuardrails(config).map(line => `- ${line}`),
    ...getLogoQualityGuardrails(config).map(line => `- ${line}`),
    ...getOutlineArtifactGuardrails(config).map(line => `- ${line}`),
  ].join("\n");
}

function shouldRunWovenValidation(config: LabelConfig): boolean {
  return ["COTTON", "TAFFETA", "HD", "SATIN"].includes(config.material);
}

function getMaterialValidationChecks(config: LabelConfig): readonly string[] {
  switch (config.material) {
    case "COTTON":
      return [
        "- The cotton label shows a high-density fine micro-weave with very tight thread spacing and realistic thread interlacing.",
        "- The design is formed by woven cotton threads inside the same fabric structure, not printed on top.",
        "- The cotton logo remains built from visible thread structure with a subtle directional weave shift versus the background, not a flat filled shape.",
        "- Text, when present, shows real woven lettering behavior with visible thread-built strokes instead of smooth solid black print-like bars.",
        "- The cotton thread scale stays micro-level, tightly packed, and industrially precise, with no enlarged yarns or open-grid appearance.",
        "- Subtle micro-shadows and controlled label depth are visible between threads.",
        "- The surface is smooth yet micro-textured, flat, clean, and refined, not smooth plastic or embroidery-like.",
        "- The thin cotton selvedge/lisiere stays intact at the top and bottom edges.",
        "- Edges are clean cut with no visible side stitches, sewing threads, or stitched borders.",
        "- There is no thick dark contour, no border stroke, and no embroidery-like outline around the logo.",
      ];
    case "TAFFETA":
      return [
        "- The taffeta weave is very fine, dense, compact, and regular with tight small-scale weave cells clearly finer than cotton — no oversized weave cells, no exaggerated checker pattern, and no heavy grain.",
        "- The taffeta surface is flat, thin, and clean — it reads as a manufactured industrial label tape, not as a thick fabric swatch, canvas patch, or soft natural cloth.",
        "- The design is flat woven into the same taffeta structure — not embroidered, not raised, not outlined with thick stitching, and not printed or overlaid.",
        "- The logo has no embroidery lift, no raised border, no stitched halo, and no separate outline ring — it is fully flat and integrated into the taffeta grid.",
        "- No cotton softness, no canvas texture, no open natural-fiber texture, no porous surface, and no organic yarn presence is visible.",
        "- The label edge is clean and thin — no thick padded selvedge, no rounded padded label body, and no thick fabric strip appearance.",
        "- There is no thick dark contour, no border stroke, and no embroidery-like outline around the logo.",
      ];
    case "SATIN":
      return [
        "- The design is visibly woven into the satin structure, not printed on top.",
        "- The satin sheen is controlled and premium, while thread definition remains visible.",
        "- The surface still reads as woven textile rather than glossy plastic.",
      ];
    case "HD":
      return [
        "- The weave is crisp, compact, and high-definition with clean woven contours.",
        "- The logo is integrated into the textile grid rather than printed or overlaid.",
        "- The HD logo remains built from visible thread structure with a subtle directional weave shift versus the background, not a flat filled shape.",
        "- Thread detail stays sharp and dense with no embroidery lift.",
        "- There is no thick dark contour, no border stroke, and no embroidery-like outline around the logo.",
      ];
  }
}

function getLogoTypeValidationChecks(config: LabelConfig): readonly string[] {
  switch (config.logoType) {
    case "SYMBOL_ONLY":
      return [
        "- The label shows only the supplied symbol mark with no invented text.",
      ];
    case "TEXT_ONLY":
      return [
        "- Woven text remains legible and each character is formed by threads rather than smooth printed strokes.",
        "- Text strokes show visible woven structure and slight thread-level variation instead of solid smooth black fill.",
        "- Letter edges look textile-real and slightly stepped at macro scale, not vector-smooth or ink-flat.",
      ];
    case "SYMBOL_AND_TEXT":
      return [
        "- Both the symbol and the text are visible and both are woven into the same textile grid.",
        "- Text characters show visible woven structure and slight thread-level variation instead of solid smooth black fill.",
      ];
    case "AUTO":
      return [
        "- The logo structure present in the source asset is preserved without invented symbol or text elements.",
      ];
  }
}

function buildWovenValidationPrompt(config: LabelConfig): string {
  const sizeProfile = getLabelSizeProfile(config.size);

  return [
    "You are validating whether a generated woven clothing label looks like real textile manufacturing.",
    "Decide if the design is physically woven into the fabric instead of printed on top.",
    "PASS only if every required condition is clearly visible.",
    "FAIL if the image looks printed, flat, plastic, digitally rendered, over-sharpened, logo-overlaid, embroidered, outlined with a thick contour, made with oversized open weave threads, or if text/logo strokes read as smooth solid black vector fill instead of woven thread structure.",
    "",
    "PASS CHECKLIST:",
    `- ${sizeProfile.validationDirective}`,
    "- The logo and background share the same woven thread grid rather than appearing as separate layers.",
    "- Visible textile depth is present through thread interlacing, micro-shadows, or thread-level relief.",
    ...getMaterialValidationChecks(config),
    ...getLogoTypeValidationChecks(config),
    "",
    "RESPONSE FORMAT:",
    "Reply with exactly one line in this format:",
    "PASS | short reason",
    "or",
    "FAIL | short reason",
  ].join("\n");
}

function parseWovenValidationResult(text: string | undefined): {
  passed: boolean;
  reason: string;
} {
  if (!text) {
    return {
      passed: true,
      reason: "Validation returned no text. Keeping generated output.",
    };
  }

  const normalized = text.trim();
  const upper = normalized.toUpperCase();

  if (upper.includes("EMBROID")) {
    return {
      passed: false,
      reason: normalized,
    };
  }

  if (upper.startsWith("PASS")) {
    return {
      passed: true,
      reason: normalized,
    };
  }

  if (upper.startsWith("FAIL")) {
    return {
      passed: false,
      reason: normalized,
    };
  }

  return {
    passed: false,
    reason: normalized,
  };
}

function buildRetryFeedback(
  config: LabelConfig,
  _validationReason: string
): string {
  const sizeProfile = getLabelSizeProfile(config.size);
  const outlineReminder =
    config.material === "SATIN"
      ? []
      : [
          "Remove any thick outer edge, dark contour, stroke, border ring, or embroidery-like outline around the logo.",
        ];

  return [
    "The previous attempt did not meet the premium industrial woven-label standard.",
    `Regenerate from scratch for a ${sizeProfile.displayName} label with stronger high-density micro-weave behavior: the label must look like a premium fashion woven clothing label, the fabric and logo must be generated together, the design must be formed by woven threads inside the same textile grid, and the result must avoid any overlay, ink, open-grid, or embroidery appearance.`,
    ...(config.material === "HD"
      ? [
          "Rebuild the HD logo as a visible thread-built layer with internal yarn grain and a subtle directional weave shift versus the background, not a smooth filled patch.",
        ]
      : config.material === "COTTON"
        ? [
            "Rebuild the cotton logo as a visible thread-built layer with internal yarn grain and a subtle directional weave shift versus the background, while keeping the thin cotton selvedge/lisiere at the top and bottom edges.",
          ]
        : []),
    ...outlineReminder,
    ...getLogoTypePromptHints(config.logoType),
  ].join(" ");
}

async function validateWovenLabelOutput(
  ai: GoogleGenAI,
  modelId: string,
  config: LabelConfig,
  imageBase64: string
): Promise<{ passed: boolean; reason: string }> {
  if (!shouldRunWovenValidation(config)) {
    return {
      passed: true,
      reason: "Validation was skipped for this material.",
    };
  }

  try {
    const validationPrompt = sanitizePrompt(buildWovenValidationPrompt(config));
    assertValidPrompt(validationPrompt);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: validationPrompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: VALIDATION_RESPONSE_MIME_TYPE,
      },
    });

    return parseWovenValidationResult(
      extractGeneratedText(response as GeminiResponseLike)
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.warn(
      "[NanoBanana] Validation unavailable, keeping generated output",
      {
        material: config.material,
        errorMessage,
      }
    );

    return {
      passed: true,
      reason: `Validation unavailable: ${errorMessage}`,
    };
  }
}

function buildHdCottonMotifRetryFeedback(
  config: LabelConfig,
  _validationReason: string
): string {
  return joinPromptLines([
    "Keep the supplied Stage A base locked exactly and rebuild only the woven motif behavior.",
    "Strengthen motif-vs-ground separation through tighter denser motif thread packing and visible internal woven thread logic inside the dark shapes.",
    "Keep the motif clearly woven and dark, but do not let it collapse into a flat fill, printed look, outline effect, or the same weave expression as the background.",
    ...getLogoTypePromptHints(config.logoType),
  ]);
}

async function executeGenerationRequest(
  context: GenerationExecutionContext,
  parts: GeminiPart[],
  attempt: number,
  stage: "single-pass" | "hd-cotton-base" | "hd-cotton-motif"
): Promise<string> {
  const response = await generateWithRetry(
    () =>
      context.ai.models.generateContent({
        model: context.modelId,
        contents: {
          parts,
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: context.mode === "final" ? "2K" : "1K",
          },
        },
      }),
    {
      attempt,
      material: context.labelConfig.material,
      labelCode: context.labelCode,
      modelId: context.modelId,
      seed: context.seed,
    }
  );

  const imageBase64 = extractGeneratedImage(response as GeminiResponseLike);
  if (!imageBase64) {
    throw new Error(`No image data found in ${stage} response.`);
  }

  return imageBase64;
}

function createReferenceImageParts(
  referenceImages: readonly GeminiInlineImage[]
): GeminiPart[] {
  if (referenceImages.length === 0) {
    return [];
  }

  return [
    { text: "REFERENCE MATERIAL IMAGES:" },
    ...referenceImages.map(referenceImage => ({
      inlineData: referenceImage,
    })),
  ];
}

async function runSinglePassGeneration(
  context: GenerationExecutionContext,
  options: {
    logoMimeType: GeminiInlineImage["mimeType"];
    normalizedLogoBase64: string;
  }
): Promise<GenerationStageResult> {
  let retryFeedback: string | undefined;
  let lastImageBase64 = "";
  let lastValidationReason = "Validation was not run.";
  let validationPassed = false;

  for (
    let attempt = 1;
    attempt <= MAX_WOVEN_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    const promptText = buildApiPrompt(context.labelConfig, {
      hasReferenceImages: context.referenceImages.length > 0,
      seed: context.seed,
      retryFeedback,
    });

    console.log("FINAL PROMPT:", promptText);
    console.log("PARAMS:", {
      material: context.labelConfig.material,
      backgroundColor: context.labelConfig.backgroundColor,
      logoColor: context.labelConfig.logoColor,
      size: context.labelConfig.size,
      logoType: context.labelConfig.logoType,
      labelCode: context.labelCode,
      seed: context.seed,
      attempt,
      stage: "single-pass",
    });

    const imageBase64 = await executeGenerationRequest(
      context,
      [
        { text: promptText },
        {
          inlineData: {
            mimeType: options.logoMimeType,
            data: options.normalizedLogoBase64,
          },
        },
        ...createReferenceImageParts(context.referenceImages),
      ],
      attempt,
      "single-pass"
    );

    lastImageBase64 = imageBase64;

    const validationResult = await validateWovenLabelOutput(
      context.ai,
      context.modelId,
      context.labelConfig,
      imageBase64
    );

    validationPassed = validationResult.passed;
    lastValidationReason = validationResult.reason;

    if (
      validationResult.passed ||
      attempt === MAX_WOVEN_GENERATION_ATTEMPTS
    ) {
      return {
        imageBase64,
        validationPassed,
        validationReason: lastValidationReason,
        attemptsUsed: attempt,
      };
    }

    retryFeedback = buildRetryFeedback(
      context.labelConfig,
      validationResult.reason
    );

    console.warn(
      "[NanoBanana] Regenerating after woven-textile validation failure",
      {
        mode: context.mode,
        modelId: context.modelId,
        textureType: context.labelConfig.textureTypeLegacy,
        material: context.labelConfig.material,
        labelCode: context.labelCode,
        seed: context.seed,
        attempt,
        stage: "single-pass",
        validationReason: validationResult.reason,
      }
    );
  }

  return {
    imageBase64: lastImageBase64,
    validationPassed,
    validationReason: lastValidationReason,
    attemptsUsed: MAX_WOVEN_GENERATION_ATTEMPTS,
  };
}

async function generateHdCottonBase(
  context: GenerationExecutionContext
): Promise<string> {
  const promptText = buildHdCottonBasePrompt(context.labelConfig, {
    hasReferenceImages: context.referenceImages.length > 0,
    seed: context.seed,
  });

  console.log("FINAL PROMPT:", promptText);
  console.log("PARAMS:", {
    material: context.labelConfig.material,
    backgroundColor: context.labelConfig.backgroundColor,
    logoColor: context.labelConfig.logoColor,
    size: context.labelConfig.size,
    logoType: context.labelConfig.logoType,
    labelCode: context.labelCode,
    seed: context.seed,
    attempt: 1,
    stage: "hd-cotton-base",
  });

  return executeGenerationRequest(
    context,
    [{ text: promptText }, ...createReferenceImageParts(context.referenceImages)],
    1,
    "hd-cotton-base"
  );
}

async function generateHdCottonMotifRefinement(
  context: GenerationExecutionContext,
  options: {
    baseImageBase64: string;
    logoMimeType: GeminiInlineImage["mimeType"];
    normalizedLogoBase64: string;
  }
): Promise<GenerationStageResult> {
  let retryFeedback: string | undefined;
  let lastImageBase64 = "";
  let lastValidationReason = "Validation was not run.";
  let validationPassed = false;

  for (
    let attempt = 1;
    attempt <= MAX_WOVEN_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    const promptText = buildHdCottonMotifRefinementPrompt(context.labelConfig, {
      hasReferenceImages: context.referenceImages.length > 0,
      seed: context.seed,
      retryFeedback,
    });

    console.log("FINAL PROMPT:", promptText);
    console.log("PARAMS:", {
      material: context.labelConfig.material,
      backgroundColor: context.labelConfig.backgroundColor,
      logoColor: context.labelConfig.logoColor,
      size: context.labelConfig.size,
      logoType: context.labelConfig.logoType,
      labelCode: context.labelCode,
      seed: context.seed,
      attempt,
      stage: "hd-cotton-motif",
    });

    const imageBase64 = await executeGenerationRequest(
      context,
      [
        { text: promptText },
        { text: "LOCKED STAGE A BASE IMAGE:" },
        {
          inlineData: {
            mimeType: "image/png",
            data: options.baseImageBase64,
          },
        },
        { text: "SUPPLIED LOGO ARTWORK:" },
        {
          inlineData: {
            mimeType: options.logoMimeType,
            data: options.normalizedLogoBase64,
          },
        },
        ...createReferenceImageParts(context.referenceImages),
      ],
      attempt,
      "hd-cotton-motif"
    );

    lastImageBase64 = imageBase64;

    const validationResult = await validateWovenLabelOutput(
      context.ai,
      context.modelId,
      context.labelConfig,
      imageBase64
    );

    validationPassed = validationResult.passed;
    lastValidationReason = validationResult.reason;

    if (
      validationResult.passed ||
      attempt === MAX_WOVEN_GENERATION_ATTEMPTS
    ) {
      return {
        imageBase64,
        validationPassed,
        validationReason: lastValidationReason,
        attemptsUsed: attempt,
      };
    }

    retryFeedback = buildHdCottonMotifRetryFeedback(
      context.labelConfig,
      validationResult.reason
    );

    console.warn(
      "[NanoBanana] Regenerating HD Cotton motif refinement after validation failure",
      {
        mode: context.mode,
        modelId: context.modelId,
        textureType: context.labelConfig.textureTypeLegacy,
        material: context.labelConfig.material,
        labelCode: context.labelCode,
        seed: context.seed,
        attempt,
        stage: "hd-cotton-motif",
        validationReason: validationResult.reason,
      }
    );
  }

  return {
    imageBase64: lastImageBase64,
    validationPassed,
    validationReason: lastValidationReason,
    attemptsUsed: MAX_WOVEN_GENERATION_ATTEMPTS,
  };
}

async function runHdCottonTwoStageGeneration(
  context: GenerationExecutionContext,
  options: {
    logoMimeType: GeminiInlineImage["mimeType"];
    normalizedLogoBase64: string;
  }
): Promise<GenerationStageResult> {
  const baseImageBase64 = await generateHdCottonBase(context);

  try {
    const motifResult = await generateHdCottonMotifRefinement(context, {
      baseImageBase64,
      logoMimeType: options.logoMimeType,
      normalizedLogoBase64: options.normalizedLogoBase64,
    });

    if (motifResult.validationPassed) {
      return motifResult;
    }

    console.warn(
      "[NanoBanana] HD Cotton motif refinement remained below validation target, trying single-pass fallback",
      {
        mode: context.mode,
        modelId: context.modelId,
        textureType: context.labelConfig.textureTypeLegacy,
        material: context.labelConfig.material,
        labelCode: context.labelCode,
        seed: context.seed,
        validationReason: motifResult.validationReason,
      }
    );

    try {
      const fallbackResult = await runSinglePassGeneration(context, options);
      return fallbackResult.validationPassed ? fallbackResult : motifResult;
    } catch (fallbackError: unknown) {
      console.warn("[NanoBanana] HD Cotton single-pass fallback failed", {
        mode: context.mode,
        modelId: context.modelId,
        textureType: context.labelConfig.textureTypeLegacy,
        material: context.labelConfig.material,
        labelCode: context.labelCode,
        seed: context.seed,
        errorMessage: getErrorMessage(fallbackError),
      });
      return motifResult;
    }
  } catch (error: unknown) {
    console.warn(
      "[NanoBanana] HD Cotton motif refinement failed, trying single-pass fallback",
      {
        mode: context.mode,
        modelId: context.modelId,
        textureType: context.labelConfig.textureTypeLegacy,
        material: context.labelConfig.material,
        labelCode: context.labelCode,
        seed: context.seed,
        errorMessage: getErrorMessage(error),
      }
    );

    try {
      return await runSinglePassGeneration(context, options);
    } catch (fallbackError: unknown) {
      console.warn(
        "[NanoBanana] HD Cotton single-pass fallback failed, returning Stage A base",
        {
          mode: context.mode,
          modelId: context.modelId,
          textureType: context.labelConfig.textureTypeLegacy,
          material: context.labelConfig.material,
          labelCode: context.labelCode,
          seed: context.seed,
          errorMessage: getErrorMessage(fallbackError),
        }
      );

      return {
        imageBase64: baseImageBase64,
        validationPassed: false,
        validationReason:
          "HD Cotton motif refinement and fallback failed. Returning locked Stage A base.",
        attemptsUsed: 1,
      };
    }
  }
}

export function buildPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    generationConfig?: GenerationConfig;
    seed?: number;
    retryFeedback?: string;
  }
): string {
  const materialPreset = TEXTURE_PRESETS_BY_MATERIAL[config.material];
  const texturePreset = getTexturePreset(config.textureTypeLegacy);
  const textureControlPreset = getTextureControlPreset(config.material);
  const generationConfig =
    options.generationConfig ?? buildFallbackGenerationConfig(config);
  const seed = options.seed ?? generateSeed(generationConfig);
  const textureBaselinePrompt = buildTextureFreezePrompt(textureControlPreset);
  const strictTextureControlPrompt =
    buildStrictTextureControlPrompt(textureControlPreset);
  const logoIntegrationPriorityPrompt =
    buildLogoIntegrationPriorityPrompt(config);
  const scopedModificationRulesPrompt =
    buildScopedModificationRulesPrompt(config);
  const materialSpecificLogoPrompt = buildMaterialSpecificLogoPrompt(config);

  // Keep the prompt layered: shared label-domain instructions stay in the
  // label module, while service-level guardrails let us tighten generation
  // quality without changing the overall pipeline or reference loading flow.
  return [
    buildGenerationPrompt(config, materialPreset, {
      hasReferenceImages: options.hasReferenceImages,
      retryFeedback: options.retryFeedback,
    }),
    "",
    textureBaselinePrompt,
    "",
    strictTextureControlPrompt,
    "",
    ...(logoIntegrationPriorityPrompt
      ? [logoIntegrationPriorityPrompt, ""]
      : []),
    ...(scopedModificationRulesPrompt
      ? [scopedModificationRulesPrompt, ""]
      : []),
    ...(materialSpecificLogoPrompt.length > 0
      ? [
          "BROCHE LOGO LAYER:",
          ...materialSpecificLogoPrompt.map(line => `- ${line}`),
          "",
        ]
      : []),
    buildQualityGuardrailsPrompt(config),
    "",
    buildTextureParameterPrompt(texturePreset),
    "",
    buildGenerationConfigPrompt(generationConfig),
    "",
    buildDeterminismPrompt(seed),
  ].join("\n");
}

export async function generateLabel(
  input: GenerateLabelInput
): Promise<GenerateLabelOutput> {
  const labelConfig = resolveLabelConfig(input);
  const generationConfig = resolveGenerationConfig(input, labelConfig);
  const labelCode = generateLabelCode(generationConfig);
  const seed = generateSeed(generationConfig);
  const materialPreset = TEXTURE_PRESETS_BY_MATERIAL[labelConfig.material];
  const texturePreset = getTexturePreset(labelConfig.textureTypeLegacy);
  const modelId =
    input.mode === "preview" ? MODEL_CONFIG.preview : MODEL_CONFIG.final;
  let normalizedLogoBase64 = "";

  try {
    normalizedLogoBase64 = normalizeLogoBase64(input.logoBase64);
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_STUDIO_API_KEY n'est pas configuree dans les variables d'environnement"
      );
    }

    console.log(`[NanoBanana] Using preset: ${texturePreset.name}`);
    console.log(`[NanoBanana] References: ${texturePreset.references.length}`);
    console.log("[NanoBanana] Parameters:", texturePreset.parameters);
    console.log("[NanoBanana] GenerationConfig", generationConfig);
    console.log(`[NanoBanana] LabelCode: ${labelCode}`);
    console.log(`[NanoBanana] Deterministic seed: ${seed}`);

    // Reference moodboards are texture-only exemplars. They should steer weave
    // behavior and material response, never the supplied logo geometry.
    const referenceImages = await loadReferenceImages(texturePreset);

    console.log("[NanoBanana] Generation start", {
      mode: input.mode,
      modelId,
      textureType: labelConfig.textureTypeLegacy,
      material: labelConfig.material,
      presetTitle: materialPreset.title,
      presetName: texturePreset.name,
      labelCode,
      seed,
      referenceCount: referenceImages.length,
    });

    const ai = new GoogleGenAI({ apiKey });
    const logoMimeType = resolveLogoMimeType(input.logoMimeType);
    const generationContext: GenerationExecutionContext = {
      ai,
      modelId,
      mode: input.mode,
      labelConfig,
      labelCode,
      seed,
      referenceImages,
    };
    const generationResult = isHdCotton(labelConfig.textureTypeLegacy)
      ? await runHdCottonTwoStageGeneration(generationContext, {
          logoMimeType,
          normalizedLogoBase64,
        })
      : await runSinglePassGeneration(generationContext, {
          logoMimeType,
          normalizedLogoBase64,
        });

    if (!generationResult.validationPassed) {
      console.warn(
        "[NanoBanana] Returning best available generation despite validation warning",
        {
          mode: input.mode,
          modelId,
          textureType: labelConfig.textureTypeLegacy,
          material: labelConfig.material,
          labelCode,
          seed,
          attemptsUsed: generationResult.attemptsUsed,
          validationReason: generationResult.validationReason,
        }
      );
    }

    console.log("[NanoBanana] Generation success", {
      mode: input.mode,
      modelId,
      textureType: labelConfig.textureTypeLegacy,
      material: labelConfig.material,
      labelCode,
      seed,
      attemptsUsed: generationResult.attemptsUsed,
      imageBytes: generationResult.imageBase64.length,
      validationReason: generationResult.validationReason,
      pipeline: isHdCotton(labelConfig.textureTypeLegacy)
        ? "hd-cotton-two-stage"
        : "single-pass",
    });

    return {
      success: true,
      imageBase64: generationResult.imageBase64,
      labelConfig,
      labelCode,
      seed,
    };
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    const errorStatus = getErrorStatus(error);

    console.error("[NanoBanana] Generation failed", {
      mode: input.mode,
      modelId,
      textureType: labelConfig.textureTypeLegacy,
      material: labelConfig.material,
      labelCode,
      seed,
      errorMessage,
      errorStatus,
    });

    const formattedErrorMessage = errorStatus
      ? `Erreur API ${errorStatus}: ${errorMessage}`
      : errorMessage;

    return {
      success: false,
      error: formattedErrorMessage,
      labelCode,
      seed,
    };
  }
}

export { type TextureType } from "./texturePresets";
