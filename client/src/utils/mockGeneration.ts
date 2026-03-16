export type MockGenerationResult = {
  labelUrl: string;
  isFreeTrial: boolean;
};

const PREVIEW_LABEL_SVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#111111" />
        <stop offset="100%" stop-color="#2f2f2f" />
      </linearGradient>
      <pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 0H12V12H0Z" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="1200" height="400" rx="28" fill="url(#bg)" />
    <rect width="1200" height="400" rx="28" fill="url(#weave)" />
    <text x="600" y="170" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="68" font-weight="700">
      Preview Label
    </text>
    <text x="600" y="245" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="28">
      AI generation is disabled in this demo environment
    </text>
  </svg>
`);

const PREVIEW_LABEL_URL = `data:image/svg+xml;charset=UTF-8,${PREVIEW_LABEL_SVG}`;

export function mockGeneration(): MockGenerationResult {
  return {
    labelUrl: PREVIEW_LABEL_URL,
    isFreeTrial: true,
  };
}
