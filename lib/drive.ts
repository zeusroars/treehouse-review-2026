import type { PreviewFile, PreviewFileType } from "@/types/review";

const DRIVE_FILE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /\/open\?id=([a-zA-Z0-9_-]+)/,
  /\/uc\?[^#]*id=([a-zA-Z0-9_-]+)/,
];

export function extractDriveFileId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed) && !trimmed.startsWith("http")) {
    return trimmed;
  }
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Split cell value: newlines, commas, or multiple drive URLs */
export function parseDriveLinksFromCell(raw: string): string[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(/[\n,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const urls: string[] = [];
  for (const part of parts) {
    if (part.includes("drive.google.com") || extractDriveFileId(part)) {
      urls.push(part);
    }
  }
  return urls.length > 0 ? urls : parts;
}

function inferFileType(url: string, mimeHint?: string): PreviewFileType {
  const lower = url.toLowerCase();
  if (mimeHint?.includes("pdf") || lower.includes(".pdf")) return "pdf";
  if (
    mimeHint?.includes("image") ||
    /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower)
  ) {
    return "image";
  }
  return "pdf";
}

export function driveFileToPreview(
  urlOrId: string,
  options?: { name?: string; mimeHint?: string; forceType?: PreviewFileType }
): PreviewFile | null {
  const fileId = extractDriveFileId(urlOrId);
  if (!fileId) return null;

  const type =
    options?.forceType ?? inferFileType(urlOrId, options?.mimeHint);

  // PDFs use Google's dedicated "/preview" endpoint, which is designed to be
  // embedded in an <iframe> and works fine cross-origin.
  //
  // Images, on the other hand, break when hotlinked directly in an <img> tag
  // (drive.google.com treats embedded subresource requests differently from
  // a top-level navigation and blocks them). We route images through our own
  // server-side proxy (/api/review/image) instead, which fetches the bytes
  // server-to-server and serves them from our own origin.
  const previewUrl =
    type === "pdf"
      ? `https://drive.google.com/file/d/${fileId}/preview`
      : `/api/review/image?fileId=${fileId}`;

  return {
    fileId,
    type,
    previewUrl,
    name: options?.name,
  };
}

export function buildPreviewFilesFromLinks(
  links: string[],
  category: string
): PreviewFile[] {
  const forceType: PreviewFileType | undefined =
    category.includes("少兒") ? "image" : category.includes("專業") ? "pdf" : undefined;

  return links
    .map((link, i) =>
      driveFileToPreview(link, {
        name: `page-${String(i + 1).padStart(2, "0")}`,
        forceType,
      })
    )
    .filter((f): f is PreviewFile => f !== null);
}
