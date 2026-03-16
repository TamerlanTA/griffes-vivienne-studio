import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { generateLabel } from "../server/nanoBananaService";
import type { GenerationConfig } from "../server/types/generationConfig";

const DEFAULT_LOGO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

type ScriptOptions = {
  logoPath?: string;
  outDir: string;
  mode: "preview" | "final";
};

type ColorVariation = {
  slug: string;
  description: string;
  config: GenerationConfig;
};

const COLOR_VARIATIONS: readonly ColorVariation[] = [
  {
    slug: "hd-black-background",
    description: "HD woven label with a black label field for dark-background stability checks.",
    config: {
      material: "HD",
      color: "black",
      size: "50x20",
      weave: "DAMASK_HD",
      density: 2,
      threadAngle: 0,
      glossLevel: 0.2,
    },
  },
  {
    slug: "hd-white-background",
    description: "HD woven label with a white label field for bright-background stability checks.",
    config: {
      material: "HD",
      color: "white",
      size: "50x20",
      weave: "DAMASK_HD",
      density: 2,
      threadAngle: 0,
      glossLevel: 0.2,
    },
  },
  {
    slug: "hd-blue-background",
    description: "HD woven label with a blue label field to stress-test non-neutral color stability through the existing generation path.",
    config: {
      material: "HD",
      color: "blue",
      size: "50x20",
      weave: "DAMASK_HD",
      density: 2,
      threadAngle: 0,
      glossLevel: 0.2,
    },
  },
] as const;

function parseArgs(argv: readonly string[]): ScriptOptions {
  const options: ScriptOptions = {
    outDir: "tmp/color-variations",
    mode: "preview",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--logo" && next) {
      options.logoPath = next;
      index += 1;
      continue;
    }

    if (current === "--out" && next) {
      options.outDir = next;
      index += 1;
      continue;
    }

    if (current === "--mode" && (next === "preview" || next === "final")) {
      options.mode = next;
      index += 1;
      continue;
    }

    if (current === "--help") {
      console.log(
        [
          "Usage: pnpm tsx scripts/testColorVariations.ts [--logo path] [--out dir] [--mode preview|final]",
          "",
          "Generates a small HD color-variation set using the existing nanoBanana pipeline.",
        ].join("\n")
      );
      process.exit(0);
    }
  }

  return options;
}

async function loadLogoBase64(logoPath?: string): Promise<string> {
  if (!logoPath) {
    return DEFAULT_LOGO_BASE64;
  }

  const absolutePath = resolve(process.cwd(), logoPath);
  const extension = extname(absolutePath).toLowerCase();

  if (extension !== ".png") {
    throw new Error("Only PNG logos are supported by this helper script.");
  }

  const fileBuffer = await readFile(absolutePath);
  return fileBuffer.toString("base64");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const outputDirectory = resolve(process.cwd(), options.outDir);
  const logoBase64 = await loadLogoBase64(options.logoPath);
  const manifest: Array<{
    slug: string;
    description: string;
    mode: ScriptOptions["mode"];
    labelCode?: string;
    seed?: number;
    outputPath?: string;
    success: boolean;
    error?: string;
  }> = [];

  await mkdir(outputDirectory, { recursive: true });

  for (const variation of COLOR_VARIATIONS) {
    console.log(`[testColorVariations] Generating ${variation.slug}...`);

    const result = await generateLabel({
      logoBase64,
      mode: options.mode,
      config: variation.config,
    });

    const outputPath = resolve(outputDirectory, `${variation.slug}.png`);

    if (!result.success || !result.imageBase64) {
      manifest.push({
        slug: variation.slug,
        description: variation.description,
        mode: options.mode,
        labelCode: result.labelCode,
        seed: result.seed,
        success: false,
        error: result.error ?? "Unknown generation failure",
      });
      console.warn(`[testColorVariations] Failed: ${variation.slug}`);
      continue;
    }

    await writeFile(outputPath, Buffer.from(result.imageBase64, "base64"));

    manifest.push({
      slug: variation.slug,
      description: variation.description,
      mode: options.mode,
      labelCode: result.labelCode,
      seed: result.seed,
      outputPath,
      success: true,
    });

    console.log(`[testColorVariations] Wrote ${outputPath}`);
  }

  const manifestPath = resolve(outputDirectory, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[testColorVariations] Wrote ${manifestPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[testColorVariations] ${message}`);
  process.exitCode = 1;
});
