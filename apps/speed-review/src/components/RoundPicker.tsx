import useAxios from 'axios-hooks';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { type Round } from '../lib/api/airtable';

type RoundPickerProps = {
  onSelect: (round: Round) => void;
};

export const RoundPicker: React.FC<RoundPickerProps> = ({ onSelect }) => {
  const [{ data, loading, error }] = useAxios<{ rounds: Round[] }>({
    method: 'get',
    url: '/api/rounds',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
        <p className="text-red-400">{error.message}</p>
      </div>
    );
  }

  const rounds = data?.rounds ?? [];

  const ALLOWED_COURSES = ['AGI Strategy', 'Technical AI Safety'];

  const grouped = rounds.reduce<Record<string, { displayName: string; rounds: typeof rounds }>>((acc, round) => {
    const matchedCourse = ALLOWED_COURSES.find((c) => round.name.includes(c));
    if (!matchedCourse) return acc;
    const key = round.course || matchedCourse;
    acc[key] ??= { displayName: matchedCourse, rounds: [] };
    acc[key].rounds.push(round);
    return acc;
  }, {});
  const courseKeys = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
      <div className="bg-stone-900 rounded-xl border border-stone-700 p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Speed Review</h1>
          <p className="text-size-sm text-stone-400 mt-1">Select a round to review</p>
        </div>

        {rounds.length === 0 ? (
          <p className="text-size-sm text-stone-500">No active or future rounds found.</p>
        ) : (
          <div className="space-y-2">
            {courseKeys.map((key) => (
              <details key={key} open className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden py-1">
                  <span className="text-size-xs font-semibold uppercase tracking-wide text-stone-500">{grouped[key]!.displayName}</span>
                  <svg className="size-3.5 text-stone-600 transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="space-y-2 mt-2">
                  {grouped[key]!.rounds.slice(0, 3).map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onSelect(round)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-stone-700 hover:border-bluedot-normal hover:bg-stone-800 transition-colors font-medium text-stone-200"
                    >
                      {round.name}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}

        <CTALinkOrButton
          variant="ghost"
          size="small"
          onClick={() => window.location.reload()}
        >
          Refresh
        </CTALinkOrButton>
      </div>
    </div>
  );
};
