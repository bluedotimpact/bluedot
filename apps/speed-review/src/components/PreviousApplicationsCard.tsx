import useAxios from 'axios-hooks';

type PreviousApplication = {
  id: string;
  roundName: string;
  humanOpinion: string;
  decision: string;
  createdAt: string;
};

type PreviousApplicationsCardProps = {
  applicationId: string;
};

const opinionBadgeClass = (opinion: string): string => {
  switch (opinion) {
    case 'Strong yes': return 'bg-blue-800 text-white';
    case 'Weak yes': return 'bg-sky-400 text-stone-900';
    case 'Neutral': return 'bg-stone-500 text-white';
    case 'Weak no': return 'bg-red-500 text-white';
    case 'Strong no': return 'bg-red-800 text-white';
    default: return 'bg-stone-700 text-stone-300';
  }
};

const decisionBadgeClass = (decision: string): string => {
  switch (decision) {
    case 'Accept': return 'bg-blue-600 text-white';
    case 'Reject': return 'bg-red-600 text-white';
    default: return 'bg-stone-700 text-stone-300';
  }
};

const Badge: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-size-xs font-semibold whitespace-nowrap ${className}`}>
    {label}
  </span>
);

export const PreviousApplicationsCard: React.FC<PreviousApplicationsCardProps> = ({ applicationId }) => {
  const [{ data, loading, error }] = useAxios<{ history: PreviousApplication[] }>({
    method: 'get',
    url: `/api/application-history?id=${encodeURIComponent(applicationId)}`,
  });

  if (loading) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-5">
        <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Previous applications</p>
        <p className="text-size-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-5">
        <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Previous applications</p>
        <p className="text-size-sm text-red-400">{error.message}</p>
      </div>
    );
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-5">
        <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Previous applications</p>
        <p className="text-size-sm text-stone-500">No previous applications.</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-5 space-y-2">
      <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">Previous applications</p>
      <ul className="space-y-2">
        {history.map((h) => (
          <li key={h.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
            <span className="text-size-sm text-stone-200">{h.roundName}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Badge label={h.humanOpinion || 'TODO'} className={opinionBadgeClass(h.humanOpinion || 'TODO')} />
              <Badge label={h.decision || 'TODO'} className={decisionBadgeClass(h.decision || 'TODO')} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
