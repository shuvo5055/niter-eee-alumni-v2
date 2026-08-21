/** Stable same-origin route backed by the immutable project logo asset. */
/** Immutable official logo copied into the application’s production public output. */
export const NITER_OFFICIAL_LOGO_URL = "/niter-official-logo.jpg";
/** A neutral silhouette, never institutional branding, for records without a personal portrait. */
export const ALUMNI_IMAGE_FALLBACK_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' fill='%23dce8e8'/%3E%3Ccircle cx='120' cy='88' r='43' fill='%2381a6ac'/%3E%3Cpath d='M35 220c8-55 42-82 85-82s77 27 85 82' fill='%2381a6ac'/%3E%3C/svg%3E";

export function toPublicImageUrl(value?: string | null, fallback = ALUMNI_IMAGE_FALLBACK_URL, revision?: Date | string | number | null) {
  const source = value?.trim();
  if (!source || /^https?:\/\/images\.unsplash\.com\//i.test(source)) return fallback;
  if (source.startsWith("data:")) return source;
  const cacheRevision = revision ? `v=${encodeURIComponent(revision instanceof Date ? revision.toISOString() : String(revision))}` : "";
  const withRevision = (url: string) => cacheRevision ? `${url}${url.includes("?") ? "&" : "?"}${cacheRevision}` : url;
  if (source.startsWith("/manus-storage/")) return withRevision(source);
  if (source.startsWith("manus-storage/")) return withRevision(`/${source}`);
  if (/^https?:\/\//i.test(source)) return withRevision(source);
  return withRevision(`/manus-storage/${source.replace(/^\/+/, "")}`);
}

export function useManagedImageFallback(event: { currentTarget: HTMLImageElement }) {
  const image = event.currentTarget;
  if (image.dataset.manusFallbackApplied === "true") return;
  image.dataset.manusFallbackApplied = "true";
  image.src = ALUMNI_IMAGE_FALLBACK_URL;
}
