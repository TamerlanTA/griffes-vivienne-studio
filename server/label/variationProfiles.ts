import type {
  LabelColor,
  LabelLogoColor,
  LabelLogoType,
  LabelSize,
} from "./types";

export type LabelSizeShape =
  | "small_square"
  | "medium_rectangle"
  | "long_horizontal";

export interface LabelSizeProfile {
  size: LabelSize;
  width: number;
  height: number;
  shape: LabelSizeShape;
  aspectRatio: number;
  displayName: string;
  compositionDirective: string;
  validationDirective: string;
}

const LABEL_SIZE_PROFILES: Record<LabelSize, LabelSizeProfile> = {
  "20x10": {
    size: "20x10",
    width: 20,
    height: 10,
    shape: "medium_rectangle",
    aspectRatio: 2,
    displayName: "compact rectangle",
    compositionDirective:
      "Use a compact rectangular woven label with balanced margins and a clear left-to-right reading flow.",
    validationDirective:
      "The label should read as a compact rectangle, wider than tall, with stable left-to-right alignment.",
  },
  "25x25": {
    size: "25x25",
    width: 25,
    height: 25,
    shape: "small_square",
    aspectRatio: 1,
    displayName: "small square",
    compositionDirective:
      "Use a small square label with centered composition and even margins on all sides.",
    validationDirective:
      "The label should read as a square woven badge with centered composition, not stretched horizontally or vertically.",
  },
  "30x15": {
    size: "30x15",
    width: 30,
    height: 15,
    shape: "medium_rectangle",
    aspectRatio: 2,
    displayName: "medium rectangle",
    compositionDirective:
      "Use a medium rectangular woven label with clear side margins and enough room for legible woven text.",
    validationDirective:
      "The label should read as a medium rectangle, wider than tall, with clean woven margins.",
  },
  "40x20": {
    size: "40x20",
    width: 40,
    height: 20,
    shape: "medium_rectangle",
    aspectRatio: 2,
    displayName: "medium rectangle",
    compositionDirective:
      "Use a medium rectangular woven label with stable horizontal balance for symbol, text, or mixed logo layouts.",
    validationDirective:
      "The label should read as a balanced medium rectangle with clean horizontal composition.",
  },
  "50x20": {
    size: "50x20",
    width: 50,
    height: 20,
    shape: "long_horizontal",
    aspectRatio: 2.5,
    displayName: "long horizontal",
    compositionDirective:
      "Use a long horizontal label with generous side margins and a clearly left-to-right woven composition.",
    validationDirective:
      "The label should read as a long horizontal format with consistent left-to-right flow and no portrait rotation.",
  },
  "60x24": {
    size: "60x24",
    width: 60,
    height: 24,
    shape: "long_horizontal",
    aspectRatio: 2.5,
    displayName: "long horizontal",
    compositionDirective:
      "Use a long horizontal fashion label with generous width, readable woven text spacing, and stable left-to-right hierarchy.",
    validationDirective:
      "The label should read as a long horizontal fashion label with strong left-to-right orientation and no portrait drift.",
  },
};

const BACKGROUND_COLOR_DESCRIPTIONS: Record<LabelColor, string> = {
  BLACK: "deep black woven ground for contrast testing",
  WHITE: "clean white woven ground",
  CREAM: "light warm cream cotton tone, subtle and refined",
  BEIGE:
    "clean refined beige cotton label tone, light and neutral, not brownish",
  GOLD: "muted warm sand woven ground",
  OFF_WHITE:
    "clean light cotton label, soft neutral off-white, slightly warm, not yellow, not brown",
  LIGHT_BEIGE: "very light beige cotton, close to off-white",
  DARK_CHARCOAL: "deep dark charcoal fabric",
  NAVY: "deep navy blue woven ground",
};

const LOGO_COLOR_DESCRIPTIONS: Record<LabelLogoColor, string> = {
  BLACK: "deep black woven threads",
  DARK_BLUE: "dark navy blue woven threads",
  WHITE: "white woven threads clearly visible",
  GOLD: "warm golden woven threads — a rich amber-gold thread tone as used in luxury woven labels, not metallic foil and not printed yellow",
};

const LOGO_TYPE_DESCRIPTIONS: Record<LabelLogoType, string> = {
  AUTO: "infer whether the supplied mark is symbol-only, text-only, or combined and preserve exactly what is present",
  SYMBOL_ONLY: "render only a symbol mark with no invented supporting text",
  TEXT_ONLY:
    "render only woven typography with crisp, readable letterforms made from threads",
  SYMBOL_AND_TEXT:
    "render both the symbol and the text together with preserved hierarchy and spacing",
};

const LOGO_TYPE_PROMPT_HINTS: Record<LabelLogoType, readonly string[]> = {
  AUTO: [
    "Infer the existing logo structure from the supplied artwork and preserve it exactly.",
    "If the supplied logo includes text, that text must also read as woven threadwork rather than printed ink.",
  ],
  SYMBOL_ONLY: [
    "Preserve the supplied symbol silhouette exactly with no invented text or slogans.",
    "The symbol must be formed by woven threads that share the same textile grid as the background.",
  ],
  TEXT_ONLY: [
    "Preserve the supplied letterforms, spacing, and typographic rhythm exactly.",
    "Every character must be woven from threads with visible interlacing, subtle depth, and no printed or inked look.",
  ],
  SYMBOL_AND_TEXT: [
    "Preserve the relationship between the symbol and the text exactly, including spacing, hierarchy, and alignment.",
    "Both the symbol and the text must be woven into the same textile grid with no overlay effect.",
  ],
};

const DARK_BACKGROUND_COLORS = new Set<LabelColor>(["BLACK", "DARK_CHARCOAL", "NAVY"]);

export const backgroundColorMap: Record<LabelColor, string> =
  BACKGROUND_COLOR_DESCRIPTIONS;
export const logoColorMap: Record<LabelLogoColor, string> =
  LOGO_COLOR_DESCRIPTIONS;

export function safeColor(
  map: Record<string, string>,
  key: string,
  fallback: string
): string {
  return map[key] ?? fallback;
}

function parseSize(size: string): { width: number; height: number } | null {
  const match = size.trim().match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);
  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
}

export function getLabelSizeProfile(
  size: LabelSize | string
): LabelSizeProfile {
  const knownProfile = LABEL_SIZE_PROFILES[size as LabelSize];
  if (knownProfile) {
    return knownProfile;
  }

  const parsed = parseSize(size);
  if (!parsed) {
    return LABEL_SIZE_PROFILES["50x20"];
  }

  const aspectRatio = parsed.width / parsed.height;
  if (aspectRatio <= 1.15) {
    return {
      size: size as LabelSize,
      width: parsed.width,
      height: parsed.height,
      shape: "small_square",
      aspectRatio,
      displayName: "small square",
      compositionDirective:
        "Use a square woven label with centered composition and even margins.",
      validationDirective:
        "The label should read as a square woven label with centered composition.",
    };
  }

  if (aspectRatio >= 2.3) {
    return {
      size: size as LabelSize,
      width: parsed.width,
      height: parsed.height,
      shape: "long_horizontal",
      aspectRatio,
      displayName: "long horizontal",
      compositionDirective:
        "Use a long horizontal woven label with clear left-to-right reading flow.",
      validationDirective:
        "The label should read as a long horizontal woven label with strong left-to-right orientation.",
    };
  }

  return {
    size: size as LabelSize,
    width: parsed.width,
    height: parsed.height,
    shape: "medium_rectangle",
    aspectRatio,
    displayName: "medium rectangle",
    compositionDirective:
      "Use a medium rectangular woven label with balanced horizontal composition.",
    validationDirective:
      "The label should read as a medium rectangular woven label with balanced horizontal composition.",
  };
}

export function describeBackgroundColor(color: LabelColor): string {
  return safeColor(backgroundColorMap, color, "light cotton color");
}

export function describeLogoColor(color: LabelLogoColor): string {
  return safeColor(logoColorMap, color, "black threads");
}

export function describeLogoType(logoType: LabelLogoType): string {
  return LOGO_TYPE_DESCRIPTIONS[logoType];
}

export function getLogoTypePromptHints(
  logoType: LabelLogoType
): readonly string[] {
  return LOGO_TYPE_PROMPT_HINTS[logoType];
}

export function isDarkBackgroundColor(color: LabelColor | string): boolean {
  return DARK_BACKGROUND_COLORS.has(color as LabelColor);
}

export function getDefaultLogoColor(
  backgroundColor: LabelColor | string
): LabelLogoColor {
  return isDarkBackgroundColor(backgroundColor) ? "WHITE" : "BLACK";
}
