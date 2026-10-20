// Which build of Orbit this is. Vite replaces import.meta.env.VITE_* with
// fixed text when it builds the app (build-time configuration), so these
// values come from the Docker build arguments APP_VERSION and BUILD_DATE.
// `npm run dev` has no build arguments, so it shows "dev".
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
export const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || '';

// "sha-1a2b3c4 · 20 Oct 2026", or just "dev" when there is no build date.
export function versionLabel(version, buildDate) {
  const date = new Date(buildDate);
  if (!buildDate || Number.isNaN(date.getTime())) return version;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${version} · ${day}`;
}
