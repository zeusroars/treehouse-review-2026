import { getGasSheetFetchUrl } from "@/lib/gas/config";
import { fetchGasJson } from "@/lib/gas/fetch-gas";

export async function fetchGasRawGrid(): Promise<string[][]> {
  const url = getGasSheetFetchUrl();
  const data = await fetchGasJson<unknown>(url, {
    label: "GAS sheet API",
    init: {
      method: "GET",
      cache: "no-store",
    },
  });

  if (!Array.isArray(data)) {
    const hint =
      data &&
      typeof data === "object" &&
      "status" in data &&
      "data" in data
        ? "GAS GET 回傳了投票 JSON 而非試算表二維陣列。請在 GAS doGet 加入 mode=sheet，或設定 GAS_SHEET_GET_QUERY=mode=sheet 並重新部署。"
        : "GAS 回傳格式錯誤：預期為二維陣列";
    throw new Error(hint);
  }

  return data.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => String(cell ?? ""));
  });
}
