import { describe, expect, it } from "vitest";
import { buildLabelConfig } from "./label";
import { buildPrompt, extractInlineImage, isRealPhotoRef } from "./nanoBananaService";

describe("nanoBananaService helpers", () => {
  it("detects valid photo references only", () => {
    expect(isRealPhotoRef("data:image/jpeg;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/png;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/webp;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("server/moodboards/cotton_1.jpeg")).toBe(true);
    expect(isRealPhotoRef("server/moodboards/taffeta_1.webp")).toBe(true);
    expect(isRealPhotoRef("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
    expect(isRealPhotoRef("server/moodboards/cotton_1.svg")).toBe(false);
    expect(isRealPhotoRef("not-a-data-url")).toBe(false);
  });

  it("parses inline base64 image data", () => {
    expect(extractInlineImage("data:image/png;base64,aGVsbG8=")).toEqual({
      mimeType: "image/png",
      data: "aGVsbG8=",
    });
    expect(extractInlineImage("invalid")).toBeNull();
  });

  it("builds a stricter textile rendering prompt with the required controls", () => {
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
    expect(prompt).toContain("INSTRUCTIONS:");
    expect(prompt).toContain("QUALITY GUARDRAILS:");
    expect(prompt).toContain("STRICT TEXTILE CONSTRAINTS:");
    expect(prompt).toContain("MATERIAL SPECIFICATION:");
    expect(prompt).toContain("WEAVE PARAMETERS:");
    expect(prompt).toContain("THREAD CHARACTERISTICS:");
    expect(prompt).toContain("COLOR / BACKGROUND CONSTRAINTS:");
    expect(prompt).toContain("IMPORTANT:");
    expect(prompt).toContain("CRITICAL NEGATIVE INSTRUCTIONS:");
    expect(prompt).toContain("CAMERA STYLE:");
    expect(prompt).toContain("VIEW / RENDER:");
    expect(prompt).toContain("CLEAN LABEL EDGES:");
    expect(prompt).toContain("Legacy texture mapping for reference loading: satin.");
    expect(prompt).toContain("TEXTURE PRESET:");
    expect(prompt).toContain("Preset name: SATIN.");
    expect(prompt).toContain("TEXTILE PARAMETERS:");
    expect(prompt).toContain("GENERATION CONFIG:");
    expect(prompt).toContain("DETERMINISM:");
    expect(prompt).toContain("Generation seed:");
    expect(prompt).toContain("Use this seed to maintain visual consistency.");
    expect(prompt).toContain("Material: SATIN.");
    expect(prompt).toContain("Color: cream.");
    expect(prompt).toContain("Label size: 30x15.");
    expect(prompt).toContain("Weave: SATIN_DIAGONAL_20.");
    expect(prompt).toContain("Weave density: 1.25.");
    expect(prompt).toContain("Thread thickness: 0.38.");
    expect(prompt).toContain("Weave density: 0.8.");
    expect(prompt).toContain("Fabric stiffness: 0.7.");
    expect(prompt).toContain("Label edge finish: clean.");
    expect(prompt).toContain("Industrial woven edges with clean rectangular selvedges.");
    expect(prompt).toContain("Gloss level: 0.85.");
    expect(prompt).toContain("Thread angle: 20.");
    expect(prompt).toContain("flat woven, flush with the textile surface");
    expect(prompt).toContain("No raised embroidery, no stitched border");
    expect(prompt).toContain("newly manufactured");
    expect(prompt).toContain("Thread thickness: Threads must appear fine and uniform");
    expect(prompt).toContain("Fabric stiffness: The label must appear slightly stiff");
    expect(prompt).toContain("Label edge finish: Edges must be clean with realistic woven borders");
    expect(prompt).toContain("The woven label has industrial-grade selvedge edges.");
    expect(prompt).toContain("No fuzzy borders.");
    expect(prompt).toContain("Macro textile photography.");
    expect(prompt).toContain("Studio product photography.");
    expect(prompt).toContain("Sharp focus on fabric edges.");
    expect(prompt).toContain("2K resolution.");
    expect(prompt).toContain("no random artistic texture");
  });
});
