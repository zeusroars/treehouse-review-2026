import { NextResponse } from "next/server";
import { translateBetween, type LocaleCode } from "@/lib/translate/server";

const MAX_TEXT_LENGTH = 1_000;

function isLanguage(value: unknown): value is LocaleCode {
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

    const translation = await translateBetween(text, body.source, body.target);

    return NextResponse.json({
      ok: true,
      translation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Translation failed",
      },
      { status: 502 }
    );
  }
}
