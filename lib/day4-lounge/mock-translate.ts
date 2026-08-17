import type { Day4Language } from "@/types/day4-lounge";

const cache = new Map<string, string>();

export async function fetchMockTranslation(
  text: string,
  source: Day4Language,
  target: Day4Language
): Promise<string> {
  if (source === target || !text.trim()) return text;

  const key = `${source}:${target}:${text}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const response = await fetch("/api/review/mock-translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, target }),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    translation?: string;
    error?: string;
  };

  if (!response.ok || !data.ok || !data.translation) {
    throw new Error(data.error ?? "Mock translation failed");
  }

  cache.set(key, data.translation);
  return data.translation;
}
