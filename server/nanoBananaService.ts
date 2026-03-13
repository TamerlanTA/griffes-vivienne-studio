/**
 * Service d'integration Nano Banana Pro (Gemini 3 Pro Image Preview)
 * via Google AI Studio (ai.google.dev)
 *
 * Structure corrigee basee sur le code fonctionnel de l'utilisateur
 * Integre les moodboards (images de reference) pour guider la generation
 */

import { GoogleGenAI } from "@google/genai";
import {
  buildGenerationPrompt,
  buildLabelConfig,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
  type LabelConfig,
  type LabelConfigInput,
} from "./label";
import { MOODBOARDS } from "./moodboards";
import { type TextureType } from "./texturePresets";

export interface GenerateLabelInput {
  logoBase64: string;
  textureType?: TextureType;
  mode: "preview" | "final";
  config?: LabelConfigInput;
}

export interface GenerateLabelOutput {
  success: boolean;
  imageBase64?: string;
  error?: string;
  labelConfig?: LabelConfig;
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
  const hasStructuredMaterial =
    typeof input.config?.material === "string" && input.config.material.trim().length > 0;

  return buildLabelConfig({
    ...input.config,
    material: input.config?.material ?? mappedLegacyMaterial,
    textureTypeLegacy: hasStructuredMaterial
      ? input.config?.textureTypeLegacy
      : input.textureType ?? input.config?.textureTypeLegacy,
  });
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

export function isRealPhotoRef(ref: string): boolean {
  const image = extractInlineImage(ref);
  return image !== null && REAL_PHOTO_MIME_TYPES.has(image.mimeType);
}

export function buildPrompt(
  config: LabelConfig,
  options: { hasReferenceImages: boolean }
): string {
  const preset = TEXTURE_PRESETS_BY_MATERIAL[config.material];
  return buildGenerationPrompt(config, preset, options);
}

export async function generateLabel(
  input: GenerateLabelInput
): Promise<GenerateLabelOutput> {
  const labelConfig = resolveLabelConfig(input);
  const preset = TEXTURE_PRESETS_BY_MATERIAL[labelConfig.material];
  const modelId = input.mode === "preview" ? MODEL_CONFIG.preview : MODEL_CONFIG.final;
  const referenceImages = MOODBOARDS[labelConfig.textureTypeLegacy]
    .filter(isRealPhotoRef)
    .map(extractInlineImage)
    .filter((image): image is GeminiInlineImage => image !== null);

  console.log("[NanoBanana] Generation start", {
    mode: input.mode,
    modelId,
    textureType: labelConfig.textureTypeLegacy,
    material: labelConfig.material,
    presetTitle: preset.title,
    labelCode: labelConfig.labelCode,
    referenceCount: referenceImages.length,
  });

  try {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_STUDIO_API_KEY n'est pas configuree dans les variables d'environnement"
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = buildPrompt(labelConfig, {
      hasReferenceImages: referenceImages.length > 0,
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
        labelCode: labelConfig.labelCode,
        imageBytes: imageBase64.length,
      });

      return {
        success: true,
        imageBase64,
        labelConfig,
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
      labelCode: labelConfig.labelCode,
      errorMessage,
      errorStatus,
    });

    const formattedErrorMessage = errorStatus
      ? `Erreur API ${errorStatus}: ${errorMessage}`
      : errorMessage;

    return {
      success: false,
      error: formattedErrorMessage,
    };
  }
}

export { type TextureType } from "./texturePresets";
