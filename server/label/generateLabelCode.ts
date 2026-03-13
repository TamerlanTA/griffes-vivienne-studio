export function normalizeSizeSegment(size: string): string {
  return size.trim().replace(/\s+/g, "").replace(/[xX]/g, "x");
}

export function generateLabelCode(material: string, color: string, size: string): string {
  return [
    material.trim().toUpperCase(),
    color.trim().toUpperCase(),
    normalizeSizeSegment(size),
  ].join("_");
}
