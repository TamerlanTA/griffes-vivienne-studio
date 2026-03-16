import { describe, expect, it } from "vitest";
import {
  buildGenerationPrompt,
  buildLabelConfig,
  generateLabelCode,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
} from "./label";
import { labelGenerateInputSchema } from "./routers";
import { generateLabelCode as generateProductionLabelCode } from "./utils/labelCode";
import { generateSeed } from "./utils/generationSeed";

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
      logoBase64: MINIMAL_LOGO_DATA_URL.replace(/^data:[^;]+;base64,/, ""),
      config: {
        material: "SATIN",
        color: "cream",
        size: "30x15",
        weave: "SATIN_DIAGONAL_20",
        density: 1.25,
        threadAngle: 20,
        glossLevel: 0.85,
      },
    });

    expect(parsed.textureType).toBeUndefined();
    expect(parsed.config?.material).toBe("SATIN");
  });

  it("requires textureType or config", () => {
    expect(() =>
      labelGenerateInputSchema.parse({
        logoDataUrl: MINIMAL_LOGO_DATA_URL,
      })
    ).toThrow("textureType or config is required");
  });
});

describe("generation domain compatibility", () => {
  it("lets structured config override legacy texture type", () => {
    const parsed = labelGenerateInputSchema.parse({
      logoDataUrl: MINIMAL_LOGO_DATA_URL,
      textureType: "hd",
      config: {
        material: "SATIN",
        color: "cream",
        size: "30x15",
        weave: "SATIN_DIAGONAL_20",
        density: 1.25,
        threadAngle: 20,
        glossLevel: 0.85,
      },
    });

    const labelConfig = buildLabelConfig({
      material: parsed.config?.material ?? mapLegacyTextureType(parsed.textureType),
      color: parsed.config?.color,
      size: parsed.config?.size,
      weaveType: parsed.config?.weave,
      gridDensity: parsed.config?.density,
      threadAngle: parsed.config?.threadAngle,
      textureTypeLegacy: parsed.config ? undefined : parsed.textureType,
    });

    expect(labelConfig.material).toBe("SATIN");
    expect(labelConfig.textureTypeLegacy).toBe("satin");
  });

  it("maps HD_COTTON generation config to the canonical cotton domain", () => {
    const parsed = labelGenerateInputSchema.parse({
      logoDataUrl: MINIMAL_LOGO_DATA_URL,
      config: {
        material: "HD_COTTON",
        color: "black",
        size: "50x20",
        weave: "COTTON_STABLE",
        density: 1.5,
      },
    });

    const labelConfig = buildLabelConfig({
      material: parsed.config?.material,
      color: parsed.config?.color,
      size: parsed.config?.size,
      weaveType: parsed.config?.weave,
      gridDensity: parsed.config?.density,
    });

    expect(labelConfig.material).toBe("COTTON");
    expect(labelConfig.textureTypeLegacy).toBe("hdcoton");
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

  it("generates production label codes from GenerationConfig", () => {
    expect(
      generateProductionLabelCode({
        material: "HD_COTTON",
        color: "black",
        size: "50x20",
      })
    ).toBe("HD_COTTON_BLACK_50x20");
  });

  it("generates deterministic seeds from GenerationConfig", () => {
    const config = {
      material: "SATIN" as const,
      color: "cream",
      size: "30x15",
      weave: "SATIN_DIAGONAL_20",
      density: 1.25,
      threadAngle: 20,
      glossLevel: 0.85,
    };

    expect(generateSeed(config)).toBe(generateSeed(config));
    expect(
      generateSeed({
        ...config,
        density: 1.5,
      })
    ).not.toBe(generateSeed(config));
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
    expect(prompt).toContain("No raised embroidery, no stitched border");
    expect(prompt).toContain("The label must appear slightly stiff and structured");
    expect(prompt).toContain("The woven label has industrial-grade selvedge edges.");
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
    expect(hdPrompt).toContain("newly manufactured high-definition finish");
    expect(hdPrompt).toContain("no fading, wear, or distressed fibers");
    expect(cottonPrompt).toContain("soft natural cotton fibers");
    expect(cottonPrompt).toContain("printed-cotton look");
    expect(taffetaPrompt).toContain("Fine, tight woven grain");
    expect(taffetaPrompt).toContain("not coarse, not oversized");
    expect(hdPrompt).toContain("Label edge finish: Edges must be clean with realistic woven borders");
    expect(cottonPrompt).toContain("Thread thickness: Threads must appear fine and uniform");
    expect(taffetaPrompt).toContain("Weave density: The fabric must show a tight and regular weave pattern");
    expect(hdPrompt).toContain("Edges are straight, sharp, and rectangular.");
    expect(cottonPrompt).toContain("No fuzzy borders.");
    expect(taffetaPrompt).toContain("The full rectangular label is clearly visible.");
  });
});
