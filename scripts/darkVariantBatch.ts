/**
 * Dark Variant Validation Batch — Milestone 2
 *
 * Runs 6 controlled dark-colorway combinations:
 *   HD   × BLACK/WHITE, NAVY/WHITE, NAVY/GOLD
 *   TAFFETA × BLACK/WHITE, NAVY/WHITE, NAVY/GOLD
 *
 * Output:  tmp/dark-variant-validation/
 * Files:   {material}_{background}_{logo}_50x20.png  (lowercase)
 * Report:  tmp/dark-variant-validation/REPORT.md
 */

import "dotenv/config";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { generateLabel } from "../server/nanoBananaService";
import type { LabelConfigInput } from "../server/label/types";

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE = "50x20";
const MODE = "preview" as const;
const LOGO_TYPE = "SYMBOL_AND_TEXT" as const;
const OUT_DIR = "tmp/dark-variant-validation";

// ── Test matrix ──────────────────────────────────────────────────────────────

type Combo = {
  material: "HD" | "TAFFETA";
  backgroundColor: string;
  logoColor: string;
};

const MATRIX: Combo[] = [
  // HD dark variants
  { material: "HD", backgroundColor: "BLACK", logoColor: "WHITE" },
  { material: "HD", backgroundColor: "NAVY", logoColor: "WHITE" },
  { material: "HD", backgroundColor: "NAVY", logoColor: "GOLD" },
  // Taffeta dark variants
  { material: "TAFFETA", backgroundColor: "BLACK", logoColor: "WHITE" },
  { material: "TAFFETA", backgroundColor: "NAVY", logoColor: "WHITE" },
  { material: "TAFFETA", backgroundColor: "NAVY", logoColor: "GOLD" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slug(combo: Combo): string {
  return `${combo.material.toLowerCase()}_${combo.backgroundColor.toLowerCase()}_${combo.logoColor.toLowerCase()}_${SIZE}`;
}

function mimeType(
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
  return { base64: buf.toString("base64"), mime: mimeType(abs) };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
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
  const header = [
    `# Dark Variant Validation Report — Milestone 2`,
    ``,
    `**Run date:** ${runDate}  `,
    `**Size:** ${SIZE}  `,
    `**Mode:** ${MODE}  `,
    `**Logo type:** ${LOGO_TYPE}  `,
    `**Total combinations:** ${rows.length}  `,
    ``,
    `> Visual assessment columns require human review.`,
    `> Fill these in after inspecting the output images in \`${OUT_DIR}/\`.`,
    ``,
    `## Results`,
    ``,
    `| # | material | backgroundColor | logoColor | file | generation | color accuracy | material fidelity | logo readability | realism preserved | status | notes |`,
    `|---|----------|-----------------|-----------|------|------------|----------------|-------------------|------------------|-------------------|--------|-------|`,
  ].join("\n");

  const body = rows
    .map((r, i) => {
      const gen =
        r.generationStatus === "OK"
          ? "✅"
          : r.generationStatus === "SKIPPED"
            ? "⏭️ skipped"
            : `❌ ${r.error ?? ""}`;
      const file =
        r.generationStatus === "OK" || r.generationStatus === "SKIPPED"
          ? `\`${r.file}\``
          : "—";
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
    `| ✅ generated | ${rows.filter(r => r.generationStatus === "OK").length} |`,
    `| ⏭️ skipped (existing) | ${rows.filter(r => r.generationStatus === "SKIPPED").length} |`,
    `| ❌ failed | ${rows.filter(r => r.generationStatus === "FAILED").length} |`,
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
  const logoArg = args.find(a => !a.startsWith("--")) ?? "/Users/tamerlan/Downloads/logo.jpg";
  const skipExisting = args.includes("--skip-existing");

  const outDir = resolve(process.cwd(), OUT_DIR);
  const runDate = new Date().toISOString().replace("T", " ").slice(0, 19);

  console.log(`[darkVariantBatch] Logo:         ${logoArg}`);
  console.log(`[darkVariantBatch] Out dir:      ${outDir}`);
  console.log(`[darkVariantBatch] Matrix:       ${MATRIX.length} combinations`);
  console.log(`[darkVariantBatch] Mode:         ${MODE}`);
  console.log(`[darkVariantBatch] Skip existing: ${skipExisting}`);
  console.log();

  const { base64: logoBase64, mime: logoMimeType } = await loadLogo(logoArg);
  await mkdir(outDir, { recursive: true });

  const rows: ReportRow[] = [];
  let skipped = 0;
  let ok = 0;
  let failed = 0;

  for (const [idx, combo] of MATRIX.entries()) {
    const name = slug(combo);
    const filePath = resolve(outDir, `${name}.png`);

    console.log(
      `[darkVariantBatch] [${idx + 1}/${MATRIX.length}] ${name}`
    );

    if (skipExisting && (await fileExists(filePath))) {
      console.log(`  ⏭️  Skipped (exists)`);
      skipped++;
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
      failed++;
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
    ok++;

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
  console.log(`[darkVariantBatch] Report: ${reportPath}`);
  console.log(`[darkVariantBatch] Done: ${ok} generated, ${skipped} skipped, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[darkVariantBatch] Fatal: ${msg}`);
  process.exitCode = 1;
});
