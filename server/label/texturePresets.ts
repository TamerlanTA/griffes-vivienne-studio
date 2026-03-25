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
        "Warm light beige / natural ecru woven cotton clothing label. Soft matte factory-made cotton surface with fine subtle diagonal woven grain, gentle natural yarn presence, refined production cotton texture, visible textile direction, not bright white, not cold, not synthetic, not overly uniform, not coarse, not ribbon-like, and not exaggerated in its twill ridges.",
      promptConstraints: [
        "Warm light beige / natural ecru cotton base with a soft matte factory-made cotton surface, subtle woven face, and fine visible diagonal woven direction in the ground fabric.",
        "Gentle natural yarn presence with refined production cotton texture, never bright white, cold, synthetic, overly regular, coarse, or ribbon-like.",
        "Keep the diagonal grain subtle and textile-real while avoiding coarse twill ridges, exaggerated diagonal bands, satin ribbon texture, or hard ribbed twill.",
        "Logo and text must read as a distinct woven motif layer with slightly tighter, denser, and more compact threads than the softer cotton ground, preserving internal thread logic inside the black shapes.",
        "Boundary threads around the logo must stay the same visual thickness as the interior logo threads, with no dark perimeter ring.",
        "No thick edge, dark contour, border stroke, or embroidery-like outline should appear around logo shapes.",
        "The label surface should stay soft, matte, flat, clean, and refined, with no printed-cotton look and no raw fabric behavior.",
        "The selvedge should remain ultra-subtle, integrated, and structural on the top and bottom edges only, never a visible decorative band.",
        "No visible side stitching, no border seams, no folded edges, no decorative stitching, and no stitched borders.",
        "Cotton backgrounds should stay warm, soft, and natural with light variants reading as pale beige / ecru rather than stark off-white.",
      ],
      paletteSuggestion: ["#EFE6D8", "#1F1F1F", "#223A5E"],
      defaultBackgroundGuidance:
        "Keep the woven cotton base warm light beige / natural ecru, soft matte, refined, and natural, with subtle visible diagonal woven direction and no stark white, cold grey, dirty, aged, brown, or synthetic cast.",
      sheenExpected: false,
      referenceHandlingNotes: [
        "Match the approved cotton reference background first and preserve the same tone, surface softness, subtle diagonal woven direction, lighting family, and edge construction.",
        "Only allow controlled variation inside the logo and text weave, and do not borrow folds, foreign surface color, vertical orientation, side stitching, border seams, decorative stitching, or raw-fabric behavior from the references.",
      ],
      camera: "high-resolution macro textile photography",
      lighting:
        "soft neutral studio lighting with natural depth between threads",
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
      gridDensity: 1.5,
      threadAngle: 0,
      glossLevel: "medium",
      promptMaterialDescription:
        "Fine dense compact woven taffeta clothing label. Thin, regular, flat, clean industrial woven label-tape surface with very tight weave cells, crisp controlled texture, a slightly warm neutral beige / light ivory tone, and a manufactured precision that is clearly tighter and finer than cotton, with no coarse grain, no softness, no canvas or linen character, and no natural fabric swatch appearance.",
      promptConstraints: [
        "Very fine dense regular taffeta weave with tight compact weave cells, a flat clean industrial label-tape surface, and sharper more controlled thread definition than cotton.",
        "Slightly warm neutral beige / light ivory taffeta face with refined industrial label precision, restrained sheen, and no cotton softness, canvas texture, linen texture, porous fabric, or coarse grain.",
        "The surface must read as a manufactured woven label tape — flatter, tighter, more regular, and more precise than cotton — not as a natural fabric swatch or textile sample.",
        "Not soft, not fuzzy, not porous, not canvas-like, not linen-like, not coarse, not thick, not a fabric strip, not glossy like satin, and not embossed like HD.",
        "Boundary threads around the logo must stay the same visual thickness as the interior logo threads, with no dark perimeter ring.",
        "No thick edge, dark contour, border stroke, or embroidery-like outline should appear around logo shapes.",
        "Logo and text stay woven, readable, and integrated into the same fine taffeta structure with clean black thread definition.",
      ],
      paletteSuggestion: ["#F0EAD6", "#8B0000", "#2F4F4F"],
      defaultBackgroundGuidance:
        "Keep the woven label base warm neutral and clean on the approved neutral paper-like support surface, with no random white backdrop drift or environmental contamination.",
      sheenExpected: false,
      referenceHandlingNotes: [
        "Use references only for fine dense compact taffeta weave structure, flat clean label-tape surface behavior, tight controlled thread definition, and lighting response.",
        "Do not copy cotton softness, canvas texture, linen texture, porous cloth behavior, fuzzy fibers, coarse grain, thick fabric strip appearance, natural cloth swatch look, external props, reference text, or exaggerated oversized weave zones from the references.",
      ],
      camera: "top-down macro textile photography",
      lighting: "balanced studio lighting with moderate specular detail",
    },
  };
