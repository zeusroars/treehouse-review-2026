export function getGasWebAppUrl(): string {
  const url =
    process.env.GAS_SHEET_API_URL?.trim() ||
    process.env.GAS_WEB_APP_URL?.trim();
  if (!url) {
    throw new Error(
      "GAS_WEB_APP_URL 未設定，請在 .env.local 填入 Google Apps Script Web App URL"
    );
  }
  return url.replace(/\/$/, "");
}

export function hasGasWebAppUrl(): boolean {
  return Boolean(
    process.env.GAS_SHEET_API_URL?.trim() || process.env.GAS_WEB_APP_URL?.trim()
  );
}

/** Vote GET (counts) / POST (submit) — defaults to GAS_WEB_APP_URL if unset. */
export function getGasVoteApiUrl(): string {
  const url =
    process.env.GAS_VOTE_API_URL?.trim() || process.env.GAS_WEB_APP_URL?.trim();
  if (!url) {
    throw new Error(
      "GAS_VOTE_API_URL 或 GAS_WEB_APP_URL 未設定，請在 .env.local 填入投票 API URL"
    );
  }
  return url.replace(/\/$/, "");
}

export function hasGasVoteApiUrl(): boolean {
  return Boolean(
    process.env.GAS_VOTE_API_URL?.trim() || process.env.GAS_WEB_APP_URL?.trim()
  );
}

/** Query param for sheet grid GET, e.g. mode=sheet */
export function getGasSheetGetQuery(): string {
  return process.env.GAS_SHEET_GET_QUERY?.trim() || "mode=sheet";
}

/** Optional query param for vote counts GET; empty = use URL as-is */
export function getGasVoteGetQuery(): string {
  return process.env.GAS_VOTE_GET_QUERY?.trim() || "";
}

function appendQuery(baseUrl: string, query: string): string {
  if (!query) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${query}`;
}

export function getGasSheetFetchUrl(): string {
  return appendQuery(getGasWebAppUrl(), getGasSheetGetQuery());
}

export function getGasVoteFetchUrl(): string {
  return appendQuery(getGasVoteApiUrl(), getGasVoteGetQuery());
}

/** 表單若無「組別」欄位時的預設值 */
export function getDefaultEntryCategory(): string {
  return process.env.DEFAULT_ENTRY_CATEGORY?.trim() || "少兒組";
}
