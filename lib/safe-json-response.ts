export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`Empty response (${response.status})`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, " ").trim();
    if (preview.startsWith("Internal Server Error")) {
      throw new Error("伺服器暫時無法回應，請稍後再試");
    }
    throw new Error(`Invalid response (${response.status}): ${preview}`);
  }
}
