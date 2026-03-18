import { describe, expect, it } from "vitest";
import { buildLabelConfig } from "./label";
import {
  assertValidPrompt,
  assertValidGenerationPrompt,
  buildApiPrompt,
  buildPrompt,
  detectImageMimeTypeFromBuffer,
  extractInlineImage,
  isRealPhotoRef,
  normalizeLogoBase64,
  resolveLogoMimeType,
  sanitizePrompt,
} from "./nanoBananaService";

describe("nanoBananaService helpers", () => {
  it("detects valid photo references only", () => {
    expect(isRealPhotoRef("data:image/jpeg;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/png;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("data:image/webp;base64,aGVsbG8=")).toBe(true);
    expect(isRealPhotoRef("server/moodboards/cotton_1.jpeg")).toBe(true);
    expect(isRealPhotoRef("server/moodboards/taffeta_1.webp")).toBe(true);
    expect(isRealPhotoRef("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(
      false
    );
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

  it("keeps supported logo mime types and falls back safely", () => {
    expect(resolveLogoMimeType("image/png")).toBe("image/png");
    expect(resolveLogoMimeType("image/jpeg")).toBe("image/jpeg");
    expect(resolveLogoMimeType("image/webp")).toBe("image/webp");
    expect(resolveLogoMimeType(undefined)).toBe("image/png");
  });

  it("sanitizes prompts to a safe deterministic length", () => {
    const prompt = sanitizePrompt(`
      line one

      line two
      ${"x".repeat(2100)}
    `);

    expect(prompt).not.toContain("\n");
    expect(prompt.length).toBe(2000);
  });

  it("rejects prompts containing invalid tokens", () => {
    expect(() => assertValidPrompt("valid prompt")).not.toThrow();
    expect(() => assertValidPrompt("contains undefined token")).toThrow(
      "Invalid prompt detected"
    );
    expect(() => assertValidPrompt("contains null token")).toThrow(
      "Invalid prompt detected"
    );
    expect(() =>
      assertValidGenerationPrompt("premium label with coarse texture")
    ).toThrow("Invalid textile prompt vocabulary detected");
  });

  it("validates and normalizes logo base64 payloads", () => {
    expect(normalizeLogoBase64(" aGVsbG8= \n")).toBe("aGVsbG8=");
    expect(() => normalizeLogoBase64("")).toThrow("Invalid logo input");
    expect(() => normalizeLogoBase64("not base64!!!")).toThrow(
      "Invalid logo input"
    );
  });

  it("detects the real mime type from file bytes", () => {
    expect(
      detectImageMimeTypeFromBuffer(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe("image/png");
    expect(
      detectImageMimeTypeFromBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xdb]))
    ).toBe("image/jpeg");
    expect(
      detectImageMimeTypeFromBuffer(
        Buffer.from([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ])
      )
    ).toBe("image/webp");
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
    expect(prompt).toContain("STRUCTURAL GENERATION:");
    expect(prompt).toContain("QUALITY GUARDRAILS:");
    expect(prompt).toContain("STRICT TEXTILE CONSTRAINTS:");
    expect(prompt).toContain("MATERIAL SPECIFICATION:");
    expect(prompt).toContain("WEAVE PARAMETERS:");
    expect(prompt).toContain("THREAD CHARACTERISTICS:");
    expect(prompt).toContain("COLOR / BACKGROUND CONSTRAINTS:");
    expect(prompt).toContain("IMPORTANT:");
    expect(prompt).toContain("SELF-CHECK BEFORE OUTPUT:");
    expect(prompt).toContain("NEGATIVE PROMPT:");
    expect(prompt).toContain("CRITICAL NEGATIVE INSTRUCTIONS:");
    expect(prompt).toContain("CAMERA STYLE:");
    expect(prompt).toContain("VIEW / RENDER:");
    expect(prompt).toContain("CLEAN LABEL EDGES:");
    expect(prompt).toContain(
      "Legacy texture mapping for reference loading: satin."
    );
    expect(prompt).toContain("TEXTURE PRESET:");
    expect(prompt).toContain("Preset name: SATIN.");
    expect(prompt).toContain("TEXTILE PARAMETERS:");
    expect(prompt).toContain("GENERATION CONFIG:");
    expect(prompt).toContain("DETERMINISM:");
    expect(prompt).toContain("Generation seed:");
    expect(prompt).toContain("Use this seed to maintain visual consistency.");
    expect(prompt).toContain("Material: SATIN.");
    expect(prompt).toContain("Background color: cream.");
    expect(prompt).toContain("Logo thread color: black.");
    expect(prompt).toContain("Logo type: AUTO.");
    expect(prompt).toContain("Label size: 30x15.");
    expect(prompt).toContain("Weave: SATIN_DIAGONAL_20.");
    expect(prompt).toContain("Weave density: 1.25.");
    expect(prompt).toContain("Thread thickness: 0.38.");
    expect(prompt).toContain("Weave density: 0.8.");
    expect(prompt).toContain("Fabric stiffness: 0.7.");
    expect(prompt).toContain("Label edge finish: clean.");
    expect(prompt).toContain(
      "Industrial woven edges with clean rectangular selvedges."
    );
    expect(prompt).toContain("Gloss level: 0.85.");
    expect(prompt).toContain("Thread angle: 20.");
    expect(prompt).toContain("flat woven, flush with the textile surface");
    expect(prompt).toContain("No raised embroidery, no stitched border");
    expect(prompt).toContain("newly manufactured");
    expect(prompt).toContain(
      "Thread thickness: Threads must appear fine and uniform"
    );
    expect(prompt).toContain(
      "Fabric stiffness: The label must appear slightly stiff"
    );
    expect(prompt).toContain(
      "Label edge finish: Edges must be clean with realistic woven borders"
    );
    expect(prompt).toContain(
      "The woven label has industrial-grade selvedge edges."
    );
    expect(prompt).toContain("No fuzzy borders.");
    expect(prompt).toContain("Macro textile photography.");
    expect(prompt).toContain("Studio product photography.");
    expect(prompt).toContain("Sharp focus on fabric edges.");
    expect(prompt).toContain("2K resolution.");
    expect(prompt).toContain("no random artistic texture");
    expect(prompt).toContain("printed, flat, smooth surface, plastic texture");
  });

  it("injects the premium cotton label directive and retry feedback", () => {
    const config = buildLabelConfig({
      material: "COTTON",
      color: "BEIGE",
      size: "50x20",
    });

    const prompt = buildPrompt(config, {
      hasReferenceImages: true,
      retryFeedback: "The prior attempt looked printed.",
    });

    expect(prompt).toContain("PREMIUM LABEL MATERIAL DIRECTIVE:");
    expect(prompt).toContain(
      "A high-resolution studio photograph of a premium woven cotton clothing label with high-density jacquard weave."
    );
    expect(prompt).toContain("Target logo threads: BLACK");
    expect(prompt).toContain("Target label format: long horizontal (50x20)");
    expect(prompt).toContain(
      "The fabric has a fine tightly packed micro-weave structure with uniform thread spacing and industrial precision"
    );
    expect(prompt).toContain("bright, even, high-key studio lighting");
    expect(prompt).toContain("No visible side stitching");
    expect(prompt).toContain("industrial jacquard construction");
    expect(prompt).toContain(
      "No visible side stitching, no border seams, no folded edges, no decorative stitching"
    );
    expect(prompt).toContain(
      "fine tightly packed cotton yarns with micro-scale definition"
    );
    expect(prompt).toContain("The prior attempt looked printed.");
    expect(prompt).toContain("logo overlay");
  });

  it("builds a compact API prompt with strict color control", () => {
    const config = buildLabelConfig({
      material: "COTTON",
      backgroundColor: "OFF_WHITE",
      logoColor: "DARK_BLUE",
      size: "40x20",
      logoType: "TEXT_ONLY",
    });

    const prompt = buildApiPrompt(config, {
      hasReferenceImages: true,
      seed: 1234,
      retryFeedback: "The previous attempt looked embroidered.",
    });

    expect(prompt.length).toBeLessThanOrEqual(2000);
    expect(prompt).toContain(
      "The fabric color is clean light cotton label, soft neutral off-white, slightly warm, not yellow, not brown."
    );
    expect(prompt).toContain(
      "The design is formed by dark navy blue woven threads."
    );
    expect(prompt).toContain(
      "A high-resolution studio photograph of a premium woven cotton clothing label."
    );
    expect(prompt).toContain(
      "high-density fine woven cotton structure with very tight thread spacing"
    );
    expect(prompt).toContain(
      "Do not default to black or neutral tones unless explicitly specified."
    );
    expect(prompt).toContain("The fabric must appear clean and refined");
    expect(prompt).toContain("No visible side stitching");
    expect(prompt).toContain("No thick edge, dark contour");
    expect(prompt).toContain("Retry correction:");
    expect(prompt).toContain("Negative prompt:");
    expect(prompt).toContain("burlap");
    expect(prompt).not.toContain("coarse");
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });
});
