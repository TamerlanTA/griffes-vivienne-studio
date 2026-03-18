import type { LabelMaterial, TexturePreset } from "./types";

export const TEXTURE_PRESETS_BY_MATERIAL: Record<LabelMaterial, TexturePreset> =
  {
    HD: {
      material: "HD",
      title: "HD (High Definition)",
      legacyTextureType: "hd",
      weaveType: "DAMASK_HD",
      gridDensity: 2,
      threadAngle: 0,
      glossLevel: "low",
      promptMaterialDescription:
        "High-density damask woven label with very tight weave control, clean woven transitions, precise thread rendering, flat woven logo integration, and a clean newly manufactured high-definition finish.",
      promptConstraints: [
        "Very tight weave with compact thread spacing and crisp high-density thread definition.",
        "Logo threads stay flat woven, flush with the fabric surface, and never form raised borders.",
        "Boundary threads around the logo must stay the same visual thickness as the interior logo threads, with no dark perimeter ring.",
        "No thick edge, dark contour, or embroidery-like outline should appear around logo shapes.",
        "Fresh newly manufactured textile finish with no fading, wear, or distressed fibers.",
        "Low gloss with controlled matte textile response.",
      ],
      paletteSuggestion: ["#F5F5DC", "#000000", "#FFFFFF"],
      defaultBackgroundGuidance:
        "Keep the woven label base warm cream and neutral, with no garment influence and no vintage or distressed cast.",
      sheenExpected: false,
      referenceHandlingNotes: [
        "Use references only for dense weave behavior, thread spacing, crisp thread integration, and lighting response.",
        "Ignore any garment, seam, framing context, or worn surface marks from the references.",
      ],
      camera: "top-down macro textile photography",
      lighting: "soft studio lighting with controlled shadow falloff",
    },
    COTTON: {
      material: "COTTON",
      title: "HD Cotton",
      legacyTextureType: "hdcoton",
      weaveType: "COTTON_STABLE",
      gridDensity: 1.75,
      threadAngle: 0,
      glossLevel: "low",
      promptMaterialDescription:
        "Premium woven cotton clothing label with high-density industrial jacquard weave, a fine tightly packed micro-weave structure, uniform thread spacing, clean light cotton base, smooth micro-textured surface, woven logo integration, subtle micro-shadow depth, and a true luxury fashion-label finish.",
      promptConstraints: [
        "High-density fine woven cotton structure with very tight thread spacing, uniform micro-weave, and industrial jacquard precision.",
        "The weave must remain micro-scale and tightly packed with no large fibers, no loose threads, and no open-grid textile appearance.",
        "Darker jacquard-woven logo threads must be integrated into the same textile grid with subtle micro-shadows between threads and clean thread-to-thread transitions.",
        "Boundary threads around the logo must stay the same visual thickness as the interior logo threads, with no dark perimeter ring.",
        "No thick edge, dark contour, border stroke, or embroidery-like outline should appear around logo shapes.",
        "The label surface should stay smooth yet micro-textured, flat, clean, and refined, with no printed-cotton look and no raw fabric behavior.",
        "No visible side stitching, no border seams, no folded edges, no decorative stitching, and no stitched borders.",
        "Cotton backgrounds should stay bright, clean, and refined with light variants reading close to off-white and never dirty, aged, or brownish.",
      ],
      paletteSuggestion: ["#F4F1E8", "#2F2F2F", "#223A5E"],
      defaultBackgroundGuidance:
        "Keep the woven cotton base bright, clean, and refined, with light variants reading close to clean off-white and no dirty, aged, yellow, brown, or synthetic cast.",
      sheenExpected: false,
      referenceHandlingNotes: [
        "Use references only for premium woven-label structure, dense micro-weave behavior, thread interlacing, industrial jacquard precision, clean cut edges, and realistic studio lighting.",
        "Do not borrow folds, product staging, foreign surface color, vertical orientation, side stitching, border seams, decorative stitching, or any raw-fabric appearance from the references.",
      ],
      camera: "high-resolution macro textile photography",
      lighting:
        "bright even high-key studio lighting with soft natural depth between threads",
    },
    SATIN: {
      material: "SATIN",
      title: "Satin",
      legacyTextureType: "satin",
      weaveType: "SATIN_DIAGONAL_20",
      gridDensity: 1.25,
      threadAngle: 20,
      glossLevel: "high",
      promptMaterialDescription:
        "Luxury satin woven label with silky sheen, refined thread transitions, a controlled 20 degree diagonal structure, and a light premium woven base.",
      promptConstraints: [
        "Silky sheen must remain visible across the woven surface.",
        "The label background must be light beige or cream (#F5F5DC).",
        "The label itself must stay light-colored and must NOT turn dark.",
        "Do not adopt dark garment background from reference images.",
        "Do not drift into a matte taffeta-like look.",
      ],
      paletteSuggestion: ["#F5F5DC", "#FFFFFF", "#000000"],
      defaultBackgroundGuidance:
        "Keep the woven label itself light beige or cream (#F5F5DC), isolated, premium, and never darkened by any garment or reference background.",
      sheenExpected: true,
      referenceHandlingNotes: [
        "Use references only for satin weave response, light reflection, and sheen behavior.",
        "Ignore any dark cloth backdrop, folds, borders, or staging elements from the references.",
      ],
      camera: "top-down macro textile photography",
      lighting: "polished studio lighting that preserves soft satin sheen",
    },
    TAFFETA: {
      material: "TAFFETA",
      title: "Taffetas",
      legacyTextureType: "taffetas",
      weaveType: "TAFFETA_CLASSIC_GRID",
      gridDensity: 1,
      threadAngle: 0,
      glossLevel: "medium",
      promptMaterialDescription:
        "High-quality woven taffeta label with fine tight grain, small-scale classic grid structure, balanced thread definition, and a clean professional woven finish.",
      promptConstraints: [
        "Fine, tight woven grain with small, regular weave cells.",
        "Balanced thread definition with restrained gloss and compact thread scale.",
        "Boundary threads around the logo must stay the same visual thickness as the interior logo threads, with no dark perimeter ring.",
        "No thick edge, dark contour, border stroke, or embroidery-like outline should appear around logo shapes.",
        "Premium woven taffeta look with fine industrial precision, small weave cells, and no oversized texture.",
      ],
      paletteSuggestion: ["#F0EAD6", "#8B0000", "#2F4F4F"],
      defaultBackgroundGuidance:
        "Keep the woven label base soft flax beige with a clean neutral field, fine tight grain, and no environmental contamination.",
      sheenExpected: false,
      referenceHandlingNotes: [
        "Use references only for fine classic grid structure, compact thread definition, and lighting response.",
        "Do not copy reference text, framing, external props, or any exaggerated oversized weave zones.",
      ],
      camera: "top-down macro textile photography",
      lighting: "balanced studio lighting with moderate specular detail",
    },
  };
