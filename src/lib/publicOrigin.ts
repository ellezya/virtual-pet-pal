// Centralised origin helpers for share URLs.
// Phase 6 will split these into CONSUMER_ORIGIN (lalalola.app) and
// ADMIN_ORIGIN (school.lalalola.app) once the Vite entry point split lands.

export const DEFAULT_PUBLIC_APP_ORIGIN = "https://lalalola.app";

export function getShareOrigin(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_APP_ORIGIN;
  return window.location.origin;
}

