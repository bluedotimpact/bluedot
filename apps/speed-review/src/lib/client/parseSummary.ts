export type ParsedSummary = {
  role: string;
  domain: string;
  technicalAbility: string;
  topAchievement: string;
  commitment: string;
};

export const parseSummary = (text: string): ParsedSummary => {
  const extract = (label: string, nextLabel: string) => {
    const regex = new RegExp(`${label}:\\s*(.+?)(?=${nextLabel}:|$)`, 's');
    const match = text.match(regex);
    return match?.[1]?.trim() ?? '';
  };

  return {
    role: extract('ROLE', 'DOMAIN'),
    domain: extract('DOMAIN', 'TECHNICAL ABILITY|TOP ACHIEVEMENT'),
    technicalAbility: extract('TECHNICAL ABILITY', 'TOP ACHIEVEMENT'),
    topAchievement: extract('TOP ACHIEVEMENT', 'COMMITMENT'),
    commitment: extract('COMMITMENT', 'ZZZNOMATCH$'),
  };
};
