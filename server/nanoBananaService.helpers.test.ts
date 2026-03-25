import { describe, expect, it } from "vitest";
import { buildLabelConfig } from "./label";
import {
  assertValidPrompt,
  assertValidGenerationPrompt,
  buildApiPrompt,
  buildHdMotifRefinementPrompt,
  buildHdCottonBasePrompt,
  buildHdCottonMotifRefinementPrompt,
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
    expect(prompt.length).toBe(2118);
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
      "Label edge finish: Edges must be realistic woven selvedges"
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
      "A high-resolution studio photograph of a premium woven cotton clothing label produced on a jacquard loom, with a high-density micro-weave."
    );
    expect(prompt).toContain("Target logo threads: BLACK");
    expect(prompt).toContain("Target label format: long horizontal (50x20)");
    expect(prompt).toContain(
      "Texture: fine woven cotton structure with a visible natural diagonal twill"
    );
    expect(prompt).toContain("bright, even, high-key studio lighting");
    expect(prompt).toContain("No visible side stitching");
    expect(prompt).toContain("jacquard-selected woven layer");
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

    expect(prompt.length).toBeLessThanOrEqual(3600);
    expect(prompt).toContain("COMPOSITION:");
    expect(prompt).toContain("COTTON BACKGROUND:");
    expect(prompt).toContain("WOVEN MOTIF:");
    expect(prompt).toContain("EDGE FINISH:");
    expect(prompt).toContain("Warm light beige / natural ecru woven cotton clothing label.");
    expect(prompt).toContain(
      "Soft matte factory-made cotton surface with subtle woven face, gentle natural yarn presence, and fine visible diagonal woven direction in the ground fabric."
    );
    expect(prompt).toContain("Match the approved cotton reference background family first");
    expect(prompt).toContain(
      "distinct motif layer"
    );
    expect(prompt).toContain(
      "Ultra-narrow woven cotton selvedge on the top and bottom only."
    );
    expect(prompt).toContain(
      "Match the approved cotton reference background first. Preserve the same cotton tone, surface softness, lighting family, and edge construction. Only allow controlled variation inside the logo and text weave."
    );
    expect(prompt).toContain("Motif thread target stays dark navy blue woven threads.");
    expect(prompt).toContain("tighter, finer, denser thread behavior than the softer background cloth.");
    expect(prompt).toContain("true woven motif layer rather than a uniform black surface merged into the same fabric.");
    expect(prompt).toContain(
      "If text is present, each letter must look like real woven lettering built from tiny thread cells inside the same textile grid"
    );
    expect(prompt).toContain(
      "Letter strokes must stay flush with the label plane and show visible woven structure"
    );
    expect(prompt).toContain(
      "Letter edges must look slightly stepped and textile-real at macro scale"
    );
    expect(prompt).toContain("Retry correction: The previous attempt looked embroidered.");
    expect(prompt).toContain("Avoid heavy twill ridges, ribbon-like diagonal bands");
    expect(prompt).not.toContain("organic cotton twill");
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });

  it("builds a dedicated HD Cotton Stage A base prompt", () => {
    const config = buildLabelConfig({
      material: "COTTON",
      size: "50x20",
    });

    const prompt = buildHdCottonBasePrompt(config, {
      hasReferenceImages: true,
      seed: 1234,
    });

    expect(prompt).toContain("STAGE A - HD COTTON BASE:");
    expect(prompt).toContain("Generate or preserve the HD Cotton base only");
    expect(prompt).toContain("subtle fine diagonal woven direction in the ground fabric");
    expect(prompt).toContain("ultra-subtle selvedge on the top and bottom edges only");
    expect(prompt).toContain("Do not prioritize logo or text refinement in this pass");
    expect(prompt).toContain("fixed light natural wood surface");
    expect(prompt).toContain(
      "Use the approved cotton reference background as the locked Stage A anchor"
    );
  });

  it("builds a dedicated HD Cotton Stage B motif refinement prompt", () => {
    const config = buildLabelConfig({
      material: "COTTON",
      size: "50x20",
      logoType: "TEXT_ONLY",
    });

    const prompt = buildHdCottonMotifRefinementPrompt(config, {
      hasReferenceImages: true,
      seed: 1234,
    });

    expect(prompt).toContain("STAGE B - HD COTTON MOTIF REFINEMENT:");
    expect(prompt).toContain("The supplied Stage A image is the locked HD Cotton base anchor.");
    expect(prompt).toContain("Preserve the background exactly");
    expect(prompt).toContain("preserving the approved Stage A base fabric family exactly");
    expect(prompt).toContain("Do not reinterpret the whole fabric, change the label proportions, drift the wood background, or weaken the diagonal ground weave.");
    expect(prompt).toContain("Refine only the logo and text woven integration");
    expect(prompt).toContain("distinct woven motif layer");
    expect(prompt).toContain("tighter, denser, finer thread behavior than the softer background ground");
    expect(prompt).toContain("Motif threads must read tighter, denser, more compact, slightly finer");
    expect(prompt).toContain("Internal woven thread logic and yarn grain must remain visible inside the black motif shapes");
    expect(prompt).toContain(
      "The black motif must remain clearly black but must not read as a flat solid fill"
    );
    expect(prompt).toContain(
      "No flat black fill, no uniform dark shape, no solid black graphic surface, no printed logo"
    );
  });

  it("builds a dedicated HD motif refinement prompt that preserves the approved HD base", () => {
    const config = buildLabelConfig({
      material: "HD",
      size: "50x20",
      logoType: "TEXT_ONLY",
    });

    const prompt = buildHdMotifRefinementPrompt(config, {
      hasReferenceImages: true,
      seed: 1234,
    });

    expect(prompt).toContain("HD MOTIF REFINEMENT:");
    expect(prompt).toContain("The approved HD reference is the locked base anchor.");
    expect(prompt).toContain("Preserve the full HD base exactly");
    expect(prompt).toContain(
      "Preserve the full HD base exactly: polished white onyx / light marble support surface, approved HD texture family, weave density, surface sharpness, scene, lighting, framing, label placement, composition, and margins."
    );
    expect(prompt).toContain(
      "Preserve the approved HD label fabric tone exactly: light warm ivory / pale beige / off-white, slightly warm, clearly distinct from the brighter cooler marble background. The label must never become pure white."
    );
    expect(prompt).toContain(
      "Keep the marble background as the support surface only. The label fabric stays in the approved warm ivory / light beige HD textile family and must not shift toward pure white or tonally merge into the marble."
    );
    expect(prompt).toContain(
      "Preserve the approved HD base identity exactly: clean, controlled, sharp, refined, dense, premium woven HD look."
    );
    expect(prompt).toContain(
      "Preserve the HD base exactly. Refine only the logo and text so they display slightly tighter, denser, cleaner woven thread behavior than the background, with visible internal thread logic inside the black shapes. The motif must remain clearly black but never read as a smooth uniform fill."
    );
    expect(prompt).toContain(
      "The logo and text must remain visibly constructed from woven threads with internal thread logic inside the black shapes. Do not flatten the motif into a smooth graphic fill."
    );
    expect(prompt).toContain("Refine only the woven behavior inside the logo and text.");
    expect(prompt).toContain(
      "tighter, denser, cleaner thread behavior than the approved background surface"
    );
    expect(prompt).toContain(
      "Internal woven thread logic must remain visible inside the black motif shapes"
    );
    expect(prompt).toContain(
      "must not read as a flat solid fill"
    );
    expect(prompt).toContain(
      "Text must feel woven, not merely clean black lettering"
    );
    expect(prompt).toContain(
      "make motif edges slightly cleaner and more controlled through tighter thread alignment and cleaner thread transitions"
    );
    expect(prompt).toContain(
      "slightly tighter black thread packing"
    );
    expect(prompt).toContain(
      "do not introduce cotton-like texture drift"
    );
    expect(prompt).toContain(
      "No green cutting mat, no cutting mat, no self-healing mat, no workshop surface"
    );
    expect(prompt).toContain(
      "No pure white label, no optical white"
    );
    expect(prompt).toContain(
      "never read as a smooth uniform fill"
    );
    expect(prompt).toContain(
      "reduced fuzzy black grain"
    );
  });

  it("routes HD API prompting through the HD motif refinement instructions", () => {
    const config = buildLabelConfig({
      material: "HD",
      size: "50x20",
    });

    const prompt = buildApiPrompt(config, {
      hasReferenceImages: true,
      seed: 4321,
    });

    expect(prompt).toContain("HD MOTIF REFINEMENT:");
    expect(prompt).toContain("Preserve the full HD base exactly");
    expect(prompt).toContain("polished white onyx / light marble support surface");
    expect(prompt).toContain("light warm ivory / pale beige / off-white");
    expect(prompt).toContain("must not shift toward pure white");
    expect(prompt).toContain("Refine only the woven behavior inside the logo and text.");
    expect(prompt).toContain("Text must feel woven, not merely clean black lettering");
    expect(prompt).toContain("Do not flatten the motif into a smooth graphic fill.");
    expect(prompt).toContain("make motif edges slightly cleaner and more controlled");
    expect(prompt).toContain("tighter, denser, cleaner thread behavior than the approved background surface");
  });

  it("builds a taffeta API prompt that stays thin dense regular and non-cotton-like", () => {
    const config = buildLabelConfig({
      material: "TAFFETA",
      size: "50x20",
      logoType: "TEXT_ONLY",
    });

    const prompt = buildApiPrompt(config, {
      hasReferenceImages: true,
      seed: 2468,
    });

    expect(prompt).toContain(
      "Fine dense woven taffeta clothing label"
    );
    expect(prompt).toContain(
      "slightly warm neutral beige / light ivory"
    );
    expect(prompt).toContain(
      "cleaner, flatter, and slightly crisper than cotton"
    );
    expect(prompt).toContain("subtle natural woven realism");
    expect(prompt).toContain(
      "never soft, fuzzy, porous, canvas-like"
    );
    expect(prompt).toContain(
      "Preserve the approved neutral paper-like support presentation"
    );
    expect(prompt).toContain(
      "Keep the logo and text woven into the same fine taffeta structure with clean readable black motif detail"
    );
    expect(prompt).toContain(
      "Negative prompt: cotton softness, fuzzy weave, porous surface, canvas look"
    );
    expect(prompt).toContain("thick fabric strip");
    expect(prompt).toContain("satin gloss drift, hd embossed drift");
  });
});
