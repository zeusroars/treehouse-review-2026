/** Default gallery card thumbnail width (passed to Drive via `sz=w{width}`). */
export const GALLERY_THUMB_WIDTH = 800;

/** Max width requested for lightbox / full-view proxy images. */
export const GALLERY_LIGHTBOX_WIDTH = 2000;

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
