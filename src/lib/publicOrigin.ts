// Centralized helper for generating short, share-friendly URLs.
//
// In the Lovable preview environment, the domain is intentionally long.
// For sharing with real users (texts/emails), we prefer the published domain.
// If you later connect a custom domain, update DEFAULT_PUBLIC_APP_ORIGIN.

export const DEFAULT_PUBLIC_APP_ORIGIN = "https://lalalola.app";

export function getShareOrigin(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_APP_ORIGIN;

  const hostname = window.location.hostname;

  // Preview domains can be either:
  // - id-preview--<uuid>.lovable.app
  // - <uuid>.lovableproject.com
  const isPreviewHost =
    hostname.startsWith('id-preview--') ||
    hostname === 'lovableproject.com' ||
    hostname.endsWith('.lovableproject.com');

  if (isPreviewHost) return DEFAULT_PUBLIC_APP_ORIGIN;

  return window.location.origin;
}

