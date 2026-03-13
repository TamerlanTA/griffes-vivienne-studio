import { describe, expect, it } from "vitest";
import { LABEL_MATERIALS, TEXTURE_PRESETS_BY_MATERIAL } from "./label";
import { TEXTURE_PRESETS, TEXTURE_TYPES } from "./texturePresets";

describe("texture presets", () => {
  it("defines exactly 4 canonical presets", () => {
    expect(LABEL_MATERIALS).toHaveLength(4);
    expect(Object.keys(TEXTURE_PRESETS_BY_MATERIAL)).toHaveLength(4);
  });

  it("ensures each canonical preset has the required controlled fields", () => {
    for (const preset of Object.values(TEXTURE_PRESETS_BY_MATERIAL)) {
      expect(preset.title).toBeTruthy();
      expect(preset.legacyTextureType).toBeTruthy();
      expect(preset.weaveType).toBeTruthy();
      expect(preset.gridDensity).toBeGreaterThan(0);
      expect(typeof preset.threadAngle).toBe("number");
      expect(["low", "medium", "high"]).toContain(preset.glossLevel);
      expect(preset.promptMaterialDescription).toBeTruthy();
      expect(preset.promptConstraints.length).toBeGreaterThan(0);
      expect(preset.paletteSuggestion.length).toBeGreaterThan(0);
      expect(preset.defaultBackgroundGuidance).toBeTruthy();
      expect(preset.referenceHandlingNotes.length).toBeGreaterThan(0);
    }
  });

  it("keeps the satin preset explicitly light and guarded against dark backgrounds", () => {
    const satin = TEXTURE_PRESETS_BY_MATERIAL.SATIN;

    expect(satin.defaultBackgroundGuidance).toContain("#F5F5DC");
    expect(satin.promptConstraints.join(" ")).toContain("NOT turn dark");
    expect(satin.promptConstraints.join(" ")).toContain("Do not adopt dark garment background");
  });

  it("keeps the legacy shim available for existing callers", () => {
    expect(TEXTURE_TYPES).toHaveLength(4);
    expect(Object.keys(TEXTURE_PRESETS)).toHaveLength(4);
    expect(TEXTURE_PRESETS.satin.references.length).toBeGreaterThan(0);
    expect(TEXTURE_PRESETS.hdcoton.references.length).toBeGreaterThan(0);
  });
});
