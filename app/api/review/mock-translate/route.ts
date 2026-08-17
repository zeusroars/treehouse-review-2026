import { NextResponse } from "next/server";
import type { Day4Language } from "@/types/day4-lounge";

const MAX_TEXT_LENGTH = 1_000;
const LANGUAGE_LABELS: Record<Day4Language, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
};

function isLanguage(value: unknown): value is Day4Language {
  return value === "zh" || value === "en" || value === "ja";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: unknown;
      source?: unknown;
      target?: unknown;
    };
    const text = String(body.text ?? "").trim();

    if (
      !text ||
      text.length > MAX_TEXT_LENGTH ||
      !isLanguage(body.source) ||
      !isLanguage(body.target)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid translation request" },
        { status: 400 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 650));

    return NextResponse.json({
      ok: true,
      translation:
        body.source === body.target
          ? text
          : `[${LANGUAGE_LABELS[body.target]} · Mock] ${text}`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Mock translation failed" },
      { status: 400 }
    );
  }
}
