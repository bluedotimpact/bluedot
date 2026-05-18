import { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { type Round } from '../lib/api/airtable';
import { type SortDirection } from '../lib/client/types';

const SORT_STORAGE_KEY = 'speed-review:sortDirection';

const loadSortDirection = (): SortDirection => {
  if (typeof window === 'undefined') return 'desc';
  return window.localStorage.getItem(SORT_STORAGE_KEY) === 'asc' ? 'asc' : 'desc';
};

type RoundPickerProps = {
  onSelect: (round: Round, sortDirection: SortDirection) => void;
};

export const RoundPicker: React.FC<RoundPickerProps> = ({ onSelect }) => {
  const [{ data, loading, error }] = useAxios<{ rounds: Round[] }>({
    method: 'get',
    url: '/api/rounds',
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    setSortDirection(loadSortDirection());
  }, []);

  const updateSortDirection = (next: SortDirection) => {
    setSortDirection(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SORT_STORAGE_KEY, next);
    }
  };

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

  const sortOption = (value: SortDirection, label: string) => {
    const active = sortDirection === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => updateSortDirection(value)}
        aria-pressed={active}
        className={`flex-1 px-3 py-2 rounded-md text-size-sm font-medium transition-colors ${
          active
            ? 'bg-stone-700 text-stone-100'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-stone-900 rounded-xl border border-stone-700 p-4 sm:p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Speed Review</h1>
          <p className="text-size-sm text-stone-400 mt-1">Select a round to review</p>
        </div>

        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Review from</p>
          <div className="flex gap-1 bg-stone-950 border border-stone-700 rounded-lg p-1">
            {sortOption('desc', 'Top of pile')}
            {sortOption('asc', 'Bottom of pile')}
          </div>
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
                  {grouped[key]!.rounds.slice(0, 7).map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onSelect(round, sortDirection)}
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
