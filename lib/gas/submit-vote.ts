import { getGasVoteApiUrl } from "@/lib/gas/config";
import { fetchGasTextWithMeta } from "@/lib/gas/fetch-gas";
import {
  isDuplicateVoteMessage,
  parseVoteApiResponse,
  type ParsedVoteApiResponse,
} from "@/lib/vote-api";

export interface SubmitVotePayload {
  photoNo: string;
  voterId: string;
}

export interface SubmitVoteResult extends ParsedVoteApiResponse {
  httpStatus: number;
  rawText?: string;
}

/**
 * Submit a vote to GAS.
 *
 * GAS's exec URL occasionally 302-redirects to a googleusercontent "echo" URL
 * that 404s (Google-side infra flakiness, ~20-30% observed), even though the
 * script itself may have already run. We retry on that specific failure mode
 * (HTTP error or HTML body instead of JSON). If a retry then comes back as a
 * "duplicate vote" error, that almost certainly means the *first* attempt did
 * record the vote and only its response got lost — so we treat that as a
 * confirmed success instead of showing a scary failure to the user.
 */
export async function submitVoteToGas(
  payload: SubmitVotePayload
): Promise<SubmitVoteResult> {
  const url = getGasVoteApiUrl();

  try {
    const { text: rawText, attempts } = await fetchGasTextWithMeta(url, {
      label: "GAS vote POST",
      init: {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    });

    let data: unknown = rawText;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      // GAS may return plain text
    }

    const parsed = parseVoteApiResponse(data);

    if (!parsed.ok && attempts > 1 && isDuplicateVoteMessage(parsed.message)) {
      return {
        ok: true,
        status: "success",
        message: "投票已成功記錄（系統重試後確認）",
        remainingVotes: parsed.remainingVotes,
        httpStatus: 200,
        rawText,
      };
    }

    return { ...parsed, httpStatus: 200, rawText };
  } catch (e) {
    return {
      ok: false,
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      httpStatus: 0,
    };
  }
}
