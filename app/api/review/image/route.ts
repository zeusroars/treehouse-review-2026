import { NextResponse } from "next/server";
import {
  driveFullImageFetchUrl,
  driveThumbnailFetchUrl,
  parseThumbnailWidth,
} from "@/lib/drive-thumbnail";

const FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchDriveImageBytes(
  driveUrl: string
): Promise<{ ok: true; buffer: ArrayBuffer; contentType: string } | { ok: false; status: number; contentType: string }> {
  const res = await fetch(driveUrl, {
    redirect: "follow",
    headers: { "User-Agent": UA },
    cache: "force-cache",
    next: { revalidate: 86400 },
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok || !contentType.startsWith("image/")) {
    return { ok: false, status: res.status, contentType };
  }

  return {
    ok: true,
    buffer: await res.arrayBuffer(),
    contentType,
  };
}

/**
 * Proxies Google Drive images for embedding.
 * - Default: full-resolution (`uc?export=view`) for judge preview.
 * - `?sz=800`: Drive thumbnail API (works for images and PDF first page).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId")?.trim();
  const thumbWidth = parseThumbnailWidth(searchParams.get("sz"));

  if (!fileId || !FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json(
      { ok: false, error: "缺少有效的 fileId" },
      { status: 400 }
    );
  }

  try {
    const candidates = thumbWidth
      ? [
          driveThumbnailFetchUrl(fileId, thumbWidth),
          driveFullImageFetchUrl(fileId),
        ]
      : [driveFullImageFetchUrl(fileId)];

    let lastFailure: { status: number; contentType: string } | null = null;

    for (const driveUrl of candidates) {
      const result = await fetchDriveImageBytes(driveUrl);
      if (result.ok) {
        return new NextResponse(result.buffer, {
          status: 200,
          headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
      lastFailure = { status: result.status, contentType: result.contentType };
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Google Drive 未回傳圖片內容，請確認檔案共用權限為「知道連結的任何人」。",
        upstreamStatus: lastFailure?.status,
        upstreamContentType: lastFailure?.contentType,
      },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "圖片代理失敗" },
      { status: 502 }
    );
  }
}
