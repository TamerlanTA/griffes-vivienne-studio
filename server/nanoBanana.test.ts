import { describe, it, expect } from "vitest";
import { generateLabel, type GenerateLabelInput } from "./nanoBananaService";

// Un logo PNG 1x1 pixel en base64 (test minimal sans dépendance externe)
const MINIMAL_LOGO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("Nano Banana Pro - Structure du service", () => {
  it("le service exporte bien la fonction generateLabel", () => {
    expect(typeof generateLabel).toBe("function");
  });

  it("les 4 types de texture sont valides en TypeScript", () => {
    const textures: GenerateLabelInput["textureType"][] = [
      "hd",
      "hdcoton",
      "satin",
      "taffetas",
    ];
    expect(textures).toHaveLength(4);
    textures.forEach((t) => expect(typeof t).toBe("string"));
  });

  it("les 2 modes preview/final sont valides", () => {
    const modes: GenerateLabelInput["mode"][] = ["preview", "final"];
    expect(modes).toHaveLength(2);
  });

  it("retourne une erreur si GOOGLE_AI_STUDIO_API_KEY est absente", async () => {
    const originalKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    delete process.env.GOOGLE_AI_STUDIO_API_KEY;

    const result = await generateLabel({
      logoBase64: MINIMAL_LOGO_BASE64,
      textureType: "hd",
      mode: "preview",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("GOOGLE_AI_STUDIO_API_KEY");

    // Restaurer la clé
    if (originalKey) process.env.GOOGLE_AI_STUDIO_API_KEY = originalKey;
  });
});
