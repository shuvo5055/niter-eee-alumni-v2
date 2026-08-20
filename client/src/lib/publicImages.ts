/** Stable same-origin route backed by the immutable project logo asset. */
export const NITER_OFFICIAL_LOGO_URL = "/api/brand/niter-official-logo.jpg";
export const ALUMNI_IMAGE_FALLBACK_URL = NITER_OFFICIAL_LOGO_URL;

export function toPublicImageUrl(value?: string | null, fallback = ALUMNI_IMAGE_FALLBACK_URL) {
  const source = value?.trim();
  if (!source || /^https?:\/\/images\.unsplash\.com\//i.test(source)) return fallback;
  if (source.startsWith("/manus-storage/")) return source;
  if (source.startsWith("manus-storage/")) return `/${source}`;
  if (/^https?:\/\//i.test(source)) return source;
  return `/manus-storage/${source.replace(/^\/+/, "")}`;
}

export function useManagedImageFallback(event: { currentTarget: HTMLImageElement }) {
  const image = event.currentTarget;
  if (image.dataset.manusFallbackApplied === "true") return;
  image.dataset.manusFallbackApplied = "true";
  image.src = ALUMNI_IMAGE_FALLBACK_URL;
}
