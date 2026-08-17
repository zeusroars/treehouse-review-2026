import type { TranslateTarget } from "@/lib/translate/server";
import { readJsonResponse } from "@/lib/safe-json-response";

const clientCache = new Map<string, string>();

function cacheKey(text: string, target: TranslateTarget): string {
  return `${target}:${text}`;
}

export async function fetchTranslatedTexts(
  texts: string[],
  target: TranslateTarget
): Promise<string[]> {
  const results: string[] = new Array(texts.length);
  const pending: { index: number; text: string }[] = [];

  texts.forEach((text, index) => {
    const trimmed = text.trim();
    if (!trimmed) {
      results[index] = text;
      return;
    }
    const key = cacheKey(trimmed, target);
    const cached = clientCache.get(key);
    if (cached) {
      results[index] = cached;
    } else {
      pending.push({ index, text: trimmed });
    }
  });

  if (pending.length === 0) return results;

  const res = await fetch("/api/review/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target,
      texts: pending.map((item) => item.text),
    }),
  });

  const data = await readJsonResponse<{
    ok?: boolean;
    translations?: string[];
    error?: string;
  }>(res);

  if (!res.ok || !data.ok || !data.translations) {
    throw new Error(data.error ?? "Translation failed");
  }

  pending.forEach((item, i) => {
    const translated = data.translations![i] ?? item.text;
    clientCache.set(cacheKey(item.text, target), translated);
    results[item.index] = translated;
  });

  return results;
}
