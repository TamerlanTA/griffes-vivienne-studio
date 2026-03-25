import type { LabelMaterial } from "./types";

export interface MaterialPromptSpec {
  compactLines: readonly string[];
  directiveLines: readonly string[];
  qualityLines: readonly string[];
  validationLines: readonly string[];
  negativeLines: readonly string[];
  viewLines: readonly string[];
}

const GLOBAL_RULE_LINES = [
  "The image must contain only ONE label.",
  "No multiple labels, no duplicates, and no stacking.",
  "The label must be centered and fully visible.",
  "Camera angle: slightly top-down (15 to 25 degrees).",
  "Clean product composition.",
  "Soft, neutral studio lighting.",
] as const;

export const GLOBAL_RULES = GLOBAL_RULE_LINES.map(line => `- ${line}`).join(
  "\n"
);

export const GLOBAL_COMPACT_RULES =
  "One label only. No duplicates or stacking. Centered and fully visible. Camera: slightly top-down 15 to 25 degrees. Clean product composition. Soft neutral studio lighting.";

const PROMPTS: Record<LabelMaterial, MaterialPromptSpec> = {
  COTTON: {
    compactLines: [
      "Material: woven cotton label.",
      "Background: fixed light natural wood with the approved cotton weave, tone, lighting, and selvedge locked exactly as-is.",
      "Use the approved cotton preset as the baseline for the background only; logo and text weave may evolve and improve.",
      "Texture: fine cotton twill with visible yarn grain; logo threads read as a distinct jacquard-selected woven motif layer, denser tighter cleaner than the background, built from visible thread structure with subtle directional weave variation.",
      "Selvedge: ultra-thin woven lisiere on top and bottom only, narrow clean real-production cotton edge, never stitched, folded, striped, or framed.",
      "Layout: small inner margins.",
      "Logo: not uniformly blended, not a flat filled shape, readable through thread transitions, and never printed, embroidered, outlined, or patch-like.",
    ],
    directiveLines: [
      "A high-resolution studio photograph of a premium woven cotton clothing label produced on a jacquard loom, with a high-density micro-weave.",
      "Material: woven cotton label.",
      "Background: fixed light natural wood surface with soft grain, warm tone, subtle depth, and the approved cotton fabric locked exactly as-is. No random backgrounds are allowed.",
      "Use the approved cotton preset as the baseline for the background while allowing the logo and text weave to evolve and improve.",
      "Texture: fine woven cotton structure with a visible natural diagonal twill, clean and consistent, realistic, slightly soft, and not overly perfect.",
      "The logo and text must read as a separate jacquard-selected woven motif layer, not a uniform copy of the background weave.",
      "The logo and text must be built from visible thread structure, not flat filled shapes.",
      "Internal yarn structure must remain visible inside dark logo areas so the mark never becomes a flat black fill or smooth surface.",
      "Add a subtle directional weave shift inside the logo compared with the background so the broche layer reads as thread-built construction.",
      "Edges must stay readable through thread transitions, not through vector-smooth outline fill.",
      "Relief stays extremely subtle and comes only from weave and thread behavior.",
      "No heavy grain, no added noise, and no artificial texture distortion.",
      "Edge: the top and bottom edges must include a realistic woven cotton selvedge that is micro-thin, slightly lighter than the base fabric, subtly textured, soft, natural, and about 1 mm in real scale.",
      "Keep that selvedge only on the top and bottom edges, not on the left and right sides, keep the same slightly top-down product angle, and never turn it into a hard stripe, white frame, wide band, folded hem, or stitched border.",
      "Logo: woven using slightly tighter, denser, more defined threads than the background for clear readability and contrast while remaining fully textile-based and embedded into the fabric.",
      "The logo must not be integrated uniformly into the weave; it should read as a subtle broche motif layer with slightly denser thread packing than the background.",
      "Keep logo and text sharp, clean, centered, and separated from the edges by a small inner margin of about 1 to 2 mm.",
      "The logo threads appear slightly denser, more compact, and more legible than the background weave while staying structurally integrated into the same textile grid and preserving the exact logo shape.",
      "Lighting: bright, even, high-key studio lighting with natural textile shadows.",
    ],
    qualityLines: [
      "Use the fixed light natural wood background for every cotton generation with no scene variation.",
      "Keep the cotton weave, tone, lighting, selvedge, and approved background locked and unchanged.",
      "Do not freeze the logo and text weave to the same baseline as the background; allow controlled structural improvement in the mark only.",
      "Keep the cotton weave fine, clean, consistent, slightly soft, and textile-real with a clearly visible natural diagonal twill.",
      "Only refine the logo material appearance through slightly tighter, denser, cleaner, and more defined thread structure, and keep the contrast subtle and realistic.",
      "The logo must keep visible internal yarn grain even in dark areas and must not collapse into a smooth black fill.",
      "The logo should show a subtle directional weave difference versus the background so the mark reads as woven thread construction rather than a filled patch or patch-like insert.",
      "Keep the selvedge edge extremely thin, subtle, slightly lighter than the fabric, softly textured, and almost flush with the label surface.",
      "HD Cotton must show a realistic micro-thin woven selvedge along the top and bottom edges only, not a broad white band, stripe, or frame.",
      "The selvedge remains a real-production lisiere detail, thin and woven, not decorative, stitched, or folded.",
      "Keep the logo highly readable through higher thread density while preserving a woven textile look and sharp clean edges.",
      "Keep a small inner margin around the design so it does not touch the selvedge.",
    ],
    validationLines: [
      "Exactly one woven cotton label is visible with no duplicates, no second label, and no stacking.",
      "The background is a consistent light natural wood surface with soft warm grain and subtle depth.",
      "The background cotton weave, tone, lighting, selvedge, and approved fabric remain locked and unchanged.",
      "The cotton weave is fine, clean, slightly soft, realistic, and shows a visible natural diagonal twill.",
      "The logo reads as a jacquard-selected woven motif layer with slightly denser, tighter, cleaner thread packing than the background.",
      "The logo is not uniformly blended into the weave and still shows internal yarn structure in dark areas.",
      "The logo shows a subtle directional weave shift versus the background so the shape reads as thread-built construction.",
      "The selvedge edge is extremely thin, subtle, slightly lighter than the fabric, softly textured, almost flush with the fabric surface, and not thick or decorative.",
      "The cotton label includes a realistic micro-thin woven selvedge on the top and bottom edges only.",
      "The camera angle remains slightly top-down and must not switch to a side angle or macro edge close-up just to show the border.",
      "The woven logo is clearly readable through slightly tighter, denser, and more defined thread structure while still looking woven rather than printed.",
      "A small inner margin is visible between the design and the edges so the artwork does not touch the selvedge.",
    ],
    negativeLines: [
      "Do not use any background other than the fixed light natural wood surface.",
      "Do not generate multiple labels, duplicate labels, stacked labels, or partial extra labels.",
      "Do not regenerate, replace, or alter the base cotton texture, weave, color, lighting, selvedge, or approved background.",
      "Do not make the selvedge thick, raised, padded, decorative, stitched, blurry, or visually dominant.",
      "Do not omit the micro-thin top and bottom woven selvedge, do not move it to the side edges, do not replace it with a flat cut edge, and do not turn it into a wide white ribbon, stripe, or frame.",
      "Do not make the logo uniformly integrated into the same weave as the background or read as only a darker color variation of it.",
      "Do not let the logo collapse into a flat black fill, smooth surface, or vector-like outline.",
      "Do not let the logo read as a filled shape with texture on top instead of visible thread structure.",
      "Do not let the logo read as a woven patch, applique, embroidered insert, or stitched motif.",
      "Do not let the woven logo lose readability, drift into blur, touch the edges, or turn into a printed ink look.",
      "Do not make the logo and background read as the same thread structure with no subtle density difference.",
      "Do not exaggerate the logo material contrast or make it look like a separate patch, applique, or print.",
    ],
    viewLines: [
      "The label rests on a consistent light natural wood surface with soft warm grain and subtle depth.",
      "The cotton background weave, tone, lighting, and selvedge remain locked and unchanged.",
      "No random backgrounds or scene changes are allowed.",
      "Keep the same slightly top-down product angle while preserving only a barely noticeable top and bottom woven selvedge.",
    ],
  },
  HD: {
    compactLines: [
      "Material: high-definition damask woven label.",
      "Background: fixed white polished onyx with subtle veins and the approved HD weave, tone, and lighting locked exactly as-is.",
      "Use the approved HD preset as the baseline for the background only; logo and text weave may evolve and improve.",
      "Texture: ultra-dense micro weave; logo threads read as a distinct jacquard-selected woven motif layer, denser tighter cleaner than the background, built from visible thread structure with subtle directional weave variation.",
      "Layout: preserve the wide rectangular label proportions.",
      "Logo: not uniformly blended, not a flat filled shape, readable through thread transitions, and never printed, embroidered, outlined, or patch-like.",
    ],
    directiveLines: [
      "A high-resolution studio photograph of a premium high-definition damask woven clothing label.",
      "Material: high-definition damask woven label.",
      "Background: fixed white polished onyx surface with subtle veins, clean studio tone, and the approved HD fabric locked exactly as-is. No random backgrounds are allowed.",
      "Use the approved HD preset as the baseline for the background while allowing the logo and text weave to evolve and improve.",
      "Texture: ultra-tight micro weave with crisp thread definition, compact structure, and clean industrial damask behavior.",
      "The logo and text must read as a separate jacquard-selected woven motif layer, not a uniform copy of the background weave.",
      "The logo and text must be built from visible thread structure, not flat filled shapes.",
      "Internal yarn structure must remain visible inside dark logo areas so the mark never becomes a flat black fill or smooth surface.",
      "Add a subtle directional weave shift inside the logo compared with the background so the broche layer reads as thread-built construction.",
      "Edges must stay readable through thread transitions, not through vector-smooth outline fill.",
      "Relief stays extremely subtle and comes only from weave and thread behavior.",
      "No heavy grain, no added noise, and no artificial texture distortion.",
      "Logo: woven using slightly tighter, denser, more defined threads than the background for clear readability and contrast while remaining fully textile-based and embedded into the fabric.",
      "The logo must not be integrated uniformly into the weave; it should read as a subtle broche motif layer with slightly denser thread packing than the background.",
      "Keep logo and text sharp, clean, centered, and structurally correct without changing proportions or typography.",
      "Lighting: bright, even studio lighting with natural textile shadows.",
    ],
    qualityLines: [
      "Use the fixed white polished onyx background for every HD generation with no scene variation.",
      "Keep the HD weave, tone, lighting, and approved background locked and unchanged.",
      "Do not freeze the logo and text weave to the same baseline as the background; allow controlled structural improvement in the mark only.",
      "Keep the HD weave ultra-tight, clean, compact, and textile-real with crisp thread definition.",
      "Only refine the logo material appearance through slightly tighter, denser, cleaner, and more defined thread structure, and keep the contrast subtle and realistic.",
      "The logo must keep visible internal yarn grain even in dark areas and must not collapse into a smooth black fill.",
      "The logo should show a subtle directional weave difference versus the background so the mark reads as woven thread construction rather than a filled patch or patch-like insert.",
      "Keep the logo highly readable through higher thread density while preserving a woven textile look and sharp clean edges.",
      "Keep the composition and framing unchanged.",
    ],
    validationLines: [
      "Exactly one woven HD label is visible with no duplicates, no second label, and no stacking.",
      "The background is fixed white polished onyx with subtle veins.",
      "The background HD weave, tone, lighting, and approved fabric remain locked and unchanged.",
      "The HD weave is ultra-tight, crisp, compact, and realistic.",
      "The logo reads as a jacquard-selected woven motif layer with slightly denser, tighter, cleaner thread packing than the background.",
      "The logo is not uniformly blended into the weave and still shows internal yarn structure in dark areas.",
      "The logo shows a subtle directional weave shift versus the background so the shape reads as thread-built construction.",
      "The woven logo is clearly readable through slightly tighter, denser, and more defined thread structure while still looking woven rather than printed.",
      "The label remains clearly rectangular and wider than tall.",
    ],
    negativeLines: [
      "Do not use any background other than the fixed white polished onyx surface.",
      "Do not generate multiple labels, duplicate labels, stacked labels, or partial extra labels.",
      "Do not regenerate, replace, or alter the base HD texture, weave, color, lighting, or approved background.",
      "Do not make the logo uniformly integrated into the same weave as the background or read as only a darker color variation of it.",
      "Do not let the logo collapse into a flat black fill, smooth surface, or vector-like outline.",
      "Do not let the logo read as a filled shape with texture on top instead of visible thread structure.",
      "Do not let the logo read as a woven patch, applique, embroidered insert, or stitched motif.",
      "Do not let the woven logo lose readability, drift into blur, or turn into a printed ink look.",
      "Do not make the logo and background read as the same thread structure with no subtle density difference.",
      "Do not exaggerate the logo material contrast or make it look like a separate patch, applique, or print.",
    ],
    viewLines: [
      "The label rests on fixed white polished onyx with subtle veins.",
      "The HD background weave, tone, and lighting remain locked and unchanged.",
      "No random backgrounds or scene changes are allowed.",
    ],
  },
  SATIN: {
    compactLines: [
      "Material: satin woven label.",
      "Background: fixed light grey polished concrete.",
      "Texture: smooth, slightly reflective satin weave.",
      "Edge: thin and precise woven edge.",
      "Logo: crisp woven threads with strong clarity.",
    ],
    directiveLines: [
      "A high-resolution studio photograph of a premium woven satin clothing label.",
      "Material: satin woven label.",
      "Background: fixed light grey polished concrete with no variation.",
      "Texture: smooth, slightly reflective satin weave with controlled sheen.",
      "Edge: thin, precise, and clean.",
      "Logo: crisp woven threads with strong clarity while remaining textile-based.",
      "The satin label should appear as a single centered product shot with no duplicate labels and no scene drift.",
    ],
    qualityLines: [
      "Use the fixed light grey polished concrete background for every satin generation with no scene variation.",
      "Keep the satin weave smooth and slightly reflective with controlled sheen, not plastic gloss.",
      "Keep the edge thin, precise, and clean.",
      "Keep the woven logo crisp and clear while preserving satin thread realism.",
    ],
    validationLines: [
      "Exactly one woven satin label is visible with no duplicates, no second label, and no stacking.",
      "The background is fixed light grey polished concrete.",
      "The satin weave is smooth, slightly reflective, and controlled rather than plastic.",
      "The woven edge is thin and precise.",
      "The woven logo is crisp and readable.",
    ],
    negativeLines: [
      "Do not use wood, paper, onyx, cloth, or any background other than fixed light grey polished concrete.",
      "Do not generate multiple labels, duplicate labels, stacked labels, or partial extra labels.",
      "Do not make the satin weave matte, fuzzy, or plastic.",
    ],
    viewLines: [
      "The label rests on fixed light grey polished concrete.",
      "No random backgrounds or scene changes are allowed.",
    ],
  },
  TAFFETA: {
    compactLines: [
      "Material: woven taffeta label.",
      "Background: fixed neutral paper-like support surface.",
      "Texture: very fine dense compact taffeta weave with tight small weave cells, a flat clean industrial label-tape surface, and no cotton softness or canvas coarseness.",
      "Edge: thin and clean woven edge.",
      "Logo: sharper contrast than cotton while staying woven.",
    ],
    directiveLines: [
      "A high-resolution studio photograph of a premium woven taffeta clothing label.",
      "Material: woven taffeta label — a manufactured industrial label tape, not a natural fabric swatch.",
      "Background: fixed neutral paper-like support surface with no scene drift.",
      "Texture: very fine dense compact taffeta weave with tight small weave cells, a flatter cleaner industrial label-tape surface, and no coarse grain, no cotton softness, no canvas texture, and no linen character.",
      "The surface must read as a tightly woven manufactured label — more regular, more precise, and finer than cotton.",
      "Edge: thin, clean, and precisely woven.",
      "Logo: sharper contrast than cotton for readability while remaining fully woven.",
      "The image must contain exactly one taffeta label with no duplicates, no stacking, and no secondary label in the background.",
    ],
    qualityLines: [
      "Use the fixed neutral paper-like background for every taffeta generation with no scene variation.",
      "Keep the taffeta weave very fine, dense, compact, and tighter than cotton with a flat clean industrial label-tape surface and no coarse grain, softness, or porous texture.",
      "The taffeta surface must read as a manufactured precision label tape, not as a natural fabric swatch or textile sample.",
      "Keep the woven edge thin and clean with no duplicate labels or stacked compositions.",
      "Keep the woven logo sharper in contrast than cotton while preserving a textile look.",
    ],
    validationLines: [
      "Exactly one woven taffeta label is visible with no duplicates, no second label, and no stacking.",
      "The background is a fixed neutral paper-like support surface.",
      "The taffeta weave is very fine, dense, compact, tighter than cotton, flat, clean, and reads as an industrial manufactured label tape rather than a natural fabric swatch.",
      "The woven edge is thin and clean, not decorative or stitched.",
      "The woven logo has sharper contrast than cotton while still looking woven.",
      "No cotton softness, canvas texture, linen texture, coarse grain, or porous fabric appearance is present.",
    ],
    negativeLines: [
      "Do not use marble, wood, concrete, cloth, or any background other than the fixed neutral paper-like support surface.",
      "Do not make the taffeta weave soft, fuzzy, porous, canvas-like, linen-like, or glossy like satin.",
      "Do not make the label thick, coarse, embossed like HD, embroidered, or printed.",
      "Do not make the weave large, loose, or visually dominant — the weave cells must stay tight, small, and compact.",
      "Do not give the taffeta a cotton softness, organic yarn presence, or natural fabric swatch appearance.",
      "Do not give the taffeta a canvas texture, burlap texture, or linen texture.",
      "Do not make the label surface porous, rough, or coarse-grained.",
      "Do not make the label read as a thick fabric strip, a cut fabric sample, or a raw textile piece.",
    ],
    viewLines: [
      "The label rests on a fixed neutral paper-like support surface.",
      "No random backgrounds or scene changes are allowed.",
    ],
  },
};

export function getMaterialPromptSpec(material: LabelMaterial): MaterialPromptSpec {
  return PROMPTS[material];
}
