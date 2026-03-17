export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Build the OAuth URL at runtime so redirects use the current origin.
// Preview deployments may intentionally omit OAuth env vars because the
// Express auth backend is not available there, so this helper must fail
// gracefully instead of crashing the React app during render.
export const getLoginUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId) {
    return null;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL("/app-auth", oauthPortalUrl);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.warn("[Auth] OAuth portal URL is invalid.", error);
    return null;
  }
};

export const navigateToLogin = (): boolean => {
  const loginUrl = getLoginUrl();

  if (!loginUrl) {
    console.warn(
      "[Auth] Login is unavailable because OAuth environment variables are missing."
    );
    return false;
  }

  window.location.href = loginUrl;
  return true;
};
