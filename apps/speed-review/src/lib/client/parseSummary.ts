export type ParsedSummary = {
  summary: string;
  notable: string[];
};

export const parseSummary = (text: string): ParsedSummary => {
  const summaryMatch = /SUMMARY:\s*([\s\S]*?)(?=\n\s*NOTABLE:|$)/.exec(text);
  const notableMatch = /NOTABLE:\s*([\s\S]*)$/.exec(text);
  const notable = notableMatch
    ? notableMatch[1]!
      .split(/\n/)
      .map((l) => l.replace(/^\s*[-•]\s*/, '').trim())
      .filter(Boolean)
    : [];
  return {
    summary: summaryMatch?.[1]?.trim() ?? '',
    notable,
  };
};
