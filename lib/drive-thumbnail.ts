/** Default gallery card thumbnail width (passed to Drive via `sz=w{width}`). */
export const GALLERY_THUMB_WIDTH = 480;

/** Max width requested for lightbox / full-view proxy images. */
export const GALLERY_LIGHTBOX_WIDTH = 2000;

/** Day1-2 blind-review entry strip thumbnails. */
export const JUDGE_STRIP_THUMB_WIDTH = 320;

/** Admin dashboard / score-detail list thumbnails. */
export const ADMIN_LIST_THUMB_WIDTH = 320;

/** Day3-4 lounge grid cards. */
export const DAY4_LIST_THUMB_WIDTH = 600;

/** Day3-4 pin-up / fullscreen review. */
export const DAY4_PINUP_WIDTH = 1600;

/** Day5 chairman board kanban cards. */
export const DAY5_CARD_THUMB_WIDTH = 480;

export function buildDriveThumbnailProxyUrl(
  fileId: string,
  width: number = GALLERY_THUMB_WIDTH
): string {
  return `/api/review/image?fileId=${encodeURIComponent(fileId)}&sz=${width}`;
}

/** High-resolution proxy URL for gallery lightbox (falls back to full image server-side). */
export function buildDriveFullImageProxyUrl(fileId: string): string {
  return `/api/review/image?fileId=${encodeURIComponent(fileId)}&sz=${GALLERY_LIGHTBOX_WIDTH}`;
}

/**
 * Rebuild a local `/api/review/image?...` URL at a different `sz`,
 * or return the original URL when it cannot be rewritten.
 */
export function resizeDriveImageProxyUrl(
  url: string | null | undefined,
  width: number
): string | null {
  if (!url) return null;
  if (/[?&]sz=\d+/.test(url)) {
    return url.replace(/([?&]sz=)\d+/, `$1${width}`);
  }
  const match = url.match(/[?&]fileId=([^&]+)/);
  if (match?.[1]) {
    return buildDriveThumbnailProxyUrl(decodeURIComponent(match[1]), width);
  }
  return url;
}

export function parseThumbnailWidth(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(2000, Math.max(100, parsed));
}

export function driveThumbnailFetchUrl(fileId: string, width: number): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function driveFullImageFetchUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
