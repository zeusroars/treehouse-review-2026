export type TranslateTarget = "en" | "ja";

const MAX_CHUNK = 1200;
const cache = new Map<string, string>();

function cacheKey(text: string, target: TranslateTarget): string {
  return `${target}:${text}`;
}

async function translateChunk(
  text: string,
  target: TranslateTarget
): Promise<string> {
  const key = cacheKey(text, target);
  const cached = cache.get(key);
  if (cached) return cached;

  const tl = target === "ja" ? "ja" : "en";
  const params = new URLSearchParams({
    client: "gtx",
    sl: "zh-TW",
    tl,
    dt: "t",
    q: text,
  });

  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!res.ok) {
    throw new Error(`Translation request failed (${res.status})`);
  }

  const data: unknown = await res.json();
  const segments = Array.isArray(data) ? data[0] : null;
  const translated =
    Array.isArray(segments)
      ? segments
          .map((segment) =>
            Array.isArray(segment) && typeof segment[0] === "string"
              ? segment[0]
              : ""
          )
          .join("")
      : text;

  cache.set(key, translated);
  return translated;
}

export async function translateText(
  text: string,
  target: TranslateTarget
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (trimmed.length <= MAX_CHUNK) {
    return translateChunk(trimmed, target);
  }

  const chunks: string[] = [];
  let buffer = "";
  for (const line of trimmed.split("\n")) {
    const next = buffer ? `${buffer}\n${line}` : line;
    if (next.length > MAX_CHUNK && buffer) {
      chunks.push(buffer);
      buffer = line;
    } else {
      buffer = next;
    }
  }
  if (buffer) chunks.push(buffer);

  const translated = await Promise.all(
    chunks.map((chunk) => translateChunk(chunk, target))
  );
  return translated.join("\n");
}

export async function translateTexts(
  texts: string[],
  target: TranslateTarget
): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text, target)));
}
