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
  course: string;
};

const TAIS_FAMILY = ['Technical AI Safety', 'Technical AI Safety Project'];
const AGISC_FAMILY = ['AGI Strategy'];

const familyFor = (course: string): string[] => {
  if (TAIS_FAMILY.includes(course)) return TAIS_FAMILY;
  if (AGISC_FAMILY.includes(course)) return AGISC_FAMILY;
  return [course];
};

const courseFromRoundName = (roundName: string): string => roundName.split('(')[0]?.trim() ?? '';

type Verdict =
  | { kind: 'accepted'; entry: PreviousApplication }
  | { kind: 'rejected'; entry: PreviousApplication }
  | { kind: 'unrelated'; count: number }
  | { kind: 'none' };

const summarise = (history: PreviousApplication[], course: string): Verdict => {
  if (history.length === 0) return { kind: 'none' };
  const family = familyFor(course);
  const inFamily = history.filter((h) => family.includes(courseFromRoundName(h.roundName)));
  const accepted = inFamily.find((h) => h.decision === 'Accept');
  if (accepted) return { kind: 'accepted', entry: accepted };
  const rejected = inFamily.find((h) => h.decision === 'Reject');
  if (rejected) return { kind: 'rejected', entry: rejected };
  return { kind: 'unrelated', count: history.length };
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

const BannerLabel: React.FC<{ verdict: Verdict }> = ({ verdict }) => {
  if (verdict.kind === 'accepted') {
    return <>↻ Previously accepted — {verdict.entry.roundName}</>;
  }

  if (verdict.kind === 'rejected') {
    return <>↻ Previously rejected — {verdict.entry.roundName}</>;
  }

  if (verdict.kind === 'unrelated') {
    return <>↻ Previous applications ({verdict.count})</>;
  }

  return null;
};

const bannerClass = (verdict: Verdict): string => {
  if (verdict.kind === 'accepted') return 'bg-amber-900/40 border-amber-700 text-amber-200';
  if (verdict.kind === 'rejected') return 'bg-stone-800 border-stone-700 text-stone-300';
  return 'bg-stone-800 border-stone-700 text-stone-400';
};

export const PreviousApplicationsCard: React.FC<PreviousApplicationsCardProps> = ({ applicationId, course }) => {
  const [{ data, loading, error }] = useAxios<{ history: PreviousApplication[] }>({
    method: 'get',
    url: `/api/application-history?id=${encodeURIComponent(applicationId)}`,
  });

  if (loading || error) return null;

  const history = data?.history ?? [];
  const verdict = summarise(history, course);
  if (verdict.kind === 'none') {
    return (
      <p className="text-size-xs text-stone-500 px-1">No previous applications.</p>
    );
  }

  return (
    <details className={`group rounded-lg border ${bannerClass(verdict)}`}>
      <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="text-size-sm font-medium">
          <BannerLabel verdict={verdict} />
        </span>
        <svg className="size-4 transition-transform group-open:rotate-180 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <ul className="px-3 pb-3 space-y-2">
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
    </details>
  );
};
