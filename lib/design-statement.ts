export interface DesignStatementParts {
  workTitle?: string;
  workConcept?: string;
  workConceptExtra?: string;
}

/** Parse legacy combined designConcept string from sheet export. */
export function parseLegacyDesignConcept(raw: string): DesignStatementParts {
  const result: DesignStatementParts = {};
  if (!raw?.trim()) return result;

  for (const block of raw.split(/\n\n+/)) {
    const match = block.match(/^【([^】]+)】\n([\s\S]*)$/);
    if (!match) continue;
    const label = match[1].trim();
    const body = match[2].trim();
    if (!body) continue;

    if (/作品名稱|作品標題|title/i.test(label)) {
      result.workTitle = body;
    } else if (/作品理念|design concept/i.test(label)) {
      result.workConcept = body;
    } else if (/設計理念|design statement/i.test(label)) {
      result.workConceptExtra = body;
    }
  }

  return result;
}

export function formatDesignStatement(
  parts: DesignStatementParts,
  labels: {
    workTitle: string;
    workConcept: string;
    workConceptExtra: string;
  }
): string {
  const sections: string[] = [];

  if (parts.workTitle?.trim()) {
    sections.push(`【${labels.workTitle}】\n${parts.workTitle.trim()}`);
  }
  if (parts.workConcept?.trim()) {
    sections.push(`【${labels.workConcept}】\n${parts.workConcept.trim()}`);
  }
  if (
    parts.workConceptExtra?.trim() &&
    parts.workConceptExtra.trim() !== parts.workConcept?.trim()
  ) {
    sections.push(
      `【${labels.workConceptExtra}】\n${parts.workConceptExtra.trim()}`
    );
  }

  return sections.join("\n\n");
}

export function resolveDesignStatementParts(input: {
  designConcept?: string;
  workTitle?: string;
  workConcept?: string;
  workConceptExtra?: string;
}): DesignStatementParts {
  const structured: DesignStatementParts = {
    workTitle: input.workTitle,
    workConcept: input.workConcept,
    workConceptExtra: input.workConceptExtra,
  };

  if (structured.workTitle || structured.workConcept || structured.workConceptExtra) {
    return structured;
  }

  return parseLegacyDesignConcept(input.designConcept ?? "");
}
