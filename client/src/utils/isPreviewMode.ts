export function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("vercel.app");
}
