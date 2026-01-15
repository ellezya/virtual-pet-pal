// Centralized helper for generating short, share-friendly URLs.
//
// In the Lovable preview environment, the domain is intentionally long.
// For sharing with real users (texts/emails), we prefer the published domain.
// If you later connect a custom domain, update DEFAULT_PUBLIC_APP_ORIGIN.

export const DEFAULT_PUBLIC_APP_ORIGIN = "https://buddy-bloom-bazaar.lovable.app";

export function getShareOrigin(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_APP_ORIGIN;

  const hostname = window.location.hostname;

  // Lovable preview domains look like: id-preview--<uuid>.lovable.app
  if (hostname.startsWith('id-preview--')) {
    return DEFAULT_PUBLIC_APP_ORIGIN;
  }

  return window.location.origin;
}
