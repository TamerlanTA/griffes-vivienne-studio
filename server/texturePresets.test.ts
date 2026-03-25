import { describe, expect, it } from "vitest";
import { LABEL_MATERIALS, TEXTURE_PRESETS_BY_MATERIAL } from "./label";
import {
  TEXTURE_PRESETS,
  TEXTURE_TYPES,
  texturePresets,
} from "./texturePresets";

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
    expect(satin.promptConstraints.join(" ")).toContain(
      "Do not adopt dark garment background"
    );
  });

  it("defines the taffeta preset as thin dense regular label material, not cotton-like fabric", () => {
    const taffeta = TEXTURE_PRESETS_BY_MATERIAL.TAFFETA;

    expect(taffeta.promptMaterialDescription).toContain(
      "Fine dense woven taffeta clothing label"
    );
    expect(taffeta.promptMaterialDescription).toContain(
      "slightly warm neutral beige / light ivory tone"
    );
    expect(taffeta.promptConstraints.join(" ")).toContain(
      "Thin dense regular taffeta label"
    );
    expect(taffeta.promptConstraints.join(" ")).toContain(
      "flatter slightly crisper surface than cotton"
    );
    expect(taffeta.promptConstraints.join(" ")).toContain(
      "subtle natural woven variation rather than sterile artificial uniformity"
    );
    expect(taffeta.promptConstraints.join(" ")).toContain(
      "Not soft, not fuzzy, not porous, not canvas-like, not glossy like satin, and not embossed like HD"
    );
    expect(taffeta.defaultBackgroundGuidance).toContain(
      "approved neutral paper-like support surface"
    );
  });

  it("defines a parameter-driven preset registry for legacy texture types", () => {
    expect(TEXTURE_TYPES).toHaveLength(4);
    expect(Object.keys(TEXTURE_PRESETS)).toHaveLength(4);
    expect(texturePresets).toBe(TEXTURE_PRESETS);
    expect(TEXTURE_PRESETS.hd.name).toBe("HD");
    expect(TEXTURE_PRESETS.hdcoton.name).toBe("HD_COTTON");
    expect(TEXTURE_PRESETS.satin.name).toBe("SATIN");
    expect(TEXTURE_PRESETS.taffetas.name).toBe("TAFFETA");
    expect(TEXTURE_PRESETS.satin.references.length).toBeGreaterThan(0);
    expect(TEXTURE_PRESETS.hd.references.length).toBeGreaterThan(0);
    expect(TEXTURE_PRESETS.hdcoton.references).toHaveLength(4);
    expect(TEXTURE_PRESETS.taffetas.references).toHaveLength(4);
    expect(TEXTURE_PRESETS.hd.parameters.threadThickness).toBe(0.4);
    expect(TEXTURE_PRESETS.hdcoton.parameters.threadThickness).toBe(0.34);
    expect(TEXTURE_PRESETS.hdcoton.parameters.weaveDensity).toBe(1.08);
    expect(TEXTURE_PRESETS.taffetas.parameters.weaveDensity).toBe(0.88);
    expect(TEXTURE_PRESETS.satin.parameters.threadAngle).toBe(20);
    expect(TEXTURE_PRESETS.satin.parameters.edgeFinish).toBe("clean");
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "Apply controlled premium woven-label realism"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "Warm light beige / natural ecru woven cotton clothing label."
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "Stage A anchor"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "subtle diagonal ground weave"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "Stage B anchor"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "internal thread logic"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "Do not flatten the logo or text into a uniform black shape"
    );
    expect(TEXTURE_PRESETS.hdcoton.promptTemplate).toContain(
      "do not erase the subtle diagonal woven direction"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "locked anchor"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "polished white onyx / light marble support surface"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "light warm ivory / pale beige / off-white"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "never pure white"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "approved and locked"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "Use the new successful woven logo/text behavior only as motif guidance"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "internal woven realism of the logo and text"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "text must preserve internal woven logic rather than smooth black lettering"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "must remain visibly thread-woven"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "slightly cleaner more production-like edges"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "must not shift toward pure white or tonally merge into the marble"
    );
    expect(TEXTURE_PRESETS.hd.promptTemplate).toContain(
      "green cutting mats, wood, workshop tables, or random tabletops"
    );
    expect(TEXTURE_PRESETS.taffetas.promptTemplate).toContain(
      "thin dense regular woven taffeta label surface"
    );
    expect(TEXTURE_PRESETS.taffetas.promptTemplate).toContain(
      "cleaner more controlled face than cotton"
    );
    expect(TEXTURE_PRESETS.taffetas.promptTemplate).toContain(
      "neutral paper-like support surface / backdrop family"
    );
    expect(TEXTURE_PRESETS.taffetas.promptTemplate).toContain(
      "slightly warmer neutral beige / light ivory tone"
    );
    expect(TEXTURE_PRESETS.taffetas.promptTemplate).toContain(
      "logo and text woven, readable, and integrated into the same fine taffeta structure"
    );
  });
});
