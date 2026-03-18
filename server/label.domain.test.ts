import { describe, expect, it } from "vitest";
import {
  buildLabelConfig,
  generateLabelCode,
  mapLegacyTextureType,
  TEXTURE_PRESETS_BY_MATERIAL,
} from "./label";

describe("label domain configuration", () => {
  it.each([
    ["HD", "hd", "DAMASK_HD", 2, 0, "low", "BEIGE", "BLACK"],
    ["COTTON", "hdcoton", "COTTON_STABLE", 1.75, 0, "low", "BEIGE", "BLACK"],
    ["SATIN", "satin", "SATIN_DIAGONAL_20", 1.25, 20, "high", "CREAM", "BLACK"],
    [
      "TAFFETA",
      "taffetas",
      "TAFFETA_CLASSIC_GRID",
      1,
      0,
      "medium",
      "BEIGE",
      "BLACK",
    ],
  ] as const)(
    "builds canonical config for %s",
    (
      material,
      legacyTextureType,
      weaveType,
      gridDensity,
      threadAngle,
      glossLevel,
      backgroundColor,
      logoColor
    ) => {
      const config = buildLabelConfig({ material });

      expect(config.material).toBe(material);
      expect(config.textureTypeLegacy).toBe(legacyTextureType);
      expect(config.weaveType).toBe(weaveType);
      expect(config.gridDensity).toBe(gridDensity);
      expect(config.threadAngle).toBe(threadAngle);
      expect(config.glossLevel).toBe(glossLevel);
      expect(config.color).toBe(backgroundColor);
      expect(config.backgroundColor).toBe(backgroundColor);
      expect(config.logoColor).toBe(logoColor);
      expect(config.size).toBe("50x20");
    }
  );

  it("applies defaults and explicit overrides safely", () => {
    const config = buildLabelConfig({
      material: "COTTON",
      color: "BEIGE",
      weaveType: "DAMASK_HD",
      gridDensity: 1.75,
      threadAngle: 8,
      glossLevel: "medium",
    });

    expect(config.color).toBe("BEIGE");
    expect(config.weaveType).toBe("DAMASK_HD");
    expect(config.gridDensity).toBe(1.75);
    expect(config.threadAngle).toBe(8);
    expect(config.glossLevel).toBe("medium");
  });

  it("maps legacy texture types correctly", () => {
    expect(mapLegacyTextureType("hd")).toBe("HD");
    expect(mapLegacyTextureType("hdcoton")).toBe("COTTON");
    expect(mapLegacyTextureType("satin")).toBe("SATIN");
    expect(mapLegacyTextureType("taffetas")).toBe("TAFFETA");
    expect(mapLegacyTextureType("unknown")).toBeUndefined();
  });

  it("generates deterministic label codes", () => {
    expect(generateLabelCode("TAFFETA", "BEIGE", "20x10")).toBe(
      "TAFFETA_BEIGE_20x10"
    );
  });

  it("keeps satin constraints explicit and light", () => {
    const satinPreset = TEXTURE_PRESETS_BY_MATERIAL.SATIN;
    const satinConstraints = satinPreset.promptConstraints.join(" ");

    expect(satinPreset.defaultBackgroundGuidance).toContain("#F5F5DC");
    expect(satinConstraints).toContain("NOT turn dark");
    expect(satinConstraints).toContain("Do not adopt dark garment background");
  });
});
