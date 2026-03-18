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
  mapLegacyTextureType,
  logoColorMap,
  safeColor,
  TEXTURE_PRESETS_BY_MATERIAL,
  type LabelConfig,
  type LabelConfigInput,
} from "./label";
import {
  getTexturePreset,
  type TexturePreset as ResolvedTexturePreset,
  type TextureType,
} from "./texturePresets";
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
const MAX_PROMPT_LENGTH = 2000;
const VALIDATION_RESPONSE_MIME_TYPE = "text/plain";
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const INVALID_PROMPT_PATTERN = /\b(?:undefined|null)\b/i;
const INVALID_TEXTILE_BODY_PATTERN =
  /\b(?:coarse|rough|burlap|linen|handmade)\b/i;
const API_NEGATIVE_PROMPT =
  "burlap, sack fabric, rough textile, linen, handmade fabric, loose weave, macro fibers, printed, flat, smooth surface, plastic texture, digital rendering, logo overlay, artificial sharp edges, embroidery, sticker effect, stamped ink, thick outline, dark contour, border ring";

type GeminiInlineImage = {
  mimeType: string;
  data: string;
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
        "Keep the label flat, clean, refined, and industrially precise with no exaggerated yarn scale.",
      ];
    case "HD":
      return [
        "The label has a dense high-definition damask weave with compact thread spacing, precise micro-weave control, and crisp industrial thread definition.",
        "The result must stay fine, controlled, flat, and newly manufactured with premium woven-label precision.",
      ];
    case "SATIN":
      return [
        "The weave is satin with controlled premium sheen, visible thread structure, and woven depth rather than print or glossy plastic.",
        "The satin must stay light and premium when a light background is requested.",
      ];
    case "TAFFETA":
      return [
        "The label has a fine tightly packed taffeta weave with a compact classic grid, restrained sheen, and premium industrial thread definition.",
        "Keep the structure micro-scale, tight, and precise with no exaggerated checker pattern or oversized texture.",
      ];
  }
}

function buildColorControlPrompt(config: LabelConfig): string {
  const backgroundColor = getSafeBackgroundColorPrompt(config);
  const logoColor = getSafeLogoColorPrompt(config);

  return [
    `The fabric color is ${backgroundColor}.`,
    `The design is formed by ${logoColor}.`,
    "The specified colors must be clearly visible and accurately rendered. Do not default to black or neutral tones unless explicitly specified.",
    "The fabric must appear clean and refined, not dirty, not aged, and not brownish.",
  ].join(" ");
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
  const outlineGuardrail =
    config.material === "SATIN"
      ? undefined
      : "No thick edge, dark contour, border ring, halo, or embroidery-like outline around the logo. Boundary threads must stay the same thickness as the interior logo threads.";
  const referenceInstruction = options.hasReferenceImages
    ? "Reference images guide micro-weave, jacquard behavior, and lighting only."
    : undefined;

  const positivePrompt = [
    `A high-resolution studio photograph of a premium woven ${getMaterialPromptLabel(config.material)} clothing label.`,
    ...getApiMaterialPromptLines(config),
    buildColorControlPrompt(config),
    "The logo must be woven into the fabric using threads, not printed or placed on top, and the thread follows the weave structure of the label.",
    "Show realistic thread interlacing, subtle micro-shadows, and clean industrial label depth.",
    "Generate the label and logo together in one woven step. Do not overlay or print the logo afterward.",
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

  const finalPrompt = sanitizePrompt(
    [
      sanitizedPositivePrompt,
      `Negative prompt: ${API_NEGATIVE_PROMPT}.`,
      `Seed ${options.seed}.`,
    ].join(" ")
  );

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
      ];
    case "COTTON":
      return [
        "Maintain a premium woven cotton label look with high-density fine micro-weave, tight thread spacing, flat structure, clean cut contours, and industrial jacquard precision.",
      ];
    case "SATIN":
      return [
        "Preserve controlled satin sheen while keeping the woven surface smooth, premium, and free from embroidered lift.",
      ];
    case "TAFFETA":
      return [
        "Keep the taffeta grain fine, tight, and small-scale with no oversized weave cells, exaggerated checker pattern, or separate outline ring around the logo.",
      ];
  }
}

function getLogoQualityGuardrails(config: LabelConfig): readonly string[] {
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
        "- The cotton thread scale stays micro-level, tightly packed, and industrially precise, with no enlarged yarns or open-grid appearance.",
        "- Subtle micro-shadows and controlled label depth are visible between threads.",
        "- The surface is smooth yet micro-textured, flat, clean, and refined, not smooth plastic or embroidery-like.",
        "- Edges are clean cut with no visible side stitches, sewing threads, or stitched borders.",
        "- There is no thick dark contour, no border stroke, and no embroidery-like outline around the logo.",
      ];
    case "TAFFETA":
      return [
        "- The taffeta grain is fine, tight, and small-scale with a visible woven grid.",
        "- The design is woven into the same taffeta structure, not printed or overlaid.",
        "- The weave cells remain compact and realistic with no oversized or exaggerated checker pattern.",
        "- The label still shows depth and thread definition even with the tighter taffeta finish.",
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
      ];
    case "SYMBOL_AND_TEXT":
      return [
        "- Both the symbol and the text are visible and both are woven into the same textile grid.",
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
    "FAIL if the image looks printed, flat, plastic, digitally rendered, over-sharpened, logo-overlaid, embroidered, outlined with a thick contour, or made with oversized open weave threads.",
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
  const generationConfig =
    options.generationConfig ?? buildFallbackGenerationConfig(config);
  const seed = options.seed ?? generateSeed(generationConfig);

  // Keep the prompt layered: shared label-domain instructions stay in the
  // label module, while service-level guardrails let us tighten generation
  // quality without changing the overall pipeline or reference loading flow.
  return [
    buildGenerationPrompt(config, materialPreset, {
      hasReferenceImages: options.hasReferenceImages,
      retryFeedback: options.retryFeedback,
    }),
    "",
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

    let lastImageBase64: string | undefined;
    let retryFeedback: string | undefined;

    for (
      let attempt = 1;
      attempt <= MAX_WOVEN_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const promptText = buildApiPrompt(labelConfig, {
        hasReferenceImages: referenceImages.length > 0,
        seed,
        retryFeedback,
      });

      console.log("FINAL PROMPT:", promptText);
      console.log("PARAMS:", {
        material: labelConfig.material,
        backgroundColor: labelConfig.backgroundColor,
        logoColor: labelConfig.logoColor,
        size: labelConfig.size,
        logoType: labelConfig.logoType,
        labelCode,
        seed,
        attempt,
      });

      const parts: GeminiPart[] = [
        { text: promptText },
        {
          inlineData: {
            mimeType: logoMimeType,
            data: normalizedLogoBase64,
          },
        },
      ];

      if (referenceImages.length > 0) {
        parts.push({ text: "REFERENCE MATERIAL IMAGES:" });
        for (const referenceImage of referenceImages) {
          parts.push({
            inlineData: referenceImage,
          });
        }
      }

      const response = await generateWithRetry(
        () =>
          ai.models.generateContent({
            model: modelId,
            contents: {
              parts,
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: input.mode === "final" ? "2K" : "1K",
              },
            },
          }),
        {
          attempt,
          material: labelConfig.material,
          labelCode,
          modelId,
          seed,
        }
      );

      const imageBase64 = extractGeneratedImage(response as GeminiResponseLike);
      if (!imageBase64) {
        throw new Error("No image data found in response.");
      }

      lastImageBase64 = imageBase64;

      const validationResult = await validateWovenLabelOutput(
        ai,
        modelId,
        labelConfig,
        imageBase64
      );

      if (
        validationResult.passed ||
        attempt === MAX_WOVEN_GENERATION_ATTEMPTS
      ) {
        if (!validationResult.passed) {
          console.warn(
            "[NanoBanana] Returning final attempt despite validation warning",
            {
              mode: input.mode,
              modelId,
              textureType: labelConfig.textureTypeLegacy,
              material: labelConfig.material,
              labelCode,
              seed,
              attempt,
              validationReason: validationResult.reason,
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
          attempt,
          imageBytes: imageBase64.length,
          validationReason: validationResult.reason,
        });

        return {
          success: true,
          imageBase64,
          labelConfig,
          labelCode,
          seed,
        };
      }

      retryFeedback = buildRetryFeedback(labelConfig, validationResult.reason);

      console.warn(
        "[NanoBanana] Regenerating after woven-textile validation failure",
        {
          mode: input.mode,
          modelId,
          textureType: labelConfig.textureTypeLegacy,
          material: labelConfig.material,
          labelCode,
          seed,
          attempt,
          validationReason: validationResult.reason,
        }
      );
    }

    if (lastImageBase64) {
      return {
        success: true,
        imageBase64: lastImageBase64,
        labelConfig,
        labelCode,
        seed,
      };
    }

    throw new Error("No image data found in response.");
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
