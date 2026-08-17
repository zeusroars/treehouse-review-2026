export interface JudgeAccount {
  passcode: string;
  judgeId: string;
  judgeName: string;
}

const DEFAULT_JUDGE_ACCOUNTS: JudgeAccount[] = [
  { passcode: "judge1", judgeId: "judge_1", judgeName: "評審 A" },
  { passcode: "judge2", judgeId: "judge_2", judgeName: "評審 B" },
  { passcode: "judge3", judgeId: "judge_3", judgeName: "評審 C" },
  { passcode: "judge4", judgeId: "judge_4", judgeName: "評審 D" },
  { passcode: "judge5", judgeId: "judge_5", judgeName: "評審 E" },
  { passcode: "judge6", judgeId: "judge_6", judgeName: "評審 F" },
];

function loadJudgeAccounts(): JudgeAccount[] {
  const raw = process.env.JUDGE_PASSCODES?.trim();
  if (!raw) return DEFAULT_JUDGE_ACCOUNTS;

  try {
    const parsed = JSON.parse(raw) as JudgeAccount[];
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          typeof item.passcode === "string" &&
          typeof item.judgeId === "string" &&
          typeof item.judgeName === "string"
      )
    ) {
      return parsed;
    }
  } catch {
    // Fall back to defaults when env JSON is invalid.
  }

  return DEFAULT_JUDGE_ACCOUNTS;
}

let cachedAccounts: JudgeAccount[] | null = null;

function getJudgeAccounts(): JudgeAccount[] {
  if (!cachedAccounts) {
    cachedAccounts = loadJudgeAccounts();
  }
  return cachedAccounts;
}

export function resolveJudgeByPasscode(code: string): JudgeAccount | null {
  const normalized = code.trim().toLowerCase();
  return (
    getJudgeAccounts().find(
      (account) => account.passcode.trim().toLowerCase() === normalized
    ) ?? null
  );
}

export function createJudgeSession(account: JudgeAccount) {
  return {
    judgeId: account.judgeId,
    judgeName: account.judgeName,
    role: "judge" as const,
  };
}

export function listJudgeIds(): string[] {
  return getJudgeAccounts().map((account) => account.judgeId);
}

export function getJudgeDisplayName(judgeId: string): string {
  return (
    getJudgeAccounts().find((account) => account.judgeId === judgeId)
      ?.judgeName ?? judgeId
  );
}
