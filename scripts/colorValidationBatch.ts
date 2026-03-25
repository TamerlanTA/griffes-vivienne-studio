/**
 * Color Validation Batch — Milestone 2
 *
 * Runs the controlled 16-combination matrix:
 *   4 materials × 4 color combos, fixed size + logo + framing.
 *
 * Usage:
 *   pnpm run color:validate                       # run all 16
 *   pnpm run color:validate -- --skip-existing    # skip already generated
 *
 * Output:  tmp/color-validation/
 * Files:   {MATERIAL}_{BACKGROUND}_{LOGO}_{SIZE}.png
 * Report:  tmp/color-validation/REPORT.md
 */

import "dotenv/config";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { generateLabel } from "../server/nanoBananaService";
import type { LabelConfigInput } from "../server/label/types";

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE = "50x20";
const MODE = "preview" as const;
const LOGO_TYPE = "SYMBOL_AND_TEXT" as const;
const OUT_DIR = "tmp/color-validation";

// ── Test matrix ──────────────────────────────────────────────────────────────

type Combo = {
  material: "HD" | "COTTON" | "SATIN" | "TAFFETA";
  backgroundColor: string;
  logoColor: string;
};

const MATRIX: Combo[] = [
  // HD
  { material: "HD", backgroundColor: "BEIGE", logoColor: "BLACK" },
  { material: "HD", backgroundColor: "CREAM", logoColor: "BLACK" },
  { material: "HD", backgroundColor: "OFF_WHITE", logoColor: "BLACK" },
  { material: "HD", backgroundColor: "BEIGE", logoColor: "DARK_BLUE" },
  // HD Cotton
  { material: "COTTON", backgroundColor: "BEIGE", logoColor: "BLACK" },
  { material: "COTTON", backgroundColor: "LIGHT_BEIGE", logoColor: "BLACK" },
  { material: "COTTON", backgroundColor: "CREAM", logoColor: "BLACK" },
  { material: "COTTON", backgroundColor: "BEIGE", logoColor: "DARK_BLUE" },
  // Satin
  { material: "SATIN", backgroundColor: "CREAM", logoColor: "BLACK" },
  { material: "SATIN", backgroundColor: "OFF_WHITE", logoColor: "BLACK" },
  { material: "SATIN", backgroundColor: "WHITE", logoColor: "BLACK" },
  { material: "SATIN", backgroundColor: "CREAM", logoColor: "DARK_BLUE" },
  // Taffeta
  { material: "TAFFETA", backgroundColor: "BEIGE", logoColor: "BLACK" },
  { material: "TAFFETA", backgroundColor: "LIGHT_BEIGE", logoColor: "BLACK" },
  { material: "TAFFETA", backgroundColor: "CREAM", logoColor: "BLACK" },
  { material: "TAFFETA", backgroundColor: "BEIGE", logoColor: "DARK_BLUE" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slug(combo: Combo): string {
  return `${combo.material}_${combo.backgroundColor}_${combo.logoColor}_${SIZE}`;
}

function resolveMimeType(
  filePath: string
): "image/png" | "image/jpeg" | "image/webp" {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function loadLogo(logoPath: string): Promise<{
  base64: string;
  mime: "image/png" | "image/jpeg" | "image/webp";
}> {
  const abs = resolve(process.cwd(), logoPath);
  const buf = await readFile(abs);
  return { base64: buf.toString("base64"), mime: resolveMimeType(abs) };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ── Report builder ────────────────────────────────────────────────────────────

type ReportRow = {
  material: string;
  backgroundColor: string;
  logoColor: string;
  file: string;
  seed: number | undefined;
  generationStatus: "OK" | "SKIPPED" | "FAILED";
  error?: string;
};

function buildReport(rows: ReportRow[], runDate: string): string {
  const generated = rows.filter(r => r.generationStatus === "OK").length;
  const skipped = rows.filter(r => r.generationStatus === "SKIPPED").length;
  const failed = rows.filter(r => r.generationStatus === "FAILED").length;

  const header = [
    `# Color Validation Report — Milestone 2`,
    ``,
    `**Run date:** ${runDate}  `,
    `**Size:** ${SIZE}  `,
    `**Mode:** ${MODE}  `,
    `**Logo type:** ${LOGO_TYPE}  `,
    `**Total combinations:** ${rows.length}  `,
    ``,
    `> Visual assessment columns (color accuracy, material fidelity, logo readability,`,
    `> realism preserved, status, notes) require human review.`,
    `> Fill these in after inspecting the output images in \`${OUT_DIR}/\`.`,
    ``,
    `## Results`,
    ``,
    `| # | material | backgroundColor | logoColor | file | generation | color accuracy | material fidelity | logo readability | realism | status | notes |`,
    `|---|----------|-----------------|-----------|------|------------|----------------|-------------------|-----------------|---------|--------|-------|`,
  ].join("\n");

  const body = rows
    .map((r, i) => {
      const gen =
        r.generationStatus === "OK"
          ? "✅"
          : r.generationStatus === "SKIPPED"
            ? "⏭ skipped"
            : `❌ ${r.error ?? ""}`;
      const file =
        r.generationStatus !== "FAILED" ? `\`${r.file}\`` : "—";
      return (
        `| ${i + 1} ` +
        `| ${r.material} ` +
        `| ${r.backgroundColor} ` +
        `| ${r.logoColor} ` +
        `| ${file} ` +
        `| ${gen} ` +
        `| PENDING ` +
        `| PENDING ` +
        `| PENDING ` +
        `| PENDING ` +
        `| PENDING ` +
        `| — |`
      );
    })
    .join("\n");

  const summary = [
    ``,
    `## Generation Summary`,
    ``,
    `| result | count |`,
    `|--------|-------|`,
    `| ✅ generated | ${generated} |`,
    `| ⏭ skipped (existing) | ${skipped} |`,
    `| ❌ failed | ${failed} |`,
    ``,
    `## Seeds (for reproducibility)`,
    ``,
    `| file | seed |`,
    `|------|------|`,
    ...rows
      .filter(r => r.seed !== undefined)
      .map(r => `| \`${r.file}\` | \`${r.seed}\` |`),
    ``,
    `## Status legend`,
    ``,
    `| status | meaning |`,
    `|--------|---------|`,
    `| PASS | Background correct, material reads true, logo clean and readable |`,
    `| SOFT FAIL | Minor drift — usable but worth a retry or note |`,
    `| HARD FAIL | Wrong material feel, wrong color, or logo broken |`,
  ].join("\n");

  return [header, body, summary].join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const logoArg =
    args.find(a => !a.startsWith("--")) ?? "/Users/tamerlan/Downloads/logo.jpg";
  const skipExisting = args.includes("--skip-existing");

  const outDir = resolve(process.cwd(), OUT_DIR);
  const runDate = new Date().toISOString().replace("T", " ").slice(0, 19);

  console.log(`[colorValidationBatch] Logo:          ${logoArg}`);
  console.log(`[colorValidationBatch] Out dir:       ${outDir}`);
  console.log(`[colorValidationBatch] Matrix:        ${MATRIX.length} combinations`);
  console.log(`[colorValidationBatch] Mode:          ${MODE}`);
  console.log(`[colorValidationBatch] Skip existing: ${skipExisting}`);
  console.log(`[colorValidationBatch] API key:       ${process.env.GOOGLE_AI_STUDIO_API_KEY ? "✅ loaded" : "❌ missing"}`);
  console.log();

  const { base64: logoBase64, mime: logoMimeType } = await loadLogo(logoArg);
  await mkdir(outDir, { recursive: true });

  const rows: ReportRow[] = [];

  for (const [idx, combo] of MATRIX.entries()) {
    const name = slug(combo);
    const filePath = resolve(outDir, `${name}.png`);

    if (skipExisting && (await fileExists(filePath))) {
      console.log(
        `[colorValidationBatch] [${idx + 1}/${MATRIX.length}] ⏭  ${name} (exists, skipped)`
      );
      rows.push({
        material: combo.material,
        backgroundColor: combo.backgroundColor,
        logoColor: combo.logoColor,
        file: `${name}.png`,
        seed: undefined,
        generationStatus: "SKIPPED",
      });
      continue;
    }

    console.log(
      `[colorValidationBatch] [${idx + 1}/${MATRIX.length}] ▶  ${name}`
    );

    const config: LabelConfigInput = {
      material: combo.material,
      backgroundColor: combo.backgroundColor,
      logoColor: combo.logoColor,
      logoType: LOGO_TYPE,
      size: SIZE,
    };

    const result = await generateLabel({
      logoBase64,
      logoMimeType,
      mode: MODE,
      config,
    });

    if (!result.success || !result.imageBase64) {
      console.warn(`  ❌ Failed: ${result.error}`);
      rows.push({
        material: combo.material,
        backgroundColor: combo.backgroundColor,
        logoColor: combo.logoColor,
        file: `${name}.png`,
        seed: result.seed,
        generationStatus: "FAILED",
        error: result.error,
      });
      continue;
    }

    await writeFile(filePath, Buffer.from(result.imageBase64, "base64"));
    console.log(`  ✅ Saved: ${filePath}`);

    rows.push({
      material: combo.material,
      backgroundColor: combo.backgroundColor,
      logoColor: combo.logoColor,
      file: `${name}.png`,
      seed: result.seed,
      generationStatus: "OK",
    });
  }

  const reportPath = resolve(outDir, "REPORT.md");
  await writeFile(reportPath, buildReport(rows, runDate));
  console.log();
  console.log(`[colorValidationBatch] Report: ${reportPath}`);

  const failed = rows.filter(r => r.generationStatus === "FAILED").length;
  const ok = rows.filter(r => r.generationStatus === "OK").length;
  const skipped = rows.filter(r => r.generationStatus === "SKIPPED").length;
  console.log(
    `[colorValidationBatch] Done: ${ok} generated, ${skipped} skipped, ${failed} failed`
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[colorValidationBatch] Fatal: ${msg}`);
  process.exitCode = 1;
});
