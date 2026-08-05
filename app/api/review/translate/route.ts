import { NextResponse } from "next/server";
import {
  translateTexts,
  type TranslateTarget,
} from "@/lib/translate/server";

const MAX_TEXTS = 5;
const MAX_TEXT_LENGTH = 12_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      target?: TranslateTarget;
      texts?: unknown;
    };

    const target = body.target;
    if (target !== "en" && target !== "ja") {
      return NextResponse.json(
        { ok: false, error: "Invalid target language" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.texts) || body.texts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing texts" },
        { status: 400 }
      );
    }

    if (body.texts.length > MAX_TEXTS) {
      return NextResponse.json(
        { ok: false, error: "Too many texts" },
        { status: 400 }
      );
    }

    const texts = body.texts.map((value) => String(value ?? ""));
    if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { ok: false, error: "Text too long" },
        { status: 400 }
      );
    }

    const translations = await translateTexts(texts, target);
    return NextResponse.json({ ok: true, translations });
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
