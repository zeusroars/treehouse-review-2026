export type Day4Language = "zh" | "en" | "ja";

export interface Day4Reply {
  id: string;
  judgeId: string;
  judgeName: string;
  content: string;
  language: Day4Language;
  createdAt: string;
}

export interface Day4Note {
  judgeId: string;
  judgeName: string;
  content: string;
  language: Day4Language | null;
  updatedAt: string | null;
  likedBy: string[];
  replies: Day4Reply[];
}

export interface Day4LoungeEntry {
  entryId: string;
  workTitle?: string;
  workConcept?: string;
  category: string;
  /** Grid / list card image (smaller). */
  thumbnailUrl: string | null;
  /** Pin-up / fullscreen image (higher res). */
  imageUrl: string | null;
  displayRotation?: number;
  scoreRank: number | null;
  technicalAssessment: string;
  discussionCount: number;
  notes: Day4Note[];
  /** Judge IDs who nominated this entry for the shortlist (四強). */
  shortlistedBy: string[];
}

export interface Day4LoungeResponse {
  ok: boolean;
  error?: string;
  entries?: Day4LoungeEntry[];
}

export type Day4LoungeAction =
  | {
      action: "save_note";
      judgeId: string;
      entryId: string;
      content: string;
      language: Day4Language;
    }
  | {
      action: "toggle_like";
      judgeId: string;
      entryId: string;
      noteJudgeId: string;
    }
  | {
      action: "add_reply";
      judgeId: string;
      entryId: string;
      noteJudgeId: string;
      content: string;
      language: Day4Language;
    }
  | {
      action: "toggle_shortlist";
      judgeId: string;
      entryId: string;
    };
