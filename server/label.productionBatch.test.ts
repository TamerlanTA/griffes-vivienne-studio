import { describe, expect, it } from "vitest";
import { buildLabelConfig, buildProductionBatchVariations } from "./label";

describe("production batch variations", () => {
  it("supports separate background and logo thread colors with automatic contrast defaults", () => {
    const darkConfig = buildLabelConfig({
      material: "COTTON",
      backgroundColor: "DARK_CHARCOAL",
      size: "25x25",
    });
    const explicitConfig = buildLabelConfig({
      material: "TAFFETA",
      backgroundColor: "OFF_WHITE",
      logoColor: "DARK_BLUE",
      logoType: "SYMBOL_AND_TEXT",
      size: "60x24",
    });

    expect(darkConfig.backgroundColor).toBe("DARK_CHARCOAL");
    expect(darkConfig.color).toBe("DARK_CHARCOAL");
    expect(darkConfig.logoColor).toBe("WHITE");
    expect(darkConfig.logoType).toBe("AUTO");
    expect(explicitConfig.backgroundColor).toBe("OFF_WHITE");
    expect(explicitConfig.logoColor).toBe("DARK_BLUE");
    expect(explicitConfig.logoType).toBe("SYMBOL_AND_TEXT");
  });

  it("builds a curated production batch across sizes, colors, logo types, and cotton/taffeta", () => {
    const variations = buildProductionBatchVariations();
    const sizes = new Set(variations.map(variation => variation.size));
    const backgroundColors = new Set(
      variations.map(variation => variation.backgroundColor)
    );
    const logoColors = new Set(
      variations.map(variation => variation.logoColor)
    );
    const logoTypes = new Set(variations.map(variation => variation.logoType));
    const materials = new Set(variations.map(variation => variation.material));

    expect(variations).toHaveLength(12);
    expect(materials).toEqual(new Set(["COTTON", "TAFFETA"]));
    expect(sizes).toEqual(new Set(["25x25", "40x20", "60x24"]));
    expect(backgroundColors).toEqual(
      new Set(["OFF_WHITE", "DARK_CHARCOAL", "CREAM", "LIGHT_BEIGE"])
    );
    expect(logoColors).toEqual(new Set(["BLACK", "DARK_BLUE", "WHITE"]));
    expect(logoTypes).toEqual(
      new Set(["SYMBOL_ONLY", "TEXT_ONLY", "SYMBOL_AND_TEXT"])
    );
    expect(variations.every(variation => variation.slug.length > 0)).toBe(true);
  });
});
