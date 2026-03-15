import {
  DEFAULT_LABEL_COLOR,
  DEFAULT_LABEL_MATERIAL,
  DEFAULT_LABEL_SIZE,
  LABEL_SIZES,
  WEAVE_TYPES,
} from "./constants";
import { generateLabelCode, normalizeSizeSegment } from "./generateLabelCode";
import { mapLegacyTextureType, mapMaterialToLegacyTextureType } from "./mapLegacyTextureType";
import { TEXTURE_PRESETS_BY_MATERIAL } from "./texturePresets";
import type {
  GlossLevel,
  LabelColor,
  LabelConfig,
  LabelConfigInput,
  LabelMaterial,
  LabelSize,
  WeaveType,
} from "./types";

const MATERIAL_ALIASES: Record<string, LabelMaterial> = {
  HD: "HD",
  COTTON: "COTTON",
  HD_COTTON: "COTTON",
  HDCOTON: "COTTON",
  SATIN: "SATIN",
  TAFFETA: "TAFFETA",
  TAFFETAS: "TAFFETA",
};

const COLOR_ALIASES: Record<string, LabelColor> = {
  BLACK: "BLACK",
  WHITE: "WHITE",
  CREAM: "CREAM",
  IVORY: "CREAM",
  BEIGE: "BEIGE",
  GOLD: "GOLD",
};

const GLOSS_LEVELS: readonly GlossLevel[] = ["low", "medium", "high"];

function normalizeMaterial(
  material: LabelConfigInput["material"],
  textureTypeLegacy: LabelConfigInput["textureTypeLegacy"]
): LabelMaterial {
  const fromLegacyMaterial = mapLegacyTextureType(material);
  if (fromLegacyMaterial) {
    return fromLegacyMaterial;
  }

  if (typeof material === "string") {
    const normalized = material.trim().toUpperCase();
    const alias = MATERIAL_ALIASES[normalized];
    if (alias) {
      return alias;
    }
  }

  const fromLegacyTextureType = mapLegacyTextureType(textureTypeLegacy);
  if (fromLegacyTextureType) {
    return fromLegacyTextureType;
  }

  return DEFAULT_LABEL_MATERIAL;
}

function normalizeColor(color: LabelConfigInput["color"]): LabelColor {
  if (typeof color === "string") {
    const normalized = color.trim().toUpperCase();
    const alias = COLOR_ALIASES[normalized];
    if (alias) {
      return alias;
    }
  }

  return DEFAULT_LABEL_COLOR;
}

function normalizeSize(size: LabelConfigInput["size"]): LabelSize {
  if (typeof size === "string") {
    const normalized = normalizeSizeSegment(size);
    if ((LABEL_SIZES as readonly string[]).includes(normalized)) {
      return normalized as LabelSize;
    }
  }

  return DEFAULT_LABEL_SIZE;
}

function normalizeWeaveType(value: LabelConfigInput["weaveType"]): WeaveType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if ((WEAVE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as WeaveType;
  }

  return undefined;
}

function normalizeGlossLevel(value: LabelConfigInput["glossLevel"]): GlossLevel | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if ((GLOSS_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as GlossLevel;
  }

  return undefined;
}

function normalizePositiveNumber(value: number | null | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function normalizeAngle(value: number | null | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

export function buildLabelConfig(input: LabelConfigInput = {}): LabelConfig {
  const material = normalizeMaterial(input.material, input.textureTypeLegacy);
  const preset = TEXTURE_PRESETS_BY_MATERIAL[material];
  const color = normalizeColor(input.color);
  const size = normalizeSize(input.size);
  const weaveType = normalizeWeaveType(input.weaveType) ?? preset.weaveType;
  const gridDensity = normalizePositiveNumber(input.gridDensity) ?? preset.gridDensity;
  const threadAngle = normalizeAngle(input.threadAngle) ?? preset.threadAngle;
  const glossLevel = normalizeGlossLevel(input.glossLevel) ?? preset.glossLevel;
  const textureTypeLegacy = mapMaterialToLegacyTextureType(material);
  const labelCode = generateLabelCode(material, color, size);

  return {
    material,
    color,
    size,
    weaveType,
    gridDensity,
    threadAngle,
    glossLevel,
    textureTypeLegacy,
    labelCode,
  };
}
