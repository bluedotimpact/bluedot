import { parseSummary } from '../lib/client/parseSummary';

type ScoreRow = {
  label: string;
  score?: number;
  rationale?: string;
};

type SummaryCardProps = {
  aiSummary: string;
  course: string;
  commitmentScore?: number;
  commitmentRationale?: string;
  impressivenessScore?: number;
  impressivenessRationale?: string;
  technicalSkillScore?: number;
  technicalSkillRationale?: string;
};

const RATING_MAX = 5;

const PillContents: React.FC<ScoreRow & { hasRationale: boolean }> = ({ label, score, hasRationale }) => (
  <>
    <span className="text-size-xs font-semibold uppercase tracking-wide text-secondary">{label}</span>
    <span className="flex items-center gap-2 shrink-0">
      <span className="text-size-sm font-mono text-primary">
        {score !== undefined ? `${score}/${RATING_MAX}` : '—'}
      </span>
      {hasRationale && (
        <svg className="size-4 text-secondary transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </span>
  </>
);

const ScorePill: React.FC<ScoreRow> = ({ label, score, rationale }) => {
  const hasRationale = !!rationale?.trim();

  if (!hasRationale) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 border border-subtle rounded-lg bg-raised">
        <PillContents label={label} score={score} hasRationale={false} />
      </div>
    );
  }

  return (
    <details className="group border border-subtle rounded-lg bg-raised">
      <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <PillContents label={label} score={score} hasRationale />
      </summary>
      <p className="px-3 pb-3 text-size-sm text-primary leading-relaxed whitespace-pre-wrap">{rationale}</p>
    </details>
  );
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  aiSummary,
  course,
  commitmentScore,
  commitmentRationale,
  impressivenessScore,
  impressivenessRationale,
  technicalSkillScore,
  technicalSkillRationale,
}) => {
  const { summary, notable } = parseSummary(aiSummary);
  const showTechnical = course === 'Technical AI Safety' || course === 'Technical AI Safety Project';

  return (
    <div className="bg-tint border border-subtle rounded-lg p-3 sm:p-5 space-y-4">
      {summary && (
        <p className="text-size-sm text-primary leading-relaxed">{summary}</p>
      )}

      {notable.length > 0 && (
        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-secondary mb-1.5">Notable</p>
          <ul className="space-y-1 list-disc list-outside pl-5 text-size-sm text-primary leading-relaxed">
            {notable.map((bullet, i) => (
              <li key={`${i}-${bullet.slice(0, 16)}`}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <ScorePill label="Commitment" score={commitmentScore} rationale={commitmentRationale} />
        <ScorePill label="Impressiveness" score={impressivenessScore} rationale={impressivenessRationale} />
        {showTechnical && (
          <ScorePill label="Technical skill" score={technicalSkillScore} rationale={technicalSkillRationale} />
        )}
      </div>
    </div>
  );
};
