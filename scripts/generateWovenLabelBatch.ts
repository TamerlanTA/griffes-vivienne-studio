import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import {
  buildProductionBatchVariations,
  type LabelMaterial,
} from "../server/label";
import { generateLabel } from "../server/nanoBananaService";

type ScriptOptions = {
  fallbackLogoPath?: string;
  symbolLogoPath?: string;
  textLogoPath?: string;
  comboLogoPath?: string;
  outDir: string;
  mode: "preview" | "final";
  materials: LabelMaterial[];
  maxItems?: number;
};

type LogoTypeKey = "SYMBOL_ONLY" | "TEXT_ONLY" | "SYMBOL_AND_TEXT";

type LoadedLogos = Record<LogoTypeKey, string>;

function parseArgs(argv: readonly string[]): ScriptOptions {
  const options: ScriptOptions = {
    outDir: "tmp/woven-label-batch",
    mode: "preview",
    materials: ["COTTON", "TAFFETA"],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--logo" && next) {
      options.fallbackLogoPath = next;
      index += 1;
      continue;
    }

    if (current === "--symbol-logo" && next) {
      options.symbolLogoPath = next;
      index += 1;
      continue;
    }

    if (current === "--text-logo" && next) {
      options.textLogoPath = next;
      index += 1;
      continue;
    }

    if (current === "--combo-logo" && next) {
      options.comboLogoPath = next;
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

    if (current === "--materials" && next) {
      const parsedMaterials = next
        .split(",")
        .map(value => value.trim().toUpperCase())
        .filter((value): value is LabelMaterial =>
          ["HD", "COTTON", "SATIN", "TAFFETA"].includes(value)
        );

      if (parsedMaterials.length > 0) {
        options.materials = parsedMaterials;
      }

      index += 1;
      continue;
    }

    if (current === "--max" && next) {
      const parsedMax = Number(next);
      if (Number.isFinite(parsedMax) && parsedMax > 0) {
        options.maxItems = parsedMax;
      }

      index += 1;
      continue;
    }

    if (current === "--help") {
      console.log(
        [
          "Usage: pnpm tsx scripts/generateWovenLabelBatch.ts [options]",
          "",
          "Required input:",
          "  Provide --logo for one shared PNG logo, or provide one or more of:",
          "  --symbol-logo, --text-logo, --combo-logo",
          "",
          "Options:",
          "  --out <dir>              Output directory (default: tmp/woven-label-batch)",
          "  --mode <preview|final>   Generation mode (default: preview)",
          "  --materials <csv>        Materials to generate (default: COTTON,TAFFETA)",
          "  --max <n>                Limit the number of generated variations",
          "",
          "Examples:",
          "  pnpm tsx scripts/generateWovenLabelBatch.ts --logo assets/logo.png",
          "  pnpm tsx scripts/generateWovenLabelBatch.ts --symbol-logo assets/icon.png --text-logo assets/wordmark.png --combo-logo assets/lockup.png --mode final",
        ].join("\n")
      );
      process.exit(0);
    }
  }

  return options;
}

async function loadPngBase64(path: string): Promise<string> {
  const absolutePath = resolve(process.cwd(), path);
  if (extname(absolutePath).toLowerCase() !== ".png") {
    throw new Error(`Only PNG logo assets are supported: ${path}`);
  }

  const buffer = await readFile(absolutePath);
  return buffer.toString("base64");
}

async function loadLogos(options: ScriptOptions): Promise<LoadedLogos> {
  const sharedLogo = options.fallbackLogoPath
    ? await loadPngBase64(options.fallbackLogoPath)
    : undefined;

  const symbolLogo = options.symbolLogoPath
    ? await loadPngBase64(options.symbolLogoPath)
    : sharedLogo;
  const textLogo = options.textLogoPath
    ? await loadPngBase64(options.textLogoPath)
    : sharedLogo;
  const comboLogo = options.comboLogoPath
    ? await loadPngBase64(options.comboLogoPath)
    : sharedLogo;

  if (!symbolLogo || !textLogo || !comboLogo) {
    throw new Error(
      "Provide --logo for one shared PNG asset, or provide PNG assets for --symbol-logo, --text-logo, and --combo-logo."
    );
  }

  return {
    SYMBOL_ONLY: symbolLogo,
    TEXT_ONLY: textLogo,
    SYMBOL_AND_TEXT: comboLogo,
  };
}

function selectLogoForVariation(
  logos: LoadedLogos,
  logoType: LogoTypeKey
): string {
  return logos[logoType];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const outputDirectory = resolve(process.cwd(), options.outDir);
  const logos = await loadLogos(options);
  const variations = buildProductionBatchVariations(options.materials);
  const selectedVariations =
    typeof options.maxItems === "number"
      ? variations.slice(0, options.maxItems)
      : variations;

  const manifest: Array<{
    slug: string;
    description: string;
    material: LabelMaterial;
    backgroundColor: string;
    logoColor: string;
    logoType: LogoTypeKey;
    size: string;
    mode: ScriptOptions["mode"];
    labelCode?: string;
    seed?: number;
    outputPath?: string;
    success: boolean;
    error?: string;
  }> = [];

  await mkdir(outputDirectory, { recursive: true });

  for (const variation of selectedVariations) {
    console.log(`[generateWovenLabelBatch] Generating ${variation.slug}...`);

    const logoBase64 = selectLogoForVariation(logos, variation.logoType);
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
        material: variation.material,
        backgroundColor: variation.backgroundColor,
        logoColor: variation.logoColor,
        logoType: variation.logoType,
        size: variation.size,
        mode: options.mode,
        labelCode: result.labelCode,
        seed: result.seed,
        success: false,
        error: result.error ?? "Unknown generation failure",
      });
      console.warn(`[generateWovenLabelBatch] Failed: ${variation.slug}`);
      continue;
    }

    await writeFile(outputPath, Buffer.from(result.imageBase64, "base64"));

    manifest.push({
      slug: variation.slug,
      description: variation.description,
      material: variation.material,
      backgroundColor: variation.backgroundColor,
      logoColor: variation.logoColor,
      logoType: variation.logoType,
      size: variation.size,
      mode: options.mode,
      labelCode: result.labelCode,
      seed: result.seed,
      outputPath,
      success: true,
    });

    console.log(`[generateWovenLabelBatch] Wrote ${outputPath}`);
  }

  const manifestPath = resolve(outputDirectory, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[generateWovenLabelBatch] Wrote ${manifestPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[generateWovenLabelBatch] ${message}`);
  process.exitCode = 1;
});
