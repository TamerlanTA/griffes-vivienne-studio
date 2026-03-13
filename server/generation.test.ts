import { describe, expect, it } from "vitest";
import {
  buildGenerationPrompt,
  buildLabelConfig,
  generateLabelCode,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
} from "./label";
import { labelGenerateInputSchema } from "./routers";

const MINIMAL_LOGO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("label.generate input schema", () => {
  it("accepts legacy texture requests without config", () => {
    const parsed = labelGenerateInputSchema.parse({
      logoDataUrl: MINIMAL_LOGO_DATA_URL,
      textureType: "hd",
    });

    expect(parsed.textureType).toBe("hd");
    expect(parsed.config).toBeUndefined();
  });

  it("accepts structured config requests without legacy textureType", () => {
    const parsed = labelGenerateInputSchema.parse({
      logoDataUrl: MINIMAL_LOGO_DATA_URL,
      config: {
        material: "SATIN",
        color: "CREAM",
        size: "30x15",
      },
    });

    expect(parsed.textureType).toBeUndefined();
    expect(parsed.config?.material).toBe("SATIN");
  });

  it("requires textureType or config.material", () => {
    expect(() =>
      labelGenerateInputSchema.parse({
        logoDataUrl: MINIMAL_LOGO_DATA_URL,
        config: {
          color: "BLACK",
        },
      })
    ).toThrow("textureType or config.material is required");
  });
});

describe("generation domain compatibility", () => {
  it("lets structured config override legacy texture type", () => {
    const parsed = labelGenerateInputSchema.parse({
      logoDataUrl: MINIMAL_LOGO_DATA_URL,
      textureType: "hd",
      config: {
        material: "SATIN",
        color: "CREAM",
      },
    });

    const labelConfig = buildLabelConfig({
      ...parsed.config,
      material: parsed.config?.material ?? mapLegacyTextureType(parsed.textureType),
      textureTypeLegacy: parsed.config?.material ? undefined : parsed.textureType,
    });

    expect(labelConfig.material).toBe("SATIN");
    expect(labelConfig.textureTypeLegacy).toBe("satin");
  });

  it("normalizes color and size into canonical values", () => {
    const labelConfig = buildLabelConfig({
      material: "satin",
      color: " cream ",
      size: "30X15",
    });

    expect(labelConfig.color).toBe("CREAM");
    expect(labelConfig.size).toBe("30x15");
    expect(labelConfig.labelCode).toBe("SATIN_CREAM_30x15");
  });

  it("maps legacy texture types to canonical materials", () => {
    expect(mapLegacyTextureType("hd")).toBe("HD");
    expect(mapLegacyTextureType("hdcoton")).toBe("COTTON");
    expect(mapLegacyTextureType("satin")).toBe("SATIN");
    expect(mapLegacyTextureType("taffetas")).toBe("TAFFETA");
  });

  it("generates deterministic label codes", () => {
    expect(generateLabelCode("hd", "black", "50X20")).toBe("HD_BLACK_50x20");
    expect(generateLabelCode("SATIN", "CREAM", "30x15")).toBe("SATIN_CREAM_30x15");
  });
});

describe("material prompt rules", () => {
  it("adds the satin light-beige constraint", () => {
    const labelConfig = buildLabelConfig({
      material: "SATIN",
      color: "CREAM",
      size: "30x15",
    });

    const prompt = buildGenerationPrompt(labelConfig, TEXTURE_PRESETS_BY_MATERIAL.SATIN, {
      hasReferenceImages: true,
    });

    expect(prompt).toContain("light beige or cream (#F5F5DC)");
    expect(prompt).toContain("must NOT turn dark");
    expect(prompt).toContain("Do not adopt dark garment background from the reference images.");
    expect(prompt).toContain("Do not lose the satin sheen");
  });

  it("keeps cotton, hd, and taffeta material-specific rules", () => {
    const hdPrompt = buildGenerationPrompt(
      buildLabelConfig({ material: "HD" }),
      TEXTURE_PRESETS_BY_MATERIAL.HD
    );
    const cottonPrompt = buildGenerationPrompt(
      buildLabelConfig({ material: "COTTON" }),
      TEXTURE_PRESETS_BY_MATERIAL.COTTON
    );
    const taffetaPrompt = buildGenerationPrompt(
      buildLabelConfig({ material: "TAFFETA" }),
      TEXTURE_PRESETS_BY_MATERIAL.TAFFETA
    );

    expect(hdPrompt).toContain("Very tight weave");
    expect(hdPrompt).toContain("high-definition woven finish");
    expect(cottonPrompt).toContain("Matte cotton surface");
    expect(cottonPrompt).toContain("not synthetic and not glossy");
    expect(taffetaPrompt).toContain("Classic visible woven grid");
    expect(taffetaPrompt).toContain("not overly glossy and not satin-like");
  });
});
