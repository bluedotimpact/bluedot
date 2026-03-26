import { parseSummary } from '../lib/client/parseSummary';

type SummaryCardProps = {
  aiSummary: string;
  course: string;
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ aiSummary, course }) => {
  const { role, domain, technicalAbility, topAchievement, commitment } = parseSummary(aiSummary);

  const showTechnicalAbility = course === 'Technical AI Safety' && !!technicalAbility;

  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-0.5">Role</p>
          <p className="text-size-sm text-stone-100">{role || '—'}</p>
        </div>
        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-0.5">Domain</p>
          <p className="text-size-sm text-stone-100">{domain || '—'}</p>
        </div>
      </div>
      {showTechnicalAbility && (
        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-0.5">Technical Ability</p>
          <p className="text-size-sm text-stone-100">{technicalAbility}</p>
        </div>
      )}
      <div>
        <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-0.5">Top Achievement</p>
        <p className="text-size-sm text-stone-100">{topAchievement || '—'}</p>
      </div>
      <div>
        <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-0.5">Commitment</p>
        <p className="text-size-sm text-stone-100">{commitment || '—'}</p>
      </div>
    </div>
  );
};
