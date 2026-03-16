export function isPreviewMode() {
  return typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
}
