/** Client-visible marker for GAS / network failures (never show raw env hints). */
export const CONNECTION_FAILED_CODE = "connection_failed";

export class ConnectionError extends Error {
  readonly code = CONNECTION_FAILED_CODE;

  constructor(message = CONNECTION_FAILED_CODE) {
    super(message);
    this.name = "ConnectionError";
  }
}

export function isConnectionError(error: unknown): boolean {
  if (error instanceof ConnectionError) return true;
  if (error instanceof Error) {
    if (error.name === "AbortError") return true;
    if (error.message === CONNECTION_FAILED_CODE) return true;
  }
  return false;
}

const TECHNICAL_PATTERNS = [
  /GAS_WEB_APP_URL/i,
  /GAS_SHEET_API_URL/i,
  /GAS_VOTE_API_URL/i,
  /GAS_SHEET_GET_QUERY/i,
  /\.env\.local/i,
  /doGet/i,
  /二維陣列/,
  /回傳格式錯誤/,
  /無法解析 JSON/i,
  /GAS sheet API/i,
  /GAS API/i,
  /HTTP \d+/i,
  /404/,
  /逾時/,
  /timeout/i,
  /AbortError/i,
  /重定向偶發/,
  /回傳 HTML/,
];

/** Map server-side GAS failures to a safe client error code. */
export function toClientConnectionErrorCode(message: string): string | null {
  if (!message.trim()) return CONNECTION_FAILED_CODE;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return CONNECTION_FAILED_CODE;
  }
  return null;
}

export function wrapAsConnectionError(error: unknown): ConnectionError {
  if (error instanceof ConnectionError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new ConnectionError();
  }
  const message = error instanceof Error ? error.message : String(error);
  if (toClientConnectionErrorCode(message)) {
    return new ConnectionError();
  }
  return new ConnectionError();
}
