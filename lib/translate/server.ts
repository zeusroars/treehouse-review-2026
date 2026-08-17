export type TranslateTarget = "en" | "ja";
export type LocaleCode = "zh" | "en" | "ja";

const MAX_CHUNK = 1200;
const cache = new Map<string, string>();

const GOOGLE_LANG: Record<LocaleCode, string> = {
  zh: "zh-TW",
  en: "en",
  ja: "ja",
};

function cacheKey(text: string, target: TranslateTarget): string {
  return `${target}:${text}`;
}

function cacheKeyBetween(
  text: string,
  source: LocaleCode,
  target: LocaleCode
): string {
  return `${source}:${target}:${text}`;
}

async function fetchGoogleTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: sourceLang,
    tl: targetLang,
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
  return Array.isArray(segments)
    ? segments
        .map((segment) =>
          Array.isArray(segment) && typeof segment[0] === "string"
            ? segment[0]
            : ""
        )
        .join("")
    : text;
}

async function translateChunk(
  text: string,
  target: TranslateTarget
): Promise<string> {
  const key = cacheKey(text, target);
  const cached = cache.get(key);
  if (cached) return cached;

  const translated = await fetchGoogleTranslation(
    text,
    GOOGLE_LANG.zh,
    GOOGLE_LANG[target]
  );

  cache.set(key, translated);
  return translated;
}

async function translateChunkBetween(
  text: string,
  source: LocaleCode,
  target: LocaleCode
): Promise<string> {
  const key = cacheKeyBetween(text, source, target);
  const cached = cache.get(key);
  if (cached) return cached;

  const translated = await fetchGoogleTranslation(
    text,
    GOOGLE_LANG[source],
    GOOGLE_LANG[target]
  );

  cache.set(key, translated);
  return translated;
}

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let buffer = "";
  for (const line of text.split("\n")) {
    const next = buffer ? `${buffer}\n${line}` : line;
    if (next.length > MAX_CHUNK && buffer) {
      chunks.push(buffer);
      buffer = line;
    } else {
      buffer = next;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
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

  const translated = await Promise.all(
    splitIntoChunks(trimmed).map((chunk) => translateChunk(chunk, target))
  );
  return translated.join("\n");
}

export async function translateBetween(
  text: string,
  source: LocaleCode,
  target: LocaleCode
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || source === target) return text;
  if (trimmed.length <= MAX_CHUNK) {
    return translateChunkBetween(trimmed, source, target);
  }

  const translated = await Promise.all(
    splitIntoChunks(trimmed).map((chunk) =>
      translateChunkBetween(chunk, source, target)
    )
  );
  return translated.join("\n");
}

export async function translateTexts(
  texts: string[],
  target: TranslateTarget
): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text, target)));
}
