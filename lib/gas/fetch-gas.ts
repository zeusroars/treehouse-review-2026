const GAS_FETCH_MAX_ATTEMPTS = 3;
const GAS_FETCH_RETRY_BASE_MS = 350;
const GAS_FETCH_TIMEOUT_MS = 8_000;

function isGasHtmlErrorBody(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withRetryQuery(url: string, attempt: number): string {
  if (attempt <= 1) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_gasRetry=${attempt}&_t=${Date.now()}`;
}

export interface FetchGasTextOptions {
  label?: string;
  init?: RequestInit;
}

export interface FetchGasTextResult {
  text: string;
  /** How many HTTP attempts were made (1 = succeeded on first try). */
  attempts: number;
}

/**
 * Fetch a GAS Web App URL with retries, returning attempt-count metadata.
 * Google occasionally returns 404 HTML on redirect; retrying usually succeeds.
 */
export async function fetchGasTextWithMeta(
  url: string,
  options: FetchGasTextOptions = {}
): Promise<FetchGasTextResult> {
  const label = options.label ?? "GAS API";
  let lastStatus = 0;
  let lastDetail = "unknown error";

  for (let attempt = 1; attempt <= GAS_FETCH_MAX_ATTEMPTS; attempt++) {
    const attemptUrl = withRetryQuery(url, attempt);
    const controller = new AbortController();
    const callerSignal = options.init?.signal;
    const abortFromCaller = () => controller.abort();
    const timer = setTimeout(() => controller.abort(), GAS_FETCH_TIMEOUT_MS);

    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener("abort", abortFromCaller, { once: true });
    }

    try {
      const res = await fetch(attemptUrl, {
        redirect: "follow",
        ...options.init,
        signal: controller.signal,
      });

      lastStatus = res.status;
      const text = await res.text();

      if (res.ok && !isGasHtmlErrorBody(text)) {
        return { text, attempts: attempt };
      }

      if (res.ok && isGasHtmlErrorBody(text)) {
        lastDetail = "回傳 HTML 而非 JSON";
      } else {
        lastDetail = `HTTP ${res.status}`;
      }
    } catch (e) {
      lastDetail =
        e instanceof Error && e.name === "AbortError"
          ? "連線逾時"
          : e instanceof Error
            ? e.message
            : String(e);
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }

    if (callerSignal?.aborted) {
      break;
    }

    if (attempt < GAS_FETCH_MAX_ATTEMPTS) {
      await sleep(GAS_FETCH_RETRY_BASE_MS * attempt);
    }
  }

  const hint =
    lastStatus === 404
      ? "（Google 重定向偶發 404，已自動重試仍失敗，請稍後再試）"
      : "";
  throw new Error(`${label} ${lastDetail}${hint}`);
}

/** Back-compat string-only variant (used by GET-only callers). */
export async function fetchGasText(
  url: string,
  options: FetchGasTextOptions = {}
): Promise<string> {
  const { text } = await fetchGasTextWithMeta(url, options);
  return text;
}

export async function fetchGasJson<T = unknown>(
  url: string,
  options: FetchGasTextOptions = {}
): Promise<T> {
  const text = await fetchGasText(url, options);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${options.label ?? "GAS API"} 回傳格式錯誤：無法解析 JSON`);
  }
}
