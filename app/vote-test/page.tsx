"use client";

import { useState } from "react";

const DEFAULT_PAYLOAD = {
  photoNo: "測試編號99",
  voterId: "Local_Test_User",
} as const;

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzBYIus0TuuoNYTgVSWAegUXomEDj1Qlsz2HCCDV4l7Ak-Z2n7usW3Q1FgvYti5V3IG/exec";

type VoteTestResult = {
  ok: boolean;
  status?: number;
  data?: unknown;
  rawText?: string;
  error?: string;
  mode?: string;
};

export default function VoteTestPage() {
  const [loading, setLoading] = useState<"proxy" | "direct" | null>(null);
  const [lastResult, setLastResult] = useState<VoteTestResult | null>(null);

  const runProxyTest = async () => {
    setLoading("proxy");
    setLastResult(null);
    try {
      const res = await fetch("/api/vote/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_PAYLOAD),
      });
      const result = (await res.json()) as VoteTestResult;
      console.log("[vote-test] via Next.js proxy:", result);
      setLastResult({ ...result, mode: "Next.js proxy (/api/vote/test)" });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[vote-test] proxy error:", message);
      setLastResult({ ok: false, error: message, mode: "Next.js proxy" });
    } finally {
      setLoading(null);
    }
  };

  const runDirectTest = async () => {
    setLoading("direct");
    setLastResult(null);
    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_PAYLOAD),
      });
      const rawText = await res.text();
      let data: unknown = rawText;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // plain text response
      }
      const result: VoteTestResult = {
        ok: res.ok,
        status: res.status,
        data,
        rawText,
        mode: "Browser direct → GAS (cors)",
      };
      console.log("[vote-test] direct GAS:", result);
      setLastResult(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[vote-test] direct CORS likely blocked:", message);
      setLastResult({
        ok: false,
        error: `${message}（瀏覽器直連 GAS 常被 CORS 擋下，請改用上方 Proxy 按鈕）`,
        mode: "Browser direct → GAS",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-wood-50 px-4 py-10">
      <main className="mx-auto max-w-xl space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">投票 API 測試</h1>
          <p className="mt-2 text-sm text-slate-600">
            測試 payload：
            <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              {JSON.stringify(DEFAULT_PAYLOAD)}
            </code>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            結果會顯示在下方，並寫入瀏覽器 Console（F12）。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void runProxyTest()}
            disabled={loading !== null}
            className="flex-1 rounded-xl bg-sage-600 px-4 py-3 text-sm font-medium text-white hover:bg-sage-500 disabled:opacity-50"
          >
            {loading === "proxy" ? "送出中…" : "POST（推薦：Next.js Proxy）"}
          </button>
          <button
            type="button"
            onClick={() => void runDirectTest()}
            disabled={loading !== null}
            className="flex-1 rounded-xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
          >
            {loading === "direct" ? "送出中…" : "POST（直連 GAS，測 CORS）"}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Google Apps Script 從瀏覽器直連常因 CORS 失敗；使用{" "}
          <code className="rounded bg-slate-100 px-1">mode: &apos;no-cors&apos;</code>{" "}
          雖可送出但無法讀取回應。正式測試請用 Proxy 按鈕（伺服器代轉）。
        </p>

        {lastResult ? (
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : null}
      </main>
    </div>
  );
}
