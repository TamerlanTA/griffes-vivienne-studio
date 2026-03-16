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
  buildGenerationPrompt,
  buildLabelConfig,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
  type LabelConfig,
  type LabelConfigInput,
} from "./label";
import {
  getTexturePreset,
  type TexturePreset as ResolvedTexturePreset,
  type TextureType,
} from "./texturePresets";
import { type GenerationConfig } from "./types/generationConfig";
import { generateLabelCode } from "./utils/labelCode";
import { generateSeed } from "./utils/generationSeed";

export interface GenerateLabelInput {
  logoBase64: string;
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
  inlineData?: {
    data?: string;
  };
};

type GeminiResponseLike = {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
    };
  }>;
};

const REAL_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const REAL_PHOTO_FILE_MIME_TYPES = new Map<string, GeminiInlineImage["mimeType"]>([
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

function extractGeneratedImage(response: GeminiResponseLike): string | undefined {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const imageBase64 = part.inlineData?.data;
    if (typeof imageBase64 === "string" && imageBase64.length > 0) {
      return imageBase64;
    }
  }

  return undefined;
}

function resolveLabelConfig(input: GenerateLabelInput): LabelConfig {
  const mappedLegacyMaterial = mapLegacyTextureType(input.textureType);
  const normalizedConfig = isGenerationConfig(input.config)
    ? mapGenerationConfigToLabelConfigInput(input.config)
    : input.config;
  const hasStructuredMaterial =
    typeof normalizedConfig?.material === "string" && normalizedConfig.material.trim().length > 0;

  return buildLabelConfig({
    ...normalizedConfig,
    material: normalizedConfig?.material ?? mappedLegacyMaterial,
    textureTypeLegacy: hasStructuredMaterial
      ? normalizedConfig?.textureTypeLegacy
      : input.textureType ?? normalizedConfig?.textureTypeLegacy,
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

function mapNumericGlossLevel(value: GenerationConfig["glossLevel"]): LabelConfigInput["glossLevel"] {
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
  return {
    material: config.material,
    color: config.color,
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

function buildFallbackGenerationConfig(
  config: LabelConfig
): GenerationConfig {
  const preset = getTexturePreset(config.textureTypeLegacy);

  return {
    material: mapLabelMaterialToGenerationMaterial(config.material),
    color: config.color.toLowerCase(),
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

    return {
      ...fallbackConfig,
      material: input.config.material,
      color: input.config.color.trim(),
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

function getReferenceFileMimeType(ref: string): GeminiInlineImage["mimeType"] | null {
  const extension = extname(ref.trim()).toLowerCase();
  return REAL_PHOTO_FILE_MIME_TYPES.get(extension) ?? null;
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
      throw new Error(`Unsupported moodboard reference image MIME type: ${inlineImage.mimeType}`);
    }

    return inlineImage;
  }

  const mimeType = getReferenceFileMimeType(ref);
  if (!mimeType) {
    throw new Error(`Unsupported moodboard reference image path: ${ref}`);
  }

  const absolutePath = resolve(process.cwd(), ref);

  try {
    const buffer = await readFile(absolutePath);
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

async function loadReferenceImages(preset: ResolvedTexturePreset): Promise<GeminiInlineImage[]> {
  const referenceImages = await Promise.all(preset.references.map(loadReferenceImage));
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
  return [
    "GENERATION CONFIG:",
    `- Material: ${config.material}.`,
    `- Color: ${config.color}.`,
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

function getMaterialQualityGuardrails(material: LabelConfig["material"]): readonly string[] {
  switch (material) {
    case "HD":
      return [
        "Maintain clean high-density weave with compact thread spacing and crisp edge definition.",
      ];
    case "COTTON":
      return [
        "Maintain soft natural cotton fibers, organic irregularity, matte finish, and slightly thicker yarns without slipping into a printed look.",
      ];
    case "SATIN":
      return [
        "Preserve controlled satin sheen while keeping the woven surface smooth, premium, and free from embroidered lift.",
      ];
    case "TAFFETA":
      return [
        "Keep the taffeta grain fine, tight, and small-scale with no oversized weave cells or coarse checker pattern.",
      ];
  }
}

function buildQualityGuardrailsPrompt(config: LabelConfig): string {
  return [
    "QUALITY GUARDRAILS:",
    "- The logo must appear fully woven into the fabric structure, never printed, coated, embossed, or placed on top of the textile.",
    "- Logo threads must be flat woven, flush with the textile surface, and integrated into the surrounding weave.",
    "- No raised embroidery, no stitched border, no bulging outline, no puffed edge, and no halo around logo shapes.",
    "- Keep the weave crisp, clean, and newly manufactured with stable density across the full label.",
    "- No aging, no wear, no fading, no distress, no washed texture, and no damaged fibers.",
    ...getMaterialQualityGuardrails(config.material).map((line) => `- ${line}`),
  ].join("\n");
}

export function buildPrompt(
  config: LabelConfig,
  options: {
    hasReferenceImages: boolean;
    generationConfig?: GenerationConfig;
    seed?: number;
  }
): string {
  const materialPreset = TEXTURE_PRESETS_BY_MATERIAL[config.material];
  const texturePreset = getTexturePreset(config.textureTypeLegacy);
  const generationConfig = options.generationConfig ?? buildFallbackGenerationConfig(config);
  const seed = options.seed ?? generateSeed(generationConfig);

  // Keep the prompt layered: shared label-domain instructions stay in the
  // label module, while service-level guardrails let us tighten generation
  // quality without changing the overall pipeline or reference loading flow.
  return [
    buildGenerationPrompt(config, materialPreset, options),
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
  const modelId = input.mode === "preview" ? MODEL_CONFIG.preview : MODEL_CONFIG.final;

  try {
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

    const promptText = buildPrompt(labelConfig, {
      hasReferenceImages: referenceImages.length > 0,
      generationConfig,
      seed,
    });

    const logoMimeType = "image/png";

    const parts: GeminiPart[] = [
      { text: promptText },
      {
        inlineData: {
          mimeType: logoMimeType,
          data: input.logoBase64,
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

    const response = await ai.models.generateContent({
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
    });

    const imageBase64 = extractGeneratedImage(response as GeminiResponseLike);
    if (imageBase64) {
      console.log("[NanoBanana] Generation success", {
        mode: input.mode,
        modelId,
        textureType: labelConfig.textureTypeLegacy,
        material: labelConfig.material,
        labelCode,
        seed,
        imageBytes: imageBase64.length,
      });

      return {
        success: true,
        imageBase64,
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
