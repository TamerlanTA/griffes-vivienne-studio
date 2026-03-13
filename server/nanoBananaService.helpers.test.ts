import { describe, expect, it } from "vitest";
import { buildLabelConfig } from "./label";
import { buildPrompt, extractInlineImage, isRealPhotoRef } from "./nanoBananaService";

describe("nanoBananaService helpers", () => {
  it("detects valid photo references only", () => {
    expect(isRealPhotoRef("data:image/jpeg;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/png;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/webp;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
    expect(isRealPhotoRef("not-a-data-url")).toBe(false);
  });

  it("parses inline base64 image data", () => {
    expect(extractInlineImage("data:image/png;base64,aGVsbG8=")).toEqual({
      mimeType: "image/png",
      data: "aGVsbG8=",
    });
    expect(extractInlineImage("invalid")).toBeNull();
  });

  it("builds a parameter-driven prompt with the required sections", () => {
    const config = buildLabelConfig({
      material: "SATIN",
      color: "CREAM",
      size: "30x15",
    });

    const prompt = buildPrompt(config, {
      hasReferenceImages: true,
    });

    expect(prompt).toContain("ROLE:");
    expect(prompt).toContain("TASK:");
    expect(prompt).toContain("INPUTS:");
    expect(prompt).toContain("MATERIAL:");
    expect(prompt).toContain("WEAVE PARAMETERS:");
    expect(prompt).toContain("THREAD CHARACTERISTICS:");
    expect(prompt).toContain("COLOR / BACKGROUND CONSTRAINTS:");
    expect(prompt).toContain("INSTRUCTIONS:");
    expect(prompt).toContain("CRITICAL NEGATIVE INSTRUCTIONS:");
    expect(prompt).toContain("VIEW / RENDER:");
    expect(prompt).toContain("Legacy texture mapping for reference loading: satin.");
    expect(prompt).toContain("Macro photography.");
    expect(prompt).toContain("2K resolution");
    expect(prompt).toContain("no random artistic texture");
  });
});
