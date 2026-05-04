export const CONSUMER_ORIGIN = import.meta.env.VITE_CONSUMER_ORIGIN ?? "https://lalalola.app";
export const ADMIN_ORIGIN = import.meta.env.VITE_ADMIN_ORIGIN ?? "https://school.lalalola.app";

export function getShareOrigin(): string {
  if (typeof window === 'undefined') return CONSUMER_ORIGIN;
  return window.location.origin;
}
