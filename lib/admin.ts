export const ADMIN_JUDGE_ID = "ADMIN";

export function getAdminAccessCode(): string {
  return process.env.ADMIN_ACCESS_CODE?.trim() || "admin";
}

export function isAdminAccessCode(code: string): boolean {
  return code.trim() === getAdminAccessCode();
}

export function isAdminJudgeId(judgeId: string): boolean {
  return judgeId === ADMIN_JUDGE_ID;
}

export function createAdminSession() {
  return {
    judgeId: ADMIN_JUDGE_ID,
    judgeName: "管理者",
    role: "admin" as const,
  };
}
