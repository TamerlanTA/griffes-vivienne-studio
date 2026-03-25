import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

import { generateLabel } from "./nanoBananaService";

const MINIMAL_LOGO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function imageResponse(data: string) {
  return {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data,
              },
            },
          ],
        },
      },
    ],
  };
}

function textResponse(text: string) {
  return { text };
}

describe("nanoBananaService pipeline", () => {
  const originalApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;

  beforeEach(() => {
    process.env.GOOGLE_AI_STUDIO_API_KEY = "test-key";
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    if (originalApiKey) {
      process.env.GOOGLE_AI_STUDIO_API_KEY = originalApiKey;
    } else {
      delete process.env.GOOGLE_AI_STUDIO_API_KEY;
    }
  });

  it("uses the HD Cotton two-stage pipeline before validation", async () => {
    mockGenerateContent
      .mockResolvedValueOnce(imageResponse("hd-base-image"))
      .mockResolvedValueOnce(imageResponse("hd-stage-b-image"))
      .mockResolvedValueOnce(textResponse("PASS | woven motif looks correct"));

    const result = await generateLabel({
      logoBase64: MINIMAL_LOGO_BASE64,
      textureType: "hdcoton",
      mode: "preview",
    });

    expect(result.success).toBe(true);
    expect(result.imageBase64).toBe("hd-stage-b-image");
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);

    const stageABody = mockGenerateContent.mock.calls[0]?.[0];
    const stageAParts = stageABody.contents.parts as Array<{ text?: string }>;
    expect(stageAParts[0]?.text).toContain("STAGE A - HD COTTON BASE:");
    expect(
      stageAParts.some(part =>
        part.text?.includes("REFERENCE MATERIAL IMAGES:")
      )
    ).toBe(true);
    expect(
      stageAParts.some(part => part.text?.includes("SUPPLIED LOGO ARTWORK:"))
    ).toBe(false);

    const stageBBody = mockGenerateContent.mock.calls[1]?.[0];
    const stageBParts = stageBBody.contents.parts as Array<{
      text?: string;
      inlineData?: { data?: string };
    }>;
    expect(stageBParts[0]?.text).toContain(
      "STAGE B - HD COTTON MOTIF REFINEMENT:"
    );
    expect(
      stageBParts.some(part => part.text?.includes("LOCKED STAGE A BASE IMAGE:"))
    ).toBe(true);
    expect(
      stageBParts.some(part => part.text?.includes("SUPPLIED LOGO ARTWORK:"))
    ).toBe(true);
    expect(
      stageBParts.some(part => part.inlineData?.data === "hd-base-image")
    ).toBe(true);

    const validationBody = mockGenerateContent.mock.calls[2]?.[0];
    expect(validationBody.config.responseMimeType).toBe("text/plain");
  });

  it("keeps non-HD-Cotton materials on the existing single-pass path", async () => {
    mockGenerateContent
      .mockResolvedValueOnce(imageResponse("satin-image"))
      .mockResolvedValueOnce(textResponse("PASS | satin looks woven"));

    const result = await generateLabel({
      logoBase64: MINIMAL_LOGO_BASE64,
      textureType: "satin",
      mode: "preview",
    });

    expect(result.success).toBe(true);
    expect(result.imageBase64).toBe("satin-image");
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    const generationBody = mockGenerateContent.mock.calls[0]?.[0];
    const generationParts = generationBody.contents.parts as Array<{
      text?: string;
    }>;
    expect(generationParts[0]?.text).not.toContain("STAGE A - HD COTTON BASE:");
    expect(generationParts[0]?.text).not.toContain(
      "STAGE B - HD COTTON MOTIF REFINEMENT:"
    );
  });

  it("falls back to the legacy HD Cotton single-pass generation if Stage B throws", async () => {
    mockGenerateContent
      .mockResolvedValueOnce(imageResponse("hd-base-image"))
      .mockRejectedValueOnce(new Error("motif refinement failed"))
      .mockRejectedValueOnce(new Error("motif refinement failed"))
      .mockRejectedValueOnce(new Error("motif refinement failed"))
      .mockResolvedValueOnce(imageResponse("hd-fallback-image"))
      .mockResolvedValueOnce(textResponse("PASS | fallback is acceptable"));

    const result = await generateLabel({
      logoBase64: MINIMAL_LOGO_BASE64,
      textureType: "hdcoton",
      mode: "preview",
    });

    expect(result.success).toBe(true);
    expect(result.imageBase64).toBe("hd-fallback-image");
    expect(mockGenerateContent).toHaveBeenCalledTimes(6);

    const fallbackBody = mockGenerateContent.mock.calls[4]?.[0];
    const fallbackParts = fallbackBody.contents.parts as Array<{ text?: string }>;
    expect(fallbackParts[0]?.text).toContain("WOVEN MOTIF:");
    expect(fallbackParts[0]?.text).not.toContain(
      "STAGE B - HD COTTON MOTIF REFINEMENT:"
    );
  });
});
